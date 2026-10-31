import type {
  AuthResult,
  CheckinInput,
  CheckinList,
  CheckinResult,
  CodeInfo,
  Comfort,
  ContactInfo,
  JourneyView,
  Me,
  Message,
  Plan,
  Today,
} from "./types";

// Set EXPO_PUBLIC_API_ORIGIN at build time to point the app at another webapp (Expo inlines it into the bundle).
export const API_ORIGIN = (process.env.EXPO_PUBLIC_API_ORIGIN || "https://app.locicare.xyz").replace(/\/$/, "");
export const API_BASE = `${API_ORIGIN}/api/v1`;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

type Opts = { base?: string; getToken: () => string | null; onUnauthorized?: () => void; fetcher?: Fetcher };

/** Normalizes a code typed as "abcd efgh", "abcd-efgh" or "ABCDEFGH" to "ABCD-EFGH". */
export function normalizeCode(raw: string): string {
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4)}` : s;
}

/**
 * The contract says `streak` is a number; the server currently sends
 * `{ current, best, doneToday }` on /today and /journey. Accept both.
 */
export function streakOf(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && typeof (v as { current?: unknown }).current === "number") return (v as { current: number }).current;
  return 0;
}

/** Typed client for the webapp's bearer-token /api/v1. */
export function createClient(opts: Opts) {
  const base = opts.base ?? API_BASE;
  const fetcher: Fetcher = opts.fetcher ?? ((i, init) => fetch(i, init));

  async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: "application/json" };
    const token = opts.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    let res: Response;
    try {
      res = await fetcher(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch {
      throw new ApiError(0, "network", "Can't reach loci. Check your connection and try again.");
    }
    if (res.status === 204) return undefined as T;
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      const e = (data as { error?: { code?: string; message?: string } } | null)?.error;
      if (res.status === 401) opts.onUnauthorized?.();
      throw new ApiError(res.status, e?.code ?? `http_${res.status}`, e?.message ?? "Something went wrong. Try again in a moment.");
    }
    return data as T;
  }

  const j = (id: string) => `/journeys/${encodeURIComponent(id)}`;

  return {
    signin: (email: string, password: string) => call<AuthResult>("POST", "/auth/signin", { email, password }),
    signup: (name: string, email: string, password: string, timezone: string) => call<AuthResult>("POST", "/auth/signup", { name, email, password, timezone }),
    demo: (timezone: string) => call<AuthResult>("POST", "/auth/demo", { timezone }),
    signout: () => call<void>("POST", "/auth/signout"),
    me: () => call<Me>("GET", "/me"),

    checkCode: (code: string) => call<CodeInfo>("GET", `/codes/${encodeURIComponent(normalizeCode(code))}`),
    redeem: (code: string, shareWithTeam: boolean) => call<{ journey_id: string }>("POST", "/redeem", { code: normalizeCode(code), share_with_team: shareWithTeam }),

    today: async (id = "current") => {
      const t = await call<Today>("GET", `${j(id)}/today`);
      return { ...t, streak: streakOf(t.streak) };
    },
    tick: (id: string, item_id: string, slot: string, done: boolean) => call<{ ok: true; progress: { done: number; total: number } }>("POST", `${j(id)}/ticks`, { item_id, slot, done }),
    planSeen: (id = "current") => call<{ ok: true }>("POST", `${j(id)}/plan-seen`),
    plan: (id = "current") => call<Plan>("GET", `${j(id)}/plan`),

    checkins: (id = "current", days = 30) => call<CheckinList>("GET", `${j(id)}/checkins?days=${days}`),
    checkin: (id: string, input: CheckinInput) => call<CheckinResult>("POST", `${j(id)}/checkins`, input),

    journey: async (id = "current") => {
      const v = await call<JourneyView>("GET", `${j(id)}/journey`);
      return { ...v, streak: streakOf(v.streak) };
    },
    comfort: (id = "current") => call<Comfort>("GET", `${j(id)}/comfort`),

    contact: (id = "current") => call<ContactInfo>("GET", `${j(id)}/contact`),
    messages: (id = "current") => call<{ messages: Message[] }>("GET", `${j(id)}/messages`),
    sendMessage: (id: string, body: string, kind: "message" | "question") => call<{ message: Message }>("POST", `${j(id)}/messages`, { body, kind }),

  };
}

export type Client = ReturnType<typeof createClient>;
