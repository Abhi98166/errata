import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.content.generator import _take_unserved, pool_depth
from app.db import Base
from app.llm.client import STUB_MODEL_NAME, StubLLMClient, set_client
from app.models import Passage, Serving, User

class FakeRealClient:
    name = "gemini/some-real-model"

    def complete(self, **_kwargs) -> str:
        raise AssertionError("not called in these tests")

@pytest.fixture
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine, expire_on_commit=False)()

    session.add(User(id="corpus-user-1"))
    session.add_all(
        [
            Passage(
                id="stub-1",
                kind="story",
                genre="comedic",
                duration_bucket=60,
                text="stub text",
                word_count=2,
                char_count=9,
                model=STUB_MODEL_NAME,
                prompt_version="story-v1",
            ),
            Passage(
                id="real-1",
                kind="story",
                genre="comedic",
                duration_bucket=60,
                text="real text",
                word_count=2,
                char_count=9,
                model="gemini/some-real-model",
                prompt_version="story-v1",
            ),
        ]
    )
    session.commit()

    yield session
    session.close()

class TestStubIsolation:

    def test_a_real_model_is_never_served_stub_text(self, db):
        set_client(FakeRealClient())
        for _ in range(10):
            passage = _take_unserved(db, "corpus-user-1", "comedic", 60)
            assert passage is not None
            assert passage.model != STUB_MODEL_NAME

    def test_the_stub_may_still_serve_its_own_passages_offline(self, db):
        set_client(StubLLMClient())
        models = {
            _take_unserved(db, "corpus-user-1", "comedic", 60).model for _ in range(20)
        }
        assert STUB_MODEL_NAME in models

    def test_pool_depth_ignores_stub_passages_for_a_real_model(self, db):
        set_client(FakeRealClient())
        assert pool_depth(db, "comedic", 60) == 1

        set_client(StubLLMClient())
        assert pool_depth(db, "comedic", 60) == 2

class TestNeverRepeat:
    def test_a_served_passage_is_not_offered_again(self, db):
        set_client(StubLLMClient())

        first = _take_unserved(db, "corpus-user-1", "comedic", 60)
        db.add(Serving(user_id="corpus-user-1", passage_id=first.id))
        db.commit()

        for _ in range(10):
            again = _take_unserved(db, "corpus-user-1", "comedic", 60)
            assert again is None or again.id != first.id

    def test_the_pool_running_out_returns_nothing_rather_than_repeating(self, db):
        set_client(StubLLMClient())
        for passage_id in ("stub-1", "real-1"):
            db.add(Serving(user_id="corpus-user-1", passage_id=passage_id))
        db.commit()

        assert _take_unserved(db, "corpus-user-1", "comedic", 60) is None

    def test_one_users_history_does_not_affect_another(self, db):
        set_client(StubLLMClient())
        db.add(User(id="corpus-user-2"))
        db.add_all(
            [
                Serving(user_id="corpus-user-1", passage_id="stub-1"),
                Serving(user_id="corpus-user-1", passage_id="real-1"),
            ]
        )
        db.commit()

        assert _take_unserved(db, "corpus-user-1", "comedic", 60) is None
        assert _take_unserved(db, "corpus-user-2", "comedic", 60) is not None
