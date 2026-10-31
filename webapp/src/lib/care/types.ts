export type Metric = "mood" | "pain" | "sleep" | "appetite" | "energy";
export const METRICS: Metric[] = ["mood", "pain", "sleep", "appetite", "energy"];

export type PlanKind = "medication" | "care" | "exercise" | "appointment" | "milestone";
export type Action = "call_team" | "emergency";

export type PlanItem = {
  id: string;
  kind: PlanKind;
  title: string;
  detail: string;
  times: string[];
  weekdays: number[] | null;
  start_day: number;
  end_day: number | null;
  day: number | null;
  at_time: string | null;
  location: string;
  /** why the team asked, in their words */
  why?: string;
  /** how to do it, in their words */
  how?: string;
  sort: number;
  reached_at: Date | string | null;
  /** came from a structure template and still needs the clinician's own words */
  needs_review?: boolean;
};

export type WarningSign = { id: string; text: string; action: Action; sort: number };
export type Threshold = { id: string; metric: Metric; op: "gte" | "lte"; value: number; days: number; action: Action };

export type Checkin = {
  id?: string;
  for_date: string;
  mood: number;
  pain: number;
  sleep: number;
  appetite: number;
  energy: number;
  signs: string[];
  note?: string;
};

export type TaskLog = { item_id: string; for_date: string; slot: string };

export type FlagResult = { source: "threshold" | "warning_sign"; refId: string; action: Action; reason: string };

export const METRIC_META: Record<Metric, { label: string; min: number; max: number; low: string; high: string; higherIsBetter: boolean }> = {
  mood: { label: "Mood", min: 1, max: 5, low: "Very low", high: "Great", higherIsBetter: true },
  pain: { label: "Pain", min: 0, max: 10, low: "None", high: "Worst", higherIsBetter: false },
  sleep: { label: "Sleep", min: 1, max: 5, low: "Barely slept", high: "Rested", higherIsBetter: true },
  appetite: { label: "Appetite", min: 1, max: 5, low: "None", high: "Hungry", higherIsBetter: true },
  energy: { label: "Energy", min: 1, max: 5, low: "Drained", high: "Lively", higherIsBetter: true },
};
