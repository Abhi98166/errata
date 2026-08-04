export type Hand = "left" | "right" | "thumb";
export type Row = "number" | "top" | "home" | "bottom" | "space";

const ROWS: [string, Row][] = [
  ["`1234567890-=", "number"],
  ["qwertyuiop[]\\", "top"],
  ["asdfghjkl;'", "home"],
  ["zxcvbnm,./", "bottom"],
];

const LEFT = new Set("`12345qwertasdfgzxcvb");
const RIGHT = new Set("67890-=yuiop[]\\hjkl;'nm,./");

export function handFor(char: string): Hand | null {
  const key = char.toLowerCase();
  if (key === " ") return "thumb";
  if (LEFT.has(key)) return "left";
  if (RIGHT.has(key)) return "right";
  return null;
}

export function rowFor(char: string): Row | null {
  const key = char.toLowerCase();
  if (key === " ") return "space";
  for (const [chars, row] of ROWS) {
    if (chars.includes(key)) return row;
  }
  return null;
}
