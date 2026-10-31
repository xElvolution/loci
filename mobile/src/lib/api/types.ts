/* Types for the loci /api/v1 contract (see ../../../../mobile-api.md). */

export type Role = "patient" | "caregiver" | "family" | string;
export type Action = "call_team" | "emergency";
export type PlanKind = "medication" | "care" | "exercise" | "appointment" | "milestone";
export type Metric = "mood" | "pain" | "sleep" | "appetite" | "energy";

export type User = { id: string; display_name: string; email: string | null; timezone: string; role_pref: string | null; is_demo: boolean };
export type AuthResult = { token: string; expires_at: string; user: User };
export type JourneyRef = { id: string; person_name: string; specialty: string; role: Role; is_current: boolean };
export type Me = { user: User; journeys: JourneyRef[]; current_journey_id: string | null };

export type CodeInfo = { valid: true; care_team_name: string; person_name: string; role: Role };

export type Contact = { care_team_name: string; care_team_phone: string; emergency_number: string };

export type TodayItem = {
  item_id: string;
  slot: string;
  kind: PlanKind;
  title: string;
  detail: string;
  why: string;
  how: string[];
  done: boolean;
};
export type Appointment = { title: string; date: string | null; time: string | null; location: string };
export type Today = {
  date: string;
  day: number;
  person_name: string;
  specialty: string;
  specialty_label: string;
  items: TodayItem[];
  progress: { done: number; total: number };
  checkin_done: boolean;
  streak: number;
  next_appointment: Appointment | null;
  plan_update: { at: string; text: string } | null;
  open_flags: number;
  contact: Contact;
};

export type PlanItem = {
  id: string;
  kind: PlanKind;
  title: string;
  detail: string;
  why: string;
  how: string | string[];
  times: string[];
  weekdays: number[] | null;
  start_day: number;
  end_day: number | null;
  day: number | null;
  at_time: string | null;
  location: string;
};
export type WarningSign = { id: string; text: string; action: Action };
export type Plan = { instructions: string; sent_at: string | null; updated_at: string | null; items: PlanItem[]; warning_signs: WarningSign[] };

export type CheckinValues = { mood: number; pain: number; sleep: number; appetite: number; energy: number };
export type Checkin = CheckinValues & { for_date: string; signs: string[]; note: string | null };
export type CheckinList = { today_done: boolean; checkins: Checkin[] };
export type CheckinInput = CheckinValues & { signs: string[]; note: string };
export type Flag = { source: "threshold" | "warning_sign"; action: Action; reason: string };
export type Escalation = { action: Action; message: string; care_team_phone: string; emergency_number: string };
export type CheckinResult = { flags: Flag[]; streak: number; escalation: Escalation | null };

export type Milestone = { id: string; title: string; day: number | null; reached: boolean };
export type TrendPoint = { date: string } & { [K in Metric]: number | null };
export type JourneyView = {
  day: number;
  horizon_days: number;
  discharge_date: string;
  streak: number;
  adherence_7d: number | null;
  milestones: Milestone[];
  appointments: Appointment[];
  trends: TrendPoint[];
};

export type Pick = { id: string; name: string; kind: string; image: string | null; subtitle: string | null; because: string[] | string | null };
export type ComfortSections = {
  soundtrack?: Pick[];
  screen?: Pick[];
  reading?: Pick[];
  meals?: Pick[];
  outings?: Pick[];
  cuisines?: { id: string; name: string }[];
};
export type GoodDayStep = { time?: string; title: string; detail?: string };
export type Comfort = {
  status: "ok" | "no_favorites" | "no_city" | "unavailable";
  label: string;
  sections: ComfortSections;
  generated_at: string | null;
  /** optional: a good-day plan when the server provides one */
  good_day?: GoodDayStep[] | { steps: GoodDayStep[] } | null;
};

export type ContactInfo = Contact & { team_on_loci: boolean; sharing_with_team: boolean };
export type Message = {
  id: string;
  side: "patient" | "team";
  kind: "message" | "question" | "update";
  body: string;
  created_at: string;
  resolved_at: string | null;
  name: string | null;
};

export type CircleMember = { id: string; name: string; role: Role; relation?: string | null; is_you?: boolean };
export type Circle = { members: CircleMember[]; invite_url?: string | null };
