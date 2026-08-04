import { useEffect } from "react";

import { GENRE_ORDER, type Lexicon } from "../lib/lexicon";
import type { Genre, Plan, UserConfig } from "../lib/types";
import { Brand, Frame } from "./Frame";
import { HeroSpecimen } from "./HeroSpecimen";

const DURATIONS = [60, 180, 300];

interface Props {
  lex: Lexicon;
  genres: Genre[];
  config: UserConfig;
  plan: Plan | null;
  busy: boolean;
  error: string | null;
  onChange: (patch: Partial<UserConfig>) => void;
  onStart: () => void;
  onOpenPlan: () => void;
}

function ordered(genres: Genre[]): Genre[] {
  return [...genres].sort(
    (a, b) => GENRE_ORDER.indexOf(a.id) - GENRE_ORDER.indexOf(b.id),
  );
}

export function Home({
  lex,
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
    <Frame variant="home" left={<Brand />} right={lex.masthead}>
      {nextDrill && (
        <div className="resume">
          <div>
            <p className="kicker kicker--accent">
              {lex.resume.label} {nextDrill.rank} / {plan!.drills.length}
            </p>
            <p className="resume__text">{nextDrill.diagnosis}</p>
          </div>
          <button className="btn btn--ghost" onClick={onOpenPlan}>
            {lex.resume.action}
          </button>
        </div>
      )}

      <section className="hero">
        <div>
          {lex.hero.kicker && <p className="kicker">{lex.hero.kicker}</p>}

          <h1 className="hero__title">
            {lex.hero.titleLead}
            <br />
            {lex.hero.titleJoin} <span className="hero__emph">{lex.hero.titleEmph}</span>
            {lex.hero.titleEnd}
          </h1>

          <p className="hero__lede">{lex.hero.lede}</p>

          <ul className="hero__facts">
            {lex.hero.facts.map((fact, i) => (
              <li key={fact}>
                <span className="hero__mark">{lex.hero.marks[i]}</span>
                {fact}
              </li>
            ))}
          </ul>

          {lex.hero.stamp && (
            <div className="hero__stamp">
              <span className="stamp">{lex.hero.stamp}</span>
            </div>
          )}
        </div>

        {selected && (
          <HeroSpecimen
            lex={lex}
            text={selected.blurb}
            still={config.reduced_motion}
          />
        )}
      </section>

      <div className="steps">
        {lex.steps.map((step) => (
          <div className="step" key={step.kicker}>
            <span className="kicker kicker--accent">{step.kicker}</span>
            <h2 className="step__title">{step.title}</h2>
            <p className="step__body">{step.body}</p>
          </div>
        ))}
      </div>

      <section className="section">
        <div className="section__head">
          <p className="kicker">{lex.picker.label}</p>
          <span className="rule" />
          <span className="section__aside">{lex.picker.aside}</span>
        </div>

        <div className="cards">
          {ordered(genres).map((genre) => {
            const active = config.genre === genre.id;
            return (
              <button
                key={genre.id}
                className="card"
                data-card={genre.id}
                aria-pressed={active}
                onClick={() => onChange({ genre: genre.id })}
              >
                <span className="card__label">{genre.label}</span>
                <span className="card__blurb">{genre.blurb}</span>
                <span className="card__foot">
                  <span className="card__aa">Aa</span>
                  {active ? (
                    <span className="card__state">{lex.picker.selected}</span>
                  ) : (
                    <i className="card__dot" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <p className="kicker">{lex.duration.label}</p>
          <span className="rule" />
        </div>

        <div className="tiles">
          {DURATIONS.map((seconds, i) => (
            <button
              key={seconds}
              className="tile"
              aria-pressed={config.duration === seconds}
              onClick={() => onChange({ duration: seconds })}
            >
              <span className="tile__label">{lex.duration.options[i].label}</span>
              <span className="tile__sub">{lex.duration.options[i].sub}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="cta">
        <button className="btn btn--lg" onClick={onStart} disabled={busy}>
          {busy ? lex.results.building : lex.cta.label}
        </button>

        {plan && !nextDrill && (
          <button className="btn btn--ghost" onClick={onOpenPlan}>
            {lex.results.plan}
          </button>
        )}

        <span className="cta__hint">
          or press <span className="key">enter</span>
        </span>

        <span className="cta__note">
          {lex.cta.note.map((line, i) => (
            <span key={i}>
              {line}
              {i < lex.cta.note.length - 1 && <br />}
            </span>
          ))}
        </span>
      </div>

      {error && (
        <div className="notice notice--bad" style={{ marginTop: "1.25rem" }}>
          {error}
        </div>
      )}

      <footer className="footer">
        <label className="toggle">
          <input
            type="checkbox"
            checked={config.sound_enabled}
            onChange={(e) => onChange({ sound_enabled: e.target.checked })}
          />
          {lex.footer.sound}
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={config.cursor_mode === "block"}
            onChange={(e) =>
              onChange({ cursor_mode: e.target.checked ? "block" : "advance" })
            }
          />
          {lex.footer.block}
        </label>
        <span className="footer__note">{lex.footer.note}</span>
      </footer>
    </Frame>
  );
}
