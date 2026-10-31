import { describe, expect, it } from "vitest";
import { INSTRUMENTS, instrumentsFor, readmissionFreeDays, trendOf } from "@/lib/care/instruments";
import { SPECIALTIES } from "@/lib/care/specialties";

describe("outcome instruments", () => {
  it("have valid ranges and unique ids, and every specialty gets suggestions", () => {
    expect(new Set(INSTRUMENTS.map((i) => i.id)).size).toBe(INSTRUMENTS.length);
    for (const i of INSTRUMENTS) expect(i.max).toBeGreaterThan(i.min);
    for (const s of SPECIALTIES) {
      const { suggested, other } = instrumentsFor(s.id);
      expect(suggested.length + other.length).toBe(INSTRUMENTS.length);
    }
    expect(instrumentsFor("neuro").suggested.map((i) => i.id)).toEqual(expect.arrayContaining(["barthel", "tug", "mrs"]));
    expect(instrumentsFor("orthopedics").suggested.map((i) => i.id)).toEqual(expect.arrayContaining(["tug", "knee_rom", "nprs"]));
  });
  it("count readmission-free days from discharge or the last return home", () => {
    expect(readmissionFreeDays("2026-10-01", "2026-10-31", [])).toMatchObject({ days: 30, readmitted: false });
    expect(readmissionFreeDays("2026-10-01", "2026-10-31", [{ admitted_on: "2026-10-10", discharged_on: "2026-10-20" }])).toMatchObject({ days: 11, since: "2026-10-20", readmitted: true });
    expect(readmissionFreeDays("2026-10-01", "2026-10-31", [{ admitted_on: "2026-10-29", discharged_on: null }])).toMatchObject({ days: 0, inHospital: true });
  });
  it("describe change by the instrument's own direction", () => {
    expect(trendOf([24.5, 16.2], false)).toEqual({ delta: -8.3, direction: "better" });
    expect(trendOf([65, 60], true)).toEqual({ delta: -5, direction: "worse" });
    expect(trendOf([3], true)).toEqual({ delta: null, direction: null });
  });
});
