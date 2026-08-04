import pytest
from fastapi.testclient import TestClient

from app.analysis.analyse import Keystroke, analyse
from app.llm.client import StubLLMClient, set_client

USER = "test-user-0001"
HEADERS = {"X-Errata-User": USER}

@pytest.fixture(scope="module")
def client(tmp_path_factory):
    db_path = tmp_path_factory.mktemp("db") / "test.db"

    from app.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()
    settings.database_url = f"sqlite:///{db_path}"
    settings.llm_enabled = False

    import app.db as db_module
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    db_module.engine = create_engine(
        settings.database_url, connect_args={"check_same_thread": False}
    )
    db_module.SessionLocal = sessionmaker(
        bind=db_module.engine, autoflush=False, expire_on_commit=False
    )

    set_client(StubLLMClient())

    from app.main import app

    db_module.Base.metadata.create_all(db_module.engine)
    with TestClient(app) as c:
        yield c

def perfect_run(text: str) -> list[dict]:
    return [
        {"seq": i, "t_ms": (i + 1) * 90, "key": ch, "index": i}
        for i, ch in enumerate(text)
    ]

def sloppy_run(text: str, expected: str, actual: str) -> list[dict]:
    return [
        {
            "seq": i,
            "t_ms": (i + 1) * 90,
            "key": actual if ch == expected else ch,
            "index": i,
        }
        for i, ch in enumerate(text)
    ]

class TestMeta:
    def test_health(self, client):
        assert client.get("/api/health").json()["status"] == "ok"

    def test_genres_are_listed(self, client):
        ids = [g["id"] for g in client.get("/api/genres").json()]
        assert set(ids) == {"comedic", "horror", "romantic", "poetic", "technical"}

    def test_config_defaults_to_comedy_with_sound_off(self, client):
        config = client.get("/api/config", headers=HEADERS).json()
        assert config["genre"] == "comedic"
        assert config["sound_enabled"] is False

    def test_config_round_trips_and_drops_unknown_keys(self, client):
        client.put(
            "/api/config",
            headers=HEADERS,
            json={"genre": "horror", "duration": 180, "nonsense": True},
        )
        config = client.get("/api/config", headers=HEADERS).json()
        assert config["genre"] == "horror"
        assert "nonsense" not in config

    def test_identity_is_required(self, client):
        assert client.get("/api/config").status_code == 400

class TestPassages:
    def test_serves_a_typeable_passage(self, client):
        from app.content.normalise import offending_characters

        body = client.post(
            "/api/passages/next?genre=comedic&duration=60", headers=HEADERS
        ).json()

        assert body["word_count"] > 0
        assert not offending_characters(body["text"])
        assert "\n" not in body["text"]

    def test_never_serves_the_same_passage_to_the_same_user(self, client):
        seen = set()
        for _ in range(6):
            body = client.post(
                "/api/passages/next?genre=comedic&duration=60", headers=HEADERS
            ).json()
            assert body["id"] not in seen
            seen.add(body["id"])

    def test_rejects_an_unknown_genre(self, client):
        assert (
            client.post(
                "/api/passages/next?genre=noir&duration=60", headers=HEADERS
            ).status_code
            == 400
        )

class TestSessions:
    def test_a_perfect_run_scores_100_percent(self, client):
        passage = client.post(
            "/api/passages/next?genre=comedic&duration=60", headers=HEADERS
        ).json()

        result = client.post(
            "/api/sessions",
            headers=HEADERS,
            json={
                "passage_id": passage["id"],
                "duration_s": 60,
                "keystrokes": perfect_run(passage["text"]),
            },
        ).json()

        assert result["analysis"]["accuracy"] == 1.0
        assert result["analysis"]["wpm"] > 0
        assert result["profile"]["sessions"] >= 1

class TestPlan:
    def test_refuses_to_plan_without_enough_evidence(self, client):
        fresh = {"X-Errata-User": "sparse-user-001"}
        client.get("/api/config", headers=fresh)
        assert client.post("/api/plan", headers=fresh).status_code == 409

    def test_a_consistent_weakness_produces_a_targeted_plan(self, client):
        user = {"X-Errata-User": "weak-t-user-001"}

        for _ in range(4):
            passage = client.post(
                "/api/passages/next?genre=comedic&duration=60", headers=user
            ).json()
            client.post(
                "/api/sessions",
                headers=user,
                json={
                    "passage_id": passage["id"],
                    "duration_s": 60,
                    "keystrokes": sloppy_run(passage["text"], "t", "r"),
                },
            )

        plan = client.post("/api/plan", headers=user)
        assert plan.status_code == 200, plan.text

        drills = plan.json()["drills"]
        assert drills, "a user who misses every t should get at least one drill"

        top = drills[0]
        assert "t" in top["targets"]
        assert '"t"' in top["diagnosis"]

        start = client.post(
            f"/api/plan/drills/{top['id']}/start", headers=user
        ).json()
        assert start["passage"]["text"]
        assert start["drill"]["status"] == "active"

    def test_a_drill_is_judged_on_its_targets_not_overall_accuracy(self, client):
        user = {"X-Errata-User": "weak-t-user-001"}
        plan = client.get("/api/plan", headers=user).json()
        drill = plan["drills"][0]

        start = client.post(f"/api/plan/drills/{drill['id']}/start", headers=user).json()
        text = start["passage"]["text"]

        result = client.post(
            "/api/sessions",
            headers=user,
            json={
                "passage_id": start["passage"]["id"],
                "duration_s": 60,
                "drill_id": drill["id"],
                "keystrokes": sloppy_run(text, "t", "r"),
            },
        ).json()

        assert result["drill_result"]["passed"] is False

        passing = client.post(
            "/api/sessions",
            headers=user,
            json={
                "passage_id": start["passage"]["id"],
                "duration_s": 60,
                "drill_id": drill["id"],
                "keystrokes": perfect_run(text),
            },
        ).json()

        assert passing["drill_result"]["passed"] is True

def test_client_cannot_lie_about_correctness():
    passage = "the quick brown fox"
    strokes = [
        Keystroke(seq=i, t_ms=(i + 1) * 100, key="z", index=i)
        for i in range(len(passage))
    ]
    assert analyse(strokes, passage).accuracy == 0.0
