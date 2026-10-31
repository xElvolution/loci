import { q } from "@/lib/server/db";
import * as repo from "@/lib/server/repo";
import { apiUser, handle, noContent, preflight, revokeToken } from "@/lib/server/api";

export const OPTIONS = preflight;
export const POST = handle(async (req: Request) => {
  const u = await apiUser(req);
  await revokeToken(req);
  if (u.is_demo) {
    // a demo ends with its sign-out: remove the paired clinician and every seeded journey
    if (u.demo_pair) {
      await q("DELETE FROM journeys WHERE created_by = $1", [u.demo_pair]).catch(() => undefined);
      await repo.deleteUser(u.demo_pair).catch(() => undefined);
    }
    await q("DELETE FROM journeys WHERE created_by = $1", [u.id]).catch(() => undefined);
    await repo.deleteUser(u.id).catch(() => undefined);
  }
  return noContent();
});
