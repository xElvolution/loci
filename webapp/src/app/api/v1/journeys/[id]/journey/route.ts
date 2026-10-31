import { apiJourney, handle, json, preflight, type Ctx } from "@/lib/server/api";
import { journeyView } from "@/lib/server/api-views";

export const OPTIONS = preflight;
export const GET = handle(async (req: Request, ctx: Ctx) => {
  const { journey } = await apiJourney(req, ctx);
  return json(await journeyView(journey));
});
