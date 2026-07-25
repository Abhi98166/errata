import { useCallback, useEffect, useState } from "react";

import { Home } from "./components/Home";
import { PlanPanel } from "./components/PlanPanel";
import { Results } from "./components/Results";
import { TypingSurface } from "./components/TypingSurface";
import { api } from "./lib/api";
import { sound } from "./lib/sound";
import type {
  Drill,
  Genre,
  Keystroke,
  Passage,
  Plan,
  SessionResult,
  UserConfig,
} from "./lib/types";

type Screen =
  | { name: "loading" }
  | { name: "home" }
  | { name: "typing"; passage: Passage; drill: Drill | null }
  | { name: "results"; result: SessionResult }
  | { name: "plan" };

const DEFAULT_CONFIG: UserConfig = {
  genre: "comedic",
  duration: 60,
  sound_enabled: false,
  keypress_volume: 0.35,
  ambient_enabled: false,
  ambient_volume: 0.2,
  theme_override: null,
  keyboard_layout: "qwerty",
  reduced_motion: false,
  cursor_mode: "advance",
};

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: "loading" });
  const [genres, setGenres] = useState<Genre[]>([]);
  const [config, setConfig] = useState<UserConfig>(DEFAULT_CONFIG);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyDrillId, setBusyDrillId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.genres(), api.getConfig(), api.getPlan()])
      .then(([loadedGenres, loadedConfig, loadedPlan]) => {
        setGenres(loadedGenres);
        setConfig(loadedConfig);
        setPlan(loadedPlan);
        setScreen({ name: "home" });
      })
      .catch((err: Error) => {
        setError(`Could not reach the backend: ${err.message}`);
        setScreen({ name: "home" });
      });
  }, []);

  const activeTheme = config.theme_override ?? config.genre;

  useEffect(() => {
    document.documentElement.dataset.genre = activeTheme;
    document.documentElement.dataset.reducedMotion = String(config.reduced_motion);
  }, [activeTheme, config.reduced_motion]);

  useEffect(() => {
    sound.enabled = config.sound_enabled;
    sound.volume = config.keypress_volume;
    sound.setGenre(config.genre);
  }, [config.sound_enabled, config.keypress_volume, config.genre]);

  const updateConfig = useCallback((patch: Partial<UserConfig>) => {
    sound.unlock();

    setConfig((previous) => {
      const next = { ...previous, ...patch };
      void api.saveConfig(next).catch(() => undefined);
      return next;
    });
  }, []);

  const start = useCallback(async () => {
    setBusy(true);
    setError(null);
    sound.unlock();
    try {
      const passage = await api.nextPassage(config.genre, config.duration);
      setScreen({ name: "typing", passage, drill: null });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }, [config.genre, config.duration]);

  const startDrill = useCallback(async (drill: Drill) => {
    setBusyDrillId(drill.id);
    setError(null);
    try {
      const started = await api.startDrill(drill);
      setScreen({ name: "typing", passage: started.passage, drill: started.drill });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyDrillId(null);
    }
  }, []);

  const finishSession = useCallback(
    async (passage: Passage, drill: Drill | null, keystrokes: Keystroke[]) => {
      try {
        const result = await api.submitSession({
          passage_id: passage.id,
          duration_s: config.duration,
          keystrokes,
          drill_id: drill?.id ?? null,
        });
        setScreen({ name: "results", result });
        if (drill) setPlan(await api.getPlan());
      } catch (err) {
        setError((err as Error).message);
        setScreen({ name: "home" });
      }
    },
    [config.duration],
  );

  const buildPlan = useCallback(async () => {
    setBusy(true);
    try {
      setPlan(await api.createPlan());
      setScreen({ name: "plan" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);

  const goHome = useCallback(() => {
    setError(null);
    setScreen({ name: "home" });
  }, []);

  return (
    <div className="app">
      <div className="effects" aria-hidden="true" />

      {screen.name === "loading" && <div className="stage" />}

      {screen.name === "home" && (
        <Home
          genres={genres}
          config={config}
          plan={plan}
          busy={busy}
          error={error}
          onChange={updateConfig}
          onStart={start}
          onOpenPlan={() => setScreen({ name: "plan" })}
        />
      )}

      {screen.name === "typing" && (
        <TypingSurface
          key={screen.passage.id}
          text={screen.passage.text}
          durationS={config.duration}
          cursorMode={config.cursor_mode}
          onFinish={(keystrokes) =>
            void finishSession(screen.passage, screen.drill, keystrokes)
          }
        />
      )}

      {screen.name === "results" && (
        <Results
          result={screen.result}
          planExists={plan !== null}
          busy={busy}
          onAgain={() => void start()}
          onHome={goHome}
          onBuildPlan={() => void buildPlan()}
          onOpenPlan={() => setScreen({ name: "plan" })}
        />
      )}

      {screen.name === "plan" && plan && (
        <PlanPanel
          plan={plan}
          busyDrillId={busyDrillId}
          error={error}
          onStartDrill={(drill) => void startDrill(drill)}
          onHome={goHome}
        />
      )}
    </div>
  );
}
