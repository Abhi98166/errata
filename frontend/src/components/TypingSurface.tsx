import { memo, useMemo } from "react";

import { useTypingSession } from "../hooks/useTypingSession";
import type { Keystroke } from "../lib/types";

interface Props {
  text: string;
  durationS: number;
  cursorMode: "advance" | "block";
  onFinish: (keystrokes: Keystroke[]) => void;
}

const Word = memo(function Word({
  chars,
  typedSlice,
  cursorOffset,
}: {
  chars: string;
  typedSlice: string;
  cursorOffset: number;
}) {
  return (
    <span className="word">
      {Array.from(chars, (char, i) => {
        const attempt = typedSlice[i];
        const classes = ["ch"];

        if (attempt !== undefined) {
          classes.push(attempt === char ? "ch--correct" : "ch--wrong");
        }
        if (char === " ") classes.push("ch--space");
        if (i === cursorOffset) classes.push("ch--cursor");

        return (
          <span key={i} className={classes.join(" ")}>
            {char}
          </span>
        );
      })}
    </span>
  );
});

function splitIntoWords(text: string): { chars: string; start: number }[] {
  const words: { chars: string; start: number }[] = [];
  let start = 0;

  for (const part of text.split(" ")) {
    const chars = start + part.length < text.length ? `${part} ` : part;
    words.push({ chars, start });
    start += chars.length;
  }

  return words;
}

function formatClock(seconds: number): string {
  const whole = Math.ceil(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function TypingSurface({ text, durationS, cursorMode, onFinish }: Props) {
  const { typed, status, remaining } = useTypingSession({
    text,
    durationS,
    cursorMode,
    onFinish,
  });

  const words = useMemo(() => splitIntoWords(text), [text]);
  const cursor = typed.length;

  return (
    <div className="stage stage--wide">
      <div className="hud">
        <span>{status === "idle" ? "start typing when you're ready" : "typing"}</span>
        <span className="hud__clock">{formatClock(remaining)}</span>
      </div>

      <div className="passage">
        {words.map((word) => {
          const end = word.start + word.chars.length;
          const inThisWord = cursor >= word.start && cursor < end;

          return (
            <Word
              key={word.start}
              chars={word.chars}
              typedSlice={typed.slice(word.start, end)}
              cursorOffset={inThisWord ? cursor - word.start : -1}
            />
          );
        })}
      </div>

      <p className="hint">
        the clock starts on your first keystroke &middot; backspace works
      </p>
    </div>
  );
}
