import { useMemo, type CSSProperties, type ReactNode } from "react";

import { useGenre } from "../lib/theme";

interface Layer {
  key: string;
  z: number;
  opacity: number;
  blend?: CSSProperties["mixBlendMode"];
  nodes: ReactNode[];
}

function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// omFall translates by percentage, so the falling track has to be panel-height,
// not petal-height, or the particle only ever moves its own size.
function track(left: number, animation: string): CSSProperties {
  return {
    position: "absolute",
    top: 0,
    height: "100%",
    left: `${left.toFixed(1)}%`,
    animation,
  };
}

function horrorLayers(): Layer[] {
  const mist: ReactNode[] = [];

  for (let i = 0; i < 8; i += 1) {
    const a = rand(i + 1);
    const b = rand(i + 9);
    const c = rand(i + 17);

    mist.push(
      <div
        key={`mist${i}`}
        style={{
          position: "absolute",
          left: `${(-22 + a * 112).toFixed(1)}%`,
          top: `${(6 + b * 84).toFixed(1)}%`,
          width: `${(240 + c * 320).toFixed(0)}px`,
          height: `${(110 + a * 180).toFixed(0)}px`,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(158, 178, 180, 0.2), rgba(88, 104, 110, 0.07) 55%, transparent 74%)",
          filter: "blur(20px)",
          animation: `omMist ${(26 + c * 26).toFixed(1)}s linear ${(-a * 34).toFixed(1)}s infinite`,
        }}
      />,
    );
  }

  const drips: ReactNode[] = [];

  for (let i = 0; i < 6; i += 1) {
    const a = rand(i + 11);
    const b = rand(i + 31);
    const duration = (12 + a * 10).toFixed(1);
    const delay = (-b * 12).toFixed(1);

    drips.push(
      <div
        key={`drip${i}`}
        style={{
          position: "absolute",
          top: 0,
          left: `${(4 + a * 92).toFixed(1)}%`,
          width: `${(1.5 + b * 2).toFixed(1)}px`,
          height: `${(50 + b * 150).toFixed(0)}px`,
          transformOrigin: "top",
          borderRadius: "0 0 2px 2px",
          background: "linear-gradient(180deg, #5e1310, #b8322a 68%, #dc554a)",
          animation: `omDrip ${duration}s ease-in ${delay}s infinite`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "-1.5px",
            bottom: "-5px",
            width: `${(4 + b * 3).toFixed(1)}px`,
            height: `${(5 + b * 4).toFixed(1)}px`,
            borderRadius: "50% 50% 62% 62%",
            background: "#b8322a",
            boxShadow: "0 0 8px rgba(184, 50, 42, 0.6)",
            animation: `omBead ${duration}s ease-in ${delay}s infinite`,
          }}
        />
      </div>,
    );
  }

  return [
    { key: "mist", z: 3, opacity: 0.55, blend: "screen", nodes: mist },
    { key: "drips", z: 4, opacity: 0.8, nodes: drips },
  ];
}

function romanticLayers(): Layer[] {
  const nodes: ReactNode[] = [];

  for (let i = 0; i < 20; i += 1) {
    const a = rand(i + 3);
    const b = rand(i + 23);
    const c = rand(i + 53);

    nodes.push(
      <div
        key={`petal${i}`}
        style={track(
          1 + a * 97,
          `omFall ${(9 + c * 12).toFixed(1)}s linear ${(-a * 20).toFixed(1)}s infinite`,
        )}
      >
        <div
          style={{
            width: `${(6 + b * 8).toFixed(1)}px`,
            height: `${(8 + b * 11).toFixed(1)}px`,
            borderRadius: "54% 8% 54% 8%",
            background: `linear-gradient(140deg, ${
              b > 0.66 ? "#fbe0dd" : b > 0.33 ? "#f0b3b8" : "#dd8f99"
            }, rgba(214, 132, 143, 0.6))`,
            boxShadow: "0 1px 3px rgba(150, 80, 90, 0.18)",
            animation: `omSway ${(3.4 + c * 3.4).toFixed(1)}s ease-in-out infinite`,
          }}
        />
      </div>,
    );
  }

  nodes.push(
    <div
      key="bloom"
      style={{
        position: "absolute",
        left: "18%",
        top: "-14%",
        width: "58%",
        height: "70%",
        background:
          "radial-gradient(ellipse at 50% 50%, rgba(255, 214, 198, 0.5), transparent 68%)",
        animation: "omGlow 11s ease-in-out infinite",
      }}
    />,
  );

  return [{ key: "petals", z: 3, opacity: 0.72, nodes }];
}

