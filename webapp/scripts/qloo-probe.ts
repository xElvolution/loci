/**
 * Live smoke probe of the comfort layer against Qloo. Prints counts and picks
 * per section only; raw Qloo responses are never written to disk.
 * Usage: QLOO_API_KEY=... npx tsx scripts/qloo-probe.ts "New York"
 */
import { buildComfort } from "../src/lib/care/comfort";
import { searchCities, searchEntities } from "../src/lib/qloo/api";
import { cleanParams, type QlooTransport } from "../src/lib/qloo/transport";
import type { Favorite, FavoriteType } from "../src/lib/qloo/types";

const BASE = (process.env.QLOO_BASE_URL || "https://hackathon.api.qloo.com").replace(/\/$/, "");
const key = process.env.QLOO_API_KEY;
if (!key) {
  console.error("QLOO_API_KEY is not set");
  process.exit(1);
}
const t: QlooTransport = {
  async get(path, params) {
    const s = Date.now();
    const r = await fetch(`${BASE}${path}?${new URLSearchParams(cleanParams(params))}`, { headers: { "X-Api-Key": key } });
    return { status: r.status, body: await r.json().catch(() => null), ms: Date.now() - s, cached: false };
  },
  async post(path, body) {
    const s = Date.now();
    const r = await fetch(`${BASE}${path}`, { method: "POST", headers: { "X-Api-Key": key, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { status: r.status, body: await r.json().catch(() => null), ms: Date.now() - s, cached: false };
  },
};

async function main() {
  const cityName = process.argv[2] ?? "New York";
  const want: [string, FavoriteType][] = [["Norah Jones", "artist"], ["Ted Lasso", "tv_show"], ["Paddington", "movie"]];
  const favorites: Favorite[] = [];
  for (const [name, type] of want) {
    const [hit] = await searchEntities(t, name, [type], 1);
    if (hit) favorites.push({ id: hit.id, name: hit.name, type, resolved: true });
  }
  const [c] = await searchCities(t, cityName, 3);
  const city = c ? { id: c.id, name: c.name, disambiguation: c.tags[0]?.name ?? null, lat: c.lat, lon: c.lon, resolved: true } : null;
  const out = await buildComfort(t, { favorites, city, filters: ["delivery", "step_free"], kidSafe: false });
  console.log(`city: ${city?.name} (${city?.disambiguation}) status: ${out.status}`);
  for (const [k, v] of Object.entries(out.sections)) console.log(`${k.padEnd(10)} ${String(v.length).padStart(2)}  ${v.slice(0, 4).map((x: { name: string }) => x.name).join(" | ")}`);
  const failed = out.trace.filter((x) => x.status !== 200);
  console.log(`calls: ${out.trace.length}, non-200: ${failed.map((f) => `${f.step}:${f.status}`).join(", ") || "none"}`);
}
main();
