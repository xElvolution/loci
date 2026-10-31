/**
 * The built-in demo journeys behind "Try the demo journey". Each plan reads as if a
 * care team typed it in, which is exactly how real plans arrive in loci. People,
 * phone numbers and care teams here are fictional (555 and drama-range numbers).
 */
import type { City, FavoriteType } from "@/lib/qloo/types";
import type { SpecialtyId } from "./specialties";
import type { Metric } from "./types";

type Med = { title: string; detail: string; times: string[]; endDay?: number; why?: string; how?: string };
type Routine = { title: string; detail: string; times: string[]; weekdays?: number[]; why?: string; how?: string };
export type DemoJourney = {
  key: string;
  personName: string;
  headline: string;
  specialty: SpecialtyId;
  ledBy: "patient" | "caregiver";
  persona: { name: string; role: "patient" | "caregiver" };
  city: City;
  day: number;
  horizon: number;
  careTeam: string;
  phone: string;
  emergency: string;
  dietNotes: string;
  circle: { name: string; role: "family" | "carer" | "caregiver" }[];
  meds: Med[];
  care: Routine[];
  exercise: Routine[];
  appointments: { title: string; day: number; at: string; location: string }[];
  milestones: { title: string; day: number | null }[];
  signs: { text: string; action: "call_team" | "emergency" }[];
  thresholds: { metric: Metric; op: "gte" | "lte"; value: number; days: number; action: "call_team" | "emergency" }[];
  favorites: { name: string; type: FavoriteType }[];
  filters: string[];
  outingsOk: boolean;
  circleTasks: { title: string; due: number | null; who: number | null; done: boolean }[];
  /** shape of recovery for seeded check-ins: start and end values */
  arc: { mood: [number, number]; pain: [number, number]; sleep: [number, number]; appetite: [number, number]; energy: [number, number] };
  adherence: number;
  /** day offsets where a rule-based flag was raised; ack = clinic already followed up */
  flagDays: { day: number; ack: boolean; metric: Metric; value: number }[];
};

const NYC: City = { id: null, name: "New York", disambiguation: "City", lat: 40.7128, lon: -74.006, resolved: true };
const BROOKLYN: City = { id: null, name: "Brooklyn", disambiguation: "Borough", lat: 40.6782, lon: -73.9442, resolved: true };
const LONDON: City = { id: null, name: "London", disambiguation: "City", lat: 51.5072, lon: -0.1276, resolved: true };
const TOKYO: City = { id: null, name: "Tokyo", disambiguation: "City", lat: 35.6762, lon: 139.6503, resolved: true };
const MEXICO: City = { id: null, name: "Mexico City", disambiguation: "City", lat: 19.4326, lon: -99.1332, resolved: true };
const BERLIN: City = { id: null, name: "Berlin", disambiguation: "City", lat: 52.52, lon: 13.405, resolved: true };
const PARIS: City = { id: null, name: "Paris", disambiguation: "City", lat: 48.8566, lon: 2.3522, resolved: true };
const TORONTO: City = { id: null, name: "Toronto", disambiguation: "City", lat: 43.6532, lon: -79.3832, resolved: true };

export const DEMO_ORG = { name: "Hudson Recovery Partners", kind: "clinic" as const };

