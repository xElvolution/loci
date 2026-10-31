import { describe, expect, it } from "vitest";
import { buildComfort, radiusFor } from "@/lib/care/comfort";
import { composeGoodDay, composeRituals } from "@/lib/care/goodday";
import { cleanFilters, tagsFor } from "@/lib/care/filters";
import type { Favorite } from "@/lib/qloo/types";
import { mockQloo } from "../support/mock-qloo";

const favs: Favorite[] = [
  { id: "FAV-1", name: "Fixture Singer", type: "artist", resolved: true },
  { id: "FAV-2", name: "Fixture Show", type: "tv_show", resolved: true },
];
const city = { id: null, name: "New York", disambiguation: "City", lat: 40.7128, lon: -74.006, resolved: true };

describe("comfort layer", () => {
  it("returns no_favorites without calling Qloo", async () => {
    const m = mockQloo();
    const c = await buildComfort(m.transport, { favorites: [], city, filters: [], kidSafe: false });
    expect(c.status).toBe("no_favorites");
    expect(m.calls).toHaveLength(0);
  });

  it("builds every section and explains picks with the person's favorites", async () => {
    const m = mockQloo();
    const c = await buildComfort(m.transport, { favorites: favs, city, filters: ["vegetarian", "delivery", "no_alcohol", "step_free"], kidSafe: false });
    expect(c.status).toBe("ok");
    expect(c.sections.soundtrack.length).toBeGreaterThan(0);
    expect(c.sections.screen.some((p) => p.kind === "movie")).toBe(true);
    expect(c.sections.reading.some((p) => p.kind === "podcast")).toBe(true);
    expect(c.sections.soundtrack[0].because).toEqual(["Fixture Singer", "Fixture Show"]);
    // the no-alcohol filter drops bars locally; cuisine affinity drops pubs
    expect(c.sections.meals.some((p) => /wine bar/i.test(p.name))).toBe(false);
    expect(c.sections.cuisines.some((t) => /pub/i.test(t.name))).toBe(false);
    // dietary and accessibility filters become Qloo tag intersections
    const meal = m.calls.find((x) => String(x.params["filter.tags"] ?? "").includes("restaurant"));
    expect(meal?.params["filter.tags"]).toBe("urn:tag:category:place:restaurant,urn:tag:dietary_option:qloo:vegetarian,urn:tag:service_options:place:delivery");
    expect(meal?.params["operator.filter.tags"]).toBe("intersection");
    const park = m.calls.find((x) => String(x.params["filter.tags"] ?? "").startsWith("urn:tag:category:place:park"));
    expect(park?.params["filter.tags"]).toContain("wheelchair_accessible_entrance");
    expect(c.trace.length).toBeGreaterThan(8);
  });

  it("sends Qloo only entity ids, a point and generic tags", async () => {
    const m = mockQloo();
    await buildComfort(m.transport, { favorites: favs, city, filters: ["halal"], kidSafe: true });
    const blob = JSON.stringify(m.calls);
    for (const forbidden of ["Fixture Singer", "orthopedics", "maternity", "pain", "mood", "@"]) expect(blob).not.toContain(forbidden);
    const show = m.calls.find((x) => x.params["filter.type"] === "urn:entity:tv_show");
    expect(show?.params["filter.content_rating"]).toBeTruthy();
  });

  it("falls back to GET when weighted POST fails, and reports Qloo down honestly", async () => {
    const m = mockQloo({ postFails: true });
    const c = await buildComfort(m.transport, { favorites: favs, city, filters: [], kidSafe: false });
    expect(c.sections.soundtrack.length).toBeGreaterThan(0);
    expect(c.trace.some((t) => t.note?.startsWith("fallback"))).toBe(true);
    const down = await buildComfort(mockQloo({ down: true }).transport, { favorites: favs, city, filters: [], kidSafe: false });
    expect(down.status).toBe("unavailable");
  });

  it("scopes outings to a walkable radius in a neighborhood", () => {
    expect(radiusFor({ ...city, disambiguation: "Neighbourhood" }, "outing")).toBe(3000);
    expect(radiusFor(city, "outing")).toBe(15000);
  });

  it("only keeps known filters", () => {
    expect(cleanFilters(["vegan", "x", "vegan", 3])).toEqual(["vegan"]);
    expect(tagsFor(["vegan", "quiet"], "outing")).toEqual(["urn:tag:ambience:qloo:quiet"]);
  });
});

describe("good-day plan", () => {
  it("keeps plan lines exactly as entered and arranges comfort around them", async () => {
    const m = mockQloo();
    const c = await buildComfort(m.transport, { favorites: favs, city, filters: [], kidSafe: false });
    const item = { id: "m1", kind: "medication" as const, title: "Tablet as on your letter", detail: "", times: ["14:00"], weekdays: null, start_day: 0, end_day: null, day: null, at_time: null, location: "", sort: 0, reached_at: null };
    const blocks = composeGoodDay({ dateIso: "2026-10-30", personName: "Daniel", doses: [{ item, slot: "14:00", done: false }], appointments: [], comfort: c.sections, outingsOk: false });
    const med = blocks.find((b) => b.source === "plan");
    expect(med?.title).toBe("Tablet as on your letter");
    expect(med?.time).toBe("2 pm");
    expect(blocks.some((b) => b.kind === "outing")).toBe(false);
    const withOuting = composeGoodDay({ dateIso: "2026-10-30", personName: "Daniel", doses: [], appointments: [], comfort: c.sections, outingsOk: true });
    expect(withOuting.some((b) => b.kind === "outing")).toBe(true);
    const mins = blocks.map((b) => b.minutes);
    expect([...mins].sort((a, b) => a - b)).toEqual(mins);
  });
  it("writes rituals without any health detail", async () => {
    const m = mockQloo();
    const c = await buildComfort(m.transport, { favorites: favs, city, filters: [], kidSafe: false });
    const r = composeRituals("Daniel", c.sections);
    expect(r.map((x) => x.key)).toEqual(["arrival", "meal", "night", "bedside", "outing"]);
    expect(JSON.stringify(r)).not.toMatch(/pain|medic|wound|dose/i);
  });
});
