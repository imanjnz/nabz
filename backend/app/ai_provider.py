
import os
from abc import ABC, abstractmethod
from typing import Any

from dotenv import load_dotenv

from app.ai_schemas import (
    DescriptiveEvaluationRequest,
    DescriptiveEvaluationResponse
)

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

ENV_FILE = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_FILE)


class AIProviderError(Exception):
    pass


class AIProviderNotConfigured(AIProviderError):
    pass


class AIQuestionProvider(ABC):

    @abstractmethod
    async def generate_questions(
        self,
        source_text: str,
        question_count: int,
        difficulty: str,
        question_type: str
    ) -> list[dict[str, Any]]:
        pass

    @abstractmethod
    async def evaluate_descriptive_answer(
        self,
        request: DescriptiveEvaluationRequest
    ) -> DescriptiveEvaluationResponse:
        pass


def get_ai_provider() -> AIQuestionProvider:

    provider_name = os.getenv(
        "NABZ_AI_PROVIDER",
        "mock"
    ).lower()

    if provider_name == "mock":

        from app.mock_provider import MockAIProvider

        return MockAIProvider()

    if provider_name == "openai":

        raise AIProviderNotConfigured(
            "OpenAI provider has not been implemented yet."
        )

    raise AIProviderNotConfigured(
        f"Unknown AI provider: {provider_name}"
    )
