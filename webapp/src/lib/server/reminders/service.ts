import "server-only";
import { one, q } from "../db";
import { appOrigin } from "../origin";
import { checkinDue, reminderText } from "@/lib/care/reminders";
import { nowMinutesIn, todayIn } from "@/lib/care/dates";
import { providerFor, type Channel, type SendResult } from "./provider";

export type ReminderPrefs = { checkin_time: string | null; steps: boolean; in_app: boolean; sms: boolean; whatsapp: boolean; phone: string | null; updated_at: Date | null };
export const DEFAULT_PREFS: ReminderPrefs = { checkin_time: null, steps: false, in_app: true, sms: false, whatsapp: false, phone: null, updated_at: null };

export async function prefsOf(userId: string, journeyId: string): Promise<ReminderPrefs> {
  return (await one<ReminderPrefs>("SELECT checkin_time, steps, in_app, sms, whatsapp, phone, updated_at FROM reminder_prefs WHERE user_id = $1 AND journey_id = $2", [userId, journeyId])) ?? DEFAULT_PREFS;
}

export async function savePrefs(userId: string, journeyId: string, p: Omit<ReminderPrefs, "updated_at">) {
  const phone = p.sms || p.whatsapp ? p.phone : null; // never keep a number nobody is using
  await q(
    `INSERT INTO reminder_prefs (user_id, journey_id, checkin_time, steps, in_app, sms, whatsapp, phone, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())
     ON CONFLICT (user_id, journey_id) DO UPDATE SET checkin_time = $3, steps = $4, in_app = $5, sms = $6, whatsapp = $7, phone = $8, updated_at = now()`,
    [userId, journeyId, p.checkin_time, p.steps, p.in_app, p.sms, p.whatsapp, phone],
  );
}

export type Delivery = { channel: Channel; kind: string; for_date: string; status: "sent" | "failed"; error: string | null; created_at: Date };
export async function recentDeliveries(userId: string, journeyId: string, limit = 5): Promise<Delivery[]> {
  return q<Delivery>(
    "SELECT channel, kind, to_char(for_date, 'YYYY-MM-DD') AS for_date, status, error, created_at FROM reminder_deliveries WHERE user_id = $1 AND journey_id = $2 ORDER BY created_at DESC LIMIT $3",
    [userId, journeyId, limit],
  );
}

/** Sends through the real provider and logs the real result. If the provider is not configured nothing is sent or logged. */
async function deliver(userId: string, journeyId: string, channel: Channel, kind: "checkin" | "test", forDate: string, to: string, body: string): Promise<SendResult> {
  const provider = providerFor(channel);
  if (!provider.configured()) return { ok: false, error: "not_connected" };
  const r = await provider.send(to, body);
  await q(
    "INSERT INTO reminder_deliveries (user_id, journey_id, channel, kind, for_date, status, provider, provider_id, error) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING",
    [userId, journeyId, channel, kind, forDate, r.ok ? "sent" : "failed", provider.name, r.ok ? r.id : null, r.ok ? null : r.error],
  );
  return r;
}

export async function sendTest(userId: string, journey: { id: string; person_name: string; timezone: string }, channel: Channel): Promise<SendResult> {
  const p = await prefsOf(userId, journey.id);
  if (!p.phone || !p[channel]) return { ok: false, error: "Switch this channel on and save a phone number first." };
  return deliver(userId, journey.id, channel, "test", todayIn(journey.timezone), p.phone, reminderText("test", journey.person_name, `${await appOrigin()}/app`));
}

/** Finds due check-in reminders for SMS and WhatsApp and sends each at most once a day. Run by a scheduler with CRON_SECRET. */
export async function runDueReminders(now = new Date()): Promise<{ due: number; sent: number; failed: number; not_connected: number }> {
  const rows = await q<{ user_id: string; journey_id: string; checkin_time: string; sms: boolean; whatsapp: boolean; phone: string; timezone: string; person_name: string }>(
    `SELECT p.user_id, p.journey_id, p.checkin_time, p.sms, p.whatsapp, p.phone, j.timezone, j.person_name
       FROM reminder_prefs p JOIN journeys j ON j.id = p.journey_id
       JOIN circle_members cm ON cm.journey_id = j.id AND cm.user_id = p.user_id
      WHERE p.checkin_time IS NOT NULL AND p.phone IS NOT NULL AND (p.sms OR p.whatsapp)`,
  );
  const out = { due: 0, sent: 0, failed: 0, not_connected: 0 };
  const origin = process.env.APP_ORIGIN ?? "";
  for (const r of rows) {
    const today = todayIn(r.timezone, now);
    const done = await one("SELECT 1 FROM checkins WHERE journey_id = $1 AND for_date = $2", [r.journey_id, today]);
    if (!checkinDue({ checkinTime: r.checkin_time, nowMinutes: nowMinutesIn(r.timezone, now), checkedInToday: !!done })) continue;
    for (const channel of (["sms", "whatsapp"] as const).filter((c) => r[c])) {
      const already = await one("SELECT 1 FROM reminder_deliveries WHERE user_id = $1 AND journey_id = $2 AND channel = $3 AND kind = 'checkin' AND for_date = $4 AND status = 'sent'", [r.user_id, r.journey_id, channel, today]);
      if (already) continue;
      out.due++;
      const res = await deliver(r.user_id, r.journey_id, channel, "checkin", today, r.phone, reminderText("checkin", r.person_name, `${origin}/app/checkin`));
      if (res.ok) out.sent++;
      else if (res.error === "not_connected") out.not_connected++;
      else out.failed++;
    }
  }
  return out;
}
