/** Normalized shapes loci uses internally. Raw Qloo payloads never leave the server. */

export const FAVORITE_TYPES = ["artist", "tv_show", "movie", "book", "podcast", "video_game"] as const;
export type FavoriteType = (typeof FAVORITE_TYPES)[number];
export type AnchorType = FavoriteType | "person" | "brand";

export const TYPE_LABEL: Record<AnchorType | "place" | "destination" | "locality", string> = {
  movie: "Film",
  tv_show: "TV",
  artist: "Music",
  video_game: "Game",
  book: "Book",
  podcast: "Podcast",
  brand: "Brand",
  person: "Person",
  place: "Place",
  destination: "Destination",
  locality: "City",
};

export type Favorite = {
  /** Qloo entity id when resolved, otherwise a local id */
  id: string;
  name: string;
  type: FavoriteType;
  image?: string | null;
  disambiguation?: string | null;
  resolved: boolean;
};

export type City = {
  id?: string | null;
  name: string;
  disambiguation?: string | null;
  lat?: number | null;
  lon?: number | null;
  resolved: boolean;
};

export type QEntity = {
  id: string;
  name: string;
  subtype: string | null;
  type: AnchorType | "place" | "destination" | "locality" | "other";
  image: string | null;
  popularity: number | null;
  affinity: number | null;
  disambiguation: string | null;
  description: string | null;
  lat: number | null;
  lon: number | null;
  geohash: string | null;
  address: string | null;
  tags: { id: string; name: string; type: string | null }[];
  /** input entity id -> normalized contribution score */
  explain: { entityId: string; score: number }[];
};

export type HeatCell = { lat: number; lon: number; geohash: string; affinity: number; affinityRank: number; popularity: number };
export type TasteTag = { id: string; name: string; subtype: string | null; affinity: number | null };
export type TrendPoint = { date: string; percentile: number | null; rank: number | null; rankVelocity: number | null; deltaPct: number | null };

/** One line in the request-to-result trace shown next to every comfort pick. */
export type TraceEntry = {
  step: string;
  endpoint: string;
  params: Record<string, string>;
  status: number | "error" | "skipped";
  results: number;
  ms: number;
  cached: boolean;
  note?: string;
};

export function typeFromUrn(urn: string | null | undefined): QEntity["type"] {
  if (!urn) return "other";
  const t = urn.replace("urn:entity:", "");
  if (t === "videogame") return "video_game";
  if (["movie", "tv_show", "artist", "video_game", "book", "podcast", "brand", "person", "place", "destination", "locality"].includes(t)) return t as QEntity["type"];
  return "other";
}

/** Qloo spells the video game type "videogame" in URNs (verified against /search and /v2/insights). */
export function urnFor(t: AnchorType | "place" | "destination" | "locality"): string {
  return t === "video_game" ? "urn:entity:videogame" : `urn:entity:${t}`;
}
