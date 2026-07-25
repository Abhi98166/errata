import { useCallback, useEffect, useRef, useState } from "react";

import { sound } from "../lib/sound";
import type { Keystroke } from "../lib/types";

export type TypingStatus = "idle" | "running" | "done";

interface Options {
  text: string;
  durationS: number;
  cursorMode: "advance" | "block";
  onFinish: (keystrokes: Keystroke[]) => void;
}

interface TypingSession {
  typed: string;
  status: TypingStatus;
  remaining: number;
}

const TICK_MS = 100;

export function useTypingSession({
  text,
  durationS,
  cursorMode,
  onFinish,
}: Options): TypingSession {
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState<TypingStatus>("idle");
  const [remaining, setRemaining] = useState(durationS);

  const typedRef = useRef("");
  const strokes = useRef<Keystroke[]>([]);
  const startedAt = useRef<number | null>(null);
  const finished = useRef(false);
  const onFinishRef = useRef(onFinish);

  onFinishRef.current = onFinish;

  useEffect(() => {
    typedRef.current = "";
    strokes.current = [];
    startedAt.current = null;
    finished.current = false;
    setTyped("");
    setStatus("idle");
    setRemaining(durationS);
  }, [text, durationS]);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    setStatus("done");
    onFinishRef.current(strokes.current);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Timestamp first. Nothing goes above this line.
      const at = performance.now();

      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (finished.current) return;

      const isCharacter = event.key.length === 1;
      const isBackspace = event.key === "Backspace";
      if (!isCharacter && !isBackspace) return;

      event.preventDefault();

      if (startedAt.current === null) {
        startedAt.current = at;
        setStatus("running");
      }

      const current = typedRef.current;
      const index = current.length;

      strokes.current.push({
        seq: strokes.current.length,
        t_ms: Math.round(at - startedAt.current),
        key: event.key,
        index,
      });

      if (isBackspace) {
        if (index === 0) return;
        typedRef.current = current.slice(0, -1);
        setTyped(typedRef.current);
        return;
      }

      if (index >= text.length) return;

      const correct = event.key === text[index];

      if (!correct && cursorMode === "block") {
        sound.error();
        return;
      }

      typedRef.current = current + event.key;
      setTyped(typedRef.current);

      if (correct) sound.key();
      else sound.error();

      if (typedRef.current.length >= text.length) finish();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [text, cursorMode, finish]);

  useEffect(() => {
    if (status !== "running") return;

    const id = window.setInterval(() => {
      if (startedAt.current === null) return;
      const elapsed = (performance.now() - startedAt.current) / 1000;
      const left = Math.max(0, durationS - elapsed);
      setRemaining(left);
      if (left <= 0) finish();
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [status, durationS, finish]);

  return { typed, status, remaining };
}
