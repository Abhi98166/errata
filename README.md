# errata

A typing app that cares less about your WPM and more about *which* keys you keep
getting wrong.

Pick a mood and a duration. An LLM writes you a passage in that voice, and the
whole app -- palette, type, motion, sound -- shifts to match. You type it, you
make mistakes, and every mistake is recorded at keystroke granularity, folded
into a rolling error profile, and turned into a **correction plan**: drills built
from passages deliberately saturated with the exact letters you keep fumbling.

## Running it

Two processes. The backend needs Python 3.12+, the frontend needs Node 20+.

```bash
# backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload

# frontend, in another terminal
cd frontend
npm install
npm run dev
```

**It runs with no API key.** Without one, `StubLLMClient` serves built-in
passages so the entire loop -- typing, analysis, profile, plan, drills -- works
offline. Add `ERRATA_GEMINI_API_KEY` to `.env` for real generated prose.

## Tests

With the venv active:

```bash
cd backend && python -m pytest    # 63 tests
cd frontend && npm run build      # typecheck + build
```

## Checking what the LLM is doing

Every call logs the request, timing, token counts, finish reason and a preview
of the text. Two things help when it looks wrong:

```bash
python check_llm.py horror 60                  # raw output, normalised, verdict
curl http://127.0.0.1:8000/api/debug/corpus    # what is in the pool and who wrote it
```

## Layout

```
backend/app/
  genres.py            genre registry -- voice, blurb, punctuation risks
  analysis/
    keyboard.py        QWERTY geometry: finger, row, hand, adjacency
    analyse.py         keystroke stream -> every derived statistic
    profile.py         rolling, recency-weighted error profile
    plan.py            profile -> ranked findings -> drills
  content/
    normalise.py       the one typeability pipeline; no bypass
    generator.py       generation, the shared corpus, never-repeat
  llm/
    prompts.py         versioned prompt assembly
    client.py          LiteLLM + an offline stub behind one interface
  api/                 thin FastAPI routes

frontend/src/
  hooks/useTypingSession.ts     the keydown path
  components/TypingSurface.tsx  memoised per-word rendering
  styles/themes.css             one custom-property block per genre
  lib/sound.ts                  synthesised per-genre keypress audio
```

## The rules this codebase is built on

These are load-bearing. Breaking one breaks something that matters.

**The LLM does not analyse errors.** Code computes the confusion matrix,
per-key accuracy, bigram stats and finger attribution -- it is arithmetic, and
it must be exact, cheap and testable. The model receives the finished diagnosis
and does the two things it is good at: writing the coaching narrative and
generating drill text. Both of its outputs are validated before a user sees them.

**Genres are data, not branches.** Nothing switches on a genre id. A new genre
is one entry in `genres.py` and one block in `themes.css`.

**Typeability is enforced in code, never by the prompt.** Models emit smart
quotes, em dashes and accents constantly and none of them exist on a keyboard.
Every passage from every source goes through `normalise.py`.

**Stub passages never reach a real user.** A corpus seeded while offline would
otherwise shadow real writing forever, invisibly, because stub text looks like a
perfectly valid passage.

**The client is not trusted to score itself.** It sends `key`, `index` and
`t_ms`; the server recomputes correctness against the passage.

**The typing path is sacred.** Keystrokes are timestamped before sound, state or
rendering. Effects live in sibling layers. Words are memoised so a 500-word
passage re-renders two spans per keystroke, not three thousand.

**Sample thresholds are a feature.** "You confuse r and t" is delightful when
true and worthless when it is an artifact of forty keystrokes. The app refuses
to build a plan it cannot support.

## Known gaps

- Passages generate whole rather than in chunks, so a very fast typist can
  exhaust one before the timer ends and the run finishes early.
- The cursor is position-locked. A dropped character misaligns the rest of the
  passage and inflates the error count for that run. Keystroke streams are
  stored in full, so this is fixable retroactively.
- Drill target density uses a crude occurrence floor rather than comparing
  against natural English frequency, which makes it too lax for common letters.
- No ambient audio, no passage quality signal, one active plan per user.
