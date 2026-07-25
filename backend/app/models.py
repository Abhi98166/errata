from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    config: Mapped[UserConfig | None] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    profile: Mapped[Profile | None] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class UserConfig(Base):
    __tablename__ = "user_configs"

    user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("users.id"), primary_key=True
    )
    data: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    user: Mapped[User] = relationship(back_populates="config")


class Passage(Base):
    __tablename__ = "passages"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=_uuid)
    kind: Mapped[str] = mapped_column(String(16))
    genre: Mapped[str] = mapped_column(String(32))
    duration_bucket: Mapped[int] = mapped_column(Integer)

    text: Mapped[str] = mapped_column(Text)
    word_count: Mapped[int] = mapped_column(Integer)
    char_count: Mapped[int] = mapped_column(Integer)

    model: Mapped[str] = mapped_column(String(128))
    prompt_version: Mapped[str] = mapped_column(String(32))

    is_private: Mapped[bool] = mapped_column(Boolean, default=False)
    targets: Mapped[list | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


Index(
    "ix_passages_pool",
    Passage.kind,
    Passage.genre,
    Passage.duration_bucket,
    Passage.is_private,
)


class Serving(Base):
    __tablename__ = "servings"
    __table_args__ = (UniqueConstraint("user_id", "passage_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id"), index=True)
    passage_id: Mapped[str] = mapped_column(String(64), ForeignKey("passages.id"))
    served_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class TypingSession(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id"), index=True)
    passage_id: Mapped[str] = mapped_column(String(64), ForeignKey("passages.id"))
    drill_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("drills.id"), nullable=True
    )

    genre: Mapped[str] = mapped_column(String(32))
    duration_s: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    wpm: Mapped[float] = mapped_column(Float)
    accuracy: Mapped[float] = mapped_column(Float)

    analysis: Mapped[dict] = mapped_column(JSON)
    keystrokes: Mapped[list] = mapped_column(JSON)


class Profile(Base):
    __tablename__ = "profiles"

    user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("users.id"), primary_key=True
    )
    data: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    user: Mapped[User] = relationship(back_populates="profile")


class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(String(16), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    drills: Mapped[list[Drill]] = relationship(
        back_populates="plan", cascade="all, delete-orphan", order_by="Drill.rank"
    )


class Drill(Base):
    __tablename__ = "drills"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=_uuid)
    plan_id: Mapped[str] = mapped_column(String(64), ForeignKey("plans.id"), index=True)
    rank: Mapped[int] = mapped_column(Integer)

    kind: Mapped[str] = mapped_column(String(24))
    diagnosis: Mapped[str] = mapped_column(Text)
    targets: Mapped[list] = mapped_column(JSON)
    evidence: Mapped[dict] = mapped_column(JSON, default=dict)

    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    passage_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("passages.id"), nullable=True
    )

    pass_metric: Mapped[str] = mapped_column(String(32), default="target_accuracy")
    pass_threshold: Mapped[float] = mapped_column(Float, default=0.98)

    status: Mapped[str] = mapped_column(String(16), default="pending")
    attempts: Mapped[int] = mapped_column(Integer, default=0)

    plan: Mapped[Plan] = relationship(back_populates="drills")
