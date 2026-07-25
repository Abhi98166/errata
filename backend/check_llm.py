from __future__ import annotations

import logging
import sys

logging.basicConfig(level=logging.INFO, format="%(levelname)-7s %(name)s | %(message)s")

from app.config import get_settings  # noqa: E402
from app.content.normalise import (  # noqa: E402
    PassageRejected,
    normalise,
    offending_characters,
    prepare,
)
from app.genres import get_genre, word_target  # noqa: E402
from app.llm import prompts  # noqa: E402
from app.llm.client import STUB_MODEL_NAME, LLMError, get_client  # noqa: E402


def main() -> int:
    genre_id = sys.argv[1] if len(sys.argv) > 1 else "comedic"
    duration = int(sys.argv[2]) if len(sys.argv) > 2 else 60

    settings = get_settings()
    client = get_client()

    print("=" * 72)
    print(f"configured model : {settings.model}")
    print(f"llm_enabled      : {settings.llm_enabled}")
    print(f"api key present  : {bool(settings.gemini_api_key)}")
    print(f"active client    : {client.name}")
    print("=" * 72)

    if client.name == STUB_MODEL_NAME:
        print("\nRunning on the stub client -- no network call will be made.")
        print("Set ERRATA_GEMINI_API_KEY in backend/.env and ERRATA_LLM_ENABLED=true.")
        return 1

    genre = get_genre(genre_id)
    words = word_target(duration)
    system, user = prompts.story_prompt(genre, words)

    print(f"\ngenre={genre.id}  duration={duration}s  target={words} words\n")

    try:
        raw = client.complete(system=system, user=user, max_tokens=1024 + words * 4)
    except LLMError as exc:
        print(f"\nCALL FAILED: {exc}")
        return 1

    cleaned = normalise(raw)

    print("\n" + "-" * 72)
    print("RAW MODEL OUTPUT")
    print("-" * 72)
    print(raw)

    print("\n" + "-" * 72)
    print("AFTER NORMALISATION")
    print("-" * 72)
    print(cleaned)

    print("\n" + "-" * 72)
    print(f"raw words        : {len(raw.split())}  (target {words})")
    print(f"normalised words : {len(cleaned.split())}")
    print(f"stripped chars   : {sorted(offending_characters(raw))}")

    try:
        prepare(raw, target_words=words)
        print("verdict          : ACCEPTED into the corpus")
    except PassageRejected as exc:
        print(f"verdict          : REJECTED -- {exc}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
