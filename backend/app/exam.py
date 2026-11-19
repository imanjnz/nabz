
import os
import re
import uuid
from io import BytesIO
from enum import Enum
from typing import Optional, List, Dict

import pymupdf
import pytesseract

from PIL import Image
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel, Field
from pypdf import PdfReader
from docx import Document

from app.ai_provider import (
    get_ai_provider,
    AIProviderNotConfigured
)

from app.ai_schemas import (
    DescriptiveEvaluationRequest,
    DescriptiveEvaluationResponse
)


router = APIRouter(
    prefix="/api/exams",
    tags=["Exams"]
)


# ==========================================
# OCR CONFIGURATION
# ==========================================

TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

if os.path.exists(TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

OCR_LANGUAGE = "fas+eng"


# ==========================================
# EXAM DATA MODELS
# ==========================================

class QuestionType(str, Enum):
    MULTIPLE = "multiple"
    TRUE_FALSE = "truefalse"
    DESCRIPTIVE = "descriptive"


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class InternalQuestion(BaseModel):
    id: str
    type: QuestionType
    question: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str
    difficulty: Difficulty


class PublicQuestion(BaseModel):
    id: str
    type: QuestionType
    question: str
    options: Optional[List[str]] = None
    difficulty: Difficulty


class ExamGenerationRequest(BaseModel):
    source_text: str = Field(min_length=20, max_length=1_000_000)
    question_count: int = Field(default=10, ge=1, le=50)
    difficulty: str = "medium"
    question_type: str = "multiple"
    duration: int = Field(default=20, ge=0, le=300)


class ExamResponse(BaseModel):
    exam_id: str
    title: str
    total_questions: int
    duration: int
    questions: List[PublicQuestion]


class ExamSubmissionRequest(BaseModel):
    exam_id: str
    answers: Dict[str, str] = Field(default_factory=dict)


class QuestionResult(BaseModel):
    question_id: str
    question: str
    question_type: QuestionType
    user_answer: str
    correct_answer: Optional[str] = None
    is_correct: Optional[bool] = None
    explanation: str
    status: str

    # جزئیات ارزیابی پاسخ تشریحی
    evaluation: Optional[DescriptiveEvaluationResponse] = None


class ExamResultResponse(BaseModel):
    exam_id: str
    total_questions: int
    objective_questions: int
    correct_answers: int
    incorrect_answers: int
    unanswered_questions: int
    descriptive_questions: int
    evaluated_descriptive_questions: int
    manual_review_descriptive_questions: int
    descriptive_score: float
    descriptive_max_score: float
    score: float
    results: List[QuestionResult]


# ==========================================
# TEMPORARY EXAM STORAGE
# ==========================================

EXAM_STORAGE: Dict[str, dict] = {}


# ==========================================
# MOCK EXAM GENERATOR
# ==========================================

def get_source_excerpt(source_text: str) -> str:
    cleaned = re.sub(r"\s+", " ", source_text).strip()

    if len(cleaned) > 120:
        return cleaned[:120].rsplit(" ", 1)[0]

    return cleaned


def generate_mock_question(
    index: int,
    question_type: str,
    difficulty: str,
    source_text: str
) -> InternalQuestion:

    excerpt = get_source_excerpt(source_text)

    if question_type == "multiple":

        options = [
            excerpt,
            "این گزینه فقط برای آزمایش سیستم است.",
            "این گزینه یک پاسخ آزمایشی دیگر است.",
            "این گزینه نیز صرفاً نمونه است."
        ]

        return InternalQuestion(
            id=str(index + 1),
            type=QuestionType.MULTIPLE,
            question="کدام گزینه عیناً از متن منبع استخراج شده است؟",
            options=options,
            correct_answer=excerpt,
            explanation="پاسخ صحیح همان بخشی از متن منبع است که در گزینه اول قرار دارد.",
            difficulty=Difficulty(difficulty)
        )

    elif question_type == "truefalse":

        if index % 2 == 0:
            statement = excerpt
            answer = "درست"
        else:
            statement = "این عبارت آزمایشی در متن اصلی وجود ندارد."
            answer = "نادرست"

        return InternalQuestion(
            id=str(index + 1),
            type=QuestionType.TRUE_FALSE,
            question=f"آیا عبارت زیر در متن منبع وجود دارد؟\n{statement}",
            options=["درست", "نادرست"],
            correct_answer=answer,
            explanation="این سؤال صرفاً برای آزمایش ساختار آزمون تولید شده است.",
            difficulty=Difficulty(difficulty)
        )

    return InternalQuestion(
        id=str(index + 1),
        type=QuestionType.DESCRIPTIVE,
        question=(
            "بخش زیر از جزوه را با زبان خود توضیح دهید:\n"
            f"{excerpt}"
        ),
        options=None,
        correct_answer="پاسخ تشریحی در نسخه آزمایشی تولید نمی‌شود.",
        explanation="این سؤال در نسخه آزمایشی نیازمند بررسی دستی است.",
        difficulty=Difficulty(difficulty)
    )


def generate_mock_exam(
    request: ExamGenerationRequest
) -> tuple[str, List[InternalQuestion]]:

    allowed_types = ["multiple", "truefalse", "descriptive", "mixed"]
    allowed_difficulties = ["easy", "medium", "hard", "mixed"]

    if request.question_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid question type.")

    if request.difficulty not in allowed_difficulties:
        raise HTTPException(status_code=400, detail="Invalid difficulty level.")

    question_types = (
        ["multiple", "truefalse", "descriptive"]
        if request.question_type == "mixed"
        else [request.question_type]
    )

    difficulties = (
        ["easy", "medium", "hard"]
        if request.difficulty == "mixed"
        else [request.difficulty]
    )

    questions = []

    for index in range(request.question_count):
        current_type = question_types[index % len(question_types)]
        current_difficulty = difficulties[index % len(difficulties)]

        questions.append(
            generate_mock_question(
                index=index,
                question_type=current_type,
                difficulty=current_difficulty,
                source_text=request.source_text
            )
        )

    return str(uuid.uuid4()), questions


# ==========================================
# GENERATE EXAM API
# ==========================================

@router.post("/generate", response_model=ExamResponse)
async def generate_exam(request: ExamGenerationRequest):

    try:
        provider = get_ai_provider()

        generated_data = await provider.generate_questions(
            source_text=request.source_text,
            question_count=request.question_count,
            difficulty=request.difficulty,
            question_type=request.question_type
        )

    except AIProviderNotConfigured as error:
        raise HTTPException(status_code=503, detail=str(error))

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Question generation failed: {str(error)}"
        )

    try:
        internal_questions = [
            InternalQuestion(**question)
            for question in generated_data
        ]

        if len(internal_questions) != request.question_count:
            raise ValueError("Provider returned an unexpected number of questions.")

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid provider response: {str(error)}"
        )

    exam_id = str(uuid.uuid4())

    EXAM_STORAGE[exam_id] = {
        "questions": internal_questions,
        "source_text": request.source_text,
        "submitted": False
    }

    public_questions = [
        PublicQuestion(
            id=question.id,
            type=question.type,
            question=question.question,
            options=question.options,
            difficulty=question.difficulty
        )
        for question in internal_questions
    ]

    return ExamResponse(
        exam_id=exam_id,
        title="آزمون نبض",
        total_questions=len(public_questions),
        duration=request.duration,
        questions=public_questions
    )


