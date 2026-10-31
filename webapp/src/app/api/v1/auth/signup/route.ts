import { z } from "zod";
import { one } from "@/lib/server/db";
import { hashPassword } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rate-limit";
import { ApiError, body, handle, ipOf, issueToken, json, preflight, publicUser } from "@/lib/server/api";

const tz = (s: string | undefined) => {
  try {
    if (s) new Intl.DateTimeFormat("en", { timeZone: s });
    return s || "UTC";
  } catch {
    return "UTC";
  }
};
const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(200),
  password: z.string().min(10, "Use at least 10 characters.").max(200),
  name: z.string().trim().min(1, "Add your first name or a nickname.").max(40),
  timezone: z.string().max(64).optional(),
});

export const OPTIONS = preflight;
export const POST = handle(async (req: Request) => {
  const p = await body(req, schema);
  if (!rateLimit(`signup:${ipOf(req)}`, 10, 3600_000).ok) throw new ApiError(429, "rate_limited", "Too many new accounts from here. Try again later.");
  const exists = await one("SELECT 1 FROM users WHERE lower(email) = $1", [p.email]);
  if (exists) throw new ApiError(409, "email_taken", "That email already has an account. Sign in instead.");
  const u = await one<{ id: string; display_name: string; email: string; timezone: string; role_pref: "caregiver"; is_demo: boolean }>(
    "INSERT INTO users (email, display_name, password_hash, timezone, role_pref) VALUES ($1,$2,$3,$4,'caregiver') RETURNING id, display_name, email, timezone, role_pref, is_demo",
    [p.email, p.name, await hashPassword(p.password), tz(p.timezone)],
  );
  return json({ ...(await issueToken(u!.id)), user: publicUser(u!) }, 201);
});
