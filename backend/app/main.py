from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import meta, passages, plans, sessions
from app.config import get_settings
from app.db import init_db

logging.basicConfig(level=logging.INFO)

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    init_db()
    yield


app = FastAPI(title="errata", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meta.router, prefix="/api")
app.include_router(passages.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(plans.router, prefix="/api")


@app.get("/api/health")
def health() -> dict:
    from app.llm.client import get_client

    return {"status": "ok", "model": get_client().name}
