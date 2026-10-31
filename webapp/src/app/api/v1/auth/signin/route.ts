import { z } from "zod";
import { one } from "@/lib/server/db";
import { hashPassword, verifyPassword } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rate-limit";
import { ApiError, body, handle, ipOf, issueToken, json, preflight, publicUser } from "@/lib/server/api";

const schema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(200), password: z.string().min(1, "Enter your password.").max(200) });

export const OPTIONS = preflight;
export const POST = handle(async (req: Request) => {
  const { email, password } = await body(req, schema);
  if (!rateLimit(`signin:${ipOf(req)}`, 20, 600_000).ok || !rateLimit(`signin:${email}`, 8, 600_000).ok) throw new ApiError(429, "rate_limited", "Too many attempts. Wait a few minutes and try again.");
  const u = await one<{ id: string; password_hash: string | null; display_name: string; email: string; timezone: string; role_pref: "patient" | "caregiver" | "clinician"; is_demo: boolean }>(
    "SELECT id, password_hash, display_name, email, timezone, role_pref, is_demo FROM users WHERE lower(email) = $1",
    [email],
  );
  const ok = u?.password_hash ? await verifyPassword(u.password_hash, password) : await hashPassword("timing-equalizer").then(() => false);
  if (!u || !ok) throw new ApiError(401, "bad_credentials", "That email and password do not match.");
  if (u.role_pref === "clinician") throw new ApiError(403, "clinician_account", "This is a clinician account. Use the loci clinician workspace on the web.");
  return json({ ...(await issueToken(u.id)), user: publicUser(u) });
});
