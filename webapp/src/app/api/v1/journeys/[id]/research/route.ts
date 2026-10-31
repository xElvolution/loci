import { z } from "zod";
import { setResearchConsent } from "@/lib/server/research";
import { ApiError, apiJourney, body, handle, json, preflight, refreshWeb, type Ctx } from "@/lib/server/api";
import type { Journey, Access } from "@/lib/server/repo";

export const OPTIONS = preflight;

function view(journey: Journey, access: Access, on = journey.research_consent) {
  const reason = !journey.org_id ? "no_team" : !access.isOwner ? "not_owner" : !journey.consent_org ? "not_sharing" : null;
  return { research_consent: on, can_change: reason === null || (on && access.isOwner), reason, k: 10 };
}

export const GET = handle(async (req: Request, ctx: Ctx) => {
  const { journey, access } = await apiJourney(req, ctx);
  return json(view(journey, access));
});

/** Body `{ granted: boolean }`. Separate from team sharing; owner only; needs team sharing to switch on. */
export const PUT = handle(async (req: Request, ctx: Ctx) => {
  const { user, journey, access } = await apiJourney(req, ctx);
  const { granted } = await body(req, z.object({ granted: z.boolean() }));
  if (!access.isOwner) throw new ApiError(403, "not_owner", "Only the person or their main caregiver can change research consent.");
  if (!journey.org_id) throw new ApiError(409, "no_team", "Research applies only to plans from a care team on loci.");
  if (granted && !journey.consent_org) throw new ApiError(409, "not_sharing", "Share with the care team first. Research uses only data the team can already see.");
  await setResearchConsent(journey.id, user.id, granted);
  refreshWeb();
  return json(view(journey, access, granted));
});
