from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import current_user_id
from app.db import get_db
from app.genres import DURATIONS, GENRES
from app.llm.client import STUB_MODEL_NAME, get_client
from app.models import Passage, UserConfig
from app.schemas import GenreOut, UserConfigModel

router = APIRouter()


@router.get("/genres", response_model=list[GenreOut])
def list_genres() -> list[GenreOut]:
    return [GenreOut(id=g.id, label=g.label, blurb=g.blurb) for g in GENRES.values()]


@router.get("/durations", response_model=list[int])
def list_durations() -> list[int]:
    return list(DURATIONS)


@router.get("/debug/corpus")
def corpus_state(db: Session = Depends(get_db)) -> dict:
    rows = db.execute(
        select(
            Passage.model,
            Passage.kind,
            Passage.genre,
            Passage.duration_bucket,
            Passage.prompt_version,
            func.count().label("n"),
        ).group_by(
            Passage.model,
            Passage.kind,
            Passage.genre,
            Passage.duration_bucket,
            Passage.prompt_version,
        )
    ).all()

    active = get_client().name
    return {
        "active_model": active,
        "using_stub": active == STUB_MODEL_NAME,
        "stub_passages_are_being_excluded": active != STUB_MODEL_NAME,
        "passages": [
            {
                "model": r.model,
                "kind": r.kind,
                "genre": r.genre,
                "duration": r.duration_bucket,
                "prompt_version": r.prompt_version,
                "count": r.n,
                "servable": active == STUB_MODEL_NAME or r.model != STUB_MODEL_NAME,
            }
            for r in rows
        ],
    }


def load_config(db: Session, user_id: str) -> UserConfigModel:
    row = db.get(UserConfig, user_id)
    return UserConfigModel.model_validate(row.data if row else {})


@router.get("/config", response_model=UserConfigModel)
def get_config(
    db: Session = Depends(get_db), user_id: str = Depends(current_user_id)
) -> UserConfigModel:
    return load_config(db, user_id)


@router.put("/config", response_model=UserConfigModel)
def put_config(
    payload: UserConfigModel,
    db: Session = Depends(get_db),
    user_id: str = Depends(current_user_id),
) -> UserConfigModel:
    row = db.get(UserConfig, user_id)
    if row is None:
        row = UserConfig(user_id=user_id)
        db.add(row)

    row.data = payload.model_dump()
    db.commit()
    return payload
