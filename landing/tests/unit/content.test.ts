import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SPECIALTIES } from "@/lib/care/specialties";

const root = path.resolve(import.meta.dirname, "../../src");
const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(path.join(dir, f)).isDirectory() ? files(path.join(dir, f)) : [path.join(dir, f)]));
const tsx = files(root).filter((f) => f.endsWith(".tsx"));

describe("landing content", () => {
  it("has no em dashes in UI copy", () => {
    for (const f of tsx) expect(readFileSync(f, "utf8"), f).not.toContain("\u2014");
  });
  it("never links to app routes on its own host", () => {
    // Any path into the webapp must go through app(...) so it points at APP_URL, not this host.
    for (const f of tsx) expect(readFileSync(f, "utf8"), f).not.toMatch(/(?<!app\()["'`]\/(app|clinic|privacy|safety)\b/);
  });
  it("covers every specialty and never says Lagos", () => {
    expect(SPECIALTIES.length).toBeGreaterThanOrEqual(12);
    for (const f of tsx) expect(readFileSync(f, "utf8")).not.toMatch(/Lagos/);
  });
});

import { DECK_TITLES } from "@/components/landing/SpecialtyDeck";
describe("specialty deck", () => {
  it("deals twelve specialties in the agreed order", () => {
    expect(DECK_TITLES).toHaveLength(12);
    expect(DECK_TITLES[0]).toBe("Maternity and postpartum");
    expect(DECK_TITLES[11]).toBe("Any other hospital stay");
  });
});
