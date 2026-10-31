/**
 * A personalized good-day plan. Plan lines (medicines, care, exercises, appointments)
 * come straight from the discharge plan at the times it sets. Comfort lines come from
 * Qloo picks. loci only arranges them; it adds no clinical step of its own.
 */
import type { ComfortSections, Pick } from "./comfort";
import { prettyTime } from "./dates";
import type { Dose } from "./schedule";
import type { PlanItem } from "./types";

export type DayBlock = {
  key: string;
  minutes: number;
  time: string;
  source: "plan" | "comfort" | "checkin";
  kind: string;
  title: string;
  detail: string;
  pick?: Pick;
};

function seedFrom(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rotate<T>(list: T[], seed: number, k = 0): T | undefined {
  return list.length ? list[(seed + k) % list.length] : undefined;
}
const mins = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

export function composeGoodDay(opts: {
  dateIso: string;
  personName: string;
  doses: Dose[];
  appointments: PlanItem[];
  comfort: ComfortSections;
  outingsOk: boolean;
}): DayBlock[] {
  const seed = seedFrom(opts.dateIso + opts.personName);
  const out: DayBlock[] = [];
  const add = (b: Omit<DayBlock, "time">) => out.push({ ...b, time: prettyTime(`${String(Math.floor(b.minutes / 60)).padStart(2, "0")}:${String(b.minutes % 60).padStart(2, "0")}`) });

  // plan lines, exactly as entered
  const grouped = new Map<string, Dose[]>();
  for (const d of opts.doses) {
    const key = d.slot === "any" ? "any" : d.slot;
    grouped.set(key, [...(grouped.get(key) ?? []), d]);
  }
  for (const [slot, ds] of grouped) {
    const minutes = slot === "any" ? 11 * 60 + 30 : mins(slot);
    add({
      key: `plan-${slot}`,
      minutes,
      source: "plan",
      kind: ds[0].item.kind,
      title: ds.map((d) => d.item.title).join(", "),
      detail: slot === "any" ? "Any time today, from your plan" : "From your plan, at the time your team set",
    });
  }
  for (const a of opts.appointments) {
    add({ key: `appt-${a.id}`, minutes: a.at_time ? mins(a.at_time) : 10 * 60, source: "plan", kind: "appointment", title: a.title, detail: a.location || "Appointment from your plan" });
  }

  add({ key: "checkin", minutes: 9 * 60 + 15, source: "checkin", kind: "checkin", title: "Daily check-in", detail: "Two minutes: mood, pain, sleep, appetite, energy" });

  const c = opts.comfort;
  const wake = rotate(c.soundtrack, seed);
  if (wake) add({ key: "wake", minutes: 8 * 60 + 30, source: "comfort", kind: "artist", title: `Wake up slow with ${wake.name}`, detail: "Put it on low while the kettle boils", pick: wake });
  const meal = rotate(c.meals, seed);
  const cuisine = rotate(c.cuisines, seed);
  if (meal) add({ key: "lunch", minutes: 12 * 60 + 30, source: "comfort", kind: "meal", title: `Lunch from ${meal.name}`, detail: `${meal.subtitle ?? "Near home"}. Check the menu against your plan's food notes`, pick: meal });
  else if (cuisine) add({ key: "lunch", minutes: 12 * 60 + 30, source: "comfort", kind: "meal", title: `A ${cuisine.name.toLowerCase()} lunch`, detail: "A cuisine your taste leans toward. Check it against your plan's food notes" });

  const outing = opts.outingsOk ? rotate(c.outings, seed) : undefined;
  const read = rotate(c.reading, seed);
  if (outing) add({ key: "outing", minutes: 15 * 60, source: "comfort", kind: "outing", title: `A gentle visit to ${outing.name}`, detail: "Only as far and as long as your plan allows", pick: outing });
  else if (read) add({ key: "rest", minutes: 15 * 60, source: "comfort", kind: read.kind, title: `${read.kind === "podcast" ? "Listen to" : "Read a little of"} ${read.name}`, detail: "A quiet hour with your feet up", pick: read });

  const show = rotate(c.screen, seed);
  if (show) add({ key: "evening", minutes: 19 * 60 + 30, source: "comfort", kind: show.kind, title: `Evening in with ${show.name}`, detail: show.kind === "movie" ? "Film night from the sofa" : "One or two episodes, no more", pick: show });
  const wind = rotate(c.soundtrack, seed, 3);
  if (wind && wind.id !== wake?.id) add({ key: "wind", minutes: 21 * 60 + 30, source: "comfort", kind: "artist", title: `Wind down with ${wind.name}`, detail: "Lights low, phone away", pick: wind });

  return out.sort((a, b) => a.minutes - b.minutes || (a.source === "plan" ? -1 : 1));
}

export type Ritual = { key: string; title: string; line: string; pick?: Pick };

/** Welcome-home rituals for the share card. No health detail ever appears here. */
export function composeRituals(personName: string, c: ComfortSections): Ritual[] {
  const out: Ritual[] = [];
  const [a1, a2] = c.soundtrack;
  if (a1) out.push({ key: "arrival", title: "Arrival soundtrack", line: `${a1.name}${a2 ? ` then ${a2.name}` : ""} playing as ${personName} walks in`, pick: a1 });
  const meal = c.meals[0];
  const cuisine = c.cuisines[0];
  if (meal) out.push({ key: "meal", title: "First meal home", line: `Something from ${meal.name}, ordered in`, pick: meal });
  else if (cuisine) out.push({ key: "meal", title: "First meal home", line: `A ${cuisine.name.toLowerCase()} dinner, the way ${personName} likes it` });
  const show = c.screen[0];
  if (show) out.push({ key: "night", title: "First night in", line: `${show.name} on the sofa, blanket ready`, pick: show });
  const read = c.reading[0];
  if (read) out.push({ key: "bedside", title: "On the bedside table", line: read.name, pick: read });
  const outing = c.outings[0];
  if (outing) out.push({ key: "outing", title: "First outing, when the time is right", line: `A slow visit to ${outing.name}`, pick: outing });
  return out;
}
