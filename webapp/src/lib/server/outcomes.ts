import "server-only";
import { one, q } from "./db";

export type Measure = { id: string; instrument: string; label: string; unit: string; min_value: number; max_value: number; higher_is_better: boolean; target: number | null; created_at: Date };
export type MeasureValue = { id: string; measure_id: string; value: number; measured_on: string; note: string; by_name: string | null };
export type Readmission = { id: string; admitted_on: string; discharged_on: string | null; note: string; by_name: string | null };

const num = <T extends Record<string, unknown>>(r: T, keys: (keyof T)[]) => {
  for (const k of keys) if (r[k] !== null && r[k] !== undefined) (r as Record<string, unknown>)[k as string] = Number(r[k]);
  return r;
};

export async function measuresOf(journeyId: string): Promise<Measure[]> {
  const rows = await q<Measure>("SELECT id, instrument, label, unit, min_value, max_value, higher_is_better, target, created_at FROM outcome_measures WHERE journey_id = $1 ORDER BY created_at", [journeyId]);
  return rows.map((r) => num(r, ["min_value", "max_value", "target"]));
}

export async function valuesOf(journeyId: string): Promise<MeasureValue[]> {
  const rows = await q<MeasureValue>(
    `SELECT v.id, v.measure_id, v.value, to_char(v.measured_on, 'YYYY-MM-DD') AS measured_on, v.note, u.display_name AS by_name
       FROM outcome_values v LEFT JOIN users u ON u.id = v.by_user WHERE v.journey_id = $1 ORDER BY v.measured_on, v.created_at`,
    [journeyId],
  );
  return rows.map((r) => num(r, ["value"]));
}

export async function readmissionsOf(journeyId: string): Promise<Readmission[]> {
  return q<Readmission>(
    `SELECT r.id, to_char(r.admitted_on, 'YYYY-MM-DD') AS admitted_on, to_char(r.discharged_on, 'YYYY-MM-DD') AS discharged_on, r.note, u.display_name AS by_name
       FROM readmissions r LEFT JOIN users u ON u.id = r.by_user WHERE r.journey_id = $1 ORDER BY r.admitted_on`,
    [journeyId],
  );
}

export async function addMeasure(journeyId: string, userId: string, m: { instrument: string; label: string; unit: string; min: number; max: number; higherIsBetter: boolean; target: number | null }) {
  const dup = await one("SELECT 1 FROM outcome_measures WHERE journey_id = $1 AND lower(label) = lower($2)", [journeyId, m.label]);
  if (dup) return null;
  return one<{ id: string }>(
    "INSERT INTO outcome_measures (journey_id, instrument, label, unit, min_value, max_value, higher_is_better, target, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id",
    [journeyId, m.instrument, m.label, m.unit, m.min, m.max, m.higherIsBetter, m.target, userId],
  );
}

export async function removeMeasure(journeyId: string, id: string) {
  await q("DELETE FROM outcome_measures WHERE id = $1 AND journey_id = $2", [id, journeyId]);
}

export async function measureById(journeyId: string, id: string) {
  const r = await one<Measure>("SELECT id, instrument, label, unit, min_value, max_value, higher_is_better, target, created_at FROM outcome_measures WHERE id = $1 AND journey_id = $2", [id, journeyId]);
  return r ? num(r, ["min_value", "max_value", "target"]) : null;
}

export async function addValue(journeyId: string, measureId: string, userId: string, value: number, on: string, note: string) {
  await q("INSERT INTO outcome_values (measure_id, journey_id, value, measured_on, note, by_user) VALUES ($1,$2,$3,$4,$5,$6)", [measureId, journeyId, value, on, note, userId]);
}

export async function removeValue(journeyId: string, id: string) {
  await q("DELETE FROM outcome_values WHERE id = $1 AND journey_id = $2", [id, journeyId]);
}

export async function addReadmission(journeyId: string, userId: string, admitted: string, discharged: string | null, note: string) {
  await q("INSERT INTO readmissions (journey_id, admitted_on, discharged_on, note, by_user) VALUES ($1,$2,$3,$4,$5)", [journeyId, admitted, discharged, note, userId]);
}

export async function closeReadmission(journeyId: string, id: string, discharged: string) {
  await q("UPDATE readmissions SET discharged_on = $3 WHERE id = $1 AND journey_id = $2 AND admitted_on <= $3", [id, journeyId, discharged]);
}

export async function removeReadmission(journeyId: string, id: string) {
  await q("DELETE FROM readmissions WHERE id = $1 AND journey_id = $2", [id, journeyId]);
}

/** Team-wide summary for the clinic list: patients with any outcome data and readmissions in the last 30 days. */
export async function orgOutcomeSummary(orgId: string) {
  return one<{ tracked: number; values_30d: number; readmissions_30d: number }>(
    `SELECT
       (SELECT COUNT(DISTINCT m.journey_id)::int FROM outcome_measures m JOIN journeys j ON j.id = m.journey_id WHERE j.org_id = $1) AS tracked,
       (SELECT COUNT(*)::int FROM outcome_values v JOIN journeys j ON j.id = v.journey_id WHERE j.org_id = $1 AND v.measured_on > now() - interval '30 days') AS values_30d,
       (SELECT COUNT(*)::int FROM readmissions r JOIN journeys j ON j.id = r.journey_id WHERE j.org_id = $1 AND r.admitted_on > now() - interval '30 days') AS readmissions_30d`,
    [orgId],
  );
}
