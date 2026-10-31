import { z } from "zod";
import { one } from "@/lib/server/db";
import { createDemoWorld } from "@/lib/server/demo";
import { rateLimit } from "@/lib/server/rate-limit";
import { ApiError, body, handle, ipOf, issueToken, json, preflight, publicUser } from "@/lib/server/api";
import type { User } from "@/lib/server/auth";

const schema = z.object({ timezone: z.string().max(64).optional() });

export const OPTIONS = preflight;
export const POST = handle(async (req: Request) => {
  const p = await body(req, schema);
  if (!rateLimit(`demo:${ipOf(req)}`, Number(process.env.DEMO_RATE_PER_HOUR) || 12, 3600_000).ok) throw new ApiError(429, "rate_limited", "The demo is busy. Try again in a few minutes.");
  let tz = "America/New_York";
  try {
    if (p.timezone) {
      new Intl.DateTimeFormat("en", { timeZone: p.timezone });
      tz = p.timezone;
    }
  } catch {}
  const ids = await createDemoWorld("daniel", tz);
  const u = await one<User>("SELECT id, display_name, email, timezone, role_pref, is_demo FROM users WHERE id = $1", [ids.patient]);
  return json({ ...(await issueToken(ids.patient, { expires: ids.expires, label: "demo" })), user: publicUser(u!) }, 201);
});
