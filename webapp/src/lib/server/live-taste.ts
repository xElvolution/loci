import "server-only";
import { httpTransport, qlooConfigured } from "@/lib/server/qloo-http";
import { searchEntities } from "@/lib/qloo/api";
import { buildComfort, type Pick } from "@/lib/care/comfort";
import type { Favorite, FavoriteType } from "@/lib/qloo/types";

const SEEDS: [string, FavoriteType][] = [
  ["Norah Jones", "artist"],
  ["Ted Lasso", "tv_show"],
];

export async function liveTaste(): Promise<{ favs: Favorite[]; picks: { label: string; icon: string; items: Pick[] }[] } | null> {
  if (!qlooConfigured()) return null;
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), 6000));
  const work = (async () => {
    const favs: Favorite[] = [];
    for (const [name, type] of SEEDS) {
      const [hit] = await searchEntities(httpTransport, name, [type], 1);
      if (hit) favs.push({ id: hit.id, name: hit.name, type, image: hit.image, resolved: true });
    }
    if (!favs.length) return null;
    const c = await buildComfort(httpTransport, { favorites: favs, city: { id: null, name: "New York", disambiguation: "City", lat: 40.7128, lon: -74.006, resolved: true }, filters: ["delivery"], kidSafe: false });
    if (c.status !== "ok") return null;
    return {
      favs,
      picks: [
        { label: "Soundtrack", icon: "music", items: c.sections.soundtrack.slice(0, 3) },
        { label: "Screen time", icon: "tv", items: c.sections.screen.slice(0, 3) },
        { label: "Gentle outings", icon: "tree", items: c.sections.outings.slice(0, 3) },
        { label: "Delivered meals", icon: "meal", items: c.sections.meals.slice(0, 3) },
      ].filter((p) => p.items.length),
    };
  })().catch(() => null);
  return Promise.race([work, timeout]);
}

