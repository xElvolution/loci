import { exportUser } from "@/lib/server/repo";
import { rateLimit } from "@/lib/server/rate-limit";
import { ApiError, apiUser, handle, json, preflight } from "@/lib/server/api";

export const OPTIONS = preflight;
/** Everything loci holds about the signed-in person and their circles, as JSON. */
export const GET = handle(async (req: Request) => {
  const u = await apiUser(req);
  if (!rateLimit(`export:${u.id}`, 10, 3600_000).ok) throw new ApiError(429, "rate_limited", "Too many exports. Try again later.");
  return json(await exportUser(u.id));
});
