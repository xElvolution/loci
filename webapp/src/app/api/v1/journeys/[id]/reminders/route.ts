import { z } from "zod";
import { prefsOf, savePrefs } from "@/lib/server/reminders/service";
import { connectedChannels } from "@/lib/server/reminders/provider";
import { normalisePhone } from "@/lib/care/reminders";
import { ApiError, apiJourney, body, handle, json, preflight, type Ctx } from "@/lib/server/api";

export const OPTIONS = preflight;

const view = (p: Awaited<ReturnType<typeof prefsOf>>) => {
  const c = connectedChannels();
  return {
    checkin_time: p.checkin_time,
    steps: p.steps,
    in_app: p.in_app,
    sms: p.sms && c.sms,
    whatsapp: p.whatsapp && c.whatsapp,
    phone: p.phone,
    channels: { sms: c.sms ? "connected" : "not_connected", whatsapp: c.whatsapp ? "connected" : "not_connected" },
  };
};

export const GET = handle(async (req: Request, ctx: Ctx) => {
  const { user, journey } = await apiJourney(req, ctx);
  return json(view(await prefsOf(user.id, journey.id)));
});

const Input = z.object({
  checkin_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "checkin_time is HH:MM").nullable(),
  steps: z.boolean().default(false),
  in_app: z.boolean().default(true),
  sms: z.boolean().default(false),
  whatsapp: z.boolean().default(false),
  phone: z.string().max(40).nullable().default(null),
});

/** Saves this person's reminder preferences. SMS or WhatsApp can only be switched on when that channel is connected. */
export const PUT = handle(async (req: Request, ctx: Ctx) => {
  const { user, journey } = await apiJourney(req, ctx);
  const b = await body(req, Input);
  const c = connectedChannels();
  if ((b.sms && !c.sms) || (b.whatsapp && !c.whatsapp)) throw new ApiError(409, "not_connected", "That channel is not connected on this server. Nothing can be sent.");
  const phone = b.phone ? normalisePhone(b.phone) : null;
  if ((b.sms || b.whatsapp) && !phone) throw new ApiError(400, "invalid", "Add a mobile number with the country code, like +1 212 555 0100.");
  await savePrefs(user.id, journey.id, { checkin_time: b.checkin_time, steps: b.steps, in_app: b.in_app, sms: b.sms, whatsapp: b.whatsapp, phone });
  return json(view(await prefsOf(user.id, journey.id)));
});
