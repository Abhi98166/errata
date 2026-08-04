import type { Lexicon } from "../lib/lexicon";
import type { Drill, Plan } from "../lib/types";
import { Frame } from "./Frame";

interface Props {
  lex: Lexicon;
  plan: Plan;
  busyDrillId: string | null;
  error: string | null;
  onStartDrill: (drill: Drill) => void;
  onHome: () => void;
}

function label(target: string): string {
  return target === " " ? "space" : target;
}

export function PlanPanel({
  lex,
  plan,
  busyDrillId,
  error,
  onStartDrill,
  onHome,
}: Props) {
  const passed = plan.drills.filter((d) => d.status === "passed").length;

  return (
    <Frame variant="plan" left={lex.plan.label} right={lex.results.barRight}>
      <div className="plan__head">
        <h1 className="plan__title">
          {lex.plan.cleared(passed, plan.drills.length)}
        </h1>
        <p className="plan__lede">{lex.plan.lede}</p>
      </div>

      <div className="schedule">
        {plan.drills.map((drill, i) => {
          const done = drill.status === "passed";
          return (
            <div
              className={`schedule__row schedule__row--${done ? "done" : i === 0 ? "now" : "next"}`}
              key={drill.id}
            >
              <span className="schedule__n">
                {lex.results.ordinals[i] ?? String(drill.rank)}
              </span>

              <div>
                <div className="schedule__text">{drill.diagnosis}</div>
                {drill.rationale && (
                  <p className="finding__rationale" style={{ marginTop: "0.4rem" }}>
                    {drill.rationale}
                  </p>
                )}
                <div className="finding__targets" style={{ marginTop: "0.5rem" }}>
                  {drill.targets.map((target) => (
                    <span key={target} className="key">
                      {label(target)}
                    </span>
                  ))}
                </div>
                <div className="schedule__state">
                  {done
                    ? lex.plan.passed(drill.attempts)
                    : lex.plan.pending(`${Math.round(drill.pass_threshold * 100)}%`)}
                </div>
              </div>

              <button
                className="btn btn--ghost schedule__action"
                onClick={() => onStartDrill(drill)}
                disabled={busyDrillId !== null}
              >
                {busyDrillId === drill.id
                  ? lex.plan.writing
                  : done
                    ? lex.plan.redo
                    : lex.plan.practice}
              </button>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="notice notice--bad" style={{ marginTop: "1.25rem" }}>
          {error}
        </div>
      )}

      <div className="row" style={{ marginTop: "1.5rem" }}>
        <button className="btn btn--ghost" onClick={onHome}>
          {lex.plan.home}
        </button>
      </div>
    </Frame>
  );
}
