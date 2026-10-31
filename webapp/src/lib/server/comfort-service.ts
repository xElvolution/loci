import "server-only";
import { httpTransport, qlooConfigured } from "./qloo-http";
import { tasteOf, type Journey } from "./repo";
import { buildComfort, EMPTY_SECTIONS, type Comfort } from "@/lib/care/comfort";

/** Comfort picks for a journey. Qloo responses are cached privately in Postgres by the transport. */
export async function comfortFor(journey: Journey): Promise<Comfort> {
  const taste = await tasteOf(journey.id);
  if (!qlooConfigured()) return { status: "unavailable", sections: EMPTY_SECTIONS, trace: [], generatedAt: new Date().toISOString() };
  try {
    return await buildComfort(httpTransport, {
      favorites: taste.favorites,
      city: journey.city,
      filters: taste.filters,
      kidSafe: taste.filters.includes("kid_safe"),
    });
  } catch {
    return { status: "unavailable", sections: EMPTY_SECTIONS, trace: [], generatedAt: new Date().toISOString() };
  }
}
