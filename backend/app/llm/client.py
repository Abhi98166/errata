from __future__ import annotations

import logging
import random
import time
from typing import Protocol

from app.config import get_settings

log = logging.getLogger(__name__)

STUB_MODEL_NAME = "stub"
PREVIEW_CHARS = 220


class LLMError(Exception):
    pass


class LLMClient(Protocol):
    name: str

    def complete(
        self, *, system: str, user: str, max_tokens: int = 2048, temperature: float = 1.0
    ) -> str: ...


class LiteLLMClient:
    def __init__(self, model: str, api_key: str) -> None:
        self.name = model
        self._api_key = api_key

    def complete(
        self, *, system: str, user: str, max_tokens: int = 2048, temperature: float = 1.0
    ) -> str:
        import litellm

        log.info(
            "llm -> %s | system=%dch user=%dch max_tokens=%d temp=%.1f",
            self.name,
            len(system),
            len(user),
            max_tokens,
            temperature,
        )
        started = time.perf_counter()

        try:
            response = litellm.completion(
                model=self.name,
                api_key=self._api_key,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                max_tokens=max_tokens,
                temperature=temperature,
            )
        except Exception as exc:  # noqa: BLE001
            log.error(
                "llm FAILED after %.2fs | %s: %s",
                time.perf_counter() - started,
                type(exc).__name__,
                exc,
            )
            raise LLMError(f"{type(exc).__name__}: {exc}") from exc

        elapsed = time.perf_counter() - started
        content = response.choices[0].message.content
        usage = getattr(response, "usage", None)

        log.info(
            "llm <- %s | %.2fs tokens_in=%s tokens_out=%s chars=%d finish=%s",
            self.name,
            elapsed,
            getattr(usage, "prompt_tokens", "?"),
            getattr(usage, "completion_tokens", "?"),
            len(content or ""),
            getattr(response.choices[0], "finish_reason", "?"),
        )
        log.info("llm text | %s", (content or "")[:PREVIEW_CHARS].replace("\n", " "))

        if not content:
            raise LLMError(
                f"empty completion (finish_reason="
                f"{getattr(response.choices[0], 'finish_reason', '?')})"
            )
        return content


class StubLLMClient:
    name = STUB_MODEL_NAME

    _SEEDS = [
        "The kettle had been boiling for eleven minutes before anyone thought to "
        "look at it. By then the window above the sink had fogged into a flat "
        "white square and the cat had relocated to the top of the fridge, where "
        "it sat with the composed expression of an animal that had predicted all "
        "of this and been ignored.",
        "You notice the hallway is one door longer than it was this morning. The "
        "carpet runs on past where the wall used to stop. You count the doors "
        "again from the other end and get a different number, and you decide, "
        "standing very still, that you will count them once more tomorrow.",
        "There was a particular way she set the mug down, always slightly off "
        "centre, always with a small sound like a held breath let go. You never "
        "mentioned it. Years later it is the thing you remember first, before "
        "the house, before the year, before any of the rest of it.",
    ]

    def complete(
        self, *, system: str, user: str, max_tokens: int = 2048, temperature: float = 1.0
    ) -> str:
        seed = random.choice(self._SEEDS)
        sentences = [s.strip() for s in seed.split(". ") if s.strip()]
        out: list[str] = []
        while len(" ".join(out).split()) < 90:
            out.append(random.choice(sentences).rstrip(".") + ".")
        return " ".join(out)


def build_client() -> LLMClient:
    settings = get_settings()
    if not settings.llm_enabled or not settings.gemini_api_key:
        log.warning("LLM disabled or no API key set; serving stub passages.")
        return StubLLMClient()
    return LiteLLMClient(model=settings.model, api_key=settings.gemini_api_key)


_client: LLMClient | None = None


def get_client() -> LLMClient:
    global _client
    if _client is None:
        _client = build_client()
    return _client


def set_client(client: LLMClient) -> None:
    global _client
    _client = client
