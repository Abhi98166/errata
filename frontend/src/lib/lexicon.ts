export type Numerals = "arabic" | "roman";

export interface DurationCopy {
  label: string;
  sub: string;
}

export interface StepCopy {
  kicker: string;
  title: string;
  body: string;
}

export interface Lexicon {
  numerals: Numerals;
  masthead: string;
  hero: {
    kicker: string | null;
    titleLead: string;
    titleJoin: string;
    titleEmph: string;
    titleEnd: string;
    lede: string;
    facts: string[];
    marks: string[];
    stamp: string | null;
  };
  steps: StepCopy[];
  picker: {
    label: string;
    aside: string;
    selected: string;
  };
  duration: {
    label: string;
    options: DurationCopy[];
  };
  cta: {
    label: string;
    note: string[];
  };
  resume: {
    label: string;
    action: string;
  };
  specimen: {
    label: string;
    clock: string;
    prefix: string | null;
    instead: string;
    prose: ((typed: string, intended: string) => string) | null;
    note: (count: number) => string[];
  };
  generating: {
    kicker: string;
    title: string;
    body: (words: number) => string;
    aside: string[];
    glyph: string;
    progress: boolean;
  };
  surface: {
    dropCap: boolean;
    marginalia: boolean;
    telemetry: boolean;
    stamp: boolean;
    clockPrefix: string;
  };
  typing: {
    barLeft: string;
    barRight: string;
    idle: string;
    status: string;
    marks: (n: number) => string;
    marksLabel: string;
    footnote: string;
    stamp: (n: number) => string;
  };
  results: {
    barLeft: string;
    barRight: string;
    headline: ((chars: string, errors: string) => string) | null;
    stats: [string, string, string, string];
    findingsLabel: string;
    evidence: (count: string, attempts: string, rate: string) => string;
    nearMiss: (expected: string, actual: string, count: string) => string;
    nothing: string;
    planLabel: string;
    planCount: (n: number) => string;
    ordinals: string[];
    statuses: { now: string; next: string; done: string };
    primary: string;
    plan: string;
    secondary: string;
    building: string;
  };
  plan: {
    label: string;
    cleared: (passed: number, total: number) => string;
    lede: string;
    practice: string;
    redo: string;
    writing: string;
    passed: (attempts: number) => string;
    pending: (threshold: string) => string;
    home: string;
  };
  footer: {
    sound: string;
    block: string;
    note: string;
  };
}

const ROMAN: [number, string][] = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

export function roman(value: number): string {
  let left = Math.round(value);
  if (left <= 0) return "nil";
  if (left > 3999) return left.toLocaleString("en-US");

  let out = "";
  for (const [amount, glyph] of ROMAN) {
    while (left >= amount) {
      out += glyph;
      left -= amount;
    }
  }
  return out;
}

export function formatCount(value: number, numerals: Numerals): string {
  return numerals === "roman" ? roman(value) : Math.round(value).toLocaleString("en-US");
}

