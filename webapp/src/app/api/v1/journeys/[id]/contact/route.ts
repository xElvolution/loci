import { apiJourney, handle, json, preflight, type Ctx } from "@/lib/server/api";
import { contactView } from "@/lib/server/api-views";

export const OPTIONS = preflight;
export const GET = handle(async (req: Request, ctx: Ctx) => {
  const { journey } = await apiJourney(req, ctx);
  return json({ ...contactView(journey), team_on_loci: !!journey.org_id, sharing_with_team: !!journey.org_id && journey.consent_org });
});
