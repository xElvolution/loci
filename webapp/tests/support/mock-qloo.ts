/**
 * Synthetic Qloo responses for tests ONLY. Names are obviously fictional
 * ("Fixture ...") so they can never be mistaken for real Qloo data.
 */
import type { QlooParams, QlooResponse, QlooTransport } from "../../src/lib/qloo/transport";

type Call = { method: "GET" | "POST"; path: string; params: Record<string, unknown> };
export type MockOptions = { noPlaces?: boolean; postFails?: boolean; down?: boolean; imageBase?: string };

function signalIds(params: Record<string, unknown>): string[] {
  const s = params["signal.interests.entities"];
  if (Array.isArray(s)) return s.map((x) => (typeof x === "object" && x ? String((x as { id: string }).id) : String(x)));
  return typeof s === "string" ? s.split(",") : [];
}

export function mockQloo(opts: MockOptions = {}) {
  const calls: Call[] = [];
  const img = (k: string, i: number) => `${opts.imageBase ?? "https://fixtures.invalid"}/img/${k}-${i}.svg`;
  const entity = (type: string, i: number, ids: string[], extra: Record<string, unknown> = {}) => ({
    entity_id: `FX-${type}-${i}`,
    name: `Fixture ${type.replace("_", " ")} ${i + 1}`,
    subtype: `urn:entity:${type === "video_game" ? "videogame" : type}`,
    popularity: 0.9 - i * 0.03,
    properties: { image: { url: img(type, i) }, ...(extra.properties as object) },
    query: { affinity: 0.95 - i * 0.04, explainability: { "signal.interests.entities": ids.slice(0, 2).map((id, k) => ({ entity_id: id, score: 0.6 - k * 0.2 })) } },
    ...Object.fromEntries(Object.entries(extra).filter(([k]) => k !== "properties")),
  });
  const respond = (method: "GET" | "POST", path: string, params: Record<string, unknown>): QlooResponse => {
    calls.push({ method, path, params });
    if (opts.down) return { status: 0, body: { error: "network" }, ms: 1, cached: false };
    const ok = (body: unknown): QlooResponse => ({ status: 200, body, ms: 1, cached: false });
    if (method === "POST" && opts.postFails) return { status: 400, body: { error: "bad" }, ms: 1, cached: false };
    if (path === "/search") {
      const types = String(params.types ?? "");
      const query = String(params.query ?? "");
      if (types.includes("locality")) {
        return ok({ results: [{ entity_id: "FX-LOC-1", name: `Fixture City ${query}`, types: ["urn:entity:locality"], tags: [{ tag_id: "t-city", name: "City" }], location: { lat: 40.7128, lon: -74.006 } }] });
      }
      const kind = (types.split(",")[0] || "urn:entity:artist").replace("urn:entity:", "").replace("videogame", "video_game");
      return ok({ results: [0, 1, 2].map((i) => ({ entity_id: `FX-FAV-${kind}-${query.toLowerCase().replace(/\W+/g, "-")}-${i}`, name: `Fixture ${kind.replace("_", " ")} ${query}${i ? ` ${i + 1}` : ""}`, types: [`urn:entity:${kind}`], popularity: 0.9, properties: { image: { url: img(kind, i) } } })) });
    }
    const type = String(params["filter.type"] ?? "");
    const ids = signalIds(params);
    if (type === "urn:tag") {
      return ok({ results: { tags: ["Comfort Food", "Italian", "Pub", "Japanese", "Bakery"].map((n, i) => ({ tag_id: `urn:tag:cuisine:qloo:fx${i}`, name: `Fixture ${n}`.replace("Fixture Pub", "Pub"), subtype: "urn:tag:cuisine:qloo", query: { affinity: 0.9 - i * 0.1 } })) } });
    }
    if (type === "urn:entity:place") {
      if (opts.noPlaces) return ok({ results: { entities: [] } });
      const tag = String(params["filter.tags"] ?? "x").split(",")[0].split(":").pop() ?? "place";
      return ok({
        results: {
          entities: [0, 1, 2, 3].map((i) =>
            entity("place", i, ids, {
              entity_id: `FX-place-${tag}-${i}`,
              name: i === 3 ? `Fixture ${tag} Wine Bar` : `Fixture ${tag.replace(/_/g, " ")} ${i + 1}`,
              location: { lat: 40.71 + i * 0.01, lon: -74.0 + i * 0.01 },
              properties: { address: `${10 + i} Fixture Street, Testville` },
              tags: [{ tag_id: "urn:tag:fx", name: "Fixture tag", subtype: "urn:tag:fx" }],
            }),
          ),
        },
      });
    }
    const t = type.replace("urn:entity:", "").replace("videogame", "video_game");
    return ok({ results: { entities: [0, 1, 2, 3, 4, 5].map((i) => entity(t, i, ids)) } });
  };
  const transport: QlooTransport = {
    get: async (path: string, params: QlooParams) => respond("GET", path, params),
    post: async (path: string, body: Record<string, unknown>) => respond("POST", path, body),
  };
  return { transport, calls };
}
