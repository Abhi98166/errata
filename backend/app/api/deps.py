from __future__ import annotations

import re

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User

USER_HEADER = "X-Errata-User"

_UUID_ISH = re.compile(r"^[A-Za-z0-9_-]{8,64}$")


def current_user_id(
    db: Session = Depends(get_db),
    x_errata_user: str | None = Header(default=None, alias=USER_HEADER),
) -> str:
    if not x_errata_user or not _UUID_ISH.match(x_errata_user):
        raise HTTPException(status_code=400, detail=f"missing or malformed {USER_HEADER}")

    if db.get(User, x_errata_user) is None:
        db.add(User(id=x_errata_user))
        db.commit()

    return x_errata_user
