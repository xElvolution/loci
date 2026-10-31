import { z } from "zod";
import * as repo from "@/lib/server/repo";
import { q } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/rate-limit";
import { ApiError, apiUser, body, handle, ipOf, json, preflight, refreshWeb } from "@/lib/server/api";

const schema = z.object({ code: z.string().min(4).max(60), share_with_team: z.boolean().default(true) });

export const OPTIONS = preflight;
export const POST = handle(async (req: Request) => {
  const u = await apiUser(req);
  const p = await body(req, schema);
  if (!rateLimit(`redeem:${ipOf(req)}`, 20, 600_000).ok) throw new ApiError(429, "rate_limited", "Too many tries. Wait a few minutes.");
  const c = repo.normalizeCode(p.code);
  const inv = /^[A-Za-z0-9]{4,40}$/.test(c) ? await repo.getInvite(c) : null;
  if (!inv || !inv.journey_id || inv.revoked_at || new Date(inv.expires_at) < new Date() || inv.uses >= inv.max_uses)
    throw new ApiError(404, "invalid_code", "That code is not valid or has expired. Ask your care team for a new one.");
  try {
    const r = await repo.acceptInvite(inv, u.id, p.share_with_team);
    await q("UPDATE users SET onboarded_at = COALESCE(onboarded_at, now()) WHERE id = $1", [u.id]);
    refreshWeb();
    return json({ journey_id: r.journeyId }, 201);
  } catch {
    throw new ApiError(409, "invalid_code", "That code was just used or has expired. Ask your care team for a new one.");
  }
});
