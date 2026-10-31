import "server-only";
import { redirect } from "next/navigation";
import { requireUser, type User } from "./auth";
import { activityOf, checkinsBetween, circleTasks, currentJourney, flagsOf, listJourneys, logsBetween, membersOf, orgsOf, planOf, tasteOf, type Access, type Journey } from "./repo";
import { addDays, dayNumber, rangeDays, todayIn } from "@/lib/care/dates";
import { adherence, checkinStreak, dosesFor } from "@/lib/care/schedule";

/** Signed-in user with a journey in view, or the right redirect. */
export async function requireJourney(next = "/app"): Promise<{ user: User; journey: Journey; access: Access }> {
  const user = await requireUser(next);
  const cur = await currentJourney(user);
  if (!cur) {
    const orgs = await orgsOf(user.id);
    redirect(orgs.length ? "/clinic" : "/app/onboarding");
  }
  return { user, ...cur };
}

export async function journeyOverview(journey: Journey) {
  const today = todayIn(journey.timezone);
  const from = addDays(today, -59);
  const [plan, logs, checkins, flags, members, tasks, activity, taste] = await Promise.all([
    planOf(journey.id),
    logsBetween(journey.id, from, today),
    checkinsBetween(journey.id, from, today),
    flagsOf(journey.id, 20),
    membersOf(journey.id),
    circleTasks(journey.id),
    activityOf(journey.id, 12),
    tasteOf(journey.id),
  ]);
  const day = dayNumber(journey.discharge_date, today);
  const doses = dosesFor(plan.items, journey.discharge_date, today, logs);
  const week = rangeDays(today, 7).filter((d) => d >= journey.discharge_date);
  const adh7 = adherence(plan.items, journey.discharge_date, week, logs);
  const streak = checkinStreak(checkins.map((c) => c.for_date), today);
  const todayCheckin = checkins.find((c) => c.for_date === today) ?? null;
  const appointments = plan.items.filter((i) => i.kind === "appointment" && i.day !== null).sort((a, b) => (a.day ?? 0) - (b.day ?? 0) || (a.at_time ?? "").localeCompare(b.at_time ?? ""));
  const nextAppointment = appointments.find((a) => (a.day ?? 0) >= day) ?? null;
  const milestones = plan.items.filter((i) => i.kind === "milestone").sort((a, b) => (a.day ?? 9999) - (b.day ?? 9999) || a.sort - b.sort);
  const nextMilestone = milestones.find((m) => !m.reached_at) ?? null;
  const openFlags = flags.filter((f) => !f.ack_at);
  return { today, day, plan, logs, checkins, flags, openFlags, members, tasks, activity, taste, doses, adh7, streak, todayCheckin, appointments, nextAppointment, milestones, nextMilestone };
}

export type Overview = Awaited<ReturnType<typeof journeyOverview>>;

export async function navContext(user: User) {
  const [journeys, orgs] = await Promise.all([listJourneys(user.id), orgsOf(user.id)]);
  return { journeys: journeys.map((j) => ({ id: j.id, name: j.person_name, specialty: j.specialty })), orgs };
}
