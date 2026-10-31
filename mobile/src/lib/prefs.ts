import { secure } from "./storage";

/** Reminder preferences. Kept on this phone; the v1 API has no reminder endpoint yet. */
export type ReminderPrefs = { plan: boolean; checkin: boolean; checkinTime: string; quietHours: boolean; messages: boolean };
export const DEFAULT_PREFS: ReminderPrefs = { plan: true, checkin: true, checkinTime: "09:00", quietHours: true, messages: true };
export const CHECKIN_TIMES = ["08:00", "09:00", "12:00", "18:00", "20:00"];
const KEY = "loci.reminders";

export function parsePrefs(raw: string | null): ReminderPrefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    const p = JSON.parse(raw) as Partial<ReminderPrefs>;
    return {
      plan: typeof p.plan === "boolean" ? p.plan : DEFAULT_PREFS.plan,
      checkin: typeof p.checkin === "boolean" ? p.checkin : DEFAULT_PREFS.checkin,
      checkinTime: typeof p.checkinTime === "string" && CHECKIN_TIMES.includes(p.checkinTime) ? p.checkinTime : DEFAULT_PREFS.checkinTime,
      quietHours: typeof p.quietHours === "boolean" ? p.quietHours : DEFAULT_PREFS.quietHours,
      messages: typeof p.messages === "boolean" ? p.messages : DEFAULT_PREFS.messages,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}
export const loadPrefs = async () => parsePrefs(await secure.get(KEY));
export const savePrefs = (p: ReminderPrefs) => secure.set(KEY, JSON.stringify(p));
