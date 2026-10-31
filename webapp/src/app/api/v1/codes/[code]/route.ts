import * as repo from "@/lib/server/repo";
import { one } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/rate-limit";
import { ApiError, apiUser, handle, ipOf, json, preflight } from "@/lib/server/api";

export const OPTIONS = preflight;
export const GET = handle(async (req: Request, ctx: { params: Promise<{ code: string }> }) => {
  await apiUser(req);
  if (!rateLimit(`redeem:${ipOf(req)}`, 20, 600_000).ok) throw new ApiError(429, "rate_limited", "Too many tries. Wait a few minutes.");
  const c = repo.normalizeCode(decodeURIComponent((await ctx.params).code));
  const inv = /^[A-Za-z0-9]{4,40}$/.test(c) ? await repo.getInvite(c) : null;
  if (!inv || !inv.journey_id || inv.revoked_at || new Date(inv.expires_at) < new Date() || inv.uses >= inv.max_uses)
    throw new ApiError(404, "invalid_code", "That code is not valid or has expired. Ask your care team for a new one.");
  const j = await one<{ person_name: string; care_team_name: string; org_name: string | null }>(
    "SELECT j.person_name, j.care_team_name, o.name AS org_name FROM journeys j LEFT JOIN orgs o ON o.id = j.org_id WHERE j.id = $1",
    [inv.journey_id],
  );
  return json({ valid: true, care_team_name: j?.org_name || j?.care_team_name || "", person_name: j?.person_name ?? "", role: inv.role });
});
