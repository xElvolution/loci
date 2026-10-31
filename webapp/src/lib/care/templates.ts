import type { Action, Metric, PlanKind } from "./types";
import type { SpecialtyId } from "./specialties";

/**
 * Plan templates. A template is structure: the sections a team usually fills in,
 * with prompts. Built-in templates carry no medicines, doses, exercises, limits or
 * warning signs. Every item they add is marked "needs your words" and the plan cannot
 * be sent until a clinician has written each one. Team templates are saved by a
 * clinician from their own plans, so they carry that team's own words.
 */
export type TemplateItem = {
  kind: PlanKind;
  title: string;
  detail: string;
  why: string;
  how: string;
  times: string[];
  weekdays: number[] | null;
  start_day: number;
  end_day: number | null;
  day: number | null;
  at_time: string | null;
  location: string;
  needs_review?: boolean;
};
export type TemplateBody = {
  instructions: string;
  items: TemplateItem[];
  milestones: { title: string; day: number | null }[];
  signs: { text: string; action: Action }[];
  thresholds: { metric: Metric; op: "gte" | "lte"; value: number; days: number; action: Action }[];
  measures: string[];
};
export type BuiltinTemplate = { id: string; name: string; description: string; specialty: SpecialtyId; horizonDays: number; ledBy: "patient" | "caregiver"; body: TemplateBody };

const slot = (kind: PlanKind, title: string, prompt: string, extra: Partial<TemplateItem> = {}): TemplateItem => ({
  kind,
  title,
  detail: prompt,
  why: "",
  how: "",
  times: [],
  weekdays: null,
  start_day: 0,
  end_day: null,
  day: null,
  at_time: null,
  location: "",
  needs_review: true,
  ...extra,
});

export const BUILTIN_TEMPLATES: BuiltinTemplate[] = [
  {
    id: "builtin:stroke-rehab",
    name: "Stroke rehabilitation at home",
    description: "Sections for a multidisciplinary stroke team: medicines, daily support routines, physio, occupational and speech therapy home practice, reviews, and family milestones.",
    specialty: "neuro",
    horizonDays: 120,
    ledBy: "caregiver",
    body: {
      instructions: "",
      items: [
        slot("medication", "Medicines from the discharge list", "Add one item per medicine, with the name, amount and times exactly as prescribed, then remove this one."),
        slot("care", "Positioning and moving safely", "Write how to position, transfer and move as the physiotherapist or nurse showed the family."),
        slot("care", "Mealtimes and drinks", "Write any texture, posture or supervision guidance from the speech and language therapist, or remove this item."),
        slot("care", "Communication support", "Write the communication aids or approaches the speech and language therapist recommended."),
        slot("care", "Daily safety and skin checks", "Write the checks the team asked the family to do each day, or remove this item."),
        slot("exercise", "Physiotherapy home program", "Write the exercises, repetitions, holds and limits the physiotherapist set."),
        slot("exercise", "Occupational therapy home practice", "Write the daily tasks or hand practice the occupational therapist set."),
        slot("exercise", "Speech and language home practice", "Write the practice the speech and language therapist set, and how often."),
        slot("appointment", "Community therapy review", "Add the date, time and place of the first community rehab review."),
        slot("appointment", "Stroke clinic follow-up", "Add the date, time and place of the stroke team follow-up."),
      ],
      milestones: [
        { title: "First week home", day: 7 },
        { title: "First phone call with a friend", day: null },
        { title: "First meal made together", day: null },
        { title: "First outing with the care circle", day: null },
        { title: "Therapy goal reached", day: null },
      ],
      signs: [],
      thresholds: [],
      measures: ["barthel", "mrs", "tug"],
    },
  },
  {
    id: "builtin:ortho-physio",
    name: "Orthopedic physiotherapy after joint replacement",
    description: "A phased physiotherapy structure for hip or knee replacement: early, middle and later home programs, wound and swelling routines, precautions, reviews and everyday milestones.",
    specialty: "orthopedics",
    horizonDays: 84,
    ledBy: "patient",
    body: {
      instructions: "",
      items: [
        slot("medication", "Medicines from the discharge list", "Add one item per medicine, with the name, amount and times exactly as prescribed, then remove this one."),
        slot("care", "Wound and dressing routine", "Write how to care for the wound and dressing, as the ward or surgeon instructed."),
        slot("care", "Swelling routine", "Write the ice, elevation or compression routine your team set, or remove this item."),
        slot("care", "Walking aid and movement precautions", "Write which walking aid to use and any movements to avoid, and for how long."),
        slot("exercise", "Home program, early phase", "Write the exercises, sets, repetitions and limits for the first two weeks.", { start_day: 0, end_day: 13 }),
        slot("exercise", "Home program, middle phase", "Write the exercises for weeks three to six, once the physiotherapist progresses them.", { start_day: 14, end_day: 41 }),
        slot("exercise", "Home program, later phase", "Write the exercises from week seven onward.", { start_day: 42 }),
        slot("appointment", "Wound check", "Add the date, time and place of the wound check."),
        slot("appointment", "Outpatient physiotherapy", "Add the date, time and place of the first outpatient session."),
        slot("appointment", "Surgeon review", "Add the date, time and place of the surgeon review."),
      ],
      milestones: [
        { title: "First stairs at home", day: null },
        { title: "First walk to the corner", day: null },
        { title: "Walking aid swapped, when your physio says so", day: null },
        { title: "Back in the car as a passenger", day: null },
        { title: "First outing to a favorite place", day: null },
      ],
      signs: [],
      thresholds: [],
      measures: ["tug", "knee_rom", "nprs"],
    },
  },
];

export const builtinTemplate = (id: string) => BUILTIN_TEMPLATES.find((t) => t.id === id) ?? null;
