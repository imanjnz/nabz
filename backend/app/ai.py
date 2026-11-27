import os
from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.ai_provider import AIProviderNotConfigured
from app.openai_service import OpenAIService

router = APIRouter(prefix="/api/ai", tags=["AI"])


class PlannerRequest(BaseModel):
    subjects: list[dict[str, Any]] = Field(default_factory=list, max_length=100)
    recent_sessions: list[dict[str, Any]] = Field(default_factory=list, max_length=500)
    existing_plans: list[dict[str, Any]] = Field(default_factory=list, max_length=300)
    availability: dict[str, int] = Field(default_factory=dict)
    start_date: str
    days: int = Field(default=7, ge=1, le=14)
    preferences: str = Field(default="", max_length=2000)


class AnalyticsRequest(BaseModel):
    summary: dict[str, Any]
    sessions: list[dict[str, Any]] = Field(default_factory=list, max_length=500)
    subjects: list[dict[str, Any]] = Field(default_factory=list, max_length=100)


class TutorRequest(BaseModel):
    question: str = Field(min_length=1, max_length=6000)
    context: str = Field(default="", max_length=30000)
    subject: str = Field(default="", max_length=200)


class MistakeRequest(BaseModel):
    question: str = Field(min_length=1, max_length=5000)
    student_answer: str = Field(min_length=1, max_length=5000)
    correct_answer: str = Field(min_length=1, max_length=5000)
    explanation: str = Field(default="", max_length=5000)


class LearningProfileRequest(BaseModel):
    sessions: list[dict[str, Any]] = Field(default_factory=list, max_length=500)
    subjects: list[dict[str, Any]] = Field(default_factory=list, max_length=100)
    exam_results: list[dict[str, Any]] = Field(default_factory=list, max_length=100)


class VoiceTextRequest(BaseModel):
    text: str = Field(min_length=1, max_length=6000)
    conversation_context: str = Field(default="", max_length=12000)


def get_ai() -> OpenAIService:
    try:
        return OpenAIService()
    except AIProviderNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/planner")
async def create_smart_plan(request: PlannerRequest):
    ai = get_ai()
    system = (
        "You are NABZ Smart Planner. Build a realistic, balanced study plan "
        "using only supplied subjects, availability and study history. Respect "
        "daily minute capacity; do not schedule unavailable time. Avoid excessive "
        "daily load and include breaks between long blocks. Return JSON: "
        "{'overview': string, 'plans': [{'title':string,'subjectId':string,"
        "'date':'YYYY-MM-DD','duration':integer,'reason':string}], "
        "'recommendations':[string]}. Keep plan dates inside requested horizon."
    )
    data = await ai.json(system=system, user=request.model_dump_json())
    plans = data.get("plans", []) if isinstance(data, dict) else []
    allowed_ids = {str(s.get("id")) for s in request.subjects}
    for plan in plans:
        if str(plan.get("subjectId")) not in allowed_ids:
            raise HTTPException(status_code=502, detail="AI returned an unknown subject.")
        if not 15 <= int(plan.get("duration", 0)) <= 180:
            raise HTTPException(status_code=502, detail="AI returned an invalid study duration.")
    return data


@router.post("/analytics")
async def analyze_study(request: AnalyticsRequest):
    ai = get_ai()
    return await ai.json(
        system=(
            "You are NABZ Study Analyst. Analyze the supplied computed study "
            "statistics; do not invent or recalculate missing data. Return JSON "
            "with: headline, insights (array of {title,description,type}), "
            "strengths (array), improvements (array), next_steps (array). "
            "Be supportive, specific, non-judgmental, and distinguish correlation "
            "from causation. If data is sparse, say so."
        ),
        user=request.model_dump_json(),
    )


@router.post("/tutor")
async def tutor(request: TutorRequest):
    ai = get_ai()
    answer = await ai.text(
        system=(
            "You are NABZ Tutor, a patient study assistant. Explain clearly at "
            "the learner's level, use the supplied context when relevant, and "
            "admit uncertainty. Do not claim to know content absent from context."
        ),
        user=f"Subject: {request.subject}\nContext: {request.context}\nQuestion: {request.question}",
    )
    return {"answer": answer}


@router.post("/explain-mistake")
async def explain_mistake(request: MistakeRequest):
    ai = get_ai()
    return await ai.json(
        system=(
            "You are NABZ Explain My Mistakes. Compare the student's answer "
            "with the correct answer and explain the misconception kindly. "
            "Return JSON keys: what_went_wrong, correct_reasoning, key_concept, "
            "similar_practice_question, practice_answer."
        ),
        user=request.model_dump_json(),
    )


@router.post("/learning-profile")
async def learning_profile(request: LearningProfileRequest):
    ai = get_ai()
    return await ai.json(
        system=(
            "You are NABZ Learning Profile analyst. Infer only cautious, "
            "evidence-based patterns from the supplied study sessions, subjects "
            "and exam results. Never diagnose or assign fixed traits. Return "
            "JSON keys: observed_patterns, effective_habits, possible_gaps, "
            "experiments_to_try. Mention when evidence is insufficient."
        ),
        user=request.model_dump_json(),
    )


@router.post("/voice-tutor")
async def voice_tutor(request: VoiceTextRequest):
    ai = get_ai()
    answer = await ai.text(
        system=(
            "You are NABZ Voice Tutor. Respond in concise, natural spoken-style "
            "language, suitable for text-to-speech. Teach conversationally."
        ),
        user=f"Conversation context: {request.conversation_context}\nLearner: {request.text}",
    )
    return {"answer": answer}


@router.get("/status")
async def ai_status():
    configured = bool(os.getenv("OPENAI_API_KEY"))
    return {
        "provider": os.getenv("NABZ_AI_PROVIDER", "mock"),
        "configured": configured,
        "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini") if configured else None,
    }
