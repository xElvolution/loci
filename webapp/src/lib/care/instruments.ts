import type { SpecialtyId } from "./specialties";

/**
 * Outcome instruments a clinician can choose to track. loci stores only the total
 * score or measurement the clinician enters. It does not administer, score or
 * reproduce any questionnaire, and it never interprets a value.
 */
export type Instrument = {
  id: string;
  label: string;
  short: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  higherIsBetter: boolean;
  /** what is entered, in neutral words */
  entry: string;
  suggestedFor: SpecialtyId[];
};

export const INSTRUMENTS: Instrument[] = [
  { id: "barthel", label: "Barthel Index", short: "Barthel", unit: "points", min: 0, max: 100, step: 5, higherIsBetter: true, entry: "Total score, 0 to 100", suggestedFor: ["neuro", "elder", "orthopedics", "general"] },
  { id: "tug", label: "Timed Up and Go", short: "TUG", unit: "seconds", min: 0, max: 120, step: 0.1, higherIsBetter: false, entry: "Time in seconds", suggestedFor: ["orthopedics", "neuro", "elder"] },
  { id: "nprs", label: "Numeric pain rating", short: "Pain", unit: "0 to 10", min: 0, max: 10, step: 1, higherIsBetter: false, entry: "Score, 0 to 10", suggestedFor: ["orthopedics", "surgery", "oncology", "general", "maternity"] },
  { id: "mrs", label: "Modified Rankin Scale", short: "mRS", unit: "grade", min: 0, max: 6, step: 1, higherIsBetter: false, entry: "Grade, 0 to 6", suggestedFor: ["neuro"] },
  { id: "6mwt", label: "Six-minute walk distance", short: "6MWD", unit: "meters", min: 0, max: 1000, step: 1, higherIsBetter: true, entry: "Distance in meters", suggestedFor: ["cardiac", "respiratory", "orthopedics"] },
  { id: "knee_rom", label: "Knee flexion range", short: "Knee ROM", unit: "degrees", min: 0, max: 160, step: 1, higherIsBetter: true, entry: "Degrees of flexion", suggestedFor: ["orthopedics"] },
  { id: "phq9", label: "PHQ-9 total", short: "PHQ-9", unit: "points", min: 0, max: 27, step: 1, higherIsBetter: false, entry: "Total score, 0 to 27", suggestedFor: ["mental_health", "maternity", "general"] },
  { id: "gad7", label: "GAD-7 total", short: "GAD-7", unit: "points", min: 0, max: 21, step: 1, higherIsBetter: false, entry: "Total score, 0 to 21", suggestedFor: ["mental_health"] },
  { id: "epds", label: "Edinburgh Postnatal Depression Scale total", short: "EPDS", unit: "points", min: 0, max: 30, step: 1, higherIsBetter: false, entry: "Total score, 0 to 30", suggestedFor: ["maternity"] },
  { id: "weight", label: "Body weight", short: "Weight", unit: "kg", min: 0, max: 400, step: 0.1, higherIsBetter: true, entry: "Weight in kg", suggestedFor: ["pediatrics", "oncology", "cardiac"] },
];

export const CUSTOM_ID = "custom";

export const instrumentOf = (id: string) => INSTRUMENTS.find((i) => i.id === id) ?? null;

/** Suggested first, then the rest, so the picker is short for each specialty. */
export function instrumentsFor(specialty: string): { suggested: Instrument[]; other: Instrument[] } {
  const suggested = INSTRUMENTS.filter((i) => i.suggestedFor.includes(specialty as SpecialtyId));
  return { suggested, other: INSTRUMENTS.filter((i) => !suggested.includes(i)) };
}

/** Days at home without a readmission: from discharge, or from the end of the last readmission, to today. */
export function readmissionFreeDays(dischargeIso: string, todayIso: string, readmissions: { admitted_on: string; discharged_on: string | null }[]): { days: number; since: string; readmitted: boolean; inHospital: boolean } {
  const sorted = [...readmissions].sort((a, b) => a.admitted_on.localeCompare(b.admitted_on));
  const last = sorted.at(-1);
  if (last && !last.discharged_on) return { days: 0, since: last.admitted_on, readmitted: true, inHospital: true };
  const since = last?.discharged_on && last.discharged_on > dischargeIso ? last.discharged_on : dischargeIso;
  const days = Math.max(0, Math.round((Date.parse(`${todayIso}T00:00:00Z`) - Date.parse(`${since}T00:00:00Z`)) / 86400_000));
  return { days, since, readmitted: sorted.length > 0, inHospital: false };
}

/** Change from first to latest value, labelled by the direction the clinician's instrument counts as better. Never a judgement about the person. */
export function trendOf(values: number[], higherIsBetter: boolean): { delta: number | null; direction: "better" | "worse" | "same" | null } {
  if (values.length < 2) return { delta: null, direction: null };
  const delta = Math.round((values.at(-1)! - values[0]) * 10) / 10;
  if (delta === 0) return { delta, direction: "same" };
  return { delta, direction: delta > 0 === higherIsBetter ? "better" : "worse" };
}
