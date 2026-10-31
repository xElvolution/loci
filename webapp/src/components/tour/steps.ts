import type { IconName } from "@/components/ui/Icon";

export type TourContext = { side?: "patient" | "clinic"; hasJourney: boolean; hasTeam: boolean; teamPlan?: boolean; patientId?: string | null };

export type TourStep = {
  id: string;
  icon: IconName;
  title: string;
  body: string;
  /** Page the step lives on. */
  route: string;
  /** data-tour target on that page. */
  target: string;
};

const PATIENT: TourStep[] = [
  { id: "today", icon: "home", title: "Today, at a glance", body: "Which day of recovery it is, the streak, and the next appointment and milestone. Everything here comes from your care team's plan.", route: "/app", target: "today-head" },
  { id: "tasks", icon: "check", title: "Tick off the plan", body: "Medicines, care tasks and exercises at the times your team set. Your care team sees each tick as it happens, and so does your circle, so nobody doubles a dose.", route: "/app", target: "today-tasks" },
  { id: "call", icon: "phone", title: "When to call", body: "The warning signs your care team wrote, word for word, with one-tap calls. loci never adds its own and never diagnoses.", route: "/app", target: "when-to-call" },
  { id: "plan", icon: "list", title: "Your plan, step by step", body: "Each item shows what to do, why your team asked and how to do it, in their words. When they change something you see a note at the top.", route: "/app/plan", target: "plan-head" },
  { id: "checkin", icon: "heart", title: "Two-minute check-in", body: "Mood, pain, sleep, appetite and energy. If an answer crosses a rule your team set, you see their instruction right away and they get a flag.", route: "/app/checkin", target: "checkin-form" },
  { id: "ask", icon: "chat", title: "Ask your care team", body: "Practical questions about the plan go straight to the team's inbox. Not for emergencies: call them if you are worried.", route: "/app/ask", target: "ask-head" },
  { id: "journey", icon: "route", title: "The road home", body: "Milestones from discharge day to home and thriving, with your check-ins drawn along the way.", route: "/app/journey", target: "journey-road" },
  { id: "circle", icon: "users", title: "Bring your circle", body: "Invite family, friends and carers with a link. Share errands, see progress and choose what your care team can see.", route: "/app/circle", target: "circle-invite" },
  { id: "comfort", icon: "sun", title: "Comfort that fits", body: "Qloo turns what you love into music, shows, meals near home and gentle outings. It stays private to your circle and never reaches your care team.", route: "/app/comfort", target: "comfort-head" },
];
const LEGACY_PLAN: TourStep = { id: "plan", icon: "edit", title: "The plan, in your team's words", body: "Copy each line from the discharge letter here, or invite a clinician to fill it in. Templates give the shape for each specialty.", route: "/app/plan", target: "plan-head" };
const SETTINGS: TourStep = { id: "settings", icon: "play", title: "Replay any time", body: "Your privacy controls, export and delete live in Settings, along with this tour.", route: "/app/settings", target: "replay-tour" };

function clinic(patientId: string | null | undefined): TourStep[] {
  const steps: TourStep[] = [
    { id: "c-list", icon: "users", title: "Every patient, at home", body: "Status for each plan: draft, sent and waiting, or being followed. Flags and open questions sort to the top.", route: "/clinic", target: "clinic-head" },
    { id: "c-kpis", icon: "chart", title: "The day at a glance", body: "Who is following a plan, flags to review, questions waiting and how many checked in today, in each patient's own time zone.", route: "/clinic", target: "clinic-kpis" },
    { id: "c-new", icon: "plus", title: "Start from a template", body: "Pick a specialty. The template gives structure and prompts; you write every medicine, task, exercise, appointment and warning sign.", route: "/clinic/new", target: "clinic-new" },
  ];
  if (patientId) {
    steps.push(
      { id: "c-send", icon: "send", title: "Preview, then send", body: "See exactly what the patient will see, then send it with a short code. Edits after sending reach them with a note that you updated the plan.", route: `/clinic/p/${patientId}/plan`, target: "clinic-send" },
      { id: "c-track", icon: "trend", title: "Track it live", body: "Tick-offs, check-in trends, flagged check-ins to mark reviewed, notes and questions, and who is in the care circle.", route: `/clinic/p/${patientId}`, target: "clinic-track" },
    );
  }
  steps.push({ id: "c-inbox", icon: "chat", title: "One inbox for questions", body: "Questions patients send from their Ask tab land here. A reply marks them answered. Flags only come from rules your team writes.", route: "/clinic/inbox", target: "clinic-inbox" });
  steps.push({ id: "c-settings", icon: "play", title: "Your team", body: "Invite colleagues, rename the team and replay this tour here.", route: "/clinic/settings", target: "replay-tour" });
  return steps;
}

export function tourSteps(ctx: TourContext): TourStep[] {
  if (ctx.side === "clinic") return clinic(ctx.patientId);
  if (!ctx.hasJourney) return [SETTINGS];
  if (ctx.teamPlan) return [...PATIENT, SETTINGS];
  return [...PATIENT.filter((s) => s.id !== "plan" && s.id !== "ask"), LEGACY_PLAN, SETTINGS];
}
