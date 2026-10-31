import * as repo from "@/lib/server/repo";
import { z } from "zod";
import { ApiError, apiUser, body, handle, json, noContent, preflight, publicUser } from "@/lib/server/api";
import { endDemoUser } from "@/lib/server/demo-end";

export const OPTIONS = preflight;
export const GET = handle(async (req: Request) => {
  const u = await apiUser(req);
  const journeys = await repo.listJourneys(u.id);
  const current = journeys.some((j) => j.id === u.current_journey_id) ? u.current_journey_id : (journeys[0]?.id ?? null);
  return json({
    user: publicUser(u),
    journeys: journeys.map((j) => ({ id: j.id, person_name: j.person_name, specialty: j.specialty, role: j.role, is_current: j.id === current })),
    current_journey_id: current,
  });
});

/** Deletes the account and every journey it owns. Body `{ "confirm": "DELETE" }`. Revokes all tokens. */
export const DELETE = handle(async (req: Request) => {
  const u = await apiUser(req);
  const b = await body(req, z.object({ confirm: z.string() }));
  if (b.confirm.trim().toUpperCase() !== "DELETE") throw new ApiError(400, "confirm_required", "Send confirm: DELETE to erase the account.");
  if (u.is_demo) await endDemoUser(u.id);
  else await repo.deleteUser(u.id);
  return noContent();
});
