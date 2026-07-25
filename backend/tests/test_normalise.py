import pytest

from app.content.normalise import (
    ALLOWED_CHARS,
    PassageRejected,
    normalise,
    offending_characters,
    prepare,
    target_density,
)

def test_strips_smart_punctuation():
    raw = "It’s a “nice” day — or it was … until now."
    assert normalise(raw) == "It's a \"nice\" day - or it was... until now."

def test_folds_accents():
    assert normalise("a café in Zürich, naïve") == "a cafe in Zurich, naive"

def test_collapses_all_whitespace_into_single_spaces():
    assert normalise("one\n\ntwo   three\tfour") == "one two three four"

def test_strips_markdown_noise():
    assert normalise("**bold** and _italic_ and `code`") == "bold and italic and code"

def test_removes_space_before_punctuation():
    assert normalise("hello , world .") == "hello, world."

def test_output_is_always_typeable():
    raw = "— café … \U0001f600 naïve “quoted”\n\nlines"
    assert not offending_characters(normalise(raw))

def test_every_allowed_char_survives():
    text = "".join(sorted(ALLOWED_CHARS - {" "}))
    assert normalise(text) == text

def test_prepare_rejects_a_passage_that_is_too_short():
    with pytest.raises(PassageRejected, match="too short"):
        prepare("three words only", target_words=100)

def test_prepare_rejects_a_passage_that_is_too_long():
    with pytest.raises(PassageRejected, match="too long"):
        prepare("word " * 300, target_words=100)

def test_prepare_accepts_within_tolerance():
    assert prepare("word " * 90, target_words=100).startswith("word")

class TestTargetDensity:
    def test_counts_multi_character_targets_by_length(self):
        assert target_density("thth", ["th"]) == 1.0

    def test_is_case_insensitive(self):
        assert target_density("TH th", ["th"]) == pytest.approx(4 / 5)

    def test_empty_inputs_are_zero(self):
        assert target_density("", ["t"]) == 0.0
        assert target_density("text", []) == 0.0
