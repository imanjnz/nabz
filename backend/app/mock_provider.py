
from typing import Any

from app.ai_provider import AIQuestionProvider
from app.ai_schemas import (
    DescriptiveEvaluationRequest,
    DescriptiveEvaluationResponse
)


class MockAIProvider(AIQuestionProvider):
    """
    Temporary provider for testing NABZ AI architecture.
    """

    async def generate_questions(
        self,
        source_text: str,
        question_count: int,
        difficulty: str,
        question_type: str
    ) -> list[dict[str, Any]]:

        excerpt = " ".join(source_text.split())[:200]

        questions = []

        types = (
            ["multiple", "truefalse", "descriptive"]
            if question_type == "mixed"
            else [question_type]
        )

        difficulties = (
            ["easy", "medium", "hard"]
            if difficulty == "mixed"
            else [difficulty]
        )

        for index in range(question_count):

            current_type = types[index % len(types)]
            current_difficulty = difficulties[
                index % len(difficulties)
            ]

            if current_type == "multiple":

                options = [
                    excerpt,
                    "گزینه آزمایشی دوم",
                    "گزینه آزمایشی سوم",
                    "گزینه آزمایشی چهارم"
                ]

                correct_answer = options[0]

                question_text = (
                    "کدام گزینه با متن منبع مطابقت دارد؟"
                )

                explanation = (
                    "این سؤال توسط موتور آزمایشی تولید شده است."
                )

            elif current_type == "truefalse":

                statement = (
                    excerpt
                    if index % 2 == 0
                    else "این عبارت صرفاً یک جمله آزمایشی است."
                )

                correct_answer = (
                    "درست"
                    if index % 2 == 0
                    else "نادرست"
                )

                options = ["درست", "نادرست"]

                question_text = (
                    f"آیا عبارت زیر صحیح است؟\n{statement}"
                )

                explanation = (
                    "این سؤال برای آزمایش ساختار سیستم است."
                )

            else:

                options = None

                correct_answer = (
                    "پاسخ تشریحی در موتور آزمایشی موجود نیست."
                )

                question_text = (
                    "متن زیر را با زبان خود توضیح دهید:\n"
                    f"{excerpt}"
                )

                explanation = (
                    "این سؤال نیازمند بررسی دستی است."
                )

            questions.append({
                "id": str(index + 1),
                "type": current_type,
                "question": question_text,
                "options": options,
                "correct_answer": correct_answer,
                "explanation": explanation,
                "difficulty": current_difficulty
            })

        return questions

    async def evaluate_descriptive_answer(
        self,
        request: DescriptiveEvaluationRequest
    ) -> DescriptiveEvaluationResponse:

        return DescriptiveEvaluationResponse(
            score=0,
            max_score=request.max_score,
            strengths=[],
            missing_points=[
                "تصحیح هوشمند در موتور آزمایشی فعال نیست."
            ],
            feedback=(
                "این موتور فقط برای آزمایش معماری نبض است. "
                "برای ارزیابی واقعی باید موتور هوش مصنوعی متصل شود."
            ),
            suggested_answer=request.reference_answer,
            status="manual_review"
        )
