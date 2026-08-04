import type { Lexicon } from "../lib/lexicon";
import { Brand, Frame } from "./Frame";

const WORDS: Record<number, number> = { 60: 120, 180: 320, 300: 520 };

const STATUS_TOKEN = /^(OK|▸▸)\s+(.*)$/;

function AsideLine({ line }: { line: string }) {
  const match = STATUS_TOKEN.exec(line);
  if (!match) return <>{line}</>;

  return (
    <>
      <b className={match[1] === "OK" ? undefined : "is-alarm"}>{match[1]}</b>{" "}
      {match[2]}
    </>
  );
}

interface Props {
  lex: Lexicon;
  durationS: number;
}

export function Generating({ lex, durationS }: Props) {
  const words = WORDS[durationS] ?? 120;

  return (
    <Frame variant="generating" left={<Brand />} right={lex.masthead}>
      <div className="gen">
        <div className="gen__figure" aria-hidden="true">
          {lex.generating.glyph}
        </div>

        <div>
          <p className="kicker">{lex.generating.kicker}</p>
          <h1 className="gen__title">{lex.generating.title}</h1>
          <p className="gen__body">{lex.generating.body(words)}</p>
          {lex.generating.progress && (
            <div className="gen__bar" aria-hidden="true">
              <i />
            </div>
          )}
        </div>

        <div className="gen__aside">
          {lex.generating.aside.map((line, i) => (
            <span key={i}>
              <AsideLine line={line} />
              {i < lex.generating.aside.length - 1 && <br />}
            </span>
          ))}
        </div>
      </div>
    </Frame>
  );
}
