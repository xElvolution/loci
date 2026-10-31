import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rate-limit";
import { httpTransport, qlooConfigured } from "@/lib/server/qloo-http";
import { cityKind, searchCities, searchEntities } from "@/lib/qloo/api";
import { FAVORITE_TYPES, type FavoriteType } from "@/lib/qloo/types";

/** Name search for favorites and places. Only the typed query goes to Qloo. */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!rateLimit(`qsearch:${user.id}`, 90, 60_000).ok) return NextResponse.json({ error: "slow down" }, { status: 429 });
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ results: [] });
  if (!qlooConfigured()) return NextResponse.json({ results: [], unavailable: true });
  try {
    if (url.searchParams.get("kind") === "city") {
      const list = await searchCities(httpTransport, q, 6);
      return NextResponse.json({ results: list.map((e) => ({ id: e.id, name: e.name, disambiguation: cityKind(e) ?? e.disambiguation, lat: e.lat, lon: e.lon })) });
    }
    const types = (url.searchParams.get("types") ?? "").split(",").filter((t): t is FavoriteType => (FAVORITE_TYPES as readonly string[]).includes(t));
    const list = await searchEntities(httpTransport, q, types.length ? types : ["artist", "tv_show", "movie", "book"], 8);
    return NextResponse.json({ results: list.filter((e) => (FAVORITE_TYPES as readonly string[]).includes(e.type)).map((e) => ({ id: e.id, name: e.name, type: e.type, image: e.image, disambiguation: e.disambiguation })) });
  } catch {
    return NextResponse.json({ results: [], unavailable: true });
  }
}
