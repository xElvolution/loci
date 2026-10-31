import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { SPECIALTIES } from "@/lib/care/specialties";
import { DEMO_JOURNEYS } from "@/lib/care/demo-fixtures";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|css)$/.test(f) ? [p] : [];
  });
}

describe("content rules", () => {
  it("covers every specialty, not only one kind of patient", () => {
    expect(SPECIALTIES.map((s) => s.id)).toEqual(expect.arrayContaining(["maternity", "surgery", "orthopedics", "cardiac", "neuro", "pediatrics", "mental_health", "oncology", "respiratory", "diabetes", "elder"]));
  });
  it("templates carry no doses or warning signs of their own", () => {
    const blob = JSON.stringify(SPECIALTIES);
    expect(blob).not.toMatch(/\b\d+\s?(mg|ml|mcg|units?)\b/i);
    expect(SPECIALTIES.every((s) => !("signs" in s))).toBe(true);
  });
  it("UI copy never uses em dashes", () => {
    const offenders = walk(path.resolve(__dirname, "../../src")).filter((f) => readFileSync(f, "utf8").includes("\u2014"));
    expect(offenders).toEqual([]);
  });
  it("demo journeys span specialties and cities, with New York first", () => {
    expect(DEMO_JOURNEYS[0].city.name).toBe("New York");
    expect(new Set(DEMO_JOURNEYS.map((d) => d.specialty)).size).toBeGreaterThanOrEqual(8);
    expect(new Set(DEMO_JOURNEYS.map((d) => d.city.name)).size).toBeGreaterThanOrEqual(6);
    expect(JSON.stringify(DEMO_JOURNEYS)).not.toMatch(/Lagos/);
  });
});
