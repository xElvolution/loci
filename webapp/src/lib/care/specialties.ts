/**
 * Specialty templates. These hold structure only: section prompts, field hints and
 * non-clinical life moments a family might want to celebrate. They contain no doses,
 * no schedules and no warning signs. Every clinical line in a plan is typed in by a
 * clinician or copied by the family from the discharge letter.
 */
export const SPECIALTY_IDS = [
  "maternity",
  "surgery",
  "orthopedics",
  "cardiac",
  "neuro",
  "pediatrics",
  "mental_health",
  "oncology",
  "respiratory",
  "diabetes",
  "elder",
  "general",
] as const;
export type SpecialtyId = (typeof SPECIALTY_IDS)[number];

export type Specialty = {
  id: SpecialtyId;
  label: string;
  short: string;
  blurb: string;
  ledBy: "patient" | "caregiver";
  horizonDays: number;
  hue: string;
  glyph: GlyphName;
  milestones: string[];
  prompts: { medication: string; care: string; exercise: string; appointment: string; warning: string };
  hints: { care: string; exercise: string };
  thriving: string;
};

export type GlyphName = "cradle" | "stitch" | "knee" | "heart" | "spark" | "kite" | "sun" | "ribbon" | "breath" | "drop" | "tea" | "house";

const COMMON_PROMPTS = {
  medication: "Copy each medicine exactly as written on the discharge letter or label: name, amount and times.",
  appointment: "Follow-up visits, scans, therapy sessions or home visits, with date, time and place.",
  warning: "Type the warning signs your care team gave you, word for word. loci never adds its own.",
};

