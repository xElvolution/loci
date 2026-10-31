/** Small, pure formatting helpers (unit tested). */

export function prettyTime(hhmm: string | null | undefined): string {
  if (!hhmm || hhmm === "any") return "Any time";
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  const ap = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${String(m).padStart(2, "0")} ${ap}` : `${h12} ${ap}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function prettyDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, mo, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !mo || !d) return iso;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return `${DAYS[dt.getUTCDay()]} ${d} ${MONTHS[mo - 1]}`;
}

export function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function firstName(name: string | null | undefined): string {
  return (name ?? "").trim().split(/\s+/)[0] || "there";
}

/** tel: link with only digits and a leading plus. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function slotMinutes(slot: string): number {
  if (slot === "any") return 24 * 60;
  const [h, m] = slot.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function relativeTime(iso: string, now: Date = new Date()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.round((now.getTime() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

/** Splits how-to text into steps when the server sends a single string. */
export function howSteps(how: string | string[] | null | undefined): string[] {
  if (!how) return [];
  const list = Array.isArray(how) ? how : how.split(/\r?\n/);
  return list.map((s) => s.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim()).filter(Boolean);
}

/** "Because of A and B" from the favorites a Qloo pick is tied to. */
export function becauseLine(b: string[] | string | null | undefined): string | null {
  const list = Array.isArray(b) ? b.filter(Boolean) : b ? [b] : [];
  return list.length ? `Because of ${list.slice(0, 2).join(" and ")}` : null;
}
