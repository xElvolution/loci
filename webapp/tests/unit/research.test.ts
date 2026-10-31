import { describe, expect, it } from "vitest";
import { aggregate, toCsv, weekLabel, weekOf, type CheckinRow } from "@/lib/care/research";

const people = (n: number, specialty = "orthopedics", week = 1): CheckinRow[] =>
  Array.from({ length: n }, (_, i) => ({ j: `${specialty}-${i}`, specialty, week, mood: 3 + (i % 2), pain: 4, sleep: 3, energy: 3, flagged: i === 0 }));

describe("research aggregate", () => {
  it("suppresses any group below k and keeps groups at k", () => {
    const a = aggregate({ checkins: [...people(10), ...people(9, "cardiac")], outcomes: [], cohort: [] }, 10);
    expect(a.checkins).toHaveLength(1);
    expect(a.checkins[0]).toMatchObject({ specialty: "orthopedics", week: "1", journeys: 10, checkins: 10, mood: 3.5, flaggedShare: 0.1 });
    expect(a.suppressed).toBe(1);
  });
  it("counts distinct people, not records", () => {
    const repeat = people(5).flatMap((r) => [r, { ...r }]);
    const a = aggregate({ checkins: repeat, outcomes: [], cohort: [] }, 10);
    expect(a.checkins).toHaveLength(0);
    expect(a.suppressed).toBe(1);
  });
  it("output carries no person keys", () => {
    const a = aggregate({ checkins: people(12), outcomes: people(12).map((r) => ({ j: r.j, specialty: r.specialty, instrument: "tug", week: 2, value: 14 })), cohort: people(12).map((r) => ({ j: r.j, specialty: r.specialty, readmitted: false })) }, 10);
    const text = JSON.stringify(a) + toCsv(a);
    expect(text).not.toMatch(/orthopedics-\d/);
    expect(a.cohort).toBe(12);
    expect(toCsv(a)).toContain("outcomes,orthopedics,tug,2,12,12,14");
  });
  it("rejects a k below 2", () => {
    expect(() => aggregate({ checkins: [], outcomes: [], cohort: [] }, 1)).toThrow();
  });
  it("buckets weeks relative to discharge and pools late weeks", () => {
    expect(weekOf(0)).toBe(1);
    expect(weekOf(6)).toBe(1);
    expect(weekOf(7)).toBe(2);
    expect(weekLabel(weekOf(200))).toBe("13+");
    expect(weekLabel(0)).toBe("before discharge");
  });
  it("hides the exact cohort size in the CSV when it is below k", () => {
    expect(toCsv(aggregate({ checkins: [], outcomes: [], cohort: people(3).map((r) => ({ j: r.j, specialty: r.specialty, readmitted: true })) }, 10))).toContain("consenting cohort: fewer than 10");
  });
});
