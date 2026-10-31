import * as repo from "@/lib/server/repo";
import { ApiError, apiJourney, body, handle, json, preflight, refreshWeb, type Ctx } from "@/lib/server/api";
import { checkinFields, recordCheckin } from "@/lib/server/patient-service";
import { addDays, todayIn } from "@/lib/care/dates";

export const OPTIONS = preflight;
export const GET = handle(async (req: Request, ctx: Ctx) => {
  const { journey } = await apiJourney(req, ctx);
  const days = Math.min(90, Math.max(1, Number(new URL(req.url).searchParams.get("days")) || 30));
  const today = todayIn(journey.timezone);
  const rows = await repo.checkinsBetween(journey.id, addDays(today, -(days - 1)), today);
  return json({
    today_done: rows.some((r) => r.for_date === today),
    checkins: rows.sort((a, b) => a.for_date.localeCompare(b.for_date)).map((c) => ({ for_date: c.for_date, mood: c.mood, pain: c.pain, sleep: c.sleep, appetite: c.appetite, energy: c.energy, signs: c.signs, note: c.note })),
  });
});

export const POST = handle(async (req: Request, ctx: Ctx) => {
  const { user, access, journey } = await apiJourney(req, ctx);
  if (!access.canCheckIn) throw new ApiError(403, "forbidden", "Only the patient and their caregivers can check in.");
  const input = await body(req, checkinFields);
  const { flags, streak } = await recordCheckin(journey, user.id, input);
  refreshWeb();
  const top = flags.find((f) => f.action === "emergency") ?? flags[0];
  const escalation = top
    ? {
        action: top.action,
        message: top.action === "emergency" ? "Your care team asked you to call the emergency number if this happens." : "Your care team asked you to contact them about this.",
        care_team_phone: journey.care_team_phone,
        emergency_number: journey.emergency_number,
      }
    : null;
  return json({ flags: flags.map((f) => ({ source: f.source, action: f.action, reason: f.reason })), streak, escalation }, 201);
});
