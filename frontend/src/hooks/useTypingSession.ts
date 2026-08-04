import { useCallback, useEffect, useRef, useState } from "react";

import { handFor, rowFor } from "../lib/keyboard";
import { sound } from "../lib/sound";
import type { Keystroke } from "../lib/types";

export type TypingStatus = "idle" | "running" | "done";

interface Options {
  text: string;
  durationS: number;
  cursorMode: "advance" | "block";
  onFinish: (keystrokes: Keystroke[]) => void;
}

export interface StreamEntry {
  t: number;
  key: string;
  fault: boolean;
}

export interface Telemetry {
  strokes: number;
  meanMs: number;
  lastMs: number;
  left: number;
  right: number;
  home: number;
  faults: number;
  stream: StreamEntry[];
}

interface TypingSession {
  typed: string;
  status: TypingStatus;
  remaining: number;
  telemetry: Telemetry;
}

const TICK_MS = 100;
const STREAM_LENGTH = 5;
const MAX_RHYTHM_INTERVAL_MS = 3000;

interface Counters {
  intervals: number[];
  hands: { left: number; right: number };
  rows: { home: number; counted: number };
  faults: number;
  stream: StreamEntry[];
  lastAt: number | null;
}

function emptyCounters(): Counters {
  return {
    intervals: [],
    hands: { left: 0, right: 0 },
    rows: { home: 0, counted: 0 },
    faults: 0,
    stream: [],
    lastAt: null,
  };
}

export function useTypingSession({
  text,
  durationS,
  cursorMode,
  onFinish,
}: Options): TypingSession {
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState<TypingStatus>("idle");
  const [remaining, setRemaining] = useState(durationS);
  const [strokeCount, setStrokeCount] = useState(0);

  const typedRef = useRef("");
  const strokes = useRef<Keystroke[]>([]);
  const counters = useRef<Counters>(emptyCounters());
  const startedAt = useRef<number | null>(null);
  const finished = useRef(false);
  const onFinishRef = useRef(onFinish);

  onFinishRef.current = onFinish;

  useEffect(() => {
    typedRef.current = "";
    strokes.current = [];
    counters.current = emptyCounters();
    startedAt.current = null;
    finished.current = false;
    setTyped("");
    setStatus("idle");
    setRemaining(durationS);
    setStrokeCount(0);
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
      const elapsed = Math.round(at - startedAt.current);

      strokes.current.push({
        seq: strokes.current.length,
        t_ms: elapsed,
        key: event.key,
        index,
      });
      setStrokeCount(strokes.current.length);

      if (isBackspace) {
        if (index === 0) return;
        typedRef.current = current.slice(0, -1);
        setTyped(typedRef.current);
        return;
      }

      if (index >= text.length) return;

      const expected = text[index];
      const correct = event.key === expected;
      const counter = counters.current;

      if (counter.lastAt !== null) {
        const gap = at - counter.lastAt;
        if (gap >= 0 && gap <= MAX_RHYTHM_INTERVAL_MS) counter.intervals.push(gap);
      }
      counter.lastAt = at;

      const hand = handFor(expected);
      if (hand === "left") counter.hands.left += 1;
      if (hand === "right") counter.hands.right += 1;

      const row = rowFor(expected);
      if (row !== null) {
        counter.rows.counted += 1;
        if (row === "home") counter.rows.home += 1;
      }

      if (!correct) counter.faults += 1;

      counter.stream = [
        ...counter.stream,
        { t: elapsed, key: event.key, fault: !correct },
      ].slice(-STREAM_LENGTH);

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

  const counter = counters.current;
  const handTotal = counter.hands.left + counter.hands.right;

  const telemetry: Telemetry = {
    strokes: strokeCount,
    meanMs: counter.intervals.length
      ? counter.intervals.reduce((sum, ms) => sum + ms, 0) / counter.intervals.length
      : 0,
    lastMs: counter.intervals.at(-1) ?? 0,
    left: handTotal ? (counter.hands.left / handTotal) * 100 : 0,
    right: handTotal ? (counter.hands.right / handTotal) * 100 : 0,
    home: counter.rows.counted
      ? (counter.rows.home / counter.rows.counted) * 100
      : 0,
    faults: counter.faults,
    stream: counter.stream,
  };

  return { typed, status, remaining, telemetry };
}
