import "server-only";
import { one, q } from "./db";
import { aggregate, DEFAULT_K, weekOf, type Aggregate, type CheckinRow, type CohortRow, type OutcomeRow } from "@/lib/care/research";
import { CUSTOM_ID } from "@/lib/care/instruments";

/** k comes from RESEARCH_K when set (never below 5), else 10. */
export function researchK(): number {
  const n = Number(process.env.RESEARCH_K);
  return Number.isInteger(n) && n >= 5 ? n : DEFAULT_K;
}

// Included: journeys in this team that share with the team AND have the separate research consent on.
const INCLUDED = "j.org_id = $1 AND j.consent_org AND j.research_consent";

/** Builds the aggregate. Journey ids are used only inside this function to count distinct people, then dropped. */
export async function orgResearch(orgId: string): Promise<Aggregate> {
  const [cohort, checkins, outcomes] = await Promise.all([
    q<{ j: string; specialty: string; readmitted: boolean }>(
      `SELECT j.id AS j, j.specialty, EXISTS (SELECT 1 FROM readmissions r WHERE r.journey_id = j.id) AS readmitted FROM journeys j WHERE ${INCLUDED}`,
      [orgId],
    ),
    q<{ j: string; specialty: string; d: number; mood: number; pain: number; sleep: number; energy: number; flagged: boolean }>(
      `SELECT j.id AS j, j.specialty, (c.for_date - j.discharge_date) AS d, c.mood, c.pain, c.sleep, c.energy,
              EXISTS (SELECT 1 FROM flags f WHERE f.checkin_id = c.id) AS flagged
         FROM checkins c JOIN journeys j ON j.id = c.journey_id WHERE ${INCLUDED}`,
      [orgId],
    ),
    q<{ j: string; specialty: string; instrument: string; d: number; value: string }>(
      `SELECT j.id AS j, j.specialty, m.instrument, (v.measured_on - j.discharge_date) AS d, v.value
         FROM outcome_values v JOIN outcome_measures m ON m.id = v.measure_id JOIN journeys j ON j.id = v.journey_id
        WHERE ${INCLUDED} AND m.instrument <> $2`,
      [orgId, CUSTOM_ID],
    ),
  ]);
  const cRows: CheckinRow[] = checkins.map((r) => ({ j: r.j, specialty: r.specialty, week: weekOf(Number(r.d)), mood: r.mood, pain: r.pain, sleep: r.sleep, energy: r.energy, flagged: r.flagged }));
  const oRows: OutcomeRow[] = outcomes.map((r) => ({ j: r.j, specialty: r.specialty, instrument: r.instrument, week: weekOf(Number(r.d)), value: Number(r.value) }));
  const coRows: CohortRow[] = cohort.map((r) => ({ j: r.j, specialty: r.specialty, readmitted: r.readmitted }));
  return aggregate({ checkins: cRows, outcomes: oRows, cohort: coRows }, researchK());
}

export async function logResearchAccess(orgId: string, userId: string, kind: "view" | "export", a: Aggregate) {
  const shown = a.checkins.length + a.outcomes.length + a.cohorts.length;
  await q("INSERT INTO research_access_log (org_id, user_id, kind, cohort, cells_shown, cells_suppressed) VALUES ($1, $2, $3, $4, $5, $6)", [orgId, userId, kind, a.cohort, shown, a.suppressed]);
}

export type AccessEntry = { kind: string; created_at: Date; name: string | null; cells_shown: number; cells_suppressed: number };
export async function researchAccessLog(orgId: string, limit = 10): Promise<AccessEntry[]> {
  return q<AccessEntry>(
    `SELECT l.kind, l.created_at, u.display_name AS name, l.cells_shown, l.cells_suppressed FROM research_access_log l LEFT JOIN users u ON u.id = l.user_id WHERE l.org_id = $1 ORDER BY l.created_at DESC LIMIT $2`,
    [orgId, limit],
  );
}

export async function setResearchConsent(journeyId: string, userId: string, granted: boolean) {
  await q("UPDATE journeys SET research_consent = $2, research_consent_at = CASE WHEN $2 THEN now() END WHERE id = $1", [journeyId, granted]);
  await q("INSERT INTO consent_log (journey_id, user_id, scope, granted) VALUES ($1, $2, 'research', $3)", [journeyId, userId, granted]);
}

export async function researchConsentOf(journeyId: string): Promise<{ research_consent: boolean; research_consent_at: Date | null } | null> {
  return one("SELECT research_consent, research_consent_at FROM journeys WHERE id = $1", [journeyId]);
}