# ==========================================
# SUBMIT AND GRADE EXAM API
# ==========================================

@router.post("/submit", response_model=ExamResultResponse)
async def submit_exam(request: ExamSubmissionRequest):

    exam = EXAM_STORAGE.get(request.exam_id)

    if exam is None:
        raise HTTPException(
            status_code=404,
            detail="Exam not found or expired."
        )

    if exam["submitted"]:
        raise HTTPException(
            status_code=409,
            detail="This exam has already been submitted."
        )

    questions = exam["questions"]

    valid_question_ids = {
        question.id for question in questions
    }

    unknown_ids = set(request.answers.keys()) - valid_question_ids

    if unknown_ids:
        raise HTTPException(
            status_code=400,
            detail="Invalid question IDs were submitted."
        )

    correct_count = 0
    incorrect_count = 0
    unanswered_count = 0
    descriptive_count = 0
    objective_count = 0

    evaluated_descriptive_count = 0
    manual_review_descriptive_count = 0

    descriptive_score = 0.0
    descriptive_max_score = 0.0

    results = []

    try:
        provider = get_ai_provider()

        for question in questions:

            user_answer = request.answers.get(
                question.id,
                ""
            ).strip()

            # ----------------------------------
            # DESCRIPTIVE QUESTION
            # ----------------------------------

            if question.type == QuestionType.DESCRIPTIVE:

                descriptive_count += 1

                if not user_answer:
                    results.append(
                        QuestionResult(
                            question_id=question.id,
                            question=question.question,
                            question_type=question.type,
                            user_answer="",
                            correct_answer=None,
                            is_correct=None,
                            explanation=question.explanation,
                            status="unanswered"
                        )
                    )
                    continue

                evaluation_request = DescriptiveEvaluationRequest(
                    question=question.question,
                    student_answer=user_answer,
                    reference_answer=question.correct_answer,
                    source_text=exam.get("source_text"),
                    evaluation_criteria=[],
                    max_score=10
                )

                evaluation = await provider.evaluate_descriptive_answer(
                    evaluation_request
                )

                if evaluation.status == "evaluated":
                    evaluated_descriptive_count += 1
                    descriptive_score += evaluation.score
                    descriptive_max_score += evaluation.max_score
                    result_status = "evaluated"
                else:
                    manual_review_descriptive_count += 1
                    result_status = "manual_review"

                results.append(
                    QuestionResult(
                        question_id=question.id,
                        question=question.question,
                        question_type=question.type,
                        user_answer=user_answer,
                        correct_answer=None,
                        is_correct=None,
                        explanation=question.explanation,
                        status=result_status,
                        evaluation=evaluation
                    )
                )

                continue

            # ----------------------------------
            # OBJECTIVE QUESTION
            # ----------------------------------

            objective_count += 1

            if not user_answer:
                unanswered_count += 1
                status = "unanswered"
                is_correct = False

            elif user_answer == question.correct_answer:
                correct_count += 1
                status = "correct"
                is_correct = True

            else:
                incorrect_count += 1
                status = "incorrect"
                is_correct = False

            results.append(
                QuestionResult(
                    question_id=question.id,
                    question=question.question,
                    question_type=question.type,
                    user_answer=user_answer,
                    correct_answer=question.correct_answer,
                    is_correct=is_correct,
                    explanation=question.explanation,
                    status=status
                )
            )

    except AIProviderNotConfigured as error:
        raise HTTPException(status_code=503, detail=str(error))

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Exam evaluation failed: {str(error)}"
        )

    # نمره تستی
    if objective_count > 0:
        objective_score = (
            correct_count / objective_count
        ) * 100
    else:
        objective_score = 0.0

    # نمره تشریحی فقط برای پاسخ‌هایی که واقعاً ارزیابی شده‌اند
    if descriptive_max_score > 0:
        descriptive_percentage = (
            descriptive_score / descriptive_max_score
        ) * 100
    else:
        descriptive_percentage = 0.0

    # نمره کلی فعلاً فقط نمره تستی است.
    # پاسخ‌های تشریحی آزمایشی وارد نمره کلی نمی‌شوند.
    score = round(objective_score, 2)

    exam["submitted"] = True

    return ExamResultResponse(
        exam_id=request.exam_id,
        total_questions=len(questions),
        objective_questions=objective_count,
        correct_answers=correct_count,
        incorrect_answers=incorrect_count,
        unanswered_questions=unanswered_count,
        descriptive_questions=descriptive_count,
        evaluated_descriptive_questions=evaluated_descriptive_count,
        manual_review_descriptive_questions=manual_review_descriptive_count,
        descriptive_score=round(descriptive_percentage, 2),
        descriptive_max_score=descriptive_max_score,
        score=score,
        results=results
    )


