
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class DescriptiveEvaluationRequest(BaseModel):
    question: str

    student_answer: str = Field(
        min_length=1,
        max_length=20000
    )

    reference_answer: str

    source_text: Optional[str] = None

    evaluation_criteria: List[str] = Field(
        default_factory=list
    )

    max_score: float = Field(
        default=10,
        gt=0,
        le=100
    )


class DescriptiveEvaluationResponse(BaseModel):
    score: float

    max_score: float

    strengths: List[str] = Field(
        default_factory=list
    )

    missing_points: List[str] = Field(
        default_factory=list
    )

    feedback: str

    suggested_answer: str

    status: Literal[
        "evaluated",
        "manual_review"
    ] = "evaluated"
