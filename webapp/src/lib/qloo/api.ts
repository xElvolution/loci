/**
 * Typed Qloo operations used by loci. Every call is recorded in a trace so the
 * request-to-result path can be shown next to each pick and audited.
 *
 * Safe use: only entity ids of things the person loves, a city point and generic
 * place tags (cuisine, dietary option, accessibility) are ever sent. Specialty, plan,
 * check-ins, names and emails never leave our server.
 */
import { entitiesFromInsights, entitiesFromSearch, tagsFromInsights } from "./normalize";
import type { QlooParams, QlooResponse, QlooTransport } from "./transport";
import { urnFor, type AnchorType, type FavoriteType, type QEntity, type TasteTag, type TraceEntry } from "./types";

export type Trace = TraceEntry[];

export function record(trace: Trace, step: string, endpoint: string, params: Record<string, unknown>, res: QlooResponse | null, results: number, note?: string) {
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    flat[k] = typeof v === "string" ? v : JSON.stringify(v);
  }
  trace.push({
    step,
    endpoint,
    params: flat,
    status: res ? (res.status === 0 ? "error" : res.status) : "skipped",
    results,
    ms: res?.ms ?? 0,
    cached: res?.cached ?? false,
    note,
  });
}

export const ok = (r: QlooResponse) => r.status >= 200 && r.status < 300;

/** Search entity names for the "things you love" picker. */
export async function searchEntities(t: QlooTransport, query: string, types: FavoriteType[], take = 8): Promise<QEntity[]> {
  const res = await t.get("/search", { query, types: types.map((x) => urnFor(x)).join(","), take });
  return ok(res) ? entitiesFromSearch(res.body) : [];
}

/** Search cities and neighborhoods (Qloo localities) and destinations. */
export async function searchCities(t: QlooTransport, query: string, take = 8): Promise<QEntity[]> {
  const res = await t.get("/search", { query, types: "urn:entity:locality,urn:entity:destination", take: Math.max(take, 10) });
  if (!ok(res)) return [];
  const list = entitiesFromSearch(res.body).filter((e) => (e.type === "locality" || e.type === "destination") && e.lat !== null && e.lon !== null);
  // Qloo lists states and provinces next to cities ("New York" the state comes first).
  // Keep Qloo's relevance order and only demote regions.
  const rank = (e: QEntity) => (["State", "Province", "Country", "Region"].includes(cityKind(e) ?? "") ? 1 : 0);
  return list
    .map((e, i) => ({ e, i }))
    .sort((a, b) => rank(a.e) - rank(b.e) || a.i - b.i)
    .map((x) => x.e)
    .slice(0, take);
}

/** "City", "Neighbourhood"... from Qloo locality tags, or "Destination". */
export function cityKind(e: QEntity): string | null {
  if (e.type === "destination") return "Destination";
  const known = ["City", "Town", "Village", "State", "Province", "Country", "Region", "County", "Neighbourhood", "Quarter", "Suburb", "Borough", "Islet"];
  return e.tags.map((t) => t.name).find((n) => known.includes(n)) ?? null;
}

export type MediaQuery = {
  signals: { id: string; weight: number }[];
  type: AnchorType;
  take: number;
  kidSafe: boolean;
  exclude: string[];
};

/** Media picks (artists, shows, films, books, podcasts) from weighted taste signals. */
export async function mediaFor(t: QlooTransport, trace: Trace, m: MediaQuery, step: string): Promise<QEntity[]> {
  const base: Record<string, unknown> = { "filter.type": urnFor(m.type), "feature.explainability": true, take: m.take, "filter.popularity.min": 0.4 };
  if (m.exclude.length) base["filter.exclude.entities"] = m.exclude.join(",");
  if (m.kidSafe && (m.type === "movie" || m.type === "tv_show")) base["filter.content_rating"] = "G,PG,TV-Y,TV-Y7,TV-G,TV-PG";
  const weighted = { ...base, "signal.interests.entities": m.signals.map((s) => ({ id: s.id, weight: s.weight })) };
  const r1 = await t.post("/v2/insights", weighted);
  let list = ok(r1) ? entitiesFromInsights(r1.body) : [];
  record(trace, step, "POST /v2/insights", weighted, r1, list.length, "weighted taste signal");
  if (list.length) return list;
  const getParams: QlooParams = { ...(base as QlooParams), "signal.interests.entities": m.signals.map((s) => s.id).join(",") };
  const r2 = await t.get("/v2/insights", getParams);
  list = ok(r2) ? entitiesFromInsights(r2.body) : [];
  record(trace, step, "GET /v2/insights", getParams, r2, list.length, "fallback: unweighted GET");
  return list;
}

export type PlaceQuery = {
  signals: string[];
  center: { lat: number; lon: number };
  radiusM: number;
  /** all of these tags must match (operator intersection) */
  tags: string[];
  take: number;
  cityName: string;
};

/** Real places near the person's area, ranked by their taste, widened once if too few return. */
export async function placesFor(t: QlooTransport, trace: Trace, p: PlaceQuery, step: string, note: string): Promise<QEntity[]> {
  const wkt = `POINT(${p.center.lon.toFixed(5)} ${p.center.lat.toFixed(5)})`;
  const common: QlooParams = {
    "filter.type": "urn:entity:place",
    "signal.interests.entities": p.signals.join(","),
    "filter.tags": p.tags.join(","),
    "operator.filter.tags": p.tags.length > 1 ? "intersection" : undefined,
    "feature.explainability": true,
    take: p.take,
  };
  const radii = [p.radiusM, Math.min(p.radiusM * 3, 40_000)];
  const seen = new Map<string, QEntity>();
  for (const [i, radius] of radii.entries()) {
    const params: QlooParams = { ...common, "filter.location": wkt, "filter.location.radius": radius };
    const r = await t.get("/v2/insights", params);
    const list = (ok(r) ? entitiesFromInsights(r.body) : []).filter((e) => e.lat !== null && e.lon !== null);
    record(trace, step, "GET /v2/insights", params, r, list.length, i === 0 ? note : `${note}, widened to ${(radius / 1000).toFixed(0)} km`);
    for (const e of list) if (!seen.has(e.id)) seen.set(e.id, e);
    if (seen.size >= Math.min(3, p.take)) break;
  }
  return [...seen.values()];
}

/** Taste Analysis over one tag family, e.g. the cuisines this taste leans toward. */
export async function tagAffinity(t: QlooTransport, trace: Trace, signals: string[], tagType: string, take: number, step: string): Promise<TasteTag[]> {
  const params: QlooParams = { "filter.type": "urn:tag", "signal.interests.entities": signals.join(","), "filter.tag.types": tagType, take };
  const r = await t.get("/v2/insights", params);
  const tags = ok(r) ? tagsFromInsights(r.body) : [];
  record(trace, step, "GET /v2/insights", params, r, tags.length, `Taste Analysis (${tagType})`);
  return tags;
}
