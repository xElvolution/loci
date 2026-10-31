import "server-only";
import { createHash } from "node:crypto";
import { q } from "./db";
import { cleanParams, QlooUnavailableError, type QlooParams, type QlooResponse, type QlooTransport } from "@/lib/qloo/transport";

const BASE = (process.env.QLOO_BASE_URL || "https://hackathon.api.qloo.com").replace(/\/$/, "");
const TIMEOUT_MS = 12_000;
const MAX_CONCURRENCY = 4;
/** Cache lifetimes: entity lookups are stable, trending changes weekly. */
const TTL_SECONDS: Record<string, number> = { "/search": 30 * 86400, "/v2/trending": 86400, default: 7 * 86400 };

export function qlooConfigured(): boolean {
  return Boolean(process.env.QLOO_API_KEY);
}

let active = 0;
const waiters: (() => void)[] = [];
async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENCY) await new Promise<void>((r) => waiters.push(r));
  active++;
  try {
    return await fn();
  } finally {
    active--;
    waiters.shift()?.();
  }
}

const inflight = new Map<string, Promise<QlooResponse>>();

function cacheKey(method: string, path: string, payload: unknown) {
  return createHash("sha256").update(`${method} ${path} ${JSON.stringify(payload)}`).digest("hex");
}

async function readCache(key: string): Promise<{ status: number; body: unknown } | null> {
  try {
    const rows = await q<{ status: number; body: unknown }>("SELECT status, body FROM qloo_cache WHERE key = $1 AND expires_at > now()", [key]);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function writeCache(key: string, status: number, body: unknown, ttl: number) {
  try {
    await q(
      `INSERT INTO qloo_cache (key, status, body, expires_at) VALUES ($1, $2, $3, now() + make_interval(secs => $4))
       ON CONFLICT (key) DO UPDATE SET status = EXCLUDED.status, body = EXCLUDED.body, created_at = now(), expires_at = EXCLUDED.expires_at`,
      [key, status, JSON.stringify(body), ttl],
    );
  } catch {
    /* cache is best effort */
  }
}

async function send(method: "GET" | "POST", path: string, payload: Record<string, string> | Record<string, unknown>): Promise<QlooResponse> {
  const key = process.env.QLOO_API_KEY;
  if (!key) throw new QlooUnavailableError();
  const ck = cacheKey(method, path, payload);
  const hit = await readCache(ck);
  if (hit) return { status: hit.status, body: hit.body, ms: 0, cached: true };
  const existing = inflight.get(ck);
  if (existing) return existing;

  const run = slot(async () => {
    const started = Date.now();
    let attempt = 0;
    for (;;) {
      attempt++;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      try {
        const url = method === "GET" ? `${BASE}${path}?${new URLSearchParams(payload as Record<string, string>).toString()}` : `${BASE}${path}`;
        const res = await fetch(url, {
          method,
          headers: { "X-Api-Key": key, Accept: "application/json", ...(method === "POST" ? { "Content-Type": "application/json" } : {}) },
          body: method === "POST" ? JSON.stringify(payload) : undefined,
          signal: ctrl.signal,
          cache: "no-store",
        });
        const text = await res.text();
        let body: unknown = null;
        try {
          body = text ? JSON.parse(text) : null;
        } catch {
          body = { error: "non-json response" };
        }
        if ((res.status === 429 || res.status >= 500) && attempt < 3) {
          const retryAfter = Number(res.headers.get("retry-after"));
          await new Promise((r) => setTimeout(r, Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 4000) : 400 * attempt * attempt));
          continue;
        }
        const out: QlooResponse = { status: res.status, body, ms: Date.now() - started, cached: false };
        if (res.ok) await writeCache(ck, res.status, body, TTL_SECONDS[path] ?? TTL_SECONDS.default);
        return out;
      } catch (e) {
        if (attempt < 2 && !(e instanceof QlooUnavailableError)) continue;
        return { status: 0, body: { error: e instanceof Error ? e.name : "network" }, ms: Date.now() - started, cached: false };
      } finally {
        clearTimeout(timer);
      }
    }
  });
  inflight.set(ck, run);
  try {
    return await run;
  } finally {
    inflight.delete(ck);
  }
}

export const httpTransport: QlooTransport = {
  get: (path: string, params: QlooParams) => send("GET", path, cleanParams(params)),
  post: (path: string, body: Record<string, unknown>) => send("POST", path, body),
};
