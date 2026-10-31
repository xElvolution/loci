import "server-only";
import { z } from "zod";
import * as repo from "./repo";
import { addDays, isTime, todayIn } from "@/lib/care/dates";
import { evaluate } from "@/lib/care/rules";
import type { FlagResult } from "@/lib/care/types";

/* Patient-side writes shared by the web server actions and the mobile API, so both follow the same rules. */

const scale = (min: number, max: number) => z.number().int().min(min).max(max);
export const checkinFields = z.object({
  mood: scale(1, 5),
  pain: scale(0, 10),
  sleep: scale(1, 5),
  appetite: scale(1, 5),
  energy: scale(1, 5),
  signs: z.array(z.string().uuid()).max(30).default([]),
  note: z.string().max(600).default(""),
});
export type CheckinInput = z.infer<typeof checkinFields>;

export async function recordCheckin(journey: repo.Journey, userId: string, input: CheckinInput): Promise<{ flags: FlagResult[]; streak: number }> {
  const today = todayIn(journey.timezone);
  const plan = await repo.planOf(journey.id);
  const known = new Set(plan.signs.map((s) => s.id));
  const c = { for_date: today, mood: input.mood, pain: input.pain, sleep: input.sleep, appetite: input.appetite, energy: input.energy, signs: input.signs.filter((s) => known.has(s)), note: input.note.trim() };
  const history = await repo.checkinsBetween(journey.id, addDays(today, -8), addDays(today, -1));
  const flags = evaluate(c, history, plan.thresholds, plan.signs);
  await repo.saveCheckin(journey.id, userId, c, flags);
  const dates = new Set([...history.map((h) => h.for_date), today]);
  let streak = 0;
  for (let d = today; dates.has(d); d = addDays(d, -1)) streak++;
  return { flags, streak };
}

/** Returns an error message, or null when the tick was saved. */
export async function recordTick(journey: repo.Journey, userId: string, t: { itemId: string; date: string; slot: string; done: boolean }): Promise<string | null> {
  const today = todayIn(journey.timezone);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t.date) || t.date > today || t.date < addDays(today, -2)) return "You can only update today and the two days before.";
  if (t.slot !== "any" && !isTime(t.slot)) return "Unknown time slot.";
  const plan = await repo.planOf(journey.id);
  if (!plan.items.some((i) => i.id === t.itemId)) return "That plan item was not found.";
  await repo.setTaskDone(journey.id, t.itemId, t.date, t.slot, userId, t.done);
  return null;
}

/** Returns an error message, or null when the message was sent. */
export async function patientMessage(journey: repo.Journey, userId: string, access: repo.Access, body: string, kind: "message" | "question"): Promise<string | null> {
  const text = body.trim();
  if (!text) return "Write a message first.";
  if (text.length > 2000) return "Keep it under 2000 characters.";
  if (access.via === "circle" && access.role === "family") return "Messages to the care team come from the patient or main caregivers.";
  await repo.addMessage(journey.id, userId, "patient", kind, text);
  return null;
}
