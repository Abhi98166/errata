export interface Genre {
  id: string;
  label: string;
  blurb: string;
}

export interface UserConfig {
  genre: string;
  duration: number;
  sound_enabled: boolean;
  keypress_volume: number;
  ambient_enabled: boolean;
  ambient_volume: number;
  theme_override: string | null;
  keyboard_layout: "qwerty";
  reduced_motion: boolean;
  cursor_mode: "advance" | "block";
}

export interface Passage {
  id: string;
  text: string;
  genre: string;
  word_count: number;
  kind: string;
  targets: string[] | null;
}

export interface Keystroke {
  seq: number;
  t_ms: number;
  key: string;
  index: number;
}

export interface KeyStat {
  attempts: number;
  errors: number;
  error_rate: number;
  mean_ms: number;
}

export interface Analysis {
  wpm: number;
  raw_wpm: number;
  accuracy: number;
  consistency: number;
  elapsed_s: number;
  typed_chars: number;
  correct_chars: number;
  error_count: number;
  backspaces: number;
  correction_bursts: number;
  confusion: Record<string, number>;
  key_stats: Record<string, KeyStat>;
  bigram_stats: Record<string, KeyStat>;
  finger_stats: Record<string, KeyStat>;
  row_stats: Record<string, KeyStat>;
  transpositions: Record<string, number>;
  hesitations: Record<string, number>;
}

export interface Finding {
  kind: string;
  diagnosis: string;
  targets: string[];
  evidence: Record<string, unknown>;
}

export interface NearMiss {
  pair: string;
  expected: string;
  actual: string;
  count: number;
  attempts: number;
  reason: "count" | "attempts";
}

export interface DrillResult {
  drill_id: string;
  passed: boolean;
  target_accuracy: number | null;
  threshold: number;
  attempts: number;
  eased: boolean;
}

export interface SessionResult {
  session_id: string;
  analysis: Analysis;
  findings: Finding[];
  near_misses: NearMiss[];
  profile: {
    sessions: number;
    total_keystrokes: number;
    wpm: number;
    accuracy: number;
    consistency: number;
  };
  plan_available: boolean;
  drill_result: DrillResult | null;
}

export interface Drill {
  id: string;
  rank: number;
  kind: string;
  diagnosis: string;
  targets: string[];
  rationale: string | null;
  status: string;
  attempts: number;
  pass_threshold: number;
}

export interface Plan {
  id: string;
  status: string;
  drills: Drill[];
}

export interface DrillStart {
  drill: Drill;
  passage: Passage;
}
