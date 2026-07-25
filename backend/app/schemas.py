from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.genres import DEFAULT_GENRE


class UserConfigModel(BaseModel):
    model_config = ConfigDict(extra="ignore")

    genre: str = DEFAULT_GENRE
    duration: int = 60

    sound_enabled: bool = False
    keypress_volume: float = Field(default=0.35, ge=0.0, le=1.0)
    ambient_enabled: bool = False
    ambient_volume: float = Field(default=0.2, ge=0.0, le=1.0)

    theme_override: str | None = None

    keyboard_layout: Literal["qwerty"] = "qwerty"
    reduced_motion: bool = False
    cursor_mode: Literal["advance", "block"] = "advance"


class GenreOut(BaseModel):
    id: str
    label: str
    blurb: str


class PassageOut(BaseModel):
    id: str
    text: str
    genre: str
    word_count: int
    kind: str
    targets: list[str] | None = None


class KeystrokeIn(BaseModel):
    seq: int
    t_ms: int
    key: str
    index: int


class SessionIn(BaseModel):
    passage_id: str
    duration_s: int
    keystrokes: list[KeystrokeIn]
    drill_id: str | None = None


class FindingOut(BaseModel):
    kind: str
    diagnosis: str
    targets: list[str]
    evidence: dict


class DrillResultOut(BaseModel):
    drill_id: str
    passed: bool
    target_accuracy: float | None
    threshold: float
    attempts: int
    eased: bool = False


class SessionOut(BaseModel):
    session_id: str
    analysis: dict
    findings: list[FindingOut]
    profile: dict
    plan_available: bool
    drill_result: DrillResultOut | None = None


class DrillOut(BaseModel):
    id: str
    rank: int
    kind: str
    diagnosis: str
    targets: list[str]
    rationale: str | None
    status: str
    attempts: int
    pass_threshold: float


class PlanOut(BaseModel):
    id: str
    status: str
    drills: list[DrillOut]


class DrillStartOut(BaseModel):
    drill: DrillOut
    passage: PassageOut
