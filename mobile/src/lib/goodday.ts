/**
 * The good-day plan: plan lines come from the care team's plan at the times it sets;
 * comfort lines come from Qloo picks. loci only arranges them and adds no clinical step.
 * Mirrors webapp/src/lib/care/goodday.ts on the client.
 */
import type { ComfortSections, Pick, TodayItem } from "./api/types";
import { prettyTime, slotMinutes } from "./format";

export type DayBlock = { key: string; minutes: number; time: string; source: "plan" | "comfort" | "checkin"; title: string; detail: string; pick?: Pick };

function seedFrom(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const rotate = <T,>(list: T[] | undefined, seed: number, k = 0): T | undefined => (list && list.length ? list[(seed + k) % list.length] : undefined);
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function composeGoodDay(opts: { date: string; personName: string; items: TodayItem[]; comfort: ComfortSections; checkinDone: boolean }): DayBlock[] {
  const seed = seedFrom(opts.date + opts.personName);
  const out: DayBlock[] = [];
  const add = (b: Omit<DayBlock, "time">) => out.push({ ...b, time: prettyTime(hhmm(b.minutes)) });

  const grouped = new Map<string, TodayItem[]>();
  for (const it of opts.items) grouped.set(it.slot, [...(grouped.get(it.slot) ?? []), it]);
  for (const [slot, list] of grouped) {
    const minutes = slot === "any" ? 11 * 60 + 30 : slotMinutes(slot);
    add({ key: `plan-${slot}`, minutes, source: "plan", title: list.map((i) => i.title).join(", "), detail: slot === "any" ? "Any time today, from your plan" : "From your plan, at the time your team set" });
  }
  if (!opts.checkinDone) add({ key: "checkin", minutes: 9 * 60 + 15, source: "checkin", title: "Daily check-in", detail: "Two minutes: mood, pain, sleep, appetite, energy" });

  const c = opts.comfort;
  const wake = rotate(c.soundtrack, seed);
  if (wake) add({ key: "wake", minutes: 8 * 60 + 30, source: "comfort", title: `Wake up slow with ${wake.name}`, detail: "Put it on low while the kettle boils", pick: wake });
  const meal = rotate(c.meals, seed);
  const cuisine = rotate(c.cuisines, seed);
  if (meal) add({ key: "lunch", minutes: 12 * 60 + 30, source: "comfort", title: `Lunch from ${meal.name}`, detail: `${meal.subtitle ?? "Near home"}. Check the menu against your plan's food notes`, pick: meal });
  else if (cuisine) add({ key: "lunch", minutes: 12 * 60 + 30, source: "comfort", title: `A ${cuisine.name.toLowerCase()} lunch`, detail: "A cuisine your taste leans toward. Check it against your plan's food notes" });
  const outing = rotate(c.outings, seed);
  const read = rotate(c.reading, seed);
  if (outing) add({ key: "outing", minutes: 15 * 60, source: "comfort", title: `A gentle visit to ${outing.name}`, detail: "Only as far and as long as your plan allows", pick: outing });
  else if (read) add({ key: "rest", minutes: 15 * 60, source: "comfort", title: `${read.kind === "podcast" ? "Listen to" : "Read a little of"} ${read.name}`, detail: "A quiet hour with your feet up", pick: read });
  const show = rotate(c.screen, seed);
  if (show) add({ key: "evening", minutes: 19 * 60 + 30, source: "comfort", title: `Evening in with ${show.name}`, detail: show.kind === "movie" ? "Film night from the sofa" : "One or two episodes, no more", pick: show });
  const wind = rotate(c.soundtrack, seed, 3);
  if (wind && wind.id !== wake?.id) add({ key: "wind", minutes: 21 * 60 + 30, source: "comfort", title: `Wind down with ${wind.name}`, detail: "Lights low, phone away", pick: wind });

  return out.sort((a, b) => a.minutes - b.minutes || (a.source === "plan" ? -1 : 1));
}
