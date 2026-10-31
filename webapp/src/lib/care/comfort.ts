/**
 * The taste layer. Turns what a person loves into comfort picks for recovery days:
 * a soundtrack, shows, reading, meals within the filters they ticked, gentle places
 * near home, a good-day plan and welcome-home rituals.
 *
 * Results are aggregate taste affinity from Qloo. They never feed any health logic,
 * and nothing about health is ever sent to Qloo.
 */
import { mediaFor, placesFor, tagAffinity, type Trace } from "@/lib/qloo/api";
import type { QlooTransport } from "@/lib/qloo/transport";
import type { City, Favorite, QEntity } from "@/lib/qloo/types";
import { looksLikeBar, tagsFor } from "./filters";

export type Pick = {
  id: string;
  name: string;
  kind: "artist" | "tv_show" | "movie" | "book" | "podcast" | "meal" | "outing";
  image: string | null;
  subtitle: string | null;
  because: string[];
  affinity: number | null;
  tags: string[];
  lat: number | null;
  lon: number | null;
};

export type ComfortSections = {
  soundtrack: Pick[];
  screen: Pick[];
  reading: Pick[];
  meals: Pick[];
  cuisines: { id: string; name: string; affinity: number | null }[];
  outings: Pick[];
};

export type Comfort = {
  status: "ok" | "no_favorites" | "no_city" | "unavailable";
  sections: ComfortSections;
  trace: Trace;
  generatedAt: string;
};

export const EMPTY_SECTIONS: ComfortSections = { soundtrack: [], screen: [], reading: [], meals: [], cuisines: [], outings: [] };

/** Gentle outing categories, one Qloo call each so every kind is represented. */
export const OUTING_KINDS = [
  { tag: "urn:tag:category:place:park", label: "Park" },
  { tag: "urn:tag:category:place:garden", label: "Garden" },
  { tag: "urn:tag:category:place:museum", label: "Museum" },
  { tag: "urn:tag:category:place:library", label: "Library" },
  { tag: "urn:tag:genre:place:restaurant:cafe", label: "Cafe" },
] as const;

export type ComfortInput = { favorites: Favorite[]; city: City | null; filters: string[]; kidSafe: boolean };

function because(e: QEntity, favs: Favorite[]): string[] {
  const names = new Map(favs.map((f) => [f.id, f.name]));
  return e.explain.map((x) => names.get(x.entityId)).filter((n): n is string => Boolean(n)).slice(0, 2);
}

function toPick(e: QEntity, kind: Pick["kind"], favs: Favorite[], subtitle: string | null = null): Pick {
  return {
    id: e.id,
    name: e.name,
    kind,
    image: e.image,
    subtitle: subtitle ?? e.disambiguation ?? null,
    because: because(e, favs),
    affinity: e.affinity,
    tags: e.tags.map((t) => t.name).slice(0, 6),
    lat: e.lat,
    lon: e.lon,
  };
}

function shortAddress(a: string | null): string | null {
  if (!a) return null;
  return a.split(",")[0].trim() || null;
}

/** Radius for "near home": a neighborhood is walkable, a whole city is wider. */
export function radiusFor(city: City, kind: "outing" | "meal"): number {
  const local = /neighbou?rhood|quarter|suburb|borough/i.test(city.disambiguation ?? "");
  if (kind === "outing") return local ? 3_000 : 15_000;
  return local ? 5_000 : 15_000;
}

export async function buildComfort(t: QlooTransport, input: ComfortInput): Promise<Comfort> {
  const trace: Trace = [];
  const generatedAt = new Date().toISOString();
  const favs = input.favorites.filter((f) => f.resolved);
  if (!favs.length) return { status: "no_favorites", sections: EMPTY_SECTIONS, trace, generatedAt };

  // earlier favorites weigh a little more; ids only, never names or anything personal
  const signals = favs.slice(0, 10).map((f, i) => ({ id: f.id, weight: Math.max(1, 10 - i) }));
  const ids = signals.map((s) => s.id);
  const exclude = ids;
  const m = (type: Parameters<typeof mediaFor>[2]["type"], take: number, step: string) => mediaFor(t, trace, { signals, type, take, kidSafe: input.kidSafe, exclude }, step);

  const city = input.city?.resolved && input.city.lat != null && input.city.lon != null ? input.city : null;
  const center = city ? { lat: city.lat as number, lon: city.lon as number } : null;
  const noBars = input.filters.includes("no_alcohol");
  const foodTags = tagsFor(input.filters, ["food", "service"]);
  const outingTags = tagsFor(input.filters, "outing");

  const [artists, shows, movies, books, podcasts, cuisines, meals, ...outings] = await Promise.all([
    m("artist", 8, "soundtrack"),
    m("tv_show", 6, "screen"),
    m("movie", 6, "screen"),
    m("book", 6, "reading"),
    m("podcast", 6, "reading"),
    tagAffinity(t, trace, ids, "urn:tag:cuisine:qloo", 12, "cuisines"),
    center && city
      ? placesFor(t, trace, { signals: ids, center, radiusM: radiusFor(city, "meal"), tags: ["urn:tag:category:place:restaurant", ...foodTags], take: 12, cityName: city.name }, "meals", "restaurants near home")
      : Promise.resolve([] as QEntity[]),
    ...(center && city
      ? OUTING_KINDS.map((k) => placesFor(t, trace, { signals: ids, center, radiusM: radiusFor(city, "outing"), tags: [k.tag, ...outingTags], take: 4, cityName: city.name }, "outings", `${k.label.toLowerCase()}s near home`))
      : []),
  ]);

  const mealPicks = meals
    .filter((e) => !noBars || !looksLikeBar([e.name, ...e.tags.map((x) => x.name)].join(" ")))
    .slice(0, 8)
    .map((e) => toPick(e, "meal", favs, shortAddress(e.address)));

  const seenPlace = new Set<string>();
  const outingPicks: Pick[] = [];
  outings.forEach((list, k) => {
    for (const e of list.slice(0, 3)) {
      if (seenPlace.has(e.id)) continue;
      if (looksLikeBar([e.name, ...e.tags.map((x) => x.name)].join(" "))) continue;
      seenPlace.add(e.id);
      outingPicks.push({ ...toPick(e, "outing", favs, shortAddress(e.address)), tags: [OUTING_KINDS[k].label, ...e.tags.map((x) => x.name).slice(0, 4)] });
    }
  });

  const interleave = <T,>(a: T[], b: T[]) => a.flatMap((x, i) => (b[i] ? [x, b[i]] : [x])).concat(b.slice(a.length));
  const sections: ComfortSections = {
    soundtrack: artists.map((e) => toPick(e, "artist", favs)),
    screen: interleave(shows.map((e) => toPick(e, "tv_show", favs)), movies.map((e) => toPick(e, "movie", favs))).slice(0, 10),
    reading: interleave(books.map((e) => toPick(e, "book", favs)), podcasts.map((e) => toPick(e, "podcast", favs))).slice(0, 10),
    meals: mealPicks,
    cuisines: cuisines.filter((c) => !/pub|bar|brewery|wine|cocktail/i.test(c.name)).slice(0, 8).map((c) => ({ id: c.id, name: c.name, affinity: c.affinity })),
    outings: outingPicks,
  };
  const total = Object.values(sections).reduce((n, s) => n + s.length, 0);
  const allFailed = trace.length > 0 && trace.every((x) => x.status === "error" || (typeof x.status === "number" && x.status >= 400));
  return { status: total === 0 && allFailed ? "unavailable" : !city ? "no_city" : "ok", sections, trace, generatedAt };
}
