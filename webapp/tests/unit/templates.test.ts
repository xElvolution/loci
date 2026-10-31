import { describe, expect, it } from "vitest";
import { BUILTIN_TEMPLATES, builtinTemplate } from "@/lib/care/templates";
import { instrumentOf } from "@/lib/care/instruments";
import { specialtyOf } from "@/lib/care/specialties";

describe("built-in structure templates", () => {
  it("ships stroke rehab and orthopedic physio", () => {
    expect(BUILTIN_TEMPLATES.map((t) => t.id)).toEqual(["builtin:stroke-rehab", "builtin:ortho-physio"]);
    expect(builtinTemplate("builtin:ortho-physio")?.specialty).toBe("orthopedics");
    expect(builtinTemplate("nope")).toBeNull();
  });
  for (const t of BUILTIN_TEMPLATES) {
    it(`${t.id} holds structure only, never clinical content`, () => {
      expect(t.body.signs).toEqual([]);
      expect(t.body.thresholds).toEqual([]);
      expect(t.body.instructions).toBe("");
      expect(t.body.items.length).toBeGreaterThan(4);
      for (const it of t.body.items) {
        expect(it.needs_review).toBe(true);
        expect(it.why).toBe("");
        expect(it.how).toBe("");
        expect(it.times).toEqual([]);
      }
    });
    it(`${t.id} suggests real instruments for a real specialty`, () => {
      expect(specialtyOf(t.specialty).id).toBe(t.specialty);
      for (const m of t.body.measures) expect(instrumentOf(m)).toBeTruthy();
    });
  }
  it("ortho physio phases do not overlap", () => {
    const ex = builtinTemplate("builtin:ortho-physio")!.body.items.filter((i) => i.kind === "exercise");
    expect(ex.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < ex.length; i++) expect(ex[i].start_day).toBeGreaterThan(ex[i - 1].end_day ?? Infinity - 1);
  });
});
