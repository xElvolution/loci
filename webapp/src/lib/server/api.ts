import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { one, q } from "./db";
import type { User } from "./auth";
import * as repo from "./repo";

/* Bearer-token API helpers for /api/v1 (the mobile patient app). */

const TOKEN_DAYS = 90;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "600",
};

export const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { ...CORS, "Cache-Control": "no-store" } });
export const noContent = () => new NextResponse(null, { status: 204, headers: CORS });
export const preflight = () => new NextResponse(null, { status: 204, headers: CORS });

const fail = (e: unknown) => {
  if (e instanceof ApiError) return json({ error: { code: e.code, message: e.message } }, e.status);
  console.error("api v1 error", e instanceof Error ? e.message : e);
  return json({ error: { code: "server_error", message: "Something went wrong. Try again in a moment." } }, 500);
};

/** Wraps a handler: turns ApiError into the documented error shape, anything else into a 500. */
export function handle<C>(fn: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      return fail(e);
    }
  };
}

export async function body<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    raw = {};
  }
  const p = schema.safeParse(raw ?? {});
  if (!p.success) throw new ApiError(400, "invalid", p.error.issues[0]?.message ?? "Check the request and try again.");
  return p.data;
}

export function ipOf(req: Request) {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

export async function issueToken(userId: string, opts: { expires?: Date; label?: string } = {}) {
  const token = `loci_${randomBytes(32).toString("base64url")}`;
  const expires = opts.expires ?? new Date(Date.now() + TOKEN_DAYS * 86400_000);
  await q("INSERT INTO api_tokens (id, user_id, label, expires_at) VALUES ($1, $2, $3, $4)", [sha256(token), userId, opts.label ?? "mobile", expires]);
  return { token, expires_at: expires.toISOString() };
}

export async function revokeToken(req: Request) {
  const t = bearer(req);
  if (t) await q("DELETE FROM api_tokens WHERE id = $1", [sha256(t)]);
}

function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(\S+)$/i.exec(h);
  return m ? m[1] : null;
}

export async function apiUser(req: Request): Promise<User & { demo_pair?: string | null }> {
  const t = bearer(req);
  if (!t) throw new ApiError(401, "unauthorized", "Sign in to continue.");
  const u = await one<User & { demo_pair: string | null }>(
    `UPDATE api_tokens t SET last_used_at = now() FROM users u
      WHERE t.id = $1 AND t.expires_at > now() AND u.id = t.user_id
      RETURNING u.id, u.email, u.display_name, u.timezone, u.role_pref, u.current_journey_id, u.is_demo, u.onboarded_at, u.tour_completed_at, u.created_at, u.demo_pair`,
    [sha256(t)],
  );
  if (!u) throw new ApiError(401, "unauthorized", "Your session has ended. Sign in again.");
  return u;
}

export const publicUser = (u: Pick<User, "id" | "display_name" | "email" | "timezone" | "role_pref" | "is_demo">) => ({
  id: u.id,
  display_name: u.display_name,
  email: u.email,
  timezone: u.timezone,
  role_pref: u.role_pref,
  is_demo: u.is_demo,
});

export type Ctx = { params: Promise<{ id: string }> };

/** The signed-in person plus a journey they are in. `current` means their current journey. Clinic access does not count here. */
export async function apiJourney(req: Request, ctx: Ctx) {
  const user = await apiUser(req);
  const { id } = await ctx.params;
  const journeyId = id === "current" ? user.current_journey_id : id;
  if (!journeyId) throw new ApiError(404, "no_journey", "There is no plan here yet. Enter the code from your care team.");
  if (!/^[0-9a-f-]{36}$/i.test(journeyId)) throw new ApiError(404, "not_found", "That journey was not found.");
  const access = await repo.accessFor(user.id, journeyId);
  if (!access || access.via !== "circle") throw new ApiError(404, "not_found", "That journey was not found.");
  const journey = await repo.getJourney(journeyId);
  if (!journey) throw new ApiError(404, "not_found", "That journey was not found.");
  return { user, access, journey };
}

/** Web pages for the patient and the clinic re-render after a write from the app. */
export function refreshWeb() {
  revalidatePath("/app", "layout");
  revalidatePath("/clinic", "layout");
}