# ==========================================
# STANDALONE AI DESCRIPTIVE EVALUATION API
# ==========================================

@router.post(
    "/evaluate-descriptive",
    response_model=DescriptiveEvaluationResponse
)
async def evaluate_descriptive_answer(
    request: DescriptiveEvaluationRequest
):

    if not request.student_answer.strip():
        raise HTTPException(
            status_code=422,
            detail="Student answer cannot be empty."
        )

    try:
        provider = get_ai_provider()

        return await provider.evaluate_descriptive_answer(request)

    except AIProviderNotConfigured as error:
        raise HTTPException(status_code=503, detail=str(error))

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Answer evaluation failed: {str(error)}"
        )


# ==========================================
# TEXT EXTRACTION
# ==========================================

def extract_image_text(image):
    return pytesseract.image_to_string(
        image,
        lang=OCR_LANGUAGE,
        config="--psm 3",
        timeout=60
    )


def is_useful_text(text):
    cleaned = re.sub(
        r"camscanner",
        "",
        text,
        flags=re.IGNORECASE
    )

    meaningful_chars = [
        char for char in cleaned
        if char.isalnum()
    ]

    return len(meaningful_chars) >= 40


def extract_pdf_text(content):
    reader = PdfReader(BytesIO(content))

    if reader.is_encrypted:
        raise HTTPException(
            status_code=400,
            detail="Encrypted PDF files are not supported."
        )

    pdf_document = pymupdf.open(
        stream=content,
        filetype="pdf"
    )

    extracted_pages = []
    used_ocr = False
    used_text = False

    try:
        for index, page in enumerate(pdf_document):

            page_text = reader.pages[index].extract_text() or ""

            if is_useful_text(page_text):
                extracted_pages.append(page_text)
                used_text = True

            else:
                pix = page.get_pixmap(
                    matrix=pymupdf.Matrix(2, 2),
                    alpha=False
                )

                image = Image.open(
                    BytesIO(pix.tobytes("png"))
                )

                ocr_text = extract_image_text(image)

                extracted_pages.append(ocr_text)
                used_ocr = True

    finally:
        pdf_document.close()

    text = "\n".join(extracted_pages)

    if used_ocr and used_text:
        method = "mixed"
    elif used_ocr:
        method = "ocr"
    else:
        method = "text"

    return text, method


