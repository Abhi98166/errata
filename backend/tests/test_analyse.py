import pytest

from app.analysis.analyse import BACKSPACE, Keystroke, analyse, target_accuracy

def stream(passage: str, typed: str, *, interval_ms: int = 100) -> list[Keystroke]:
    return [
        Keystroke(seq=i, t_ms=(i + 1) * interval_ms, key=char, index=i)
        for i, char in enumerate(typed)
    ]

class TestMetrics:
    def test_perfect_run_is_fully_accurate(self):
        passage = "the quick brown fox"
        result = analyse(stream(passage, passage), passage)

        assert result.accuracy == 1.0
        assert result.error_count == 0
        assert result.correct_chars == len(passage)

    def test_wpm_counts_correct_characters_in_units_of_five(self):
        passage = "a" * 50
        result = analyse(stream(passage, passage), passage)
        assert result.wpm == pytest.approx(120.0, rel=0.01)

    def test_raw_wpm_counts_errors_too_but_wpm_does_not(self):
        passage = "abcdefghij"
        result = analyse(stream(passage, "abcdefghXX"), passage)

        assert result.raw_wpm > result.wpm
        assert result.accuracy == pytest.approx(0.8)

    def test_client_reported_correctness_is_not_trusted(self):
        passage = "abc"
        result = analyse(stream(passage, "abx"), passage)
        assert result.error_count == 1

    def test_empty_session_does_not_divide_by_zero(self):
        result = analyse([], "some passage")
        assert result.wpm == 0.0
        assert result.accuracy == 0.0

    def test_keystrokes_past_the_end_of_the_passage_are_ignored(self):
        passage = "abc"
        strokes = stream(passage, "abcdef")
        result = analyse(strokes, passage)
        assert result.typed_chars == 3

class TestConsistency:
    def test_metronomic_typing_scores_high(self):
        passage = "a" * 30
        assert analyse(stream(passage, passage), passage).consistency > 0.95

    def test_erratic_typing_scores_lower(self):
        passage = "a" * 30
        strokes = [
            Keystroke(seq=i, t_ms=t, key="a", index=i)
            for i, t in enumerate(
                [n * (40 if n % 2 else 400) for n in range(1, len(passage) + 1)]
            )
        ]
        steady = analyse(stream(passage, passage), passage).consistency
        assert analyse(strokes, passage).consistency < steady

    def test_too_few_keystrokes_to_judge_returns_zero(self):
        assert analyse(stream("ab", "ab"), "ab").consistency == 0.0

class TestConfusion:
    def test_records_expected_over_actual(self):
        passage = "tttt"
        result = analyse(stream(passage, "trtr"), passage)
        assert result.confusion == {"t>r": 2}

    def test_correct_keystrokes_produce_no_confusion(self):
        assert analyse(stream("abc", "abc"), "abc").confusion == {}

class TestDerivedDimensions:
    def test_attributes_errors_to_the_right_finger(self):
        passage = "aaaa"
        result = analyse(stream(passage, "aqaq"), passage)
        assert result.finger_stats["left pinky"]["errors"] == 2

    def test_attributes_keys_to_the_right_row(self):
        passage = "asdf"
        result = analyse(stream(passage, "asdf"), passage)
        assert result.row_stats["home"]["attempts"] == 4

    def test_bigrams_are_keyed_by_the_expected_pair(self):
        passage = "the"
        result = analyse(stream(passage, "the"), passage)
        assert "th" in result.bigram_stats
        assert "he" in result.bigram_stats

class TestTranspositions:
    def test_detects_a_reversed_pair(self):
        passage = "the"
        result = analyse(stream(passage, "teh"), passage)
        assert result.transpositions == {"he": 1}

    def test_a_clean_run_has_none(self):
        assert analyse(stream("the", "the"), "the").transpositions == {}

class TestCorrections:
    def test_a_run_of_backspaces_counts_as_one_burst(self):
        strokes = [
            Keystroke(seq=0, t_ms=100, key="a", index=0),
            Keystroke(seq=1, t_ms=200, key=BACKSPACE, index=1),
            Keystroke(seq=2, t_ms=300, key=BACKSPACE, index=0),
            Keystroke(seq=3, t_ms=400, key="a", index=0),
            Keystroke(seq=4, t_ms=500, key=BACKSPACE, index=1),
        ]
        result = analyse(strokes, "aaa")
        assert result.backspaces == 3
        assert result.correction_bursts == 2

class TestTargetAccuracy:
    def test_measures_only_the_targeted_characters(self):
        passage = "t" * 12 + "z" * 40
        typed = "r" * 12 + "z" * 40
        result = analyse(stream(passage, typed), passage)

        assert result.accuracy > 0.7
        assert target_accuracy(result, ["t"]) == 0.0

    def test_returns_none_when_the_sample_is_too_small(self):
        passage = "tzzz"
        result = analyse(stream(passage, passage), passage)
        assert target_accuracy(result, ["t"]) is None
