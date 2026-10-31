import { apiJourney, handle, json, preflight, type Ctx } from "@/lib/server/api";
import { comfortFor } from "@/lib/server/comfort-service";
import type { Pick } from "@/lib/care/comfort";

const pick = (p: Pick) => ({ id: p.id, name: p.name, kind: p.kind, image: p.image, subtitle: p.subtitle, because: p.because });

export const OPTIONS = preflight;
export const GET = handle(async (req: Request, ctx: Ctx) => {
  const { journey } = await apiJourney(req, ctx);
  const c = await comfortFor(journey);
  const s = c.sections;
  return json({
    status: c.status,
    label: "Aggregate taste affinity from Qloo. Not advice.",
    sections: { soundtrack: s.soundtrack.map(pick), screen: s.screen.map(pick), reading: s.reading.map(pick), meals: s.meals.map(pick), outings: s.outings.map(pick), cuisines: s.cuisines.map((x) => ({ id: x.id, name: x.name })) },
    generated_at: c.generatedAt,
  });
});
