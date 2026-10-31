import { NextResponse } from "next/server";
import { liveTaste } from "@/lib/server/live-taste";

export const dynamic = "force-dynamic";

/**
 * Public, read-only sample of Qloo affinity for the landing site: two fixed
 * public favorites and a city. No user data in or out. Responses are cached.
 */
export async function GET() {
  const data = await liveTaste();
  return NextResponse.json(data ?? { favs: [], picks: [] }, { headers: { "Cache-Control": "public, max-age=600, s-maxage=3600" } });
}
