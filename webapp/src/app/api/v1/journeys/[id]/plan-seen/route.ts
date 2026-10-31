import * as repo from "@/lib/server/repo";
import { apiJourney, handle, json, preflight, refreshWeb, type Ctx } from "@/lib/server/api";

export const OPTIONS = preflight;
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const { user, journey } = await apiJourney(req, ctx);
  await repo.markPlanSeen(journey.id, user.id);
  refreshWeb();
  return json({ ok: true });
});
