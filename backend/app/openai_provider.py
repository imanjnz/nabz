from typing import Any

from app.ai_provider import AIQuestionProvider
from app.ai_schemas import (
    DescriptiveEvaluationRequest,
    DescriptiveEvaluationResponse,
)
from app.openai_service import OpenAIService


class OpenAIQuestionProvider(AIQuestionProvider):
    def __init__(self) -> None:
        self.ai = OpenAIService()

    async def generate_questions(
        self,
        source_text: str,
        question_count: int,
        difficulty: str,
        question_type: str,
    ) -> list[dict[str, Any]]:
        system = (
            "You are NABZ, an accurate educational assessment designer. "
            "Create questions only from the supplied source. Never invent facts. "
            "Return JSON with a single key 'questions'. Each item must contain "
            "id (string), type (multiple|truefalse|descriptive), question, "
            "options (array of strings or null), correct_answer, explanation, "
            "difficulty (easy|medium|hard). For multiple choice use exactly "
            "four distinct options and make correct_answer exactly equal to "
            "one option. For truefalse use options ['درست','نادرست'] and "
            "correct_answer exactly one of them. Write in the language of source."
        )
        user = (
            f"Question count: {question_count}\n"
            f"Difficulty: {difficulty}\nQuestion type: {question_type}\n"
            f"Source text:\n{source_text[:70000]}"
        )
        data = await self.ai.json(system=system, user=user)
        questions = data.get("questions") if isinstance(data, dict) else None
        if not isinstance(questions, list) or len(questions) != question_count:
            raise ValueError("OpenAI did not return the requested number of questions.")
        for index, question in enumerate(questions):
            question["id"] = str(index + 1)
        return questions

    async def evaluate_descriptive_answer(
        self,
        request: DescriptiveEvaluationRequest,
    ) -> DescriptiveEvaluationResponse:
        system = (
            "You are a fair educational evaluator. Evaluate only against the "
            "question, reference answer, source and criteria. Do not reward "
            "unsupported claims. Return JSON keys: score, max_score, strengths, "
            "missing_points, feedback, suggested_answer, status. status must "
            "be evaluated. Keep feedback constructive and in the student's language."
        )
        user = (
            f"Question: {request.question}\n"
            f"Student answer: {request.student_answer}\n"
            f"Reference answer: {request.reference_answer}\n"
            f"Source: {(request.source_text or '')[:30000]}\n"
            f"Criteria: {request.evaluation_criteria}\n"
            f"Maximum score: {request.max_score}"
        )
        data = await self.ai.json(system=system, user=user)
        data["max_score"] = request.max_score
        data["score"] = max(0, min(float(data.get("score", 0)), request.max_score))
        data["status"] = "evaluated"
        return DescriptiveEvaluationResponse(**data)
