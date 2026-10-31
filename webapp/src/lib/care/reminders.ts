/** Pure reminder rules. */
export const E164 = /^\+[1-9]\d{7,14}$/;

/** Normalises a typed phone number to E.164, or null. Spaces, dashes, dots and brackets are dropped. */
export function normalisePhone(raw: string): string | null {
  const s = raw.trim().replace(/[\s\-().]/g, "");
  const v = s.startsWith("00") ? `+${s.slice(2)}` : s;
  return E164.test(v) ? v : null;
}

/** The check-in reminder is due once its time has passed today and today's check-in is not done. */
export function checkinDue(p: { checkinTime: string | null; nowMinutes: number; checkedInToday: boolean }): boolean {
  if (!p.checkinTime || p.checkedInToday) return false;
  const [h, m] = p.checkinTime.split(":").map(Number);
  return p.nowMinutes >= h * 60 + m;
}

/** Message text. Deliberately says nothing about health, the plan or the specialty: a phone lock screen may show it. */
export function reminderText(kind: "checkin" | "test", name: string, url: string): string {
  return kind === "test"
    ? `loci: this is a test message. Reminders for ${name} will arrive here. ${url}`
    : `loci: a gentle reminder for ${name}'s daily check-in. ${url}`;
}
