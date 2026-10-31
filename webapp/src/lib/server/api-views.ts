import "server-only";
import * as repo from "./repo";
import { journeyOverview } from "./journey-service";
import { addDays } from "@/lib/care/dates";
import { howSteps } from "@/lib/care/describe";
import { specialtyOf } from "@/lib/care/specialties";
import type { PlanItem } from "@/lib/care/types";

/* JSON shapes for /api/v1, documented in mobile-api.md and docs/content/api.md. */

const appt = (i: PlanItem, discharge: string) => ({ title: i.title, date: i.day === null ? null : addDays(discharge, i.day), time: i.at_time, location: i.location });

export async function todayView(journey: repo.Journey, userId: string) {
  const o = await journeyOverview(journey);
  const since = await repo.planSeenAt(journey.id, userId);
  const updates = since ? await repo.planUpdatesSince(journey.id, since) : [];
  return {
    date: o.today,
    day: o.day,
    person_name: journey.person_name,
    specialty: journey.specialty,
    specialty_label: specialtyOf(journey.specialty).label,
    items: o.doses.map((d) => ({ item_id: d.item.id, slot: d.slot, kind: d.item.kind, title: d.item.title, detail: d.item.detail, why: d.item.why ?? "", how: howSteps(d.item.how), done: d.done })),
    progress: { done: o.doses.filter((d) => d.done).length, total: o.doses.length },
    checkin_done: !!o.todayCheckin,
    streak: o.streak,
    next_appointment: o.nextAppointment ? appt(o.nextAppointment, journey.discharge_date) : null,
    plan_update: updates.length ? { at: new Date(updates[0].created_at).toISOString(), text: updates.map((u) => u.text).join("\n") } : null,
    open_flags: o.openFlags.length,
    contact: contactView(journey),
  };
}

export async function progressView(journey: repo.Journey) {
  const o = await journeyOverview(journey);
  return { done: o.doses.filter((d) => d.done).length, total: o.doses.length };
}

export function contactView(journey: repo.Journey) {
  return { care_team_name: journey.care_team_name, care_team_phone: journey.care_team_phone, emergency_number: journey.emergency_number };
}

export async function journeyView(journey: repo.Journey) {
  const o = await journeyOverview(journey);
  const from = addDays(o.today, -29);
  return {
    day: o.day,
    horizon_days: journey.horizon_days,
    discharge_date: journey.discharge_date,
    streak: o.streak,
    adherence_7d: o.adh7.rate,
    milestones: o.milestones.map((m) => ({ id: m.id, title: m.title, day: m.day, reached: !!m.reached_at })),
    appointments: o.appointments.map((a) => appt(a, journey.discharge_date)),
    trends: o.checkins.filter((c) => c.for_date >= from).sort((a, b) => a.for_date.localeCompare(b.for_date)).map((c) => ({ date: c.for_date, mood: c.mood, pain: c.pain, sleep: c.sleep, appetite: c.appetite, energy: c.energy })),
  };
}

export const messageView = (m: repo.Message) => ({ id: m.id, side: m.side, kind: m.kind, body: m.body, created_at: new Date(m.created_at).toISOString(), resolved_at: m.resolved_at ? new Date(m.resolved_at).toISOString() : null, name: m.name });
