import { useEffect, useMemo, useState } from "react";

const NEIGHBOURS: Record<string, string> = {
  a: "s",
  e: "w",
  h: "j",
  i: "o",
  l: "k",
  n: "m",
  o: "i",
  r: "t",
  s: "d",
  t: "r",
};

interface Slips {
  intended: string;
  typed: string;
  indices: Set<number>;
}

function planSlips(text: string): Slips {
  const lower = text.toLowerCase();

  let intended = "";
  let best = 0;

  for (const letter of Object.keys(NEIGHBOURS)) {
    const count = lower.split(letter).length - 1;
    if (count > best) {
      intended = letter;
      best = count;
    }
  }

  const indices = new Set<number>();
  let previous = -Infinity;

  for (let i = 0; i < lower.length && indices.size < 2; i += 1) {
    if (lower[i] === intended && i - previous >= 16) {
      indices.add(i);
      previous = i;
    }
  }

  return { intended, typed: NEIGHBOURS[intended] ?? "", indices };
}

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

interface Props {
  label: string;
  text: string;
  still: boolean;
}

export function HeroSpecimen({ label, text, still }: Props) {
  const words = useMemo(() => splitIntoWords(text), [text]);
  const slips = useMemo(() => planSlips(text), [text]);

  const [cursor, setCursor] = useState(0);
  const [verdict, setVerdict] = useState(false);

  useEffect(() => {
    if (still) {
      setCursor(text.length);
      setVerdict(true);
      return;
    }

    let timer = 0;
    let index = 0;

    const type = () => {
      index += 1;
      setCursor(index);

      if (index < text.length) {
        const pause = slips.indices.has(index) ? 300 : 32 + Math.random() * 58;
        timer = window.setTimeout(type, pause);
        return;
      }

      timer = window.setTimeout(() => {
        setVerdict(true);
        timer = window.setTimeout(restart, 3600);
      }, 500);
    };

    const restart = () => {
      index = 0;
      setCursor(0);
      setVerdict(false);
      timer = window.setTimeout(type, 700);
    };

    setCursor(0);
    setVerdict(false);
    timer = window.setTimeout(type, 700);

    return () => window.clearTimeout(timer);
  }, [text, still, slips]);

  return (
    <figure className="spec" aria-hidden="true">
      <figcaption className="spec__bar">
        <span className="spec__dot" />
        {label}
        <span className="spec__meta">0:47</span>
      </figcaption>

      <p className="spec__line">
        {words.map((word) => (
          <span className="word" key={word.start}>
            {Array.from(word.chars, (char, i) => {
              const index = word.start + i;
              const classes = ["ch"];

              if (index < cursor) {
                classes.push(slips.indices.has(index) ? "ch--wrong" : "ch--correct");
              }
              if (char === " ") classes.push("ch--space");
              if (index === cursor) classes.push("ch--cursor");

              return (
                <span key={i} className={classes.join(" ")}>
                  {char}
                </span>
              );
            })}
          </span>
        ))}
      </p>

      <div className={verdict ? "spec__verdict is-in" : "spec__verdict"}>
        <span className="key key--error">{slips.typed}</span>
        <span className="spec__arrow">for</span>
        <span className="key">{slips.intended}</span>
        <span className="spec__note">
          {slips.indices.size}&times; this passage &middot; folded into your profile
        </span>
      </div>
    </figure>
  );
}
