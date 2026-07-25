from __future__ import annotations

import statistics
from collections import Counter, defaultdict
from dataclasses import dataclass, field

from app.analysis import keyboard

BACKSPACE = "Backspace"

HESITATION_FACTOR = 2.5
MAX_RHYTHM_INTERVAL_MS = 3000


@dataclass(frozen=True)
class Keystroke:
    seq: int
    t_ms: int
    key: str
    index: int


@dataclass
class CharStat:
    attempts: int = 0
    errors: int = 0
    latencies: list[int] = field(default_factory=list)

    @property
    def error_rate(self) -> float:
        return self.errors / self.attempts if self.attempts else 0.0

    @property
    def mean_ms(self) -> float:
        return statistics.fmean(self.latencies) if self.latencies else 0.0


@dataclass
class Analysis:
    wpm: float
    raw_wpm: float
    accuracy: float
    consistency: float

    elapsed_s: float
    typed_chars: int
    correct_chars: int
    error_count: int
    backspaces: int
    correction_bursts: int

    confusion: dict[str, int]
    key_stats: dict[str, dict]
    bigram_stats: dict[str, dict]
    finger_stats: dict[str, dict]
    row_stats: dict[str, dict]

    transpositions: dict[str, int]
    hesitations: dict[str, int]

    def to_dict(self) -> dict:
        return {
            "wpm": round(self.wpm, 1),
            "raw_wpm": round(self.raw_wpm, 1),
            "accuracy": round(self.accuracy, 4),
            "consistency": round(self.consistency, 4),
            "elapsed_s": round(self.elapsed_s, 2),
            "typed_chars": self.typed_chars,
            "correct_chars": self.correct_chars,
            "error_count": self.error_count,
            "backspaces": self.backspaces,
            "correction_bursts": self.correction_bursts,
            "confusion": self.confusion,
            "key_stats": self.key_stats,
            "bigram_stats": self.bigram_stats,
            "finger_stats": self.finger_stats,
            "row_stats": self.row_stats,
            "transpositions": self.transpositions,
            "hesitations": self.hesitations,
        }


def _summarise(stats: dict[str, CharStat], *, min_attempts: int = 1) -> dict[str, dict]:
    return {
        key: {
            "attempts": stat.attempts,
            "errors": stat.errors,
            "error_rate": round(stat.error_rate, 4),
            "mean_ms": round(stat.mean_ms, 1),
        }
        for key, stat in stats.items()
        if stat.attempts >= min_attempts
    }


def analyse(keystrokes: list[Keystroke], passage: str) -> Analysis:
    ordered = sorted(keystrokes, key=lambda k: k.seq)

    typed = [k for k in ordered if k.key != BACKSPACE and 0 <= k.index < len(passage)]
    backspaces = sum(1 for k in ordered if k.key == BACKSPACE)
    correction_bursts = _count_bursts(ordered)

    elapsed_ms = ordered[-1].t_ms if ordered else 0
    elapsed_s = max(elapsed_ms / 1000, 1e-6)

    confusion: Counter[str] = Counter()
    key_stats: dict[str, CharStat] = defaultdict(CharStat)
    bigram_stats: dict[str, CharStat] = defaultdict(CharStat)
    finger_stats: dict[str, CharStat] = defaultdict(CharStat)
    row_stats: dict[str, CharStat] = defaultdict(CharStat)

    intervals: list[int] = []
    per_key_intervals: dict[str, list[int]] = defaultdict(list)

    previous_t: int | None = None
    correct_chars = 0

    for stroke in typed:
        expected = passage[stroke.index]
        is_correct = stroke.key == expected
        correct_chars += is_correct

        interval = None
        if previous_t is not None:
            gap = stroke.t_ms - previous_t
            if 0 <= gap <= MAX_RHYTHM_INTERVAL_MS:
                interval = gap
                intervals.append(gap)
        previous_t = stroke.t_ms

        _record(key_stats[expected], is_correct, interval)
        if interval is not None:
            per_key_intervals[expected].append(interval)

        if not is_correct:
            confusion[f"{expected}>{stroke.key}"] += 1

        if (finger := keyboard.finger_for(expected)) is not None:
            _record(finger_stats[finger], is_correct, interval)
        if (row := keyboard.row_for(expected)) is not None:
            _record(row_stats[row], is_correct, interval)

        if stroke.index > 0:
            bigram = passage[stroke.index - 1 : stroke.index + 1]
            _record(bigram_stats[bigram], is_correct, interval)

    typed_chars = len(typed)
    errors = typed_chars - correct_chars
    minutes = elapsed_s / 60

    return Analysis(
        wpm=(correct_chars / 5) / minutes if minutes else 0.0,
        raw_wpm=(typed_chars / 5) / minutes if minutes else 0.0,
        accuracy=correct_chars / typed_chars if typed_chars else 0.0,
        consistency=_consistency(intervals),
        elapsed_s=elapsed_s,
        typed_chars=typed_chars,
        correct_chars=correct_chars,
        error_count=errors,
        backspaces=backspaces,
        correction_bursts=correction_bursts,
        confusion=dict(confusion),
        key_stats=_summarise(key_stats),
        # No minimum: bigrams accumulate across sessions in the profile.
        bigram_stats=_summarise(bigram_stats),
        finger_stats=_summarise(finger_stats),
        row_stats=_summarise(row_stats),
        transpositions=_find_transpositions(typed, passage),
        hesitations=_find_hesitations(per_key_intervals, intervals),
    )


def target_accuracy(analysis: Analysis, targets: list[str]) -> float | None:
    attempts = 0
    errors = 0

    for target in targets:
        source = analysis.key_stats if len(target) == 1 else analysis.bigram_stats
        stat = source.get(target)
        if stat:
            attempts += stat["attempts"]
            errors += stat["errors"]

    if attempts < 10:
        return None
    return (attempts - errors) / attempts


def _record(stat: CharStat, is_correct: bool, interval: int | None) -> None:
    stat.attempts += 1
    if not is_correct:
        stat.errors += 1
    if interval is not None:
        stat.latencies.append(interval)


def _count_bursts(strokes: list[Keystroke]) -> int:
    bursts = 0
    in_burst = False
    for stroke in strokes:
        if stroke.key == BACKSPACE:
            if not in_burst:
                bursts += 1
                in_burst = True
        else:
            in_burst = False
    return bursts


def _consistency(intervals: list[int]) -> float:
    if len(intervals) < 5:
        return 0.0
    mean = statistics.fmean(intervals)
    if mean <= 0:
        return 0.0
    cv = statistics.pstdev(intervals) / mean
    return max(0.0, min(1.0, 1 - cv))


def _find_transpositions(typed: list[Keystroke], passage: str) -> dict[str, int]:
    found: Counter[str] = Counter()
    by_index = {k.index: k.key for k in typed}

    for index in sorted(by_index):
        nxt = index + 1
        if nxt not in by_index or nxt + 1 > len(passage):
            continue
        first, second = passage[index], passage[nxt]
        if first == second or " " in (first, second):
            continue
        if by_index[index] == second and by_index[nxt] == first:
            found[first + second] += 1

    return dict(found)


def _find_hesitations(
    per_key: dict[str, list[int]], all_intervals: list[int]
) -> dict[str, int]:
    if len(all_intervals) < 10:
        return {}
    baseline = statistics.median(all_intervals)
    threshold = baseline * HESITATION_FACTOR

    return {
        key: count
        for key, values in per_key.items()
        if (count := sum(1 for v in values if v > threshold)) >= 2
    }
