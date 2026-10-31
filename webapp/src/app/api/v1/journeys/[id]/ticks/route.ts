import { z } from "zod";
import { ApiError, apiJourney, body, handle, json, preflight, refreshWeb, type Ctx } from "@/lib/server/api";
import { progressView } from "@/lib/server/api-views";
import { recordTick } from "@/lib/server/patient-service";
import { todayIn } from "@/lib/care/dates";

const schema = z.object({ item_id: z.string().uuid("Unknown plan item."), slot: z.string().max(5), done: z.boolean(), date: z.string().max(10).optional() });

export const OPTIONS = preflight;
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const { user, access, journey } = await apiJourney(req, ctx);
  if (!access.canCheckIn) throw new ApiError(403, "forbidden", "Only the patient and their caregivers can tick off the plan.");
  const p = await body(req, schema);
  const err = await recordTick(journey, user.id, { itemId: p.item_id, slot: p.slot, done: p.done, date: p.date ?? todayIn(journey.timezone) });
  if (err) throw new ApiError(400, "invalid", err);
  refreshWeb();
  return json({ ok: true, progress: await progressView(journey) });
});
