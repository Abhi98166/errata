from app.analysis import plan as plan_mod

def profile_with(**overrides) -> dict:
    base = {
        "sessions": 4,
        "total_keystrokes": 2000,
        "wpm": 60.0,
        "accuracy": 0.9,
        "consistency": 0.8,
        "confusion": {},
        "keys": {},
        "bigrams": {},
        "fingers": {},
    }
    return {**base, **overrides}

class TestSubstitutions:
    def test_names_both_characters(self):
        prof = profile_with(
            confusion={"t>r": 20.0},
            keys={"t": {"attempts": 200.0, "errors": 20.0, "error_rate": 0.1}},
        )
        (finding,) = plan_mod.find_substitutions(prof)

        assert finding.targets == ["t", "r"]
        assert '"r"' in finding.diagnosis and '"t"' in finding.diagnosis

    def test_distinguishes_neighbours_from_wrong_hand(self):
        neighbours = plan_mod.find_substitutions(
            profile_with(
                confusion={"t>r": 20.0},
                keys={"t": {"attempts": 200.0, "errors": 20.0}},
            )
        )[0]
        distant = plan_mod.find_substitutions(
            profile_with(
                confusion={"a>p": 20.0},
                keys={"a": {"attempts": 200.0, "errors": 20.0}},
            )
        )[0]

        assert "neighbours" in neighbours.diagnosis
        assert "landing just short" in neighbours.diagnosis
        assert "nowhere near" in distant.diagnosis
        assert "wrong finger" in distant.diagnosis

    def test_ignores_a_thin_sample(self):
        prof = profile_with(
            confusion={"t>r": 20.0},
            keys={"t": {"attempts": 5.0, "errors": 5.0}},
        )
        assert plan_mod.find_substitutions(prof) == []

    def test_ignores_a_one_off_confusion(self):
        prof = profile_with(
            confusion={"t>r": 1.0},
            keys={"t": {"attempts": 300.0, "errors": 1.0}},
        )
        assert plan_mod.find_substitutions(prof) == []

    def test_weights_common_letters_above_rare_ones(self):
        common = plan_mod.find_substitutions(
            profile_with(
                confusion={"e>r": 20.0}, keys={"e": {"attempts": 200.0, "errors": 20.0}}
            )
        )[0]
        rare = plan_mod.find_substitutions(
            profile_with(
                confusion={"z>x": 20.0}, keys={"z": {"attempts": 200.0, "errors": 20.0}}
            )
        )[0]

        assert common.score > rare.score

class TestBigrams:
    def _finding(self, bigram: str):
        prof = profile_with(
            bigrams={bigram: {"attempts": 40.0, "errors": 20.0, "error_rate": 0.5}}
        )
        return plan_mod.find_weak_bigrams(prof)[0]

    def test_same_hand_transition_is_named_as_such(self):
        assert "same hand" in self._finding("st").diagnosis

    def test_cross_hand_transition_is_named_as_such(self):
        assert "crosses hands" in self._finding("th").diagnosis

    def test_a_word_boundary_is_not_described_in_hand_terms(self):
        diagnosis = self._finding(" t").diagnosis

        assert "word boundary" in diagnosis
        assert "crosses hands" not in diagnosis
        assert "same hand" not in diagnosis

    def test_ignores_an_occasional_miss(self):
        prof = profile_with(
            bigrams={"th": {"attempts": 40.0, "errors": 2.0, "error_rate": 0.05}}
        )
        assert plan_mod.find_weak_bigrams(prof) == []

class TestPlanShape:
    def test_does_not_restate_the_same_weakness_five_times(self):
        prof = profile_with(
            confusion={"t>r": 40.0},
            keys={
                "t": {"attempts": 400.0, "errors": 40.0, "error_rate": 0.1},
                "r": {"attempts": 300.0, "errors": 5.0, "error_rate": 0.02},
            },
            bigrams={
                " t": {"attempts": 60.0, "errors": 30.0, "error_rate": 0.5},
                "st": {"attempts": 40.0, "errors": 20.0, "error_rate": 0.5},
                "at": {"attempts": 40.0, "errors": 20.0, "error_rate": 0.5},
                "th": {"attempts": 40.0, "errors": 20.0, "error_rate": 0.5},
            },
        )
        findings = plan_mod.build_findings(prof)

        assert findings[0].kind == "substitution"
        seen: set[str] = set()
        for finding in findings:
            chars = {c for t in finding.targets for c in t}
            assert len(chars & seen) / len(chars) < 0.5
            seen |= chars

    def test_is_capped(self):
        prof = profile_with(
            confusion={f"{c}>x": 20.0 for c in "abcdefgh"},
            keys={c: {"attempts": 200.0, "errors": 20.0} for c in "abcdefghx"},
        )
        assert len(plan_mod.build_findings(prof)) <= plan_mod.MAX_DRILLS

    def test_a_clean_profile_yields_nothing_to_drill(self):
        prof = profile_with(
            keys={"t": {"attempts": 500.0, "errors": 0.0, "error_rate": 0.0}}
        )
        assert plan_mod.build_findings(prof) == []
