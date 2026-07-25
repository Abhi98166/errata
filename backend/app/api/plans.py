from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.analysis import plan as plan_mod, profile as profile_mod
from app.api.deps import current_user_id
from app.api.meta import load_config
from app.content.generator import GenerationFailed, generate_drill, write_rationale
from app.db import get_db
from app.llm.client import LLMError
from app.models import Drill, Plan, Profile
from app.schemas import DrillOut, DrillStartOut, PassageOut, PlanOut

router = APIRouter()


def _to_out(plan: Plan) -> PlanOut:
    return PlanOut(
        id=plan.id,
        status=plan.status,
        drills=[
            DrillOut(
                id=d.id,
                rank=d.rank,
                kind=d.kind,
                diagnosis=d.diagnosis,
                targets=d.targets,
                rationale=d.rationale,
                status=d.status,
                attempts=d.attempts,
                pass_threshold=d.pass_threshold,
            )
            for d in plan.drills
        ],
    )


def _active_plan(db: Session, user_id: str) -> Plan | None:
    stmt = (
        select(Plan)
        .where(Plan.user_id == user_id, Plan.status == "active")
        .order_by(Plan.created_at.desc())
        .limit(1)
    )
    return db.execute(stmt).scalar_one_or_none()


@router.get("/plan", response_model=PlanOut | None)
def get_plan(
    db: Session = Depends(get_db), user_id: str = Depends(current_user_id)
) -> PlanOut | None:
    plan = _active_plan(db, user_id)
    return _to_out(plan) if plan else None


@router.post("/plan", response_model=PlanOut)
def create_plan(
    db: Session = Depends(get_db), user_id: str = Depends(current_user_id)
) -> PlanOut:
    row = db.get(Profile, user_id)
    profile = row.data if row else None

    if not profile_mod.has_enough_evidence(profile):
        raise HTTPException(
            status_code=409,
            detail="not enough typing yet to say anything true -- run another session",
        )

    findings = plan_mod.build_findings(profile)
    if not findings:
        raise HTTPException(
            status_code=409, detail="no weakness is showing up often enough to drill"
        )

    if (existing := _active_plan(db, user_id)) is not None:
        existing.status = "superseded"

    plan = Plan(user_id=user_id)
    plan.drills = [
        Drill(
            rank=rank,
            kind=finding.kind,
            diagnosis=finding.diagnosis,
            targets=finding.targets,
            evidence=finding.evidence,
        )
        for rank, finding in enumerate(findings, start=1)
    ]
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return _to_out(plan)


@router.post("/plan/drills/{drill_id}/start", response_model=DrillStartOut)
def start_drill(
    drill_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(current_user_id),
) -> DrillStartOut:
    drill = db.get(Drill, drill_id)
    if drill is None or drill.plan.user_id != user_id:
        raise HTTPException(status_code=404, detail="unknown drill")

    genre = load_config(db, user_id).genre

    if drill.rationale is None:
        drill.rationale = write_rationale(drill.diagnosis, drill.targets)

    # Regenerated per attempt: repeating identical text trains the text.
    try:
        passage = generate_drill(db, genre, drill.targets)
    except (GenerationFailed, LLMError) as exc:
        raise HTTPException(status_code=503, detail=f"could not write a drill: {exc}")

    drill.passage_id = passage.id
    if drill.status == "pending":
        drill.status = "active"
    db.commit()

    return DrillStartOut(
        drill=DrillOut(
            id=drill.id,
            rank=drill.rank,
            kind=drill.kind,
            diagnosis=drill.diagnosis,
            targets=drill.targets,
            rationale=drill.rationale,
            status=drill.status,
            attempts=drill.attempts,
            pass_threshold=drill.pass_threshold,
        ),
        passage=PassageOut(
            id=passage.id,
            text=passage.text,
            genre=passage.genre,
            word_count=passage.word_count,
            kind=passage.kind,
            targets=passage.targets,
        ),
    )