export const DEMO_JOURNEYS: DemoJourney[] = [
  {
    key: "daniel",
    personName: "Daniel",
    headline: "Day 9 home after a knee replacement in New York",
    specialty: "orthopedics",
    ledBy: "patient",
    persona: { name: "Daniel", role: "patient" },
    city: NYC,
    day: 9,
    horizon: 84,
    careTeam: "Hudson Recovery Partners, joint care team",
    phone: "(212) 555-0148",
    emergency: "911",
    dietNotes: "Normal diet. Keep drinking water through the day, as discussed at discharge.",
    circle: [{ name: "Marisol", role: "family" }, { name: "Theo", role: "family" }, { name: "Ana (home physio)", role: "carer" }],
    meds: [
      {
        title: "Pain relief, as on your discharge letter",
        detail: "Take with food. Dose exactly as printed on the pharmacy label.",
        times: ["08:00", "14:00", "20:00"],
        why: "Keeping pain steady lets you do your knee exercises, which is what gets the joint moving again.",
        how: "Take it with breakfast, lunch and dinner. Swallow with water. If you miss one, do not double the next one; call us if unsure.",
      },
      {
        title: "Blood thinner injection",
        detail: "As shown by the ward nurse. Course length is on your letter.",
        times: ["18:00"],
        endDay: 28,
        why: "After a joint replacement we use this course to lower the chance of a clot while you are less active.",
        how: "Same time each evening. Use the belly skin, two finger-widths from the navel, changing sides each day. Put the used syringe in the yellow box.",
      },
    ],
    care: [
      {
        title: "Ice and elevate the knee",
        detail: "20 minutes, as your physio showed you.",
        times: ["10:00", "16:00"],
        why: "It keeps swelling down so the knee bends further each day.",
        how: "Lie back with the leg on two pillows, heel higher than the hip. Ice pack wrapped in a tea towel, never straight on the skin. 20 minutes, then off.",
      },
      {
        title: "Check the dressing stays clean and dry",
        detail: "Do not remove it. Your team changes it at the clinic.",
        times: [],
        why: "A clean, dry dressing protects the wound until the clips come out.",
        how: "Look once a day. Cover it with the waterproof sleeve to shower. If it is wet through, or you see any of the warning signs, call us.",
      },
    ],
    exercise: [
      {
        title: "Physio sheet A: knee bends and straight leg raises",
        detail: "Sets and reps are on the sheet from Ana.",
        times: ["09:30", "15:30"],
        why: "Bending and straightening now is what decides how well the knee moves in three months.",
        how: "Take your pain relief about 30 minutes before. Follow the sheet in order, slowly. Some discomfort is expected; stop if pain is sharp and tell us at the next check-in.",
      },
    ],
    appointments: [
      { title: "Wound check and clip removal", day: 12, at: "10:30", location: "Hudson Recovery Partners, 5th floor" },
      { title: "Outpatient physio", day: 14, at: "14:00", location: "Riverside Physio Studio" },
      { title: "Six week review with the surgeon", day: 42, at: "09:15", location: "Hudson Recovery Partners, Clinic B" },
    ],
    milestones: [
      { title: "First night in your own bed", day: 0 },
      { title: "First stairs at home", day: 4 },
      { title: "First walk to the corner", day: 11 },
      { title: "Walking aid swapped, when your physio says so", day: 21 },
      { title: "First outing to a favorite place", day: 30 },
    ],
    signs: [
      { text: "Calf pain, swelling or warmth in either leg", action: "call_team" },
      { text: "Wound redness that is spreading, or fluid leaking from the wound", action: "call_team" },
      { text: "Temperature of 38°C (100.4°F) or higher", action: "call_team" },
      { text: "Chest pain or sudden shortness of breath", action: "emergency" },
    ],
    thresholds: [
      { metric: "pain", op: "gte", value: 8, days: 2, action: "call_team" },
      { metric: "mood", op: "lte", value: 1, days: 3, action: "call_team" },
    ],
    favorites: [
      { name: "Bruce Springsteen", type: "artist" },
      { name: "Ted Lasso", type: "tv_show" },
      { name: "The Godfather", type: "movie" },
      { name: "Norah Jones", type: "artist" },
    ],
    filters: ["delivery", "step_free"],
    outingsOk: true,
    circleTasks: [
      { title: "Pick up the next pharmacy order", due: 1, who: 0, done: false },
      { title: "Drive Daniel to the wound check", due: 3, who: 1, done: false },
      { title: "Move the rug in the hallway", due: -6, who: 1, done: true },
      { title: "Cook a big pot of soup for the freezer", due: -2, who: 0, done: true },
    ],
    arc: { mood: [2, 4], pain: [7, 3], sleep: [2, 4], appetite: [2, 4], energy: [1, 3] },
    adherence: 0.9,
    flagDays: [{ day: 4, ack: true, metric: "pain", value: 8 }],
  },
  {
    key: "amara",
    personName: "Amara",
    headline: "Two weeks home with a newborn in Brooklyn",
    specialty: "maternity",
    ledBy: "patient",
    persona: { name: "Amara", role: "patient" },
    city: BROOKLYN,
    day: 13,
    horizon: 42,
    careTeam: "Hudson Recovery Partners, maternity and midwife team",
    phone: "(718) 555-0172",
    emergency: "911",
    dietNotes: "Keep up fluids while feeding. Iron-rich foods were suggested by the midwife.",
    circle: [{ name: "Kwame", role: "caregiver" }, { name: "Grandma Efua", role: "family" }, { name: "Jo (doula)", role: "carer" }],
    meds: [
      { title: "Pain relief, as on your discharge letter", detail: "Dose and limit exactly as on the label.", times: ["09:00", "21:00"], endDay: 10 },
      { title: "Iron tablet", detail: "As prescribed by your midwife.", times: ["12:00"] },
    ],
    care: [
      { title: "Stitch care routine", detail: "Rinse and pat dry, as your midwife showed you.", times: ["08:30", "20:30"] },
      { title: "Feeding log", detail: "Times and sides, as the feeding team asked.", times: [] },
    ],
    exercise: [{ title: "Pelvic floor routine from your physio", detail: "Short sets, as on the leaflet.", times: ["11:00", "17:00"] }],
    appointments: [
      { title: "Midwife home visit", day: 14, at: "11:00", location: "At home" },
      { title: "Postnatal check", day: 42, at: "09:40", location: "Hudson Recovery Partners, Women's Clinic" },
    ],
    milestones: [
      { title: "First night home together", day: 0 },
      { title: "First visitor at home", day: 5 },
      { title: "First walk outside with the stroller", day: 12 },
      { title: "First full night of rest in shifts", day: 20 },
      { title: "Postnatal check visit done", day: 42 },
    ],
    signs: [
      { text: "Heavy bleeding that soaks a pad within an hour", action: "emergency" },
      { text: "Severe headache, or changes in your vision", action: "emergency" },
      { text: "Temperature of 38°C (100.4°F) or higher", action: "call_team" },
      { text: "Feeling unable to cope, or thoughts of harming yourself or your baby", action: "emergency" },
      { text: "Red, painful or swollen area on the breast", action: "call_team" },
    ],
    thresholds: [
      { metric: "mood", op: "lte", value: 2, days: 3, action: "call_team" },
      { metric: "sleep", op: "lte", value: 1, days: 3, action: "call_team" },
    ],
    favorites: [
      { name: "Beyoncé", type: "artist" },
      { name: "Abbott Elementary", type: "tv_show" },
      { name: "Americanah", type: "book" },
      { name: "Burna Boy", type: "artist" },
    ],
    filters: ["delivery", "vegetarian"],
    outingsOk: true,
    circleTasks: [
      { title: "Night feed shift, Thursday", due: 1, who: 0, done: false },
      { title: "Batch of jollof for the freezer", due: 2, who: 1, done: false },
      { title: "Laundry and baby clothes", due: -1, who: 2, done: true },
    ],
    arc: { mood: [3, 4], pain: [5, 1], sleep: [1, 3], appetite: [3, 4], energy: [1, 3] },
    adherence: 0.86,
    flagDays: [],
  },
  {
    key: "leo",
    personName: "Leo",
    headline: "Age 7, home after appendix surgery in London, parent-led",
    specialty: "pediatrics",
    ledBy: "caregiver",
    persona: { name: "Nadia", role: "caregiver" },
    city: LONDON,
    day: 4,
    horizon: 21,
    careTeam: "Hudson Recovery Partners, children's surgical team",
    phone: "020 7946 0018",
    emergency: "999",
    dietNotes: "Normal diet as tolerated, small meals to start, as the ward explained.",
    circle: [{ name: "Sam (Dad)", role: "caregiver" }, { name: "Nana Rose", role: "family" }],
    meds: [{ title: "Children's pain relief, as on the discharge letter", detail: "Dose by weight, exactly as printed on the bottle.", times: ["08:00", "14:00", "20:00"], endDay: 7 }],
    care: [{ title: "Check the little wound dressings", detail: "Keep dry. The ward said plasters can come off on day 5.", times: ["19:00"] }],
    exercise: [{ title: "Short walk around the house", detail: "No climbing frames or football until the team says so.", times: ["11:00", "16:00"] }],
    appointments: [{ title: "Phone follow-up with the surgical nurse", day: 7, at: "15:00", location: "By phone" }],
    milestones: [
      { title: "First night in their own bed", day: 0 },
      { title: "First full day of play", day: 6 },
      { title: "Favorite food back on the menu", day: 5 },
      { title: "Back to school, when the team says so", day: 14 },
    ],
    signs: [
      { text: "Tummy pain that is getting worse instead of better", action: "call_team" },
      { text: "Vomiting that will not stop, or no wee for 12 hours", action: "call_team" },
      { text: "Temperature of 38°C or higher", action: "call_team" },
      { text: "Floppy, very sleepy or hard to wake", action: "emergency" },
    ],
    thresholds: [{ metric: "pain", op: "gte", value: 7, days: 1, action: "call_team" }],
    favorites: [
      { name: "Bluey", type: "tv_show" },
      { name: "Paddington", type: "movie" },
      { name: "Minecraft", type: "video_game" },
      { name: "Harry Potter and the Philosopher's Stone", type: "book" },
    ],
    filters: ["kid_safe", "delivery"],
    outingsOk: false,
    circleTasks: [
      { title: "Collect homework pack from school", due: 2, who: 1, done: false },
      { title: "Bring the Lego set from Nana's", due: -1, who: 1, done: true },
    ],
    arc: { mood: [2, 5], pain: [6, 2], sleep: [3, 4], appetite: [2, 4], energy: [2, 4] },
    adherence: 0.94,
    flagDays: [],
  },
  {
    key: "grace",
    personName: "Grace",
    headline: "Age 81, home after a hip fracture in Toronto, daughter leading",
    specialty: "elder",
    ledBy: "caregiver",
    persona: { name: "Ruth", role: "caregiver" },
    city: TORONTO,
    day: 16,
    horizon: 42,
    careTeam: "Hudson Recovery Partners, home-care program",
    phone: "(416) 555-0193",
    emergency: "911",
    dietNotes: "Soft, easy-to-chew foods for now and regular fluids, as the speech and swallow team advised.",
    circle: [{ name: "Marcus (son)", role: "family" }, { name: "Esther (home carer)", role: "carer" }, { name: "Mrs. Patel (neighbor)", role: "family" }],
    meds: [
      { title: "Morning tablets from the blister pack", detail: "As set up by the pharmacy.", times: ["08:00"] },
      { title: "Evening tablets from the blister pack", detail: "As set up by the pharmacy.", times: ["19:00"] },
    ],
    care: [
      { title: "Skin check on heels and hips", detail: "As the district nurse showed Esther.", times: ["09:00"] },
      { title: "Afternoon meal and drinks", detail: "From the carer plan.", times: ["13:00"] },
    ],
    exercise: [{ title: "Chair exercises from the physio sheet", detail: "With Esther standing by.", times: ["11:00"] }],
    appointments: [
      { title: "District nurse visit", day: 18, at: "10:00", location: "At home" },
      { title: "Falls clinic review", day: 30, at: "13:30", location: "Hudson Recovery Partners, Falls Clinic" },
    ],
    milestones: [
      { title: "First week home", day: 7 },
      { title: "First visit from the grandkids", day: 10 },
      { title: "Carer routine settled", day: 14 },
      { title: "First trip to a favorite cafe", day: 28 },
    ],
    signs: [
      { text: "A new fall, even if no injury is seen", action: "call_team" },
      { text: "New confusion or much sleepier than usual", action: "call_team" },
      { text: "Not drinking or passing much urine for a day", action: "call_team" },
      { text: "Sudden weakness of the face, arm or leg, or slurred speech", action: "emergency" },
    ],
    thresholds: [
      { metric: "appetite", op: "lte", value: 1, days: 2, action: "call_team" },
      { metric: "energy", op: "lte", value: 1, days: 2, action: "call_team" },
    ],
    favorites: [
      { name: "Ella Fitzgerald", type: "artist" },
      { name: "Murder, She Wrote", type: "tv_show" },
      { name: "The Sound of Music", type: "movie" },
      { name: "Agatha Christie", type: "book" },
    ],
    filters: ["soups", "delivery", "step_free", "quiet"],
    outingsOk: false,
    circleTasks: [
      { title: "Sunday lunch visit", due: 2, who: 0, done: false },
      { title: "Grocery run: soup, yogurt, soft fruit", due: 0, who: 2, done: false },
      { title: "Fit the second grab rail", due: -3, who: 0, done: true },
    ],
    arc: { mood: [2, 4], pain: [6, 3], sleep: [2, 3], appetite: [2, 3], energy: [1, 3] },
    adherence: 0.82,
    flagDays: [{ day: 15, ack: false, metric: "appetite", value: 1 }],
  },
  {
    key: "kenji",
    personName: "Kenji",
    headline: "Five weeks after a heart attack in Tokyo",
    specialty: "cardiac",
    ledBy: "patient",
    persona: { name: "Kenji", role: "patient" },
    city: TOKYO,
    day: 35,
    horizon: 84,
    careTeam: "Hudson Recovery Partners, cardiac rehab",
    phone: "03-5550-0110",
    emergency: "119",
    dietNotes: "Lower salt choices, as the cardiac dietitian explained.",
    circle: [{ name: "Yui", role: "family" }],
    meds: [
      { title: "Heart tablets, morning set", detail: "As printed on your medicine list.", times: ["08:00"] },
      { title: "Heart tablets, evening set", detail: "As printed on your medicine list.", times: ["20:00"] },
    ],
    care: [{ title: "Morning weight log", detail: "Same scale, same time, as the rehab nurse asked.", times: ["07:30"] }],
    exercise: [{ title: "Rehab walk at the pace your team set", detail: "Length and pace are on your rehab card.", times: ["17:00"], weekdays: [1, 3, 5] }],
    appointments: [{ title: "Cardiac rehab class", day: 37, at: "10:00", location: "Hudson Recovery Partners, Rehab Gym" }],
    milestones: [{ title: "First cardiac rehab session", day: 14 }, { title: "First walk around the block", day: 10 }, { title: "Back to a hobby you love", day: 45 }],
    signs: [
      { text: "Chest pain or pressure that does not settle with rest", action: "emergency" },
      { text: "Weight up by 2 kg in 3 days", action: "call_team" },
      { text: "New ankle swelling or breathlessness lying flat", action: "call_team" },
    ],
    thresholds: [{ metric: "energy", op: "lte", value: 1, days: 3, action: "call_team" }],
    favorites: [{ name: "Ryuichi Sakamoto", type: "artist" }, { name: "Spirited Away", type: "movie" }, { name: "Haruki Murakami", type: "book" }],
    filters: ["quiet"],
    outingsOk: true,
    circleTasks: [],
    arc: { mood: [3, 4], pain: [2, 1], sleep: [3, 4], appetite: [3, 4], energy: [2, 4] },
    adherence: 0.93,
    flagDays: [],
  },
  {
    key: "rosa",
    personName: "Rosa",
    headline: "Neuro rehab at home after a stroke in Mexico City",
    specialty: "neuro",
    ledBy: "caregiver",
    persona: { name: "Lucía", role: "caregiver" },
    city: MEXICO,
    day: 22,
    horizon: 120,
    careTeam: "Hudson Recovery Partners, neuro rehab",
    phone: "55 5550 0166",
    emergency: "911",
    dietNotes: "Thickened drinks as the speech therapist set.",
    circle: [{ name: "Diego", role: "family" }],
    meds: [{ title: "Morning tablets", detail: "As on the medicine list from the stroke unit.", times: ["08:00"] }],
    care: [{ title: "Communication board practice", detail: "From the speech therapist.", times: ["10:00"] }],
    exercise: [{ title: "Hand and arm program", detail: "From occupational therapy.", times: ["12:00", "18:00"] }],
    appointments: [{ title: "Speech therapy", day: 24, at: "11:00", location: "Hudson Recovery Partners, Neuro Rehab" }],
    milestones: [{ title: "First week home", day: 7 }, { title: "First phone call with a friend", day: 18 }, { title: "First meal made together", day: 30 }],
    signs: [{ text: "Sudden new weakness, face drooping or speech change", action: "emergency" }, { text: "Coughing or choking with drinks", action: "call_team" }],
    thresholds: [{ metric: "mood", op: "lte", value: 1, days: 2, action: "call_team" }],
    favorites: [{ name: "Natalia Lafourcade", type: "artist" }, { name: "Coco", type: "movie" }],
    filters: ["soups", "step_free"],
    outingsOk: false,
    circleTasks: [],
    arc: { mood: [2, 3], pain: [3, 2], sleep: [2, 3], appetite: [2, 3], energy: [1, 3] },
    adherence: 0.78,
    flagDays: [{ day: 21, ack: false, metric: "mood", value: 1 }],
  },
  {
    key: "sam",
    personName: "Jonas",
    headline: "Three weeks after inpatient mental health care in Berlin",
    specialty: "mental_health",
    ledBy: "patient",
    persona: { name: "Jonas", role: "patient" },
    city: BERLIN,
    day: 19,
    horizon: 56,
    careTeam: "Hudson Recovery Partners, community mental health",
    phone: "030 5550 0120",
    emergency: "112",
    dietNotes: "",
    circle: [{ name: "Mia", role: "family" }],
    meds: [{ title: "Evening medicine", detail: "As on your discharge letter.", times: ["21:00"] }],
    care: [{ title: "Evening wind-down from my safety plan", detail: "My own steps.", times: ["22:00"] }],
    exercise: [{ title: "Daily walk I agreed with my therapist", detail: "", times: ["16:00"] }],
    appointments: [{ title: "Outpatient session", day: 21, at: "15:00", location: "Hudson Recovery Partners, Community Team" }],
    milestones: [{ title: "First week of steady routines", day: 7 }, { title: "First outing with someone you trust", day: 12 }],
    signs: [{ text: "Thoughts of ending my life or harming myself", action: "emergency" }, { text: "Not sleeping for two nights", action: "call_team" }],
    thresholds: [{ metric: "mood", op: "lte", value: 1, days: 2, action: "call_team" }],
    favorites: [{ name: "Bon Iver", type: "artist" }, { name: "Dark", type: "tv_show" }],
    filters: [],
    outingsOk: true,
    circleTasks: [],
    arc: { mood: [2, 3], pain: [0, 0], sleep: [2, 3], appetite: [3, 3], energy: [2, 3] },
    adherence: 0.8,
    flagDays: [],
  },
  {
    key: "omar",
    personName: "Omar",
    headline: "New insulin routine after a diabetes admission in Paris",
    specialty: "diabetes",
    ledBy: "patient",
    persona: { name: "Omar", role: "patient" },
    city: PARIS,
    day: 11,
    horizon: 56,
    careTeam: "Hudson Recovery Partners, diabetes nurses",
    phone: "01 55 50 01 77",
    emergency: "112",
    dietNotes: "Meal pattern as agreed with the diabetes nurse.",
    circle: [],
    meds: [{ title: "Insulin, as on your plan", detail: "Units and timing exactly as your diabetes nurse wrote.", times: ["07:30", "19:30"] }],
    care: [{ title: "Glucose check", detail: "At the times your team set.", times: ["07:15", "12:15", "19:15", "22:00"] }],
    exercise: [{ title: "Walk after dinner", detail: "", times: ["20:30"] }],
    appointments: [{ title: "Diabetes education session", day: 14, at: "10:00", location: "Hudson Recovery Partners, Diabetes Center" }],
    milestones: [{ title: "First week of steady routines", day: 7 }, { title: "First meal out with confidence", day: 20 }],
    signs: [{ text: "Glucose readings out of the range on your plan twice in a row", action: "call_team" }, { text: "Confusion, drowsiness or vomiting", action: "emergency" }],
    thresholds: [{ metric: "energy", op: "lte", value: 1, days: 2, action: "call_team" }],
    favorites: [{ name: "Stromae", type: "artist" }],
    filters: ["halal"],
    outingsOk: true,
    circleTasks: [],
    arc: { mood: [3, 4], pain: [1, 0], sleep: [3, 4], appetite: [3, 4], energy: [2, 4] },
    adherence: 0.88,
    flagDays: [],
  },
  {
    key: "ellen",
    personName: "Ellen",
    headline: "Home between chemotherapy cycles in New York",
    specialty: "oncology",
    ledBy: "patient",
    persona: { name: "Ellen", role: "patient" },
    city: NYC,
    day: 6,
    horizon: 90,
    careTeam: "Hudson Recovery Partners, oncology day unit",
    phone: "(212) 555-0119",
    emergency: "911",
    dietNotes: "Small frequent meals, as the oncology dietitian suggested.",
    circle: [{ name: "Ruth", role: "family" }],
    meds: [{ title: "Anti-sickness tablets", detail: "As on your treatment plan.", times: ["08:00", "20:00"], endDay: 5 }],
    care: [{ title: "Mouth care routine", detail: "As the chemo nurse explained.", times: ["09:00", "21:00"] }],
    exercise: [{ title: "Gentle walk on good days", detail: "", times: [] }],
    appointments: [{ title: "Next treatment cycle", day: 21, at: "08:30", location: "Hudson Recovery Partners, Day Unit" }],
    milestones: [{ title: "First treatment cycle finished at home", day: 21 }],
    signs: [{ text: "Temperature of 37.5°C or higher, or feeling shivery", action: "emergency" }, { text: "Unable to keep fluids down for 24 hours", action: "call_team" }],
    thresholds: [{ metric: "appetite", op: "lte", value: 1, days: 2, action: "call_team" }],
    favorites: [{ name: "Joni Mitchell", type: "artist" }, { name: "The Great British Bake Off", type: "tv_show" }],
    filters: ["soups", "delivery"],
    outingsOk: false,
    circleTasks: [],
    arc: { mood: [2, 3], pain: [3, 2], sleep: [2, 3], appetite: [1, 2], energy: [1, 2] },
    adherence: 0.84,
    flagDays: [{ day: 5, ack: false, metric: "appetite", value: 1 }],
  },
];

export const DEMO_CHOICES = ["daniel", "amara", "leo", "grace"] as const;
export type DemoChoice = (typeof DEMO_CHOICES)[number] | "clinic";
