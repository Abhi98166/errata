from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import current_user_id
from app.content.generator import GenerationFailed, serve_story, warm_pool
from app.db import get_db
from app.genres import DURATIONS, GENRES
from app.llm.client import LLMError
from app.schemas import PassageOut

router = APIRouter()


@router.post("/passages/next", response_model=PassageOut)
def next_passage(
    background: BackgroundTasks,
    genre: str = Query(...),
    duration: int = Query(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(current_user_id),
) -> PassageOut:
    if genre not in GENRES:
        raise HTTPException(status_code=400, detail=f"unknown genre: {genre}")
    if duration not in DURATIONS:
        raise HTTPException(status_code=400, detail=f"unknown duration: {duration}")

    try:
        passage = serve_story(db, user_id, genre, duration)
    except (GenerationFailed, LLMError) as exc:
        raise HTTPException(status_code=503, detail=f"could not write a passage: {exc}")

    background.add_task(warm_pool, genre, duration)

    return PassageOut(
        id=passage.id,
        text=passage.text,
        genre=passage.genre,
        word_count=passage.word_count,
        kind=passage.kind,
        targets=passage.targets,
    )
