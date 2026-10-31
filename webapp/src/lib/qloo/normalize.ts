import { typeFromUrn, type HeatCell, type QEntity, type TasteTag, type TrendPoint } from "./types";

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

function pickImage(props: Obj | null): string | null {
  if (!props) return null;
  const img = props.image;
  if (isObj(img)) {
    const u = str(img.url);
    if (u && /^https?:\/\//.test(u)) return u;
  }
  if (typeof img === "string" && /^https?:\/\//.test(img)) return img;
  const images = props.images;
  if (Array.isArray(images)) {
    for (const i of images) {
      if (isObj(i) && str(i.url) && /^https?:\/\//.test(i.url as string)) return i.url as string;
    }
  }
  return null;
}

/** Explainability shape varies; collect any {entity_id|entity, score} pairs found under it. */
function pickExplain(q: Obj | null): { entityId: string; score: number }[] {
  if (!q) return [];
  const root = q.explainability;
  const out = new Map<string, number>();
  const walk = (v: unknown, depth: number) => {
    if (depth > 4) return;
    if (Array.isArray(v)) v.forEach((x) => walk(x, depth + 1));
    else if (isObj(v)) {
      const id = str(v.entity_id) ?? str(v.entity) ?? str(v.id);
      const score = num(v.score) ?? num(v.weight) ?? num(v.impact);
      if (id && score !== null) out.set(id, Math.max(out.get(id) ?? 0, score));
      else Object.values(v).forEach((x) => walk(x, depth + 1));
    }
  };
  walk(root, 0);
  return [...out.entries()].map(([entityId, score]) => ({ entityId, score })).sort((a, b) => b.score - a.score);
}

export function normalizeEntity(raw: unknown): QEntity | null {
  if (!isObj(raw)) return null;
  const id = str(raw.entity_id) ?? str(raw.id);
  const name = str(raw.name);
  if (!id || !name) return null;
  const props = isObj(raw.properties) ? raw.properties : null;
  const types = Array.isArray(raw.types) ? (raw.types.filter((t) => typeof t === "string") as string[]) : [];
  const subtype = str(raw.subtype) ?? types.find((t) => t.startsWith("urn:entity:")) ?? null;
  const loc = isObj(raw.location) ? raw.location : null;
  const geocode = props && isObj(props.geocode) ? props.geocode : null;
  const query = isObj(raw.query) ? raw.query : null;
  const tags = Array.isArray(raw.tags)
    ? raw.tags
        .filter(isObj)
        .map((t) => ({ id: str(t.tag_id) ?? str(t.id) ?? "", name: str(t.name) ?? "", type: str(t.subtype) ?? str(t.type) }))
        .filter((t) => t.id && t.name)
    : [];
  return {
    id,
    name,
    subtype,
    type: typeFromUrn(subtype),
    image: pickImage(props),
    popularity: num(raw.popularity),
    affinity: query ? num(query.affinity) : null,
    disambiguation: str(raw.disambiguation),
    description: props ? str(props.description) ?? str(props.short_description) : null,
    lat: loc ? num(loc.lat) ?? num(loc.latitude) : null,
    lon: loc ? num(loc.lon) ?? num(loc.lng) ?? num(loc.longitude) : null,
    geohash: loc ? str(loc.geohash) : null,
    address: props ? str(props.address) ?? (geocode ? str(geocode.name) : null) : null,
    tags,
    explain: pickExplain(query),
  };
}

export function entitiesFromSearch(body: unknown): QEntity[] {
  if (!isObj(body)) return [];
  const list = Array.isArray(body.results) ? body.results : [];
  return list.map(normalizeEntity).filter((e): e is QEntity => e !== null);
}

export function entitiesFromInsights(body: unknown): QEntity[] {
  if (!isObj(body) || !isObj(body.results)) return [];
  const list = Array.isArray(body.results.entities) ? body.results.entities : [];
  return list.map(normalizeEntity).filter((e): e is QEntity => e !== null);
}

export function heatFromInsights(body: unknown): HeatCell[] {
  if (!isObj(body) || !isObj(body.results) || !Array.isArray(body.results.heatmap)) return [];
  const out: HeatCell[] = [];
  for (const c of body.results.heatmap) {
    if (!isObj(c) || !isObj(c.location)) continue;
    const q = isObj(c.query) ? c.query : {};
    const lat = num(c.location.latitude) ?? num(c.location.lat);
    const lon = num(c.location.longitude) ?? num(c.location.lon);
    const geohash = str(c.location.geohash);
    if (lat === null || lon === null || !geohash) continue;
    out.push({ lat, lon, geohash, affinity: num(q.affinity) ?? 0, affinityRank: num(q.affinity_rank) ?? 0, popularity: num(q.popularity) ?? 0 });
  }
  return out;
}

export function tagsFromInsights(body: unknown): TasteTag[] {
  if (!isObj(body) || !isObj(body.results) || !Array.isArray(body.results.tags)) return [];
  return body.results.tags
    .filter(isObj)
    .map((t) => ({
      id: str(t.tag_id) ?? str(t.id) ?? "",
      name: str(t.name) ?? "",
      subtype: str(t.subtype),
      affinity: isObj(t.query) ? num(t.query.affinity) : null,
    }))
    .filter((t) => t.id && t.name);
}

export function trendFromBody(body: unknown): TrendPoint[] {
  if (!isObj(body) || !isObj(body.results) || !Array.isArray(body.results.trending)) return [];
  return body.results.trending.filter(isObj).map((p) => ({
    date: str(p.date) ?? "",
    percentile: num(p.population_percentile),
    rank: num(p.population_rank),
    rankVelocity: num(p.population_rank_velocity),
    deltaPct: num(p.population_percent_delta),
  }));
}

/** Locality echo, e.g. query.localities.filter on heatmap responses. */
export function localityEcho(body: unknown): { id: string; name: string } | null {
  if (!isObj(body) || !isObj(body.query)) return null;
  const q = body.query;
  const cands: unknown[] = [];
  if (isObj(q.localities)) cands.push(q.localities.filter, q.localities.signal);
  if (isObj(q.locality)) cands.push(q.locality.filter, q.locality.signal);
  for (const c of cands) {
    if (isObj(c) && str(c.entity_id) && str(c.name)) return { id: c.entity_id as string, name: c.name as string };
  }
  return null;
}
