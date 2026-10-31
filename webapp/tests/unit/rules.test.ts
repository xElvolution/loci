import { describe, expect, it } from "vitest";
import { describeThreshold, evaluate, mostUrgent, validThreshold } from "@/lib/care/rules";
import type { Checkin, Threshold, WarningSign } from "@/lib/care/types";

const base = (date: string, over: Partial<Checkin> = {}): Checkin => ({ for_date: date, mood: 3, pain: 3, sleep: 3, appetite: 3, energy: 3, signs: [], ...over });
const pain8x2: Threshold = { id: "t1", metric: "pain", op: "gte", value: 8, days: 2, action: "call_team" };
const moodLow: Threshold = { id: "t2", metric: "mood", op: "lte", value: 1, days: 1, action: "call_team" };
const signs: WarningSign[] = [
  { id: "s1", text: "Calf pain or swelling", action: "call_team", sort: 0 },
  { id: "s2", text: "Chest pain", action: "emergency", sort: 1 },
];

describe("rule-based flags", () => {
  it("does nothing when nothing in the plan matches", () => {
    expect(evaluate(base("2026-10-30"), [], [pain8x2, moodLow], signs)).toEqual([]);
  });
  it("needs every day of a multi-day threshold", () => {
    const today = base("2026-10-30", { pain: 9 });
    expect(evaluate(today, [base("2026-10-29", { pain: 5 })], [pain8x2], [])).toHaveLength(0);
    expect(evaluate(today, [base("2026-10-29", { pain: 8 })], [pain8x2], [])).toHaveLength(1);
  });
  it("treats a missing day as a broken run", () => {
    expect(evaluate(base("2026-10-30", { pain: 9 }), [base("2026-10-28", { pain: 9 })], [pain8x2], [])).toHaveLength(0);
  });
  it("lte thresholds fire at the boundary", () => {
    const r = evaluate(base("2026-10-30", { mood: 1 }), [], [moodLow], []);
    expect(r[0].reason).toContain("Mood 1 or lower");
  });
  it("ticked warning signs flag with the clinician's own words, emergency first", () => {
    const r = evaluate(base("2026-10-30", { signs: ["s1", "s2"] }), [], [], signs);
    expect(r.map((f) => f.action)).toEqual(["emergency", "call_team"]);
    expect(r[1].reason).toContain("Calf pain or swelling");
    expect(mostUrgent(r)).toBe("emergency");
  });
  it("ignores sign ids that are not in the plan", () => {
    expect(evaluate(base("2026-10-30", { signs: ["nope"] }), [], [], signs)).toEqual([]);
  });
  it("describes thresholds in plain language", () => {
    expect(describeThreshold(pain8x2)).toBe("Pain 8 or higher (scale 0 to 10) for 2 days in a row");
  });
  it("validates thresholds against the scale", () => {
    expect(validThreshold({ metric: "pain", op: "gte", value: 11, days: 1 })).toBe(false);
    expect(validThreshold({ metric: "mood", op: "lte", value: 0, days: 1 })).toBe(false);
    expect(validThreshold({ metric: "mood", op: "lte", value: 2, days: 3 })).toBe(true);
  });
});
