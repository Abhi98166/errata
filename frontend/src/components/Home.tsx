import { useEffect } from "react";

import type { Genre, Plan, UserConfig } from "../lib/types";
import { HeroSpecimen } from "./HeroSpecimen";

const DURATIONS = [
  { seconds: 60, label: "1 min", words: "120 words" },
  { seconds: 180, label: "3 min", words: "320 words" },
  { seconds: 300, label: "5 min", words: "520 words" },
];

const STEPS = [
  {
    n: "01",
    title: "Choose a voice",
    body: "A model writes you something new in that mood. Palette, typeface, motion and keypress sound shift with it.",
  },
  {
    n: "02",
    title: "Type it badly",
    body: "Every keystroke is timestamped and scored on the server -- confusions, bigrams, fingers, rows, hesitations.",
  },
  {
    n: "03",
    title: "Get a correction plan",
    body: "Ranked findings become drills: passages deliberately saturated with the exact letters you keep fumbling.",
  },
];

interface Props {
  genres: Genre[];
  config: UserConfig;
  plan: Plan | null;
  busy: boolean;
  error: string | null;
  onChange: (patch: Partial<UserConfig>) => void;
  onStart: () => void;
  onOpenPlan: () => void;
}

export function Home({
  genres,
  config,
  plan,
  busy,
  error,
  onChange,
  onStart,
  onOpenPlan,
}: Props) {
  const remainingDrills = plan?.drills.filter((d) => d.status !== "passed") ?? [];
  const nextDrill = remainingDrills[0];
  const selected = genres.find((g) => g.id === config.genre);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || busy) return;
      if (document.activeElement instanceof HTMLButtonElement) return;
      if (document.activeElement instanceof HTMLInputElement) return;
      event.preventDefault();
      onStart();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onStart]);

  return (
    <div className="stage stage--home">
      <header className="masthead">
        <div className="brand">
          err<b>a</b>ta
        </div>
        <span className="pill">
          <i className="pill__dot" />
          runs offline
        </span>
      </header>

      {nextDrill && (
        <div className="resume">
          <div>
            <p className="resume__eyebrow">
              correction plan &middot; drill {nextDrill.rank} of {plan!.drills.length}
            </p>
            <p className="resume__text">{nextDrill.diagnosis}</p>
          </div>
          <button className="btn btn--ghost" onClick={onOpenPlan}>
            Continue
          </button>
        </div>
      )}

      <section className="hero">
        <div>
          <h1 className="hero__title">
            The keys you miss are the <em>whole point</em>.
          </h1>
          <p className="hero__lede">
            Most typing apps hand you a number and wish you luck. errata writes you a
            passage worth reading, records every mistake down to the keystroke, and
            turns the letters you keep fumbling into drills built to fix them.
          </p>
          <ul className="hero__facts">
            <li>Keystroke-level error profile, not a WPM score</li>
            <li>Four moods, each with its own palette, type and sound</li>
            <li>Scored on the server &mdash; the client cannot flatter you</li>
          </ul>
        </div>

        {selected && (
          <HeroSpecimen
            label={selected.label}
            text={selected.blurb}
            still={config.reduced_motion}
          />
        )}
      </section>

      <div className="steps">
        {STEPS.map((step) => (
          <div className="step" key={step.n}>
            <span className="step__n">{step.n}</span>
            <h2 className="step__title">{step.title}</h2>
            <p className="step__body">{step.body}</p>
          </div>
        ))}
      </div>

      <section className="section">
        <div className="section__head">
          <p className="eyebrow">pick a mood</p>
          <span className="section__rule" />
          <span className="section__aside">the whole app follows</span>
        </div>

        <div className="cards">
          {genres.map((genre) => (
            <button
              key={genre.id}
              className="card"
              data-genre={genre.id}
              aria-pressed={config.genre === genre.id}
              onClick={() => onChange({ genre: genre.id })}
            >
              <span className="card__top">
                <i className="card__dot" />
                <span className="card__label">{genre.label}</span>
              </span>
              <span className="card__blurb">{genre.blurb}</span>
              <span className="card__specimen">
                <span className="card__aa">Aa</span>
                <span className="card__swatches">
                  <i className="card__swatch card__swatch--bg" />
                  <i className="card__swatch card__swatch--accent" />
                  <i className="card__swatch card__swatch--ink" />
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <p className="eyebrow">how long</p>
          <span className="section__rule" />
        </div>

        <div className="tiles">
          {DURATIONS.map((option) => (
            <button
              key={option.seconds}
              className="tile"
              aria-pressed={config.duration === option.seconds}
              onClick={() => onChange({ duration: option.seconds })}
            >
              <span className="tile__label">{option.label}</span>
              <span className="tile__sub">{option.words}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="cta">
        <button className="btn btn--lg" onClick={onStart} disabled={busy}>
          {busy ? "writing you something..." : "Begin"}
        </button>
        {plan && !nextDrill && (
          <button className="btn btn--ghost" onClick={onOpenPlan}>
            View plan
          </button>
        )}
        <span className="cta__hint">
          or press <span className="key">enter</span>
        </span>
      </div>

      {error && <div className="notice notice--bad cta__error">{error}</div>}

      <footer className="footer">
        <label className="toggle">
          <input
            type="checkbox"
            checked={config.sound_enabled}
            onChange={(e) => onChange({ sound_enabled: e.target.checked })}
          />
          sound
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={config.cursor_mode === "block"}
            onChange={(e) =>
              onChange({ cursor_mode: e.target.checked ? "block" : "advance" })
            }
          />
          stop me on mistakes
        </label>
        <span className="footer__note">finger analysis assumes QWERTY</span>
      </footer>
    </div>
  );
}
