import { z } from "zod";
import * as repo from "@/lib/server/repo";
import { rateLimit } from "@/lib/server/rate-limit";
import { ApiError, apiJourney, body, handle, json, preflight, refreshWeb, type Ctx } from "@/lib/server/api";
import { messageView } from "@/lib/server/api-views";
import { patientMessage } from "@/lib/server/patient-service";

const schema = z.object({ body: z.string().max(4000), kind: z.enum(["message", "question"]).default("message") });

export const OPTIONS = preflight;
export const GET = handle(async (req: Request, ctx: Ctx) => {
  const { user, journey } = await apiJourney(req, ctx);
  const messages = await repo.messagesOf(journey.id);
  await repo.markAskSeen(journey.id, user.id);
  return json({ messages: messages.map(messageView) });
});

export const POST = handle(async (req: Request, ctx: Ctx) => {
  const { user, access, journey } = await apiJourney(req, ctx);
  if (!journey.org_id) throw new ApiError(403, "no_team", "This journey is not connected to a care team on loci. Call them on the number in your plan.");
  const p = await body(req, schema);
  if (!rateLimit(`msg:${user.id}`, 60, 3600_000).ok) throw new ApiError(429, "rate_limited", "Too many messages in an hour.");
  const err = await patientMessage(journey, user.id, access, p.body, p.kind);
  if (err) throw new ApiError(err.startsWith("Messages to the care team") ? 403 : 400, err.startsWith("Messages to the care team") ? "forbidden" : "invalid", err);
  refreshWeb();
  const last = (await repo.messagesOf(journey.id, 5)).filter((m) => m.user_id === user.id).at(-1);
  return json({ message: last ? messageView(last) : null }, 201);
});
