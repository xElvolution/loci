import { diffDays, weekdayOf } from "./dates";
import type { PlanItem, TaskLog } from "./types";

export type Dose = { item: PlanItem; slot: string; done: boolean };

export const RECURRING: PlanItem["kind"][] = ["medication", "care", "exercise"];

/** Is a recurring plan item active on this calendar date? */
export function activeOn(item: PlanItem, dischargeIso: string, dateIso: string): boolean {
  if (!RECURRING.includes(item.kind)) return false;
  const d = diffDays(dateIso, dischargeIso);
  if (d < item.start_day) return false;
  if (item.end_day !== null && item.end_day !== undefined && d > item.end_day) return false;
  if (item.weekdays && item.weekdays.length && !item.weekdays.includes(weekdayOf(dateIso))) return false;
  return true;
}

/** Every scheduled slot for a date. Items without times count once a day ("any"). */
export function dosesFor(items: PlanItem[], dischargeIso: string, dateIso: string, logs: TaskLog[]): Dose[] {
  const done = new Set(logs.filter((l) => l.for_date === dateIso).map((l) => `${l.item_id}|${l.slot}`));
  const out: Dose[] = [];
  for (const item of items) {
    if (!activeOn(item, dischargeIso, dateIso)) continue;
    const slots = item.times.length ? [...item.times].sort() : ["any"];
    for (const slot of slots) out.push({ item, slot, done: done.has(`${item.id}|${slot}`) });
  }
  return out.sort((a, b) => (a.slot === "any" ? "99" : a.slot).localeCompare(b.slot === "any" ? "99" : b.slot) || a.item.sort - b.item.sort);
}

export type Adherence = { scheduled: number; done: number; rate: number | null };

/** Share of scheduled slots marked done across the given dates. */
export function adherence(items: PlanItem[], dischargeIso: string, dates: string[], logs: TaskLog[], kinds: PlanItem["kind"][] = RECURRING): Adherence {
  let scheduled = 0;
  let done = 0;
  const pool = items.filter((i) => kinds.includes(i.kind));
  for (const d of dates) {
    const doses = dosesFor(pool, dischargeIso, d, logs);
    scheduled += doses.length;
    done += doses.filter((x) => x.done).length;
  }
  return { scheduled, done, rate: scheduled ? done / scheduled : null };
}

/** Consecutive days with a check-in ending today (or yesterday, so the streak survives until tonight). */
export function checkinStreak(dates: string[], todayIso: string): { current: number; best: number; doneToday: boolean } {
  const set = new Set(dates);
  const doneToday = set.has(todayIso);
  let current = 0;
  let cursor = doneToday ? todayIso : shift(todayIso, -1);
  while (set.has(cursor)) {
    current++;
    cursor = shift(cursor, -1);
  }
  const sorted = [...set].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && diffDays(d, prev) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current, best: Math.max(best, current), doneToday };
}

function shift(iso: string, n: number) {
  const t = Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) + n * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** Gentle levels earned from showing up, never from health values. */
export const BADGES = [
  { id: "first", days: 1, label: "First check-in" },
  { id: "three", days: 3, label: "Three days steady" },
  { id: "week", days: 7, label: "One week of check-ins" },
  { id: "fortnight", days: 14, label: "Two steady weeks" },
  { id: "month", days: 30, label: "A month of showing up" },
] as const;

export function earnedBadges(totalCheckins: number, best: number) {
  return BADGES.map((b) => ({ ...b, earned: (b.id === "first" ? totalCheckins : best) >= b.days }));
}
