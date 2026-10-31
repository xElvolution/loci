/**
 * Research layer aggregation. Pure: takes per-record rows that still carry an internal journey key,
 * returns grouped cells with no keys at all. Any cell with fewer than k distinct journeys is suppressed,
 * never rounded or merged, so a small group cannot reveal one person.
 */
export const DEFAULT_K = 10;
export const MAX_WEEK = 12;

export type CheckinRow = { j: string; specialty: string; week: number; mood: number; pain: number; sleep: number; energy: number; flagged: boolean };
export type OutcomeRow = { j: string; specialty: string; instrument: string; week: number; value: number };
export type CohortRow = { j: string; specialty: string; readmitted: boolean };

export type CheckinCell = { specialty: string; week: string; journeys: number; checkins: number; mood: number; pain: number; sleep: number; energy: number; flaggedShare: number };
export type OutcomeCell = { specialty: string; instrument: string; week: string; journeys: number; values: number; mean: number };
export type CohortCell = { specialty: string; journeys: number; readmittedShare: number };
export type Aggregate = { k: number; cohort: number; checkins: CheckinCell[]; outcomes: OutcomeCell[]; cohorts: CohortCell[]; suppressed: number };

/** Week of recovery, 1 based, relative to discharge. Weeks past MAX_WEEK are pooled so late stragglers are not singled out. */
export function weekLabel(week: number): string {
  if (week < 1) return "before discharge";
  return week > MAX_WEEK ? `${MAX_WEEK + 1}+` : String(week);
}
export const weekOf = (dayFromDischarge: number) => (dayFromDischarge < 0 ? 0 : Math.floor(dayFromDischarge / 7) + 1);

const mean = (xs: number[]) => Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
const share = (n: number, d: number) => Math.round((n / d) * 100) / 100;

function group<T>(rows: T[], key: (r: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const k = key(r);
    const list = m.get(k);
    if (list) list.push(r);
    else m.set(k, [r]);
  }
  return m;
}

export function aggregate(input: { checkins: CheckinRow[]; outcomes: OutcomeRow[]; cohort: CohortRow[] }, k = DEFAULT_K): Aggregate {
  if (!Number.isInteger(k) || k < 2) throw new Error("k must be an integer of at least 2");
  let suppressed = 0;
  const distinct = (rows: { j: string }[]) => new Set(rows.map((r) => r.j)).size;

  const checkins: CheckinCell[] = [];
  for (const [key, rows] of group(input.checkins, (r) => `${r.specialty}|${weekLabel(r.week)}`)) {
    const n = distinct(rows);
    if (n < k) { suppressed++; continue; }
    const [specialty, week] = key.split("|");
    checkins.push({ specialty, week, journeys: n, checkins: rows.length, mood: mean(rows.map((r) => r.mood)), pain: mean(rows.map((r) => r.pain)), sleep: mean(rows.map((r) => r.sleep)), energy: mean(rows.map((r) => r.energy)), flaggedShare: share(rows.filter((r) => r.flagged).length, rows.length) });
  }

  const outcomes: OutcomeCell[] = [];
  for (const [key, rows] of group(input.outcomes, (r) => `${r.specialty}|${r.instrument}|${weekLabel(r.week)}`)) {
    const n = distinct(rows);
    if (n < k) { suppressed++; continue; }
    const [specialty, instrument, week] = key.split("|");
    outcomes.push({ specialty, instrument, week, journeys: n, values: rows.length, mean: mean(rows.map((r) => r.value)) });
  }

  const cohorts: CohortCell[] = [];
  for (const [specialty, rows] of group(input.cohort, (r) => r.specialty)) {
    const n = distinct(rows);
    if (n < k) { suppressed++; continue; }
    cohorts.push({ specialty, journeys: n, readmittedShare: share(rows.filter((r) => r.readmitted).length, n) });
  }

  const order = (w: string) => (w === "before discharge" ? 0 : w.endsWith("+") ? 99 : Number(w));
  checkins.sort((a, b) => a.specialty.localeCompare(b.specialty) || order(a.week) - order(b.week));
  outcomes.sort((a, b) => a.specialty.localeCompare(b.specialty) || a.instrument.localeCompare(b.instrument) || order(a.week) - order(b.week));
  cohorts.sort((a, b) => a.specialty.localeCompare(b.specialty));
  return { k, cohort: distinct(input.cohort), checkins, outcomes, cohorts, suppressed };
}

const cell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** One CSV with a table column, aggregate rows only. */
export function toCsv(a: Aggregate): string {
  const lines = [["table", "specialty", "measure", "week_of_recovery", "journeys", "records", "mean_or_share", "mood_mean", "pain_mean", "sleep_mean", "energy_mean"].join(",")];
  for (const c of a.cohorts) lines.push(["cohort", c.specialty, "readmitted_share", "", c.journeys, c.journeys, c.readmittedShare, "", "", "", ""].map(cell).join(","));
  for (const c of a.checkins) lines.push(["checkins", c.specialty, "flagged_share", c.week, c.journeys, c.checkins, c.flaggedShare, c.mood, c.pain, c.sleep, c.energy].map(cell).join(","));
  for (const c of a.outcomes) lines.push(["outcomes", c.specialty, c.instrument, c.week, c.journeys, c.values, c.mean, "", "", "", ""].map(cell).join(","));
  lines.push(`# k=${a.k}; cells with fewer than ${a.k} journeys suppressed: ${a.suppressed}; consenting cohort: ${a.cohort >= a.k ? a.cohort : `fewer than ${a.k}`}`);
  return lines.join("\n") + "\n";
}
