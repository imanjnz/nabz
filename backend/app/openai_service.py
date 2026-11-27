import json
import os
from typing import Any

from openai import AsyncOpenAI

from app.ai_provider import AIProviderNotConfigured


class OpenAIService:
    """Shared async OpenAI client for all NABZ AI capabilities."""

    def __init__(self) -> None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise AIProviderNotConfigured(
                "OPENAI_API_KEY is missing. Add it to backend/.env."
            )
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.client = AsyncOpenAI(
            api_key=api_key,
            timeout=float(os.getenv("OPENAI_TIMEOUT_SECONDS", "60")),
            max_retries=2,
        )

    async def text(self, *, system: str, user: str) -> str:
        response = await self.client.chat.completions.create(
            model=self.model,
            temperature=0.4,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        content = response.choices[0].message.content
        if not content:
            raise RuntimeError("OpenAI returned an empty response.")
        return content.strip()

    async def json(self, *, system: str, user: str) -> Any:
        response = await self.client.chat.completions.create(
            model=self.model,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        content = response.choices[0].message.content
        if not content:
            raise RuntimeError("OpenAI returned an empty response.")
        return json.loads(content)
