import type { Finding, SessionResult } from "../lib/types";

interface Props {
  result: SessionResult;
  planExists: boolean;
  busy: boolean;
  onAgain: () => void;
  onHome: () => void;
  onBuildPlan: () => void;
  onOpenPlan: () => void;
}

function label(target: string): string {
  return target === " " ? "space" : target;
}

export function FindingCard({ finding }: { finding: Finding }) {
  return (
    <div className="finding">
      <p className="finding__diagnosis">{finding.diagnosis}</p>
      <div className="finding__targets">
        {finding.targets.map((target) => (
          <span key={target} className="key key--error">
            {label(target)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Results({
  result,
  planExists,
  busy,
  onAgain,
  onHome,
  onBuildPlan,
  onOpenPlan,
}: Props) {
  const { analysis, findings, drill_result: drill } = result;

  return (
    <div className="stage stage--wide">
      <div className="scores">
        <div className="score">
          <div className="score__value">{Math.round(analysis.wpm)}</div>
          <div className="score__label">wpm</div>
        </div>
        <div className="score">
          <div className="score__value">{Math.round(analysis.accuracy * 100)}%</div>
          <div className="score__label">accuracy</div>
        </div>
        <div className="score">
          <div className="score__value">{Math.round(analysis.raw_wpm)}</div>
          <div className="score__label">raw</div>
        </div>
        <div className="score">
          <div className="score__value">
            {Math.round(analysis.consistency * 100)}%
          </div>
          <div className="score__label">consistency</div>
        </div>
      </div>

      {drill && (
        <div
          className={`notice${drill.passed ? "" : " notice--bad"}`}
          style={{ marginBottom: "2rem" }}
        >
          {drill.target_accuracy === null ? (
            <>That passage did not give you enough chances at the target to judge.</>
          ) : drill.passed ? (
            <>
              Drill passed &mdash; {Math.round(drill.target_accuracy * 100)}% on the
              letters you were practicing.
            </>
          ) : (
            <>
              {Math.round(drill.target_accuracy * 100)}% on the target letters, and
              you need {Math.round(drill.threshold * 100)}%. Attempt{" "}
              {drill.attempts}.
              {drill.eased && " Easing the bar slightly for the next one."}
            </>
          )}
        </div>
      )}

      <p className="eyebrow">what actually went wrong</p>

      {findings.length > 0 ? (
        findings.map((finding, i) => <FindingCard key={i} finding={finding} />)
      ) : (
        <div className="notice">
          Nothing is recurring often enough yet to be worth calling a weakness. A
          few more runs and the patterns start separating from the noise.
        </div>
      )}

      <div className="row" style={{ marginTop: "2.5rem" }}>
        <button className="btn" onClick={onAgain}>
          Again
        </button>
        {planExists ? (
          <button className="btn btn--ghost" onClick={onOpenPlan}>
            Open plan
          </button>
        ) : (
          result.plan_available && (
            <button className="btn btn--ghost" onClick={onBuildPlan} disabled={busy}>
              {busy ? "building..." : "Build a correction plan"}
            </button>
          )
        )}
        <button className="btn btn--ghost" onClick={onHome}>
          Home
        </button>
      </div>
    </div>
  );
}
