import { memo, useMemo } from "react";

import { useTypingSession, type Telemetry } from "../hooks/useTypingSession";
import { roman, type Lexicon } from "../lib/lexicon";
import type { Keystroke } from "../lib/types";
import { Frame } from "./Frame";

interface Props {
  lex: Lexicon;
  text: string;
  durationS: number;
  cursorMode: "advance" | "block";
  onFinish: (keystrokes: Keystroke[]) => void;
}

interface Slip {
  typed: string;
  expected: string;
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
        const wrong = attempt !== undefined && attempt !== char;
        // Show the letter that was actually struck, not the one that was wanted.
        const shown = wrong && attempt !== " " ? attempt : char;
        const classes = ["ch"];

        if (attempt !== undefined) classes.push(wrong ? "ch--wrong" : "ch--correct");
        if (shown === " ") classes.push("ch--space");
        if (i === cursorOffset) classes.push("ch--cursor");

        return (
          <span key={i} className={classes.join(" ")}>
            {shown}
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

function formatClock(seconds: number, lex: Lexicon): string {
  const whole = Math.ceil(seconds);
  if (lex.numerals === "roman") return roman(whole).toLowerCase();
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function label(char: string): string {
  return char === " " ? "space" : char;
}

function findSlips(text: string, typed: string): Slip[] {
  const seen = new Map<string, Slip>();

  for (let i = 0; i < typed.length; i += 1) {
    if (typed[i] === text[i]) continue;
    const key = `${typed[i]}>${text[i]}`;
    if (!seen.has(key)) seen.set(key, { typed: typed[i], expected: text[i] });
  }

  return [...seen.values()].slice(-4);
}

function Marginalia({ slips }: { slips: Slip[] }) {
  const latest = slips[slips.length - 1];

  return (
    <aside className="marginalia">
      <div>
        <div className="marginalia__label">in another hand</div>
        <p className="marginalia__hand">
          {latest
            ? `"${label(latest.typed)} for ${label(latest.expected)}, again. the same finger, the same failing."`
            : '"the hand is steady, so far."'}
        </p>
      </div>
      <div>
        <div className="marginalia__label">gloss</div>
        <p className="marginalia__gloss">
          A dot set beneath a letter cancels it. The scribe does not scratch out;
          the scribe admits.
        </p>
      </div>
    </aside>
  );
}

function TelemetryGutter({ data }: { data: Telemetry }) {
  return (
    <aside className="telemetry">
      <div className="telemetry__label">telemetry</div>

      <div className="telemetry__row">
        <span>stroke</span>
        <b>{data.strokes}</b>
      </div>
      <div className="telemetry__row">
        <span>&Delta;t mean</span>
        <b>{Math.round(data.meanMs)}ms</b>
      </div>
      <div className="telemetry__row">
        <span>&Delta;t last</span>
        <b>{Math.round(data.lastMs)}ms</b>
      </div>
      <div className="telemetry__row">
        <span>hand</span>
        <b>
          L {Math.round(data.left)} / R {Math.round(data.right)}
        </b>
      </div>
      <div className="telemetry__row">
        <span>row</span>
        <b>home {Math.round(data.home)}%</b>
      </div>
      <div className="telemetry__row telemetry__row--fault telemetry__divide">
        <span>faults</span>
        <b>{data.faults}</b>
      </div>

      <div className="telemetry__label">stream</div>
      <div className="telemetry__stream">
        {data.stream.length === 0 && <div>awaiting first stroke</div>}
        {data.stream.map((entry, i) => (
          <div key={`${entry.t}-${i}`}>
            {`t+${(entry.t / 1000).toFixed(3)}`}{" "}
            <b className={entry.fault ? "is-fault" : undefined}>
              {label(entry.key)}
            </b>{" "}
            <span className={entry.fault ? "is-fault" : undefined}>
              {entry.fault ? "fault" : "ok"}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function TypingSurface({
  lex,
  text,
  durationS,
  cursorMode,
  onFinish,
}: Props) {
  const { typed, status, remaining, telemetry } = useTypingSession({
    text,
    durationS,
    cursorMode,
    onFinish,
  });

  const words = useMemo(() => splitIntoWords(text), [text]);
  const slips = useMemo(() => findSlips(text, typed), [text, typed]);
  const cursor = typed.length;

  const { dropCap, marginalia, telemetry: gutter } = lex.surface;
  const body = dropCap ? text.slice(1) : text;
  const bodyWords = useMemo(
    () => (dropCap ? splitIntoWords(body) : words),
    [dropCap, body, words],
  );
  const offset = dropCap ? 1 : 0;

  const columns = [
    "surface__cols",
    dropCap ? "surface__cols--dropcap" : "",
    gutter ? "surface__cols--telemetry" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Frame variant="typing" left={lex.typing.barLeft} right={lex.typing.barRight}>
      {lex.surface.stamp && telemetry.faults > 0 && (
        <div className="surface__stamp">
          <span className="stamp">{lex.typing.stamp(telemetry.faults)}</span>
        </div>
      )}

      <div className="surface__head">
        <span className="surface__status">
          {status === "idle" ? lex.typing.idle : lex.typing.status}
          <b>{lex.typing.marks(telemetry.faults)}</b>
        </span>
        <span className="clock">
          {lex.surface.clockPrefix}
          {formatClock(remaining, lex)}
        </span>
      </div>

      <div className={columns}>
        {dropCap && (
          <div
            className={`dropcap${
              cursor === 0
                ? " is-cursor"
                : typed[0] === text[0]
                  ? ""
                  : " is-wrong"
            }`}
          >
            {text[0]}
          </div>
        )}

        <p className="passage">
          {bodyWords.map((word) => {
            const start = word.start + offset;
            const end = start + word.chars.length;
            const inThisWord = cursor >= start && cursor < end;

            return (
              <Word
                key={start}
                chars={word.chars}
                typedSlice={typed.slice(start, end)}
                cursorOffset={inThisWord ? cursor - start : -1}
              />
            );
          })}
        </p>

        {marginalia && <Marginalia slips={slips} />}
        {gutter && <TelemetryGutter data={telemetry} />}
      </div>

      <div className="surface__foot">
        <span>{lex.typing.marksLabel}</span>
        {slips.map((slip) => (
          <span key={`${slip.typed}${slip.expected}`} className="key key--error">
            {label(slip.typed)}&rarr;{label(slip.expected)}
          </span>
        ))}
        <span className="surface__hint">{lex.typing.footnote}</span>
      </div>
    </Frame>
  );
}
