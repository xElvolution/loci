import * as repo from "@/lib/server/repo";
import { howSteps } from "@/lib/care/describe";
import { apiJourney, handle, json, preflight, type Ctx } from "@/lib/server/api";

export const OPTIONS = preflight;
export const GET = handle(async (req: Request, ctx: Ctx) => {
  const { journey } = await apiJourney(req, ctx);
  const plan = await repo.planOf(journey.id);
  const iso = (d: Date | null) => (d ? new Date(d).toISOString() : null);
  return json({
    instructions: journey.instructions,
    sent_at: iso(journey.plan_sent_at),
    updated_at: iso(journey.plan_updated_at),
    items: plan.items.map((i) => ({ id: i.id, kind: i.kind, title: i.title, detail: i.detail, why: i.why ?? "", how: howSteps(i.how), times: i.times, weekdays: i.weekdays, start_day: i.start_day, end_day: i.end_day, day: i.day, at_time: i.at_time, location: i.location })),
    warning_signs: plan.signs.map((s) => ({ id: s.id, text: s.text, action: s.action })),
  });
});
