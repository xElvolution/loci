import { addDays, prettyDate, prettyTime } from "./dates";
import type { PlanItem } from "./types";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Plain-language "when" for a plan item, from its schedule fields only. */
export function whenText(it: PlanItem, discharge: string): string {
  if (it.kind === "appointment" || it.kind === "milestone") {
    if (it.day === null) return it.kind === "milestone" ? "When you get there" : "No date set yet";
    return `${prettyDate(addDays(discharge, it.day))}${it.at_time ? `, ${prettyTime(it.at_time)}` : ""}${it.location ? ` · ${it.location}` : ""}`;
  }
  const t = it.times.length ? it.times.map(prettyTime).join(", ") : "Once a day, any time";
  const w = it.weekdays && it.weekdays.length ? ` · ${it.weekdays.map((d) => DAYS[d]).join(" ")}` : " · every day";
  const r = it.end_day !== null ? ` · days ${it.start_day} to ${it.end_day}` : it.start_day ? ` · from day ${it.start_day}` : "";
  return t + w + r;
}

/** Splits the team's "how" text into steps: one per line, or one per sentence. Never rewrites the words. */
export function howSteps(how: string | undefined): string[] {
  const text = (how ?? "").trim();
  if (!text) return [];
  const lines = text.split(/\n+/).map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  const sentences = text.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
  return sentences.length ? sentences : [text];
}
