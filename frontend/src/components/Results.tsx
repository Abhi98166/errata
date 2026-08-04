import { formatCount, type Lexicon } from "../lib/lexicon";
import type { Drill, Finding, Plan, SessionResult } from "../lib/types";
import { Frame } from "./Frame";

interface Props {
  lex: Lexicon;
  result: SessionResult;
  plan: Plan | null;
  busy: boolean;
  onAgain: () => void;
  onHome: () => void;
  onBuildPlan: () => void;
  onOpenPlan: () => void;
}

function label(target: string): string {
  return target === " " ? "space" : target;
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function evidenceFor(lex: Lexicon, finding: Finding): string | null {
  const evidence = finding.evidence as {
    count?: number;
    attempts?: number;
    error_rate?: number;
    share?: number;
  };

  const attempts = evidence.attempts;
  if (attempts === undefined) return null;

  const count = evidence.count ?? (evidence.error_rate ?? 0) * attempts;
  const rate = evidence.error_rate ?? (attempts ? count / attempts : 0);

  return lex.results.evidence(
    formatCount(count, lex.numerals),
    formatCount(attempts, lex.numerals),
    percent(rate),
  );
}

function dominant(result: SessionResult): string {
  const pairs = Object.entries(result.analysis.confusion);
  if (pairs.length === 0) return "—";

  const [pair] = pairs.sort((a, b) => b[1] - a[1])[0];
  const [expected, actual] = pair.split(">");
  return `${label(expected)}/${label(actual)}`;
}

function scheduleRows(
  lex: Lexicon,
  plan: Plan | null,
  fallback: Finding[],
): { key: string; text: string; state: string; kind: "now" | "next" | "done" }[] {
  if (plan) {
    return plan.drills.slice(0, 3).map((drill: Drill, i) => ({
      key: drill.id,
      text: drill.diagnosis,
      state:
        drill.status === "passed"
          ? lex.results.statuses.done
          : i === 0
            ? lex.results.statuses.now
            : lex.results.statuses.next,
      kind: drill.status === "passed" ? "done" : i === 0 ? "now" : "next",
    }));
  }

  return fallback.slice(0, 3).map((finding, i) => ({
    key: `${finding.kind}-${i}`,
    text: finding.diagnosis,
    state: i === 0 ? lex.results.statuses.now : lex.results.statuses.next,
    kind: i === 0 ? "now" : "next",
  }));
}

export function Results({
  lex,
  result,
  plan,
  busy,
  onAgain,
  onHome,
  onBuildPlan,
  onOpenPlan,
}: Props) {
  const { analysis, findings, near_misses: nearMisses, drill_result: drill } = result;
  const top = findings[0];
  const rows = scheduleRows(lex, plan, findings);
  const outstanding = plan
    ? plan.drills.filter((d) => d.status !== "passed").length
    : findings.length;

  return (
    <Frame variant="results" left={lex.results.barLeft} right={lex.results.barRight}>
      {lex.results.headline && (
        <h1 className="results__headline">
          {lex.results.headline(
            formatCount(analysis.typed_chars, lex.numerals),
            formatCount(analysis.error_count, lex.numerals),
          )}
        </h1>
      )}

      {drill && (
        <div
          className={`notice${drill.passed ? "" : " notice--bad"}`}
          style={{ marginBottom: "1.4rem" }}
        >
          {drill.target_accuracy === null ? (
            <>That passage did not give you enough chances at the target to judge.</>
          ) : drill.passed ? (
            <>
              Drill passed &mdash; {percent(drill.target_accuracy)} on the letters you
              were practicing.
            </>
          ) : (
            <>
              {percent(drill.target_accuracy)} on the target letters, and you need{" "}
              {percent(drill.threshold)}. Attempt {drill.attempts}.
              {drill.eased && " Easing the bar slightly for the next one."}
            </>
          )}
        </div>
      )}

      <div className="scores">
        <div className="score">
          <div className="score__value">
            {formatCount(analysis.wpm, lex.numerals)}
          </div>
          <div className="score__label">{lex.results.stats[0]}</div>
        </div>
        <div className="score">
          <div className="score__value">{percent(analysis.accuracy)}</div>
          <div className="score__label">{lex.results.stats[1]}</div>
        </div>
        <div className="score">
          <div className="score__value">
            {formatCount(analysis.error_count, lex.numerals)}
          </div>
          <div className="score__label">{lex.results.stats[2]}</div>
        </div>
        <div className="score">
          <div className="score__value">{dominant(result)}</div>
          <div className="score__label">{lex.results.stats[3]}</div>
        </div>
      </div>

      <div className="results__cols">
        <div>
          <p className="kicker" style={{ marginBottom: "0.75rem" }}>
            {lex.results.findingsLabel}
          </p>

          {top ? (
            <>
              <div className="finding">
                <p className="finding__diagnosis">{top.diagnosis}</p>
                {evidenceFor(lex, top) && (
                  <p className="finding__evidence">{evidenceFor(lex, top)}</p>
                )}
                <div className="finding__targets">
                  {top.targets.map((target) => (
                    <span key={target} className="key key--error">
                      {label(target)}
                    </span>
                  ))}
                </div>
              </div>

              {findings.slice(1, 3).map((finding, i) => (
                <div className="finding" key={i}>
                  <p className="finding__diagnosis">{finding.diagnosis}</p>
                  <div className="finding__targets">
                    {finding.targets.map((target) => (
                      <span key={target} className="key">
                        {label(target)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="notice" style={{ marginBottom: "1.15rem" }}>
              {lex.results.nothing}
            </div>
          )}

          {nearMisses.map((miss) => (
            <div className="notice" key={miss.pair} style={{ marginTop: "0.75rem" }}>
              {lex.results.nearMiss(
                label(miss.expected),
                label(miss.actual),
                formatCount(miss.count, lex.numerals),
              )}
            </div>
          ))}
        </div>

        <div>
          <div className="section__head" style={{ marginBottom: "0.75rem" }}>
            <p className="kicker">{lex.results.planLabel}</p>
            <span className="kicker kicker--accent" style={{ marginLeft: "auto" }}>
              {lex.results.planCount(outstanding)}
            </span>
          </div>

          {rows.length > 0 ? (
            <div className="schedule">
              {rows.map((row, i) => (
                <div className={`schedule__row schedule__row--${row.kind}`} key={row.key}>
                  <span className="schedule__n">{lex.results.ordinals[i]}</span>
                  <div>
                    <div className="schedule__text">{row.text}</div>
                    <div className="schedule__state">{row.state}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="notice">{lex.results.nothing}</div>
          )}

          <div className="row" style={{ marginTop: "1.1rem" }}>
            <button className="btn" onClick={onAgain} disabled={busy}>
              {lex.results.primary}
            </button>

            {plan ? (
              <button className="btn btn--ghost" onClick={onOpenPlan}>
                {lex.results.plan}
              </button>
            ) : (
              result.plan_available && (
                <button className="btn btn--ghost" onClick={onBuildPlan} disabled={busy}>
                  {busy ? lex.results.building : lex.results.plan}
                </button>
              )
            )}

            <button className="btn btn--ghost" onClick={onHome}>
              {lex.results.secondary}
            </button>
          </div>
        </div>
      </div>
    </Frame>
  );
}