def extract_image_file(content):
    image = Image.open(BytesIO(content))
    image = image.convert("RGB")

    text = extract_image_text(image)

    return text, "ocr"


# ==========================================
# EXTRACT NOTES API
# ==========================================

@router.post("/extract")
async def extract_notes(file: UploadFile = File(...)):

    filename = (file.filename or "").lower()

    if not filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is required."
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty."
        )

    try:
        method = "text"

        if filename.endswith(".pdf"):
            text, method = extract_pdf_text(content)

        elif filename.endswith(".docx"):
            document = Document(BytesIO(content))

            text = "\n".join(
                paragraph.text
                for paragraph in document.paragraphs
            )

        elif filename.endswith(".txt"):
            text = content.decode("utf-8-sig")

        elif filename.endswith((
            ".png",
            ".jpg",
            ".jpeg",
            ".webp",
            ".bmp",
            ".tif",
            ".tiff"
        )):
            text, method = extract_image_file(content)

        else:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Supported formats: PDF, DOCX, TXT, "
                    "PNG, JPG, JPEG, WEBP and TIFF."
                )
            )

    except HTTPException:
        raise

    except pytesseract.TesseractNotFoundError:
        raise HTTPException(
            status_code=500,
            detail="Tesseract OCR was not found."
        )

    except pytesseract.TesseractError as error:
        raise HTTPException(
            status_code=500,
            detail=f"OCR processing failed: {str(error)}"
        )

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Could not read this file: {str(error)}"
        )

    text = text.strip()

    if not text:
        raise HTTPException(
            status_code=422,
            detail="No readable text was found in this file."
        )

    if len(text) > 1_000_000:
        raise HTTPException(
            status_code=413,
            detail="The extracted text is too large."
        )

    return {
        "success": True,
        "filename": file.filename,
        "character_count": len(text),
        "extraction_method": method,
        "text": text
    }