function poeticLayers(): Layer[] {
  const nodes: ReactNode[] = [
    <div
      key="candle"
      style={{
        position: "absolute",
        left: "10%",
        top: "4%",
        width: "46%",
        height: "58%",
        background:
          "radial-gradient(ellipse at 50% 50%, rgba(255, 226, 158, 0.42), transparent 66%)",
        animation: "omGlow 9s ease-in-out infinite",
      }}
    />,
  ];

  for (let i = 0; i < 26; i += 1) {
    const a = rand(i + 5);
    const b = rand(i + 45);
    const c = rand(i + 85);
    const size = `${(2 + c * 2.4).toFixed(1)}px`;

    nodes.push(
      <div
        key={`mote${i}`}
        style={{
          position: "absolute",
          left: `${(2 + a * 96).toFixed(1)}%`,
          top: `${(52 + b * 46).toFixed(1)}%`,
          width: size,
          height: size,
          borderRadius: "50%",
          background: "radial-gradient(circle, #ffeaad, rgba(201, 164, 92, 0) 72%)",
          boxShadow: "0 0 6px rgba(255, 224, 150, 0.7)",
          animation: `omMote ${(10 + b * 13).toFixed(1)}s linear ${(-a * 20).toFixed(1)}s infinite`,
        }}
      />,
    );
  }

  return [{ key: "gold", z: 3, opacity: 0.85, blend: "screen", nodes }];
}

const GLYPHS = Array.from("01△∴ 1011 ≡≠ 0110");

function technicalLayers(): Layer[] {
  const nodes: ReactNode[] = [];

  for (let i = 0; i < 16; i += 1) {
    const a = rand(i + 7);
    const b = rand(i + 27);

    nodes.push(
      <div
        key={`rain${i}`}
        style={{
          position: "absolute",
          top: 0,
          left: `${(2 + a * 96).toFixed(1)}%`,
          width: "1px",
          height: `${(60 + b * 110).toFixed(0)}px`,
          background:
            "linear-gradient(180deg, transparent, rgba(111, 240, 208, 0.55) 70%, rgba(216, 255, 245, 0.9))",
          animation: `omRain ${(4 + b * 6).toFixed(1)}s linear ${(-a * 9).toFixed(1)}s infinite`,
        }}
      />,
    );
  }

  for (let i = 0; i < 7; i += 1) {
    const a = rand(i + 63);
    const b = rand(i + 73);

    nodes.push(
      <div
        key={`glyph${i}`}
        style={{
          position: "absolute",
          top: 0,
          left: `${(4 + a * 92).toFixed(1)}%`,
          writingMode: "vertical-rl",
          font: '9px/1.5 "IBM Plex Mono", monospace',
          letterSpacing: "0.12em",
          color: "rgba(111, 240, 208, 0.5)",
          animation: `omRain ${(6 + b * 7).toFixed(1)}s linear ${(-b * 13).toFixed(1)}s infinite`,
        }}
      >
        {GLYPHS.slice(0, 6 + Math.round(a * 8)).join("")}
      </div>,
    );
  }

  nodes.push(
    <div
      key="sweep"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: "54px",
        background:
          "linear-gradient(180deg, transparent, rgba(111, 240, 208, 0.1), transparent)",
        animation: "omSweep 6.5s linear infinite",
      }}
    />,
    <div
      key="tear"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: "36%",
        height: "13px",
        background: "rgba(111, 240, 208, 0.16)",
        mixBlendMode: "screen",
        animation: "omGlitch 9s linear infinite",
      }}
    />,
  );

  return [{ key: "crt", z: 3, opacity: 0.7, nodes }];
}

const BUILDERS: Record<string, () => Layer[]> = {
  horror: horrorLayers,
  romantic: romanticLayers,
  poetic: poeticLayers,
  technical: technicalLayers,
};

export function Atmosphere() {
  const genre = useGenre();
  const layers = useMemo(() => BUILDERS[genre]?.() ?? [], [genre]);

  return (
    <>
      {layers.map((layer) => (
        <div
          key={layer.key}
          className="atmos"
          aria-hidden="true"
          style={{ zIndex: layer.z, opacity: layer.opacity, mixBlendMode: layer.blend }}
        >
          {layer.nodes}
        </div>
      ))}
    </>
  );
}
