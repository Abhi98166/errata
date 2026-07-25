from __future__ import annotations

from dataclasses import dataclass, field

from app.analysis import keyboard, profile as profile_mod

MAX_DRILLS = 5


@dataclass
class Finding:
    kind: str
    diagnosis: str
    targets: list[str]
    score: float
    evidence: dict = field(default_factory=dict)


def _confidence(attempts: float, full: float = 60.0) -> float:
    return min(1.0, attempts / full)


def _describe_char(char: str) -> str:
    return "space" if char == " " else f'"{char}"'


def find_substitutions(prof: dict) -> list[Finding]:
    findings: list[Finding] = []
    keys = prof.get("keys", {})

    for pair, count in prof.get("confusion", {}).items():
        expected, _, actual = pair.partition(">")
        if not expected or not actual or count < profile_mod.MIN_CONFUSION_COUNT:
            continue

        stat = keys.get(expected, {})
        attempts = stat.get("attempts", 0)
        if attempts < profile_mod.MIN_KEY_ATTEMPTS:
            continue

        adjacent = keyboard.are_adjacent(expected, actual)
        finger = keyboard.finger_for(expected)
        cause = (
            "your finger is landing just short of the key"
            if adjacent
            else "the wrong finger is reaching for it"
        )

        findings.append(
            Finding(
                kind="substitution",
                diagnosis=(
                    f"You type {_describe_char(actual)} when you mean "
                    f"{_describe_char(expected)}. They are "
                    f"{'neighbours on the board, so ' if adjacent else 'nowhere near each other, so '}"
                    f"{cause}"
                    f"{f' -- {expected} is a {finger} key' if finger else ''}."
                ),
                targets=[expected, actual],
                score=count * keyboard.impact_weight(expected) * _confidence(attempts),
                evidence={
                    "pair": pair,
                    "count": round(count, 1),
                    "attempts": round(attempts, 1),
                    "adjacent": adjacent,
                    "finger": finger,
                },
            )
        )

    return findings


def find_weak_bigrams(prof: dict) -> list[Finding]:
    findings: list[Finding] = []

    for bigram, stat in prof.get("bigrams", {}).items():
        attempts = stat.get("attempts", 0)
        errors = stat.get("errors", 0)
        if attempts < profile_mod.MIN_BIGRAM_ATTEMPTS or errors < 2:
            continue

        rate = stat.get("error_rate", 0)
        if rate < 0.12:
            continue

        first, second = bigram[0], bigram[1]
        first_hand, second_hand = keyboard.hand_for(first), keyboard.hand_for(second)

        # A space is a thumb key, so hand framing would be meaningless here.
        if first_hand is None or second_hand is None:
            same_hand = False
            note = (
                "That is a word boundary, so it is about how you land on the "
                "first key of the next word rather than about a reach."
            )
        elif first_hand == second_hand:
            same_hand = True
            note = (
                "Both letters are on the same hand, which is where transitions "
                "usually break down."
            )
        else:
            same_hand = False
            note = (
                "The transition crosses hands, so it is a timing problem more "
                "than a reach."
            )

        findings.append(
            Finding(
                kind="bigram",
                diagnosis=(
                    f'The transition "{bigram}" trips you up -- you miss it '
                    f"{rate:.0%} of the time. {note}"
                ),
                targets=[bigram],
                score=errors * keyboard.impact_weight(second) * _confidence(attempts, 30),
                evidence={
                    "bigram": bigram,
                    "error_rate": rate,
                    "attempts": round(attempts, 1),
                    "same_hand": same_hand,
                },
            )
        )

    return findings


def find_weak_fingers(prof: dict) -> list[Finding]:
    fingers = prof.get("fingers", {})
    total_errors = sum(s.get("errors", 0) for s in fingers.values())
    if total_errors < 8:
        return []

    findings: list[Finding] = []
    for finger, stat in fingers.items():
        attempts = stat.get("attempts", 0)
        errors = stat.get("errors", 0)
        if attempts < 40 or errors < 4:
            continue

        share = errors / total_errors
        if share < 0.28 or finger == "thumb":
            continue

        chars = sorted(
            (
                char
                for char in prof.get("keys", {})
                if keyboard.finger_for(char) == finger and char != " "
            ),
            key=lambda c: prof["keys"][c].get("error_rate", 0),
            reverse=True,
        )[:4]
        if not chars:
            continue

        findings.append(
            Finding(
                kind="finger",
                diagnosis=(
                    f"Your {finger} is doing most of the damage: {share:.0%} of all "
                    f"your errors come from it, across {', '.join(chars)}. That "
                    f"usually means the hand is drifting off home position."
                ),
                targets=chars,
                score=errors * 0.6 * _confidence(attempts, 120),
                evidence={"finger": finger, "share": round(share, 3), "chars": chars},
            )
        )

    return findings


def build_findings(prof: dict) -> list[Finding]:
    findings = find_substitutions(prof) + find_weak_bigrams(prof) + find_weak_fingers(prof)
    findings.sort(key=lambda f: f.score, reverse=True)

    chosen: list[Finding] = []
    covered: set[str] = set()

    for finding in findings:
        chars = {c for t in finding.targets for c in t}
        # Inclusive: a bigram sharing one character scores exactly 0.5.
        if chars and len(chars & covered) / len(chars) >= 0.5:
            continue
        chosen.append(finding)
        covered |= chars
        if len(chosen) == MAX_DRILLS:
            break

    return chosen
