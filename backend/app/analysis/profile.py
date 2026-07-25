from __future__ import annotations

from app.analysis.analyse import Analysis

DECAY = 0.8

MIN_KEY_ATTEMPTS = 20
MIN_KEY_ERRORS = 3.0
MIN_BIGRAM_ATTEMPTS = 8
MIN_CONFUSION_COUNT = 3.0

EMPTY: dict = {
    "sessions": 0,
    "total_keystrokes": 0,
    "wpm": 0.0,
    "accuracy": 0.0,
    "consistency": 0.0,
    "confusion": {},
    "keys": {},
    "bigrams": {},
    "fingers": {},
}


def _blend(previous: float, current: float, sessions: int) -> float:
    if sessions == 0:
        return current
    return previous * DECAY + current * (1 - DECAY)


def _decay_counter(
    existing: dict[str, float], incoming: dict[str, int]
) -> dict[str, float]:
    merged = {key: value * DECAY for key, value in existing.items()}
    for key, value in incoming.items():
        merged[key] = merged.get(key, 0.0) + value
    return {k: round(v, 3) for k, v in merged.items() if v >= 0.5}


def _decay_stats(existing: dict[str, dict], incoming: dict[str, dict]) -> dict[str, dict]:
    merged: dict[str, dict] = {
        key: {
            "attempts": value["attempts"] * DECAY,
            "errors": value["errors"] * DECAY,
            "mean_ms": value["mean_ms"],
        }
        for key, value in existing.items()
    }

    for key, value in incoming.items():
        if key in merged:
            prior = merged[key]
            weight = value["attempts"] / (prior["attempts"] + value["attempts"])
            prior["attempts"] += value["attempts"]
            prior["errors"] += value["errors"]
            prior["mean_ms"] = prior["mean_ms"] * (1 - weight) + value["mean_ms"] * weight
        else:
            merged[key] = {
                "attempts": float(value["attempts"]),
                "errors": float(value["errors"]),
                "mean_ms": value["mean_ms"],
            }

    return {
        key: {
            "attempts": round(value["attempts"], 2),
            "errors": round(value["errors"], 2),
            "error_rate": round(value["errors"] / value["attempts"], 4)
            if value["attempts"]
            else 0.0,
            "mean_ms": round(value["mean_ms"], 1),
        }
        for key, value in merged.items()
        if value["attempts"] >= 1
    }


def update(existing: dict | None, analysis: Analysis) -> dict:
    profile = {**EMPTY, **(existing or {})}
    sessions = profile["sessions"]

    return {
        "sessions": sessions + 1,
        "total_keystrokes": profile["total_keystrokes"] + analysis.typed_chars,
        "wpm": round(_blend(profile["wpm"], analysis.wpm, sessions), 2),
        "accuracy": round(_blend(profile["accuracy"], analysis.accuracy, sessions), 4),
        "consistency": round(
            _blend(profile["consistency"], analysis.consistency, sessions), 4
        ),
        "confusion": _decay_counter(profile["confusion"], analysis.confusion),
        "keys": _decay_stats(profile["keys"], analysis.key_stats),
        "bigrams": _decay_stats(profile["bigrams"], analysis.bigram_stats),
        "fingers": _decay_stats(profile["fingers"], analysis.finger_stats),
    }


def has_enough_evidence(profile: dict | None) -> bool:
    if not profile:
        return False
    return profile.get("total_keystrokes", 0) >= 300
