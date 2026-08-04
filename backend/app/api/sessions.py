from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.analysis import plan as plan_mod, profile as profile_mod
from app.analysis.analyse import Keystroke, analyse, target_accuracy
from app.api.deps import current_user_id
from app.db import get_db
from app.models import Drill, Passage, Profile, TypingSession
from app.schemas import (
    DrillResultOut,
    FindingOut,
    NearMissOut,
    SessionIn,
    SessionOut,
)

router = APIRouter()

ATTEMPTS_BEFORE_EASING = 3
EASING_STEP = 0.02
EASING_FLOOR = 0.90


@router.post("/sessions", response_model=SessionOut)
def submit_session(
    payload: SessionIn,
    db: Session = Depends(get_db),
    user_id: str = Depends(current_user_id),
) -> SessionOut:
    passage = db.get(Passage, payload.passage_id)
    if passage is None:
        raise HTTPException(status_code=404, detail="unknown passage")

    strokes = [
        Keystroke(seq=k.seq, t_ms=k.t_ms, key=k.key, index=k.index)
        for k in payload.keystrokes
    ]
    result = analyse(strokes, passage.text)

    row = db.get(Profile, user_id)
    updated = profile_mod.update(row.data if row else None, result)
    if row is None:
        db.add(Profile(user_id=user_id, data=updated))
    else:
        row.data = updated

    session = TypingSession(
        user_id=user_id,
        passage_id=passage.id,
        drill_id=payload.drill_id,
        genre=passage.genre,
        duration_s=payload.duration_s,
        wpm=result.wpm,
        accuracy=result.accuracy,
        analysis=result.to_dict(),
        keystrokes=[k.model_dump() for k in payload.keystrokes],
    )
    db.add(session)

    drill_result = (
        _judge_drill(db, payload.drill_id, result) if payload.drill_id else None
    )

    db.commit()

    findings = plan_mod.build_findings(updated)
    near_misses = plan_mod.find_near_misses(updated, findings)
    can_plan = profile_mod.has_enough_evidence(updated) and bool(findings)

    return SessionOut(
        session_id=session.id,
        analysis=result.to_dict(),
        findings=[
            FindingOut(
                kind=f.kind,
                diagnosis=f.diagnosis,
                targets=f.targets,
                evidence=f.evidence,
            )
            for f in findings
        ],
        near_misses=[
            NearMissOut(
                pair=m.pair,
                expected=m.expected,
                actual=m.actual,
                count=m.count,
                attempts=m.attempts,
                reason=m.reason,
            )
            for m in near_misses
        ],
        profile=_public_profile(updated),
        plan_available=can_plan,
        drill_result=drill_result,
    )


def _judge_drill(db: Session, drill_id: str, result) -> DrillResultOut | None:
    drill = db.get(Drill, drill_id)
    if drill is None:
        return None

    drill.attempts += 1

    eased = False
    if drill.attempts > ATTEMPTS_BEFORE_EASING:
        overshoot = drill.attempts - ATTEMPTS_BEFORE_EASING
        drill.pass_threshold = max(
            EASING_FLOOR, drill.pass_threshold - EASING_STEP * overshoot
        )
        eased = True

    accuracy = target_accuracy(result, drill.targets)
    passed = accuracy is not None and accuracy >= drill.pass_threshold
    if passed:
        drill.status = "passed"

    return DrillResultOut(
        drill_id=drill.id,
        passed=passed,
        target_accuracy=round(accuracy, 4) if accuracy is not None else None,
        threshold=round(drill.pass_threshold, 4),
        attempts=drill.attempts,
        eased=eased,
    )


def _public_profile(profile: dict) -> dict:
    return {
        "sessions": profile["sessions"],
        "total_keystrokes": profile["total_keystrokes"],
        "wpm": profile["wpm"],
        "accuracy": profile["accuracy"],
        "consistency": profile["consistency"],
    }
