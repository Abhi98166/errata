from __future__ import annotations

from app.genres import Genre

STORY_PROMPT_VERSION = "story-v1"
DRILL_PROMPT_VERSION = "drill-v1"
RATIONALE_PROMPT_VERSION = "rationale-v1"


TYPEABILITY = """\
HARD CONSTRAINTS. These are absolute and override every stylistic instruction:
- Use ONLY plain ASCII. Allowed punctuation: . , ' " ? ! - ; : ( )
- NO em dashes, NO en dashes, NO ellipsis characters, NO curly or smart quotes,
  NO accented letters, NO emoji, NO symbols of any kind.
- Write ONE continuous paragraph. No line breaks, no headings, no lists, no
  markdown, no title, no quotation of the instructions.
- No double spaces. No trailing whitespace.
- Ordinary English words only. No invented spellings, no numerals written as
  digits where a word would do.
- Output the passage text and nothing else. No preamble, no commentary."""


def _system(genre: Genre) -> str:
    risks = ", ".join(genre.punctuation_risks)
    return (
        "You write short passages for a typing practice app. Every character you "
        "write will be typed by hand on a physical keyboard, so typeability "
        "outranks style whenever the two conflict.\n\n"
        f"{TYPEABILITY}\n\n"
        f"Your genre habitually reaches for {risks}. Do not. Rewrite around them."
    )


def story_prompt(genre: Genre, word_count: int) -> tuple[str, str]:
    user = (
        f"{genre.voice}\n\n"
        f"Write approximately {word_count} words.\n\n"
        "It must be ONE coherent piece with a beginning, a middle and an end -- "
        "not a set of unrelated sentences. It will be read while it is being "
        "typed, so it has to hold attention from the first line without any "
        "setup. Make it specific: real objects, real places, real detail."
    )
    return _system(genre), user


def drill_prompt(genre: Genre, targets: list[str], word_count: int) -> tuple[str, str]:
    shown = ", ".join(f'"{t}"' for t in targets)
    user = (
        f"{genre.voice}\n\n"
        f"Write approximately {word_count} words.\n\n"
        f"CRITICAL: this passage is typing practice for these specific letter "
        f"sequences: {shown}\n"
        "Choose words so that those sequences appear as often as you can manage "
        "while the writing still reads as natural, genuine prose in the voice "
        "above. Never repeat the same word over and over, never write a list of "
        "words, and never mention that this is practice. It must read like a real "
        "passage that happens to be unusually full of those letters."
    )
    return _system(genre), user


def rationale_prompt(diagnosis: str, targets: list[str]) -> tuple[str, str]:
    system = (
        "You are a typing coach. You are given a diagnosis that has already been "
        "computed from keystroke data. Do not question it, do not hedge it, and do "
        "not invent numbers or details you were not given.\n\n"
        "Write two or three sentences, plain ASCII only, no markdown. Speak "
        "directly to the person. Explain what the pattern usually means about hand "
        "position or timing, and what to concentrate on while practicing. Be warm "
        "and concrete. Do not open with a greeting."
    )
    user = f"Diagnosis: {diagnosis}\nLetters to practice: {', '.join(targets)}"
    return system, user
