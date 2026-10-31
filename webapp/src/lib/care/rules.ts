/**
 * Rule-based flags. A flag fires only when a check-in matches a threshold or a
 * warning sign that a clinician or the family typed into the plan. There is no
 * scoring model, no prediction and no diagnosis here.
 */
import { addDays } from "./dates";
import { METRIC_META, type Checkin, type FlagResult, type Threshold, type WarningSign } from "./types";

export function describeThreshold(t: Threshold): string {
  const m = METRIC_META[t.metric];
  const scale = `${m.min} to ${m.max}`;
  const cmp = t.op === "gte" ? `${t.value} or higher` : `${t.value} or lower`;
  const span = t.days > 1 ? ` for ${t.days} days in a row` : "";
  return `${m.label} ${cmp} (scale ${scale})${span}`;
}

function matches(t: Threshold, c: Checkin): boolean {
  const v = c[t.metric];
  return t.op === "gte" ? v >= t.value : v <= t.value;
}

/**
 * Evaluate today's check-in against the plan.
 * history: earlier check-ins (any order). A multi-day threshold needs one check-in
 * on each of the previous days; a missing day breaks the run.
 */
export function evaluate(today: Checkin, history: Checkin[], thresholds: Threshold[], signs: WarningSign[]): FlagResult[] {
  const out: FlagResult[] = [];
  const byDate = new Map(history.map((c) => [c.for_date, c]));
  byDate.set(today.for_date, today);

  for (const s of signs) {
    if (today.signs.includes(s.id)) {
      out.push({ source: "warning_sign", refId: s.id, action: s.action, reason: `Warning sign ticked: "${s.text}"` });
    }
  }
  for (const t of thresholds) {
    let run = true;
    for (let i = 0; i < Math.max(1, t.days); i++) {
      const c = byDate.get(addDays(today.for_date, -i));
      if (!c || !matches(t, c)) {
        run = false;
        break;
      }
    }
    if (run) out.push({ source: "threshold", refId: t.id, action: t.action, reason: `Care team threshold reached: ${describeThreshold(t)}` });
  }
  // emergency first, so the screen leads with the most urgent instruction
  return out.sort((a, b) => (a.action === b.action ? 0 : a.action === "emergency" ? -1 : 1));
}

export function mostUrgent(flags: FlagResult[]): FlagResult["action"] | null {
  if (flags.some((f) => f.action === "emergency")) return "emergency";
  return flags.length ? "call_team" : null;
}

export function validThreshold(t: Pick<Threshold, "metric" | "op" | "value" | "days">): boolean {
  const m = METRIC_META[t.metric];
  if (!m) return false;
  return Number.isInteger(t.value) && t.value >= m.min && t.value <= m.max && Number.isInteger(t.days) && t.days >= 1 && t.days <= 7 && (t.op === "gte" || t.op === "lte");
}
