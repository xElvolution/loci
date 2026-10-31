import { apiJourney, handle, json, preflight, type Ctx } from "@/lib/server/api";
import { todayView } from "@/lib/server/api-views";

export const OPTIONS = preflight;
export const GET = handle(async (req: Request, ctx: Ctx) => {
  const { user, journey } = await apiJourney(req, ctx);
  return json(await todayView(journey, user.id));
});
