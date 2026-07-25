import type { Drill, Plan } from "../lib/types";

interface Props {
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
  plan,
  busyDrillId,
  error,
  onStartDrill,
  onHome,
}: Props) {
  const passed = plan.drills.filter((d) => d.status === "passed").length;

  return (
    <div className="stage stage--wide">
      <p className="eyebrow">correction plan</p>
      <h1>
        {passed} of {plan.drills.length} cleared
      </h1>
      <p className="lede">
        Each drill is a fresh passage built to be unusually full of the letters
        you keep missing. It is judged only on those letters, not on your overall
        accuracy.
      </p>

      {plan.drills.map((drill) => (
        <div className="drill" key={drill.id}>
          <div className="drill__rank">{drill.rank}</div>
          <div className="drill__body">
            <p className="finding__diagnosis">{drill.diagnosis}</p>
            {drill.rationale && (
              <p className="finding__rationale">{drill.rationale}</p>
            )}
            <div className="finding__targets">
              {drill.targets.map((target) => (
                <span key={target} className="key">
                  {label(target)}
                </span>
              ))}
            </div>
            <div
              className={`drill__status${
                drill.status === "passed" ? " drill__status--passed" : ""
              }`}
            >
              {drill.status === "passed"
                ? `passed · ${drill.attempts} attempt${drill.attempts === 1 ? "" : "s"}`
                : `needs ${Math.round(drill.pass_threshold * 100)}% on the target letters`}
            </div>
          </div>
          <button
            className="btn btn--ghost"
            onClick={() => onStartDrill(drill)}
            disabled={busyDrillId !== null}
          >
            {busyDrillId === drill.id
              ? "writing..."
              : drill.status === "passed"
                ? "Redo"
                : "Practice"}
          </button>
        </div>
      ))}

      {error && (
        <div className="notice notice--bad" style={{ marginTop: "1.5rem" }}>
          {error}
        </div>
      )}

      <div className="row" style={{ marginTop: "2.5rem" }}>
        <button className="btn btn--ghost" onClick={onHome}>
          Home
        </button>
      </div>
    </div>
  );
}