export const SPECIALTIES: Specialty[] = [
  {
    id: "maternity",
    label: "Maternity and postpartum",
    short: "Postpartum",
    blurb: "The first weeks home with a new baby, for the parent who gave birth and the people around them.",
    ledBy: "patient",
    horizonDays: 42,
    hue: "#ff8fa3",
    glyph: "cradle",
    milestones: ["First night home together", "First visitor at home", "First walk outside with the stroller", "First full night of rest in shifts", "Postnatal check visit done"],
    prompts: { ...COMMON_PROMPTS, care: "Care tasks from your midwife or obstetric team, such as wound or stitch care, feeding support or pelvic floor routines.", exercise: "Only movement your midwife or physio has cleared, with how often." },
    hints: { care: "e.g. Feeding log, as your midwife asked", exercise: "e.g. Pelvic floor routine from your physio" },
    thriving: "Settled and thriving at home",
  },
  {
    id: "surgery",
    label: "General surgery",
    short: "Surgery",
    blurb: "Recovering at home after an operation, from day surgery to a longer hospital stay.",
    ledBy: "patient",
    horizonDays: 28,
    hue: "#ffc15e",
    glyph: "stitch",
    milestones: ["First night in your own bed", "First shower on your own", "First short walk outside", "Back to a normal meal routine", "Stitches or clips check done"],
    prompts: { ...COMMON_PROMPTS, care: "Wound and dressing care exactly as your surgical team explained, with how often.", exercise: "Breathing, walking or movement goals your team set, and when." },
    hints: { care: "e.g. Dressing change, as shown by your nurse", exercise: "e.g. Walking goal your team set" },
    thriving: "Healed up and back to your days",
  },
  {
    id: "orthopedics",
    label: "Orthopedics and joints",
    short: "Orthopedics",
    blurb: "Hip, knee, shoulder, spine or fracture recovery, where daily physio does the heavy lifting.",
    ledBy: "patient",
    horizonDays: 84,
    hue: "#7cf5d3",
    glyph: "knee",
    milestones: ["First stairs at home", "First walk to the corner", "Walking aid swapped, when your physio says so", "Back in the car as a passenger", "First outing to a favorite place"],
    prompts: { ...COMMON_PROMPTS, care: "Ice, elevation, dressing or brace routines from your team.", exercise: "Your physio program, with sets, times and any limits your physio wrote." },
    hints: { care: "e.g. Brace on when walking, per your team", exercise: "e.g. Exercise sheet A, as your physio set" },
    thriving: "Moving freely and back to what you love",
  },
  {
    id: "cardiac",
    label: "Heart and cardiac",
    short: "Cardiac",
    blurb: "After a heart attack, heart surgery or a new heart diagnosis, with rehab and daily routines.",
    ledBy: "patient",
    horizonDays: 84,
    hue: "#ff6b5a",
    glyph: "heart",
    milestones: ["First cardiac rehab session", "First walk around the block", "First meal out with family", "Back to a hobby you love", "Rehab program finished"],
    prompts: { ...COMMON_PROMPTS, care: "Daily routines your cardiac team asked for, such as weight or blood pressure logs.", exercise: "Your rehab walking or activity plan, as your rehab team set it." },
    hints: { care: "e.g. Morning weight log, as your team asked", exercise: "e.g. Rehab walk, as your rehab nurse set" },
    thriving: "Strong heart, full days",
  },
  {
    id: "neuro",
    label: "Stroke and neuro rehab",
    short: "Neuro rehab",
    blurb: "Rebuilding everyday life after a stroke, brain injury or neurological illness, often with family leading.",
    ledBy: "caregiver",
    horizonDays: 120,
    hue: "#b48cff",
    glyph: "spark",
    milestones: ["First week home", "First phone call with a friend", "First meal made together", "First outing with the care circle", "Therapy goal reached"],
    prompts: { ...COMMON_PROMPTS, care: "Daily support routines from the rehab team, such as positioning, communication aids or safety checks.", exercise: "Physio, speech or occupational therapy home practice, as the therapists set it." },
    hints: { care: "e.g. Communication board practice, per the speech therapist", exercise: "e.g. Hand exercises sheet from occupational therapy" },
    thriving: "Living life your way again",
  },
  {
    id: "pediatrics",
    label: "Children, parent-led",
    short: "Pediatrics",
    blurb: "A child coming home from hospital, with parents and carers running the plan together.",
    ledBy: "caregiver",
    horizonDays: 21,
    hue: "#ffd36b",
    glyph: "kite",
    milestones: ["First night in their own bed", "First full day of play", "Favorite food back on the menu", "Back to school or nursery, when the team says so", "Follow-up visit done"],
    prompts: { ...COMMON_PROMPTS, care: "Care tasks the children's team showed you, with how often.", exercise: "Any activity limits or movement goals the team gave for your child." },
    hints: { care: "e.g. Inhaler with spacer, as the nurse showed you", exercise: "e.g. No contact sports until the team says so" },
    thriving: "Back to being a kid",
  },
  {
    id: "mental_health",
    label: "Mental health",
    short: "Mental health",
    blurb: "Leaving inpatient or crisis care, with a safety plan, routines and people who care close by.",
    ledBy: "patient",
    horizonDays: 56,
    hue: "#8fd3ff",
    glyph: "sun",
    milestones: ["First week of steady routines", "First session with your outpatient team", "First outing with someone you trust", "A day that felt like you again", "Back to work, study or volunteering"],
    prompts: { ...COMMON_PROMPTS, care: "Routines from your care team or your safety plan, in your own words.", exercise: "Activity or movement goals you agreed with your team.", warning: "Copy the warning signs and steps from your safety plan, exactly as you and your team wrote them." },
    hints: { care: "e.g. Evening wind-down from my safety plan", exercise: "e.g. Daily walk I agreed with my therapist" },
    thriving: "Steady, connected, yourself",
  },
  {
    id: "oncology",
    label: "Cancer care",
    short: "Oncology",
    blurb: "Home between treatment cycles or after cancer surgery, with energy that changes day to day.",
    ledBy: "patient",
    horizonDays: 90,
    hue: "#ffb38a",
    glyph: "ribbon",
    milestones: ["First treatment cycle finished at home", "First good-energy day out", "Favorite meal enjoyed again", "Celebration with the care circle", "End of treatment visit"],
    prompts: { ...COMMON_PROMPTS, care: "Care tasks from your oncology team, such as line care or mouth care, as they explained.", exercise: "Activity your team suggested for your energy levels." },
    hints: { care: "e.g. Line flush visit, as your nurse scheduled", exercise: "e.g. Gentle walk on good days, per your team" },
    thriving: "Through treatment and living fully",
  },
  {
    id: "respiratory",
    label: "Lungs and breathing",
    short: "Respiratory",
    blurb: "After pneumonia, COPD or asthma admissions, with inhalers, breathing practice and pacing.",
    ledBy: "patient",
    horizonDays: 42,
    hue: "#9be7ff",
    glyph: "breath",
    milestones: ["First full night of rest", "First trip to the shop", "Pulmonary rehab started", "First walk in the park", "Back to a favorite activity"],
    prompts: { ...COMMON_PROMPTS, care: "Inhaler, oxygen or breathing device routines exactly as your team set them.", exercise: "Breathing exercises or pacing plans from your physio." },
    hints: { care: "e.g. Preventer inhaler, as on your plan", exercise: "e.g. Breathing exercise sheet from your physio" },
    thriving: "Breathing easy and out and about",
  },
  {
    id: "diabetes",
    label: "Diabetes",
    short: "Diabetes",
    blurb: "Home after a diabetes admission or a new diagnosis, getting daily routines to feel normal.",
    ledBy: "patient",
    horizonDays: 56,
    hue: "#c6f57c",
    glyph: "drop",
    milestones: ["First week of steady routines", "First meal out with confidence", "Diabetes education session done", "Back to work or school", "Review visit with your team"],
    prompts: { ...COMMON_PROMPTS, care: "Glucose checks, insulin or foot care routines, exactly as your diabetes team set them.", exercise: "Activity goals you agreed with your team." },
    hints: { care: "e.g. Glucose check, at the times your team set", exercise: "e.g. Walk after dinner, as agreed with your nurse" },
    thriving: "In control and living freely",
  },
  {
    id: "elder",
    label: "Older adult care",
    short: "Elder care",
    blurb: "An older parent or relative coming home, with family, neighbors and carers sharing the load.",
    ledBy: "caregiver",
    horizonDays: 42,
    hue: "#f3c98b",
    glyph: "tea",
    milestones: ["First week home", "First visit from the grandkids", "First trip to a favorite cafe", "Carer routine settled", "Review visit with the doctor"],
    prompts: { ...COMMON_PROMPTS, care: "Care routines from the hospital or home-care team, such as skin checks, meals or mobility help.", exercise: "Movement or falls-prevention exercises the physio set." },
    hints: { care: "e.g. Afternoon meal and fluids, as the carer plan says", exercise: "e.g. Chair exercises from the physio sheet" },
    thriving: "Safe, social and at home",
  },
  {
    id: "general",
    label: "Something else",
    short: "General",
    blurb: "Any other hospital stay. Start from a blank plan and shape it with your care team.",
    ledBy: "patient",
    horizonDays: 30,
    hue: "#ece8ff",
    glyph: "house",
    milestones: ["First night home", "First outing", "Follow-up visit done", "Back to a normal week"],
    prompts: { ...COMMON_PROMPTS, care: "Any care tasks your team gave you.", exercise: "Any movement or activity plan your team gave you." },
    hints: { care: "e.g. Task from your discharge letter", exercise: "e.g. Activity from your discharge letter" },
    thriving: "Home and thriving",
  },
];

export const SPECIALTY: Record<SpecialtyId, Specialty> = Object.fromEntries(SPECIALTIES.map((s) => [s.id, s])) as Record<SpecialtyId, Specialty>;

export function specialtyOf(id: string): Specialty {
  return (SPECIALTY as Record<string, Specialty>)[id] ?? SPECIALTY.general;
}

export function isSpecialty(id: unknown): id is SpecialtyId {
  return typeof id === "string" && (SPECIALTY_IDS as readonly string[]).includes(id);
}