const LEXICONS: Record<string, Lexicon> = {
  comedic: {
    numerals: "arabic",
    masthead: "form 1-A · rev. 12 · retain all copies",
    hero: {
      kicker: "box 1 — statement of the problem",
      titleLead: "The keys you miss",
      titleJoin: "are the",
      titleEmph: "whole point",
      titleEnd: "",
      lede:
        "Other typing apps issue you a number and close the matter. errata opens a case file. Every keystroke is timestamped, cross-referenced against the passage, and entered into the record. The letters you keep fumbling become mandatory remedial exercises.",
      facts: [
        "Keystroke-level error profile. Not a WPM score.",
        "Five moods. Each with its own palette, type and sound.",
        "Scored on the server. The client cannot flatter you.",
      ],
      marks: ["✗", "✗", "✗"],
      stamp: "file reopened",
    },
    steps: [
      {
        kicker: "BOX 2",
        title: "Nominate a voice",
        body: "A model files you fresh prose in that register. The premises change to match.",
      },
      {
        kicker: "BOX 3",
        title: "Type it poorly",
        body: "Confusions, bigrams, fingers, rows, hesitations. All of it, on the record.",
      },
      {
        kicker: "BOX 4",
        title: "Receive your obligations",
        body: "Ranked findings become drills saturated with the exact letters you fumble.",
      },
    ],
    picker: {
      label: "box 5 — nominate a voice",
      aside: "tick one only. the premises follow.",
      selected: "SELECTED",
    },
    duration: {
      label: "box 6 — duration of exposure",
      options: [
        { label: "1 min", sub: "120 words" },
        { label: "3 min", sub: "320 words" },
        { label: "5 min", sub: "520 words" },
      ],
    },
    cta: {
      label: "File it",
      note: ["by signing below you accept", "the findings in advance"],
    },
    resume: { label: "case reopened · obligation", action: "Comply" },
    specimen: {
      label: "specimen — comedic",
      clock: "0:47",
      prefix: null,
      instead: "entered in error for",
      prose: null,
      note: (n) => [`${n}× this passage`, "logged, box 4"],
    },
    generating: {
      kicker: "status",
      title: "Drafting the incident…",
      body: (words) =>
        `A clerk is inventing ${words} words of plausible catastrophe. Please do not leave this window. Leaving this window has, historically, made it worse.`,
      aside: ["ref 1-A/0447", "copies: 3", "yours: pink"],
      glyph: "✔",
      progress: false,
    },
    surface: { dropCap: false, marginalia: false, telemetry: false, stamp: true, clockPrefix: "" },
    typing: {
      barLeft: "box 7 — enter the statement verbatim",
      barRight: "do not initial in this box",
      idle: "awaiting first entry · the clock is not running",
      status: "transcription in progress · clock runs from first keystroke",
      marks: (n) => `${n} amendments filed`,
      marksLabel: "amendments this box",
      footnote: "backspace permitted · the original entry is retained",
      stamp: (n) => `amended ×${n}`,
    },
    results: {
      barLeft: "findings of fact — ref 1-A/0447",
      barRight: "determination: liable",
      headline: null,
      stats: [
        "words per minute",
        "accuracy",
        "amendments filed",
        "principal offender",
      ],
      findingsLabel: "narrative of events",
      evidence: (count, attempts, rate) =>
        `${count} samples in ${attempts} chances, ${rate} confusion rate. Above the threshold. This is real, not an artifact.`,
      nearMiss: (expected, actual, count) =>
        `Insufficient evidence regarding ${expected}/${actual}. ${count} samples. The office declines to open a second file on a hunch.`,
      nothing:
        "No finding is supported on the present record. The office requires a pattern, not an afternoon. File again.",
      planLabel: "schedule of obligations",
      planCount: (n) => `${n} outstanding`,
      ordinals: ["01", "02", "03", "04", "05"],
      statuses: { now: "due immediately", next: "pending", done: "discharged" },
      primary: "Comply",
      plan: "Open the schedule",
      secondary: "Appeal (denied)",
      building: "opening a file…",
    },
    plan: {
      label: "schedule of obligations",
      cleared: (passed, total) => `${passed} of ${total} discharged`,
      lede:
        "Each obligation is a fresh passage engineered to be unreasonably full of the letters you keep entering in error. It is assessed on those letters only, not on your general competence.",
      practice: "Comply",
      redo: "Refile",
      writing: "drafting…",
      passed: (attempts) =>
        `discharged · ${attempts} attempt${attempts === 1 ? "" : "s"}`,
      pending: (threshold) => `requires ${threshold} on the nominated letters`,
      home: "Close the file",
    },
    footer: {
      sound: "audible stamp",
      block: "halt me on error",
      note: "finger attribution assumes QWERTY",
    },
  },

  horror: {
    numerals: "arabic",
    masthead: "you were here on the 3rd · you did not finish",
    hero: {
      kicker: null,
      titleLead: "The keys you miss",
      titleJoin: "are the",
      titleEmph: "whole point",
      titleEnd: ".",
      lede:
        "Other apps give you a number. This one keeps a record. Every keystroke is timestamped before anything else happens — before sound, before the screen changes — and the letters you keep fumbling are written down somewhere you cannot reach.",
      facts: [
        "Keystroke-level error profile. Not a WPM score.",
        "Five moods. The app becomes each one completely.",
        "Scored on the server. You cannot lie to it from here.",
      ],
      marks: ["―", "―", "―"],
      stamp: null,
    },
    steps: [
      {
        kicker: "first",
        title: "You choose the voice",
        body: "Something writes you a passage in it. The room changes to match.",
      },
      {
        kicker: "then",
        title: "You get it wrong",
        body: "Which key, which finger, which hesitation, to the millisecond. All kept.",
      },
      {
        kicker: "after",
        title: "It writes back",
        body: "Drills built from the letters you flinch at. It will use them on purpose.",
      },
    ],
    picker: {
      label: "choose a voice",
      aside: "the room follows",
      selected: "HERE",
    },
    duration: {
      label: "how long can you stay",
      options: [
        { label: "1 min", sub: "120 words" },
        { label: "3 min", sub: "320 words" },
        { label: "5 min", sub: "520 words" },
      ],
    },
    cta: {
      label: "Go in",
      note: ["the clock starts when you do", "nothing starts before that"],
    },
    resume: { label: "it kept something for you", action: "Go back in" },
    specimen: {
      label: "horror",
      clock: "0:47",
      prefix: null,
      instead: "instead of",
      prose: null,
      note: () => ["it remembers this one", "from last time"],
    },
    generating: {
      kicker: "please wait",
      title: "It is deciding what happens to you.",
      body: (words) =>
        `${words} words are being written for you specifically. It knows which letters you are bad at. It has been asked not to use that against you.`,
      aside: ["0:00", "0 keystrokes", "nothing yet"],
      glyph: "",
      progress: false,
    },
    surface: { dropCap: false, marginalia: false, telemetry: false, stamp: false, clockPrefix: "" },
    typing: {
      barLeft: "you are still here",
      barRight: "none of them will heal",
      idle: "it is waiting",
      status: "it is counting",
      marks: (n) => `${n} marks on the page · none of them will heal`,
      marksLabel: "it noticed",
      footnote: "backspace works. it still counts.",
      stamp: (n) => `${n} marks`,
    },
    results: {
      barLeft: "it is over. here is what it kept.",
      barRight: "the record stays",
      headline: (chars, errors) =>
        `You typed ${chars} characters and flinched at ${errors} of them.`,
      stats: [
        "words per minute",
        "accuracy",
        "marks left behind",
        "the one it watches",
      ],
      findingsLabel: "what it wants you to know",
      evidence: (count, attempts, rate) =>
        `${count} samples out of ${attempts}. ${rate}. This is not noise. It has waited until it was sure.`,
      nearMiss: (expected, actual, count) =>
        `There is something with ${expected} and ${actual} too. Only ${count} samples. It is not going to say anything yet.`,
      nothing:
        "Nothing has repeated often enough for it to be sure. It is going to keep watching.",
      planLabel: "what happens next",
      planCount: (n) => `${n} waiting`,
      ordinals: ["01", "02", "03", "04", "05"],
      statuses: { now: "now", next: "after that", done: "closed" },
      primary: "Go back in",
      plan: "See what it wants",
      secondary: "Leave the house",
      building: "it is deciding…",
    },
    plan: {
      label: "what happens next",
      cleared: (passed, total) => `${passed} of ${total} closed`,
      lede:
        "Each one is a new passage with far too many of your worst letters in it. It is judged on those letters alone. Nothing else about the run will save you.",
      practice: "Go in",
      redo: "Again",
      writing: "writing…",
      passed: (attempts) =>
        `closed · ${attempts} attempt${attempts === 1 ? "" : "s"}`,
      pending: (threshold) => `wants ${threshold} on those letters`,
      home: "Leave the house",
    },
    footer: {
      sound: "sound",
      block: "stop me on mistakes",
      note: "finger analysis assumes QWERTY",
    },
  },

  romantic: {
    numerals: "arabic",
    masthead: "still typing to you, apparently",
    hero: {
      kicker: null,
      titleLead: "The keys you miss are",
      titleJoin: "the",
      titleEmph: "whole point",
      titleEnd: ".",
      lede:
        "Everyone else hands you a number and wishes you well. This writes you something worth having typed, keeps every mistake the way you keep the ones that mattered, and then — gently, relentlessly — asks you to do them again until they stop.",
      facts: [
        "Every keystroke, to the millisecond. Nothing rounded off.",
        "Five moods, and the app falls completely for each one.",
        "Scored elsewhere, so it can afford to be honest with you.",
      ],
      marks: ["✦", "✦", "✦"],
      stamp: null,
    },
    steps: [
      {
        kicker: "first,",
        title: "Choose how to be spoken to",
        body: "A passage arrives in that voice. The paper, the ink and the sound of the keys arrive with it.",
      },
      {
        kicker: "then,",
        title: "Get it a little wrong",
        body: "Which key, which finger, and the half-second before it — all of it written down.",
      },
      {
        kicker: "and after,",
        title: "A letter back",
        body: "Drills full of the letters you keep losing, written in the voice you chose.",
      },
    ],
    picker: {
      label: "how would you like to be spoken to",
      aside: "choose one, it changes everything",
      selected: "this one",
    },
    duration: {
      label: "how long shall we stay",
      options: [
        { label: "a minute", sub: "120 words" },
        { label: "three", sub: "320 words" },
        { label: "five", sub: "520 words" },
      ],
    },
    cta: {
      label: "Begin, then",
      note: ["the clock waits for you,", "which is more than most things do"],
    },
    resume: { label: "we left something unfinished", action: "Go on, then" },
    specimen: {
      label: "romantic",
      clock: "0:47 left with them",
      prefix: null,
      instead: "— twice now",
      prose: (typed, intended) => `${typed} for ${intended}`,
      note: () => ["kept, of course"],
    },
    generating: {
      kicker: "a moment",
      title: "Finding the right way to say it…",
      body: (words) =>
        `${words} words about a kitchen, or a platform, or a wait. It will be specific, and it will be about someone you have not thought about in a while.`,
      aside: ["don't go anywhere"],
      glyph: "✦",
      progress: false,
    },
    surface: { dropCap: false, marginalia: false, telemetry: false, stamp: false, clockPrefix: "" },
    typing: {
      barLeft: "you started when you started, if that matters",
      barRight: "with them",
      idle: "whenever you are ready",
      status: "the clock is being kind about this",
      marks: (n) =>
        `${n} second thought${n === 1 ? "" : "s"} so far`,
      marksLabel: "second thoughts",
      footnote: "backspace, if you must — the first version is kept regardless",
      stamp: (n) => `${n} second thoughts`,
    },
    results: {
      barLeft: "so — how did we do",
      barRight: "kept, of course",
      headline: (chars, errors) =>
        `You typed ${chars} characters and changed your mind about ${errors}.`,
      stats: [
        "words a minute",
        "accuracy",
        "second thoughts",
        "the one you keep making",
      ],
      findingsLabel: "what we noticed",
      evidence: (count, attempts, rate) =>
        `${count} times out of ${attempts} chances, which is ${rate}. Enough to be a habit rather than a bad afternoon.`,
      nearMiss: (expected, actual, count) =>
        `There may be something with ${expected} and ${actual} as well, but only ${count} samples. We would rather not say a thing we cannot stand behind.`,
      nothing:
        "Nothing has happened often enough to be worth calling a habit. Come back and we will look again.",
      planLabel: "what we might do about it",
      planCount: (n) => `${n} left`,
      ordinals: ["i.", "ii.", "iii.", "iv.", "v."],
      statuses: { now: "start here", next: "after that", done: "done, and well" },
      primary: "Again, please",
      plan: "Read the whole letter",
      secondary: "Leave it for now",
      building: "writing it out…",
    },
    plan: {
      label: "what we might do about it",
      cleared: (passed, total) => `${passed} of ${total}, done and well`,
      lede:
        "Each one is a new passage, written to be unreasonably full of the letters you keep losing. It is judged on those letters only, which is the kindest way we know to do it.",
      practice: "Begin",
      redo: "Once more",
      writing: "writing…",
      passed: (attempts) =>
        `done · ${attempts} attempt${attempts === 1 ? "" : "s"}`,
      pending: (threshold) => `${threshold} on those letters, when you can`,
      home: "Leave it for now",
    },
    footer: {
      sound: "the sound of the keys",
      block: "stop me when I slip",
      note: "the finger analysis assumes QWERTY",
    },
  },

  poetic: {
    numerals: "roman",
    masthead: "fol. xiv v · of the errors of the hand",
    hero: {
      kicker: null,
      titleLead: "The keys thou missest",
      titleJoin: "are the",
      titleEmph: "whole matter",
      titleEnd: ".",
      lede:
        "Other instruments return to thee a number and take their leave. This one sets down every stroke of the hand, in order and in time, and from thy failures composes exercises made expressly of the letters thy fingers cannot hold.",
      facts: [
        "Every stroke recorded, to the thousandth part of a second.",
        "Five voices; the whole workshop is remade for each.",
        "Judged elsewhere, that it may not flatter thee.",
      ],
      marks: ["I.", "II.", "III."],
      stamp: null,
    },
    steps: [
      {
        kicker: "the first",
        title: "Elect a voice",
        body: "A passage is composed for thee in that register, and the workshop is dressed to suit it.",
      },
      {
        kicker: "the second",
        title: "Copy it badly",
        body: "Which finger, which row, and the hesitation before the stroke. All set down.",
      },
      {
        kicker: "the third",
        title: "Receive thy penance",
        body: "Exercises thick with the very letters thou dost fumble, in the voice thou chose.",
      },
    ],
    picker: {
      label: "elect a voice",
      aside: "the workshop follows",
      selected: "ELECTED",
    },
    duration: {
      label: "the measure of thy labour",
      options: [
        { label: "I min", sub: "cxx words" },
        { label: "III min", sub: "cccxx words" },
        { label: "V min", sub: "dxx words" },
      ],
    },
    cta: {
      label: "Set to it",
      note: ["the hour glass is not turned", "until thy first stroke"],
    },
    resume: { label: "a penance stands unfulfilled", action: "Take it up" },
    specimen: {
      label: "poetic",
      clock: "xlvii",
      prefix: null,
      instead: "marked beneath, corrected above",
      prose: (typed, intended) => `${typed} set for ${intended}`,
      note: (n) => [`${roman(n).toLowerCase()}× in this leaf`],
    },
    generating: {
      kicker: "stay a moment",
      title: "The ink is being ground.",
      body: (words) =>
        `${roman(words)} words are being set down for thee alone, in one continuous breath, and without a single line broken — for the surface will not suffer a broken line.`,
      aside: ["fol. xv r", "strokes: nil", "hand: thine"],
      glyph: "Q",
      progress: false,
    },
    surface: { dropCap: true, marginalia: true, telemetry: false, stamp: false, clockPrefix: "" },
    typing: {
      barLeft: "fol. xv r · the copying of the passage",
      barRight: "the first hand is kept",
      idle: "the hour glass is not yet turned",
      status: "the hour glass is turned",
      marks: (n) => `${roman(n)} letters marked beneath`,
      marksLabel: "marked beneath",
      footnote: "backspace is permitted. the first hand is kept.",
      stamp: (n) => `${roman(n)} cancelled`,
    },
    results: {
      barLeft: "of the errors of the hand · fol. xv v",
      barRight: "the leaf is finished",
      headline: (chars, errors) =>
        `Thou hast set down ${chars} letters, and cancelled ${errors} of them.`,
      stats: [
        "words the minute",
        "of strokes true",
        "letters cancelled",
        "thy chief failing",
      ],
      findingsLabel: "the finding",
      evidence: (count, attempts, rate) =>
        `${count} instances in ${attempts} occasions, being ${rate}. Above the threshold, and therefore fit to be spoken of.`,
      nearMiss: (expected, actual, count) =>
        `Something stirs also between ${expected} and ${actual}, upon ${count} occasions only. The workshop will not open a second finding upon a suspicion.`,
      nothing:
        "No failing yet stands clear of the ordinary trembling of the hand. Copy another leaf, and we shall see.",
      planLabel: "thy penance",
      planCount: (n) => `${roman(n).toLowerCase()} unfulfilled`,
      ordinals: ["i.", "ii.", "iii.", "iv.", "v."],
      statuses: { now: "begin here", next: "thereafter", done: "discharged" },
      primary: "Take up the pen",
      plan: "Read thy penance",
      secondary: "Close the book",
      building: "the ink is being ground…",
    },
    plan: {
      label: "thy penance",
      cleared: (passed, total) =>
        `${roman(passed)} of ${roman(total)} discharged`,
      lede:
        "Each penance is a passage composed expressly thick with the letters thy hand cannot hold. It is judged upon those letters alone, and upon nothing else.",
      practice: "Set to it",
      redo: "Once more",
      writing: "the ink is being ground…",
      passed: (attempts) =>
        `discharged · ${roman(attempts).toLowerCase()} attempt${attempts === 1 ? "" : "s"}`,
      pending: (threshold) => `${threshold} of those strokes must run true`,
      home: "Close the book",
    },
    footer: {
      sound: "the sound of the pen",
      block: "stay my hand at a fault",
      note: "the reckoning of fingers presumes a QWERTY board",
    },
  },

  technical: {
    numerals: "arabic",
    masthead: "sys 0.9.4 · offline capable",
    hero: {
      kicker: "▸ advisory 004 — operator error is a measurable quantity",
      titleLead: "The keys you miss",
      titleJoin: "are the",
      titleEmph: "whole point",
      titleEnd: ".",
      lede:
        "Other systems report throughput and terminate the session. This one instruments the operator. Every stroke is timestamped at the hardware boundary, scored server-side, and reduced to a fault profile. Faults become targeted load.",
      facts: [
        "Per-keystroke fault profile. Throughput is a by-product.",
        "Five voice profiles. Full theme, type and audio swap.",
        "Scoring is remote. The client cannot revise its own record.",
      ],
      marks: ["[01]", "[02]", "[03]"],
      stamp: null,
    },
    steps: [
      {
        kicker: "PHASE 01",
        title: "Select voice profile",
        body: "Text is generated to spec. Palette, type, motion and audio swap with it.",
      },
      {
        kicker: "PHASE 02",
        title: "Generate fault data",
        body: "Confusion pairs, bigrams, finger and row attribution, hesitation windows.",
      },
      {
        kicker: "PHASE 03",
        title: "Receive load plan",
        body: "Ranked faults become passages saturated with your failing keys.",
      },
    ],
    picker: {
      label: "select voice profile",
      aside: "full environment swap · ~0ms",
      selected: "ACTIVE",
    },
    duration: {
      label: "session length",
      options: [
        { label: "60s", sub: "~120 words" },
        { label: "180s", sub: "~320 words" },
        { label: "300s", sub: "~520 words" },
      ],
    },
    cta: {
      label: "Engage",
      note: ["clock arms on first stroke", "abort at any time, data retained"],
    },
    resume: { label: "load plan · queued", action: "Run" },
    specimen: {
      label: "specimen · technical",
      clock: "t-00:47",
      prefix: "ANOMALY",
      instead: "expected",
      prose: null,
      note: (n) => [`${n} logged`, "idx recorded"],
    },
    generating: {
      kicker: "▸ generating passage",
      title: "Composing bad news, quietly",
      body: () =>
        "Do not close the terminal. Generation is remote; validation is local; the passage will be ASCII-clean before it reaches your hands.",
      aside: [
        "OK  keyboard geometry loaded (qwerty)",
        "OK  profile restored",
        "OK  audio context unlocked",
        "OK  normaliser v3 armed",
        "▸▸ awaiting text…",
      ],
      glyph: "",
      progress: true,
    },
    surface: { dropCap: false, marginalia: false, telemetry: true, stamp: false, clockPrefix: "T-" },
    typing: {
      barLeft: "errata · dexterity calibration terminal",
      barRight: "original stream retained",
      idle: "armed · awaiting first stroke",
      status: "transcription active",
      marks: (n) => `${n} anomal${n === 1 ? "y" : "ies"} in window`,
      marksLabel: "ANOMALIES",
      footnote: "backspace permitted · original stream retained",
      stamp: (n) => `${n} faults`,
    },
    results: {
      barLeft: "session closed · report generated locally",
      barRight: "fault report",
      headline: (chars, errors) =>
        `${chars} strokes logged. ${errors} faults. Reduced to a profile.`,
      stats: [
        "wpm (derived)",
        "stroke accuracy",
        "faults logged",
        "dominant confusion",
      ],
      findingsLabel: "diagnosis",
      evidence: (count, attempts, rate) =>
        `n=${count} over ${attempts} opportunities. ${rate}. Above the reporting floor, so it is reported.`,
      nearMiss: (expected, actual, count) =>
        `SUPPRESSED — ${expected}/${actual} confusion, n=${count}. Below sample floor. Not reported; the system will not build a plan it cannot support.`,
      nothing:
        "NO FAULT ABOVE THRESHOLD. Insufficient samples to separate pattern from noise. Continue logging.",
      planLabel: "load plan",
      planCount: (n) => `${n} queued`,
      ordinals: ["01", "02", "03", "04", "05"],
      statuses: { now: "ready", next: "queued", done: "passed" },
      primary: "Run again",
      plan: "Open load plan",
      secondary: "End session",
      building: "compiling load plan…",
    },
    plan: {
      label: "load plan",
      cleared: (passed, total) => `${passed} / ${total} passed`,
      lede:
        "Each item is a generated passage saturated with your failing keys. Scoring is restricted to the target set; overall accuracy is not considered.",
      practice: "Run",
      redo: "Re-run",
      writing: "generating…",
      passed: (attempts) =>
        `passed · ${attempts} attempt${attempts === 1 ? "" : "s"}`,
      pending: (threshold) => `requires ${threshold} on target set`,
      home: "End session",
    },
    footer: {
      sound: "audio",
      block: "halt on fault",
      note: "finger attribution assumes QWERTY",
    },
  },
};

export const GENRE_ORDER = ["comedic", "horror", "romantic", "poetic", "technical"];

export function lexiconFor(genre: string): Lexicon {
  return LEXICONS[genre] ?? LEXICONS.comedic;
}
