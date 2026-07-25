from __future__ import annotations

import logging

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.content.normalise import PassageRejected, prepare
from app.genres import get_genre, word_target
from app.llm import prompts
from app.llm.client import STUB_MODEL_NAME, LLMError, get_client
from app.models import Passage, Serving

log = logging.getLogger(__name__)

DRILL_WORD_COUNT = 130


class GenerationFailed(Exception):
    pass


def serve_story(db: Session, user_id: str, genre_id: str, duration_s: int) -> Passage:
    passage = _take_unserved(db, user_id, genre_id, duration_s)

    if passage is not None:
        log.info(
            "passage from pool | %s/%ss id=%s model=%s prompt=%s words=%d",
            genre_id,
            duration_s,
            passage.id[:8],
            passage.model,
            passage.prompt_version,
            passage.word_count,
        )
    else:
        log.info(
            "pool empty for %s/%ss -- generating a new passage", genre_id, duration_s
        )
        passage = generate_story(db, genre_id, duration_s)

    db.add(Serving(user_id=user_id, passage_id=passage.id))
    db.commit()
    return passage


def _take_unserved(
    db: Session, user_id: str, genre_id: str, duration_s: int
) -> Passage | None:
    seen = select(Serving.passage_id).where(Serving.user_id == user_id)

    conditions = [
        Passage.kind == "story",
        Passage.genre == genre_id,
        Passage.duration_bucket == duration_s,
        Passage.is_private.is_(False),
        Passage.id.not_in(seen),
    ]

    # Shipped as a bug once: a corpus seeded offline shadowed real writing forever.
    if get_client().name != STUB_MODEL_NAME:
        conditions.append(Passage.model != STUB_MODEL_NAME)

    stmt = select(Passage).where(*conditions).order_by(func.random()).limit(1)
    return db.execute(stmt).scalar_one_or_none()


def generate_story(db: Session, genre_id: str, duration_s: int) -> Passage:
    genre = get_genre(genre_id)
    words = word_target(duration_s)
    system, user = prompts.story_prompt(genre, words)

    text = _generate_valid(system, user, target_words=words)

    passage = Passage(
        kind="story",
        genre=genre.id,
        duration_bucket=duration_s,
        text=text,
        word_count=len(text.split()),
        char_count=len(text),
        model=get_client().name,
        prompt_version=prompts.STORY_PROMPT_VERSION,
        is_private=False,
    )
    db.add(passage)
    db.commit()
    db.refresh(passage)
    return passage


def pool_depth(db: Session, genre_id: str, duration_s: int) -> int:
    conditions = [
        Passage.kind == "story",
        Passage.genre == genre_id,
        Passage.duration_bucket == duration_s,
        Passage.is_private.is_(False),
    ]
    if get_client().name != STUB_MODEL_NAME:
        conditions.append(Passage.model != STUB_MODEL_NAME)

    return db.execute(
        select(func.count()).select_from(Passage).where(*conditions)
    ).scalar_one()


def warm_pool(genre_id: str, duration_s: int) -> None:
    from app.db import SessionLocal

    settings = get_settings()
    db = SessionLocal()
    try:
        while pool_depth(db, genre_id, duration_s) < settings.pool_target:
            generate_story(db, genre_id, duration_s)
    except (GenerationFailed, LLMError) as exc:
        log.warning("pool warm failed for %s/%s: %s", genre_id, duration_s, exc)
    finally:
        db.close()


def generate_drill(db: Session, genre_id: str, targets: list[str]) -> Passage:
    genre = get_genre(genre_id)
    system, user = prompts.drill_prompt(genre, targets, DRILL_WORD_COUNT)

    text = _generate_valid(system, user, target_words=DRILL_WORD_COUNT, targets=targets)

    passage = Passage(
        kind="drill",
        genre=genre.id,
        duration_bucket=0,
        text=text,
        word_count=len(text.split()),
        char_count=len(text),
        model=get_client().name,
        prompt_version=prompts.DRILL_PROMPT_VERSION,
        is_private=True,
        targets=targets,
    )
    db.add(passage)
    db.commit()
    db.refresh(passage)
    return passage


def write_rationale(diagnosis: str, targets: list[str]) -> str | None:
    system, user = prompts.rationale_prompt(diagnosis, targets)
    try:
        from app.content.normalise import normalise

        return normalise(get_client().complete(system=system, user=user, max_tokens=300))
    except LLMError as exc:
        log.warning("rationale generation failed: %s", exc)
        return None


def _min_target_hits(word_count: int) -> int:
    return max(6, word_count // 10)


def _generate_valid(
    system: str,
    user: str,
    *,
    target_words: int,
    targets: list[str] | None = None,
) -> str:
    settings = get_settings()
    client = get_client()
    best: tuple[int, str] | None = None
    last_error = "no attempts made"

    for attempt in range(settings.generation_attempts):
        try:
            raw = client.complete(
                system=system,
                user=user,
                # Headroom so a thinking model does not get truncated mid-sentence.
                max_tokens=1024 + target_words * 4,
                temperature=1.0,
            )
        except LLMError as exc:
            last_error = f"provider error: {exc}"
            log.warning("generation attempt %s failed: %s", attempt, exc)
            continue

        try:
            text = prepare(raw, target_words=target_words)
        except PassageRejected as exc:
            last_error = str(exc)
            log.warning(
                "attempt %d REJECTED: %s | raw was %r",
                attempt + 1,
                exc,
                raw[:160].replace("\n", " "),
            )
            continue

        if not targets:
            log.info(
                "attempt %d accepted | %d words, %d chars",
                attempt + 1,
                len(text.split()),
                len(text),
            )
            return text

        lowered = text.lower()
        counts = {t: lowered.count(t.lower()) for t in targets}
        weakest = min(counts.values())
        needed = _min_target_hits(target_words)

        log.info(
            "attempt %d drill density | %s (need %d each)", attempt + 1, counts, needed
        )
        if weakest >= needed:
            return text

        last_error = f"target density too low (weakest target appeared {weakest}x)"
        if best is None or weakest > best[0]:
            best = (weakest, text)

    if best is not None:
        log.info("using best-effort drill passage: %s", last_error)
        return best[1]

    raise GenerationFailed(last_error)
