import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { hash, verify } from "@node-rs/argon2";
import { one, q } from "./db";

export const SESSION_COOKIE = "loci_care_session";
const SESSION_DAYS = 30;

export type User = {
  id: string;
  email: string | null;
  display_name: string;
  timezone: string;
  role_pref: "patient" | "caregiver" | "clinician";
  current_journey_id: string | null;
  is_demo: boolean;
  onboarded_at: Date | null;
  tour_completed_at: Date | null;
  created_at: Date;
};

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function hashPassword(pw: string) {
  // argon2id with OWASP-recommended parameters
  return hash(pw, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
}

export async function verifyPassword(stored: string, pw: string) {
  try {
    return await verify(stored, pw);
  } catch {
    return false;
  }
}

export async function createSession(userId: string, days = SESSION_DAYS) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + days * 86400_000);
  await q("INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)", [sha256(token), userId, expires]);
  const jar = await cookies();
  const h = await headers();
  const secure = (h.get("x-forwarded-proto") ?? "").includes("https") || process.env.NODE_ENV === "production";
  jar.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure, path: "/", expires });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await q("DELETE FROM sessions WHERE id = $1", [sha256(token)]);
  jar.delete(SESSION_COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return one<User>(
    `SELECT u.id, u.email, u.display_name, u.timezone, u.role_pref, u.current_journey_id, u.is_demo, u.onboarded_at, u.tour_completed_at, u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = $1 AND s.expires_at > now()`,
    [sha256(token)],
  );
}

/** For pages: signed-in user or redirect to sign in (preserving destination). */
export async function requireUser(next?: string): Promise<User> {
  const u = await currentUser();
  if (!u) redirect(next ? `/app/signin?next=${encodeURIComponent(next)}` : "/app/signin");
  return u;
}

/** For pages that need a finished onboarding. */
export async function requireOnboardedUser(next?: string): Promise<User> {
  const u = await requireUser(next);
  if (!u.onboarded_at) redirect("/app/onboarding");
  return u;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
}

/** Only allow same-site relative redirects. */
export function safeNext(next: unknown, fallback = "/app"): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
