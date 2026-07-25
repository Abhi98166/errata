import type { Genre, Plan, UserConfig } from "../lib/types";

const DURATIONS = [
  { seconds: 60, label: "1 min" },
  { seconds: 180, label: "3 min" },
  { seconds: 300, label: "5 min" },
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

  return (
    <div className="stage stage--wide">
      <div className="brand">
        err<b>a</b>ta
      </div>

      {nextDrill && (
        <>
          <p className="eyebrow">correction plan</p>
          <div className="notice" style={{ marginBottom: "2.5rem" }}>
            <p style={{ marginBottom: "0.9rem" }}>
              Drill {nextDrill.rank} of {plan!.drills.length}: {nextDrill.diagnosis}
            </p>
            <button className="btn" onClick={onOpenPlan}>
              Continue plan
            </button>
          </div>
        </>
      )}

      <p className="eyebrow">pick a mood</p>
      <div className="cards">
        {genres.map((genre) => (
          <button
            key={genre.id}
            className="card"
            data-genre={genre.id}
            aria-pressed={config.genre === genre.id}
            onClick={() => onChange({ genre: genre.id })}
          >
            <div className="card__label">{genre.label}</div>
            <div className="card__blurb">{genre.blurb}</div>
          </button>
        ))}
      </div>

      <p className="eyebrow">how long</p>
      <div className="row" style={{ marginBottom: "2.25rem" }}>
        {DURATIONS.map((option) => (
          <button
            key={option.seconds}
            className="chip"
            aria-pressed={config.duration === option.seconds}
            onClick={() => onChange({ duration: option.seconds })}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="row">
        <button className="btn" onClick={onStart} disabled={busy}>
          {busy ? "writing you something..." : "Begin"}
        </button>
        {plan && !nextDrill && (
          <button className="btn btn--ghost" onClick={onOpenPlan}>
            View plan
          </button>
        )}
      </div>

      {error && (
        <div className="notice notice--bad" style={{ marginTop: "1.5rem" }}>
          {error}
        </div>
      )}

      <div className="settings">
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
        <span style={{ marginLeft: "auto", fontSize: "0.78rem" }}>
          finger analysis assumes QWERTY
        </span>
      </div>
    </div>
  );
}
