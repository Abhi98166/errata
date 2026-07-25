from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Genre:
    id: str
    label: str
    blurb: str
    voice: str
    punctuation_risks: tuple[str, ...]


GENRES: dict[str, Genre] = {
    "comedic": Genre(
        id="comedic",
        label="Comedic",
        blurb="Something goes mildly, then catastrophically, wrong.",
        voice=(
            "Write dry, absurd comedy. Deadpan narration of an escalating situation: "
            "start with something mundane and let it compound until it is plainly "
            "ridiculous, while the narrator continues to treat it as reasonable. "
            "Specific and concrete beats general and whimsical. No punchlines, no "
            "wordplay, no jokes announced as jokes -- the humour comes from the "
            "escalation and the flatness of the telling."
        ),
        punctuation_risks=("parentheses", "ALL CAPS", "exclamation marks"),
    ),
    "horror": Genre(
        id="horror",
        label="Horror",
        blurb="Something is wrong with the house, and you have noticed.",
        voice=(
            "Write quiet, tense horror in present tense, second person. Restraint is "
            "everything: describe ordinary things that are subtly incorrect and let "
            "the reader assemble the dread. Short declarative sentences. No gore, no "
            "monsters described outright, no jump scare, no ending that explains "
            "itself. The unease should build steadily and simply stop."
        ),
        punctuation_risks=("ellipses", "em dashes", "trailing off"),
    ),
    "romantic": Genre(
        id="romantic",
        label="Romantic",
        blurb="A small moment, remembered far longer than it deserved.",
        voice=(
            "Write warm, wistful romance in second person, past tense. A small "
            "specific remembered moment between two people -- a kitchen, a train "
            "platform, a wait -- rendered with tenderness and precise sensory detail. "
            "Understated rather than sweeping. No declarations of love, no melodrama, "
            "no tragedy. The feeling lives in the detail, not in the statement."
        ),
        punctuation_risks=("accented loanwords", "curly apostrophes"),
    ),
    "poetic": Genre(
        id="poetic",
        label="Poetic",
        blurb="Dense, imagistic, and refusing to explain itself.",
        voice=(
            "Write prose poetry as one continuous paragraph. Dense, imagistic, "
            "rhythmic. Concrete images over abstractions; let them accumulate rather "
            "than argue. Vary sentence length deliberately for cadence. This must "
            "read as poetry that happens to be set as prose -- it is NOT arranged in "
            "lines and must not contain any line breaks."
        ),
        punctuation_risks=("line breaks", "em dashes", "stanza spacing"),
    ),
}

DEFAULT_GENRE = "comedic"

WORD_TARGETS: dict[int, int] = {60: 120, 180: 320, 300: 520}

DURATIONS: tuple[int, ...] = (60, 180, 300)


def get_genre(genre_id: str) -> Genre:
    return GENRES.get(genre_id, GENRES[DEFAULT_GENRE])


def word_target(duration_s: int) -> int:
    return WORD_TARGETS.get(duration_s, WORD_TARGETS[60])
