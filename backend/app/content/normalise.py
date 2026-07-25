from __future__ import annotations

import re
import unicodedata

ALLOWED_CHARS = frozenset(
    "abcdefghijklmnopqrstuvwxyz"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "0123456789"
    " .,'\"?!-;:()"
)

_SUBSTITUTIONS = {
    "‘": "'", "’": "'", "‚": "'", "‛": "'",
    "“": '"', "”": '"', "„": '"', "«": '"', "»": '"',
    "–": "-", "—": "-", "―": "-", "−": "-",
    "…": "...",
    " ": " ", " ": " ", " ": " ", " ": " ",
    "•": ",", "·": ",",
    "æ": "ae", "ß": "ss", "œ": "oe",
}

_MARKDOWN_NOISE = re.compile(r"[*_`#>\[\]{}]")
_WHITESPACE = re.compile(r"\s+")
_SPACE_BEFORE_PUNCT = re.compile(r"\s+([.,;:!?])")


class PassageRejected(Exception):
    pass


def normalise(text: str) -> str:
    for source, target in _SUBSTITUTIONS.items():
        text = text.replace(source, target)

    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))

    text = _MARKDOWN_NOISE.sub("", text)
    text = _WHITESPACE.sub(" ", text)
    text = "".join(ch for ch in text if ch in ALLOWED_CHARS)
    text = _SPACE_BEFORE_PUNCT.sub(r"\1", text)

    return text.strip()


def offending_characters(text: str) -> set[str]:
    return {ch for ch in text if ch not in ALLOWED_CHARS}


def validate(text: str, *, min_words: int, max_words: int) -> list[str]:
    problems: list[str] = []

    bad = offending_characters(text)
    if bad:
        problems.append(f"untypeable characters: {sorted(bad)!r}")

    words = text.split()
    if len(words) < min_words:
        problems.append(f"too short: {len(words)} words, wanted >= {min_words}")
    if len(words) > max_words:
        problems.append(f"too long: {len(words)} words, wanted <= {max_words}")

    if "  " in text:
        problems.append("double spaces")

    return problems


def prepare(text: str, *, target_words: int, tolerance: float = 0.4) -> str:
    cleaned = normalise(text)
    problems = validate(
        cleaned,
        min_words=int(target_words * (1 - tolerance)),
        max_words=int(target_words * (1 + tolerance)),
    )
    if problems:
        raise PassageRejected("; ".join(problems))
    return cleaned


def target_density(text: str, targets: list[str]) -> float:
    if not targets or not text:
        return 0.0
    lowered = text.lower()
    hits = sum(lowered.count(t.lower()) * len(t) for t in targets)
    return hits / len(lowered)
