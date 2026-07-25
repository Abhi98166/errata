import type {
  Drill,
  DrillStart,
  Genre,
  Keystroke,
  Passage,
  Plan,
  SessionResult,
  UserConfig,
} from "./types";

const USER_KEY = "errata:user";

export function userId(): string {
  let id = localStorage.getItem(USER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(USER_KEY, id);
  }
  return id;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Errata-User": userId(),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body) => body.detail)
      .catch(() => response.statusText);
    throw new ApiError(String(detail), response.status);
  }

  return response.json() as Promise<T>;
}

export const api = {
  genres: () => request<Genre[]>("/genres"),

  getConfig: () => request<UserConfig>("/config"),

  saveConfig: (config: UserConfig) =>
    request<UserConfig>("/config", {
      method: "PUT",
      body: JSON.stringify(config),
    }),

  nextPassage: (genre: string, duration: number) =>
    request<Passage>(`/passages/next?genre=${genre}&duration=${duration}`, {
      method: "POST",
    }),

  submitSession: (body: {
    passage_id: string;
    duration_s: number;
    keystrokes: Keystroke[];
    drill_id?: string | null;
  }) =>
    request<SessionResult>("/sessions", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getPlan: () => request<Plan | null>("/plan"),

  createPlan: () => request<Plan>("/plan", { method: "POST" }),

  startDrill: (drill: Drill) =>
    request<DrillStart>(`/plan/drills/${drill.id}/start`, { method: "POST" }),
};
