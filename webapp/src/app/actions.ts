"use server";

import { setResearchConsent } from "@/lib/server/research";
import { endDemoUser } from "@/lib/server/demo-end";
import { savePrefs, sendTest } from "@/lib/server/reminders/service";
import { connectedChannels } from "@/lib/server/reminders/provider";
import { normalisePhone } from "@/lib/care/reminders";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clientIp, createSession, currentUser, destroySession, hashPassword, requireUser, safeNext, verifyPassword, type User } from "@/lib/server/auth";
import { one, q } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/rate-limit";
import * as repo from "@/lib/server/repo";
import { startDemo } from "@/lib/server/demo";
import { appOrigin } from "@/lib/server/origin";
import { isSpecialty, specialtyOf } from "@/lib/care/specialties";
import { validThreshold } from "@/lib/care/rules";
import { addDays, isTime, todayIn } from "@/lib/care/dates";
import { cleanFilters } from "@/lib/care/filters";
import { DEMO_CHOICES, type DemoChoice } from "@/lib/care/demo-fixtures";
import { FAVORITE_TYPES } from "@/lib/qloo/types";
import type { FlagResult } from "@/lib/care/types";
import { checkinFields, recordCheckin } from "@/lib/server/patient-service";
import { addMeasure, addReadmission, addValue, closeReadmission, measureById, removeMeasure, removeReadmission, removeValue } from "@/lib/server/outcomes";
import { CUSTOM_ID, instrumentOf } from "@/lib/care/instruments";
import { applyTemplate, bodyFromJourney, createTemplate, deleteTemplate, resolveTemplate, teamTemplate, updateTemplate } from "@/lib/server/templates";
import { builtinTemplate } from "@/lib/care/templates";

export type FormState = { error?: string; ok?: string; fieldErrors?: Record<string, string> } | undefined;
export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const fail = (error: string) => ({ ok: false as const, error });
const refresh = () => {
  revalidatePath("/app", "layout");
  revalidatePath("/clinic", "layout");
};
const isTeam = (a: repo.Access) => a.via === "org" || a.role === "clinician";
/** After a care team edits a plan that was already sent, the family gets a notice. */
async function teamEdit(g: { user: User; access: repo.Access; journey: repo.Journey }, text: string) {
  if (isTeam(g.access)) await repo.notePlanUpdate(g.journey.id, g.user.id, text);
}

function validTz(tz: unknown): string {
  const s = String(tz ?? "").slice(0, 64);
  try {
    new Intl.DateTimeFormat("en", { timeZone: s });
    return s || "UTC";
  } catch {
    return "UTC";
  }
}

/* ---------------- auth ---------------- */
const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(200);
const passwordSchema = z.string().min(10, "Use at least 10 characters.").max(200);

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const ip = await clientIp();
  if (!rateLimit(`signup:${ip}`, 8, 3600_000).ok) return { error: "Too many sign ups from this network. Try again later." };
  const parsed = z
    .object({ name: z.string().trim().min(1, "Tell us what to call you.").max(60), email: emailSchema, password: passwordSchema })
    .safeParse({ name: form.get("name"), email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  const { name, email, password } = parsed.data;
  const exists = await one("SELECT 1 FROM users WHERE lower(email) = $1", [email]);
  if (exists) return { fieldErrors: { email: "An account with this email already exists. Sign in instead." } };
  const hash = await hashPassword(password);
  const clinic = form.get("side") === "clinic";
  const row = await one<{ id: string }>("INSERT INTO users (email, display_name, password_hash, timezone, role_pref) VALUES ($1,$2,$3,$4,$5) RETURNING id", [email, name, hash, validTz(form.get("timezone")), clinic ? "clinician" : "caregiver"]);
  await createSession(row!.id);
  const next = form.get("next");
  if (typeof next === "string" && next.startsWith("/app/join/")) redirect(safeNext(next));
  redirect(clinic ? "/clinic/setup" : "/app/onboarding");
}

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const ip = await clientIp();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!rateLimit(`signin:${ip}`, 20, 600_000).ok || !rateLimit(`signin:${email}`, 8, 600_000).ok) return { error: "Too many attempts. Wait a few minutes and try again." };
  const user = await one<{ id: string; password_hash: string | null; onboarded_at: Date | null; role_pref: string }>("SELECT id, password_hash, onboarded_at, role_pref FROM users WHERE lower(email) = $1", [email]);
  const ok = user?.password_hash ? await verifyPassword(user.password_hash, String(form.get("password") ?? "")) : await hashPassword("timing-equalizer").then(() => false);
  if (!user || !ok) return { error: "That email and password do not match." };
  await createSession(user.id);
  const clinician = user.role_pref === "clinician";
  const asked = form.get("next");
  const next = typeof asked === "string" && asked ? safeNext(asked) : clinician || form.get("side") === "clinic" ? "/clinic" : "/app";
  if (next.startsWith("/app/join/")) redirect(next);
  if (!user.onboarded_at) redirect(clinician ? "/clinic/setup" : "/app/onboarding");
  redirect(next);
}

export async function signOut() {
  const u = await currentUser();
  await destroySession();
  if (u?.is_demo) await endDemoUser(u.id);
  redirect("/");
}

/* ---------------- demo ---------------- */
export async function startDemoAction(form: FormData) {
  const ip = await clientIp();
  if (!rateLimit(`demo:${ip}`, Number(process.env.DEMO_RATE_PER_HOUR) || 12, 3600_000).ok) redirect("/app/demo?busy=1");
  const raw = String(form.get("choice") ?? "daniel");
  const choice: DemoChoice = raw === "clinic" || (DEMO_CHOICES as readonly string[]).includes(raw) ? (raw as DemoChoice) : "daniel";
  const side = form.get("side") === "clinic" || raw === "clinic" ? "clinic" : "patient";
  const prev = await currentUser();
  if (prev?.is_demo) {
    await destroySession();
    await endDemoUser(prev.id);
  }
  const { redirectTo } = await startDemo(choice === "clinic" ? "daniel" : choice, validTz(form.get("timezone")), side);
  redirect(redirectTo);
}

/** In the demo, jump to the other side of the same patient: clinician or patient. */
export async function switchDemoSide() {
  const u = await currentUser();
  if (!u?.is_demo) redirect("/app/demo");
  const pair = await one<{ id: string; role_pref: string }>("SELECT id, role_pref FROM users WHERE id = (SELECT demo_pair FROM users WHERE id = $1) AND is_demo AND demo_expires_at > now()", [u.id]);
  if (!pair) redirect("/app/demo");
  await destroySession();
  await createSession(pair.id, 1);
  redirect(pair.role_pref === "clinician" ? "/clinic" : "/app");
}

/* ---------------- guards ---------------- */
type Need = "view" | "edit" | "checkin" | "owner";
async function guard(journeyId: unknown, need: Need): Promise<{ user: User; access: repo.Access; journey: repo.Journey } | null> {
  const user = await currentUser();
  if (!user || typeof journeyId !== "string" || !/^[0-9a-f-]{36}$/i.test(journeyId)) return null;
  const access = await repo.accessFor(user.id, journeyId);
  if (!access) return null;
  if (need === "edit" && !access.canEditPlan) return null;
  if (need === "checkin" && !access.canCheckIn) return null;
  if (need === "owner" && !(access.via === "circle" && (access.isOwner || access.role === "patient" || access.role === "caregiver"))) return null;
  const journey = await repo.getJourney(journeyId);
  return journey ? { user, access, journey } : null;
}

/* ---------------- onboarding ---------------- */
const citySchema = z
  .object({ id: z.string().max(80).nullable().optional(), name: z.string().min(1).max(80), disambiguation: z.string().max(80).nullable().optional(), lat: z.number().nullable().optional(), lon: z.number().nullable().optional(), resolved: z.boolean() })
  .nullable();

const onboardingSchema = z.object({
  role: z.enum(["patient", "caregiver", "clinician"]),
  specialty: z.string(),
  personName: z.string().trim().max(40),
  dischargeDate: z.string(),
  horizonDays: z.number().int().min(7).max(365),
  city: citySchema,
  milestones: z.array(z.string().trim().min(1).max(120)).max(12),
  planSource: z.enum(["clinician", "family", "patient"]),
  careTeamName: z.string().trim().max(120),
  careTeamPhone: z.string().trim().max(40),
  emergencyNumber: z.string().trim().max(12),
  timezone: z.string().max(64),
  orgName: z.string().trim().max(80).optional(),
  orgKind: z.enum(["clinic", "home_care", "hospital", "employer", "other"]).optional(),
});

export async function completeOnboarding(payload: unknown): Promise<Result<{ redirectTo: string }>> {
  const user = await currentUser();
  if (!user) return fail("Your session ended. Sign in again.");
  const p = onboardingSchema.safeParse(payload);
  if (!p.success) return fail(p.error.issues[0]?.message ?? "Check the form.");
  const d = p.data;
  const tz = validTz(d.timezone);
  if (d.role === "clinician") {
    await q("UPDATE users SET role_pref = $2, timezone = $3, onboarded_at = COALESCE(onboarded_at, now()) WHERE id = $1", [user.id, d.role, tz]);
    await repo.createOrg(user.id, d.orgName || "My care team", d.orgKind ?? "clinic");
    refresh();
    return { ok: true, redirectTo: "/clinic" };
  }
  if (!isSpecialty(d.specialty)) return fail("Pick the kind of recovery.");
  if (!d.personName) return fail("Add a first name or nickname.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.dischargeDate)) return fail("Pick the discharge date.");
  if (d.emergencyNumber.length < 2) return fail("Add the emergency number for where you live.");
  const s = specialtyOf(d.specialty);
  const today = todayIn(tz);
  if (d.dischargeDate > addDays(today, 60) || d.dischargeDate < addDays(today, -365)) return fail("Pick a discharge date within the last year or the next two months.");
  await q("UPDATE users SET role_pref = $2, timezone = $3, onboarded_at = COALESCE(onboarded_at, now()) WHERE id = $1", [user.id, d.role, tz]);
  await repo.createJourney({
    createdBy: user.id,
    personName: d.personName,
    ledBy: d.role === "patient" ? "patient" : "caregiver",
    specialty: s.id,
    dischargeDate: d.dischargeDate,
    horizonDays: d.horizonDays,
    timezone: tz,
    city: d.city,
    planSource: d.planSource,
    planEnteredBy: d.planSource === "clinician" ? d.careTeamName : user.display_name,
    careTeamName: d.careTeamName,
    careTeamPhone: d.careTeamPhone,
    emergencyNumber: d.emergencyNumber,
    creatorRole: d.role === "patient" ? "patient" : "caregiver",
    milestones: d.milestones,
  });
  refresh();
  return { ok: true, redirectTo: "/app/plan?welcome=1" };
}

export async function switchJourney(journeyId: string): Promise<Result> {
  const g = await guard(journeyId, "view");
  if (!g || g.access.via !== "circle") return fail("You are not in this care circle.");
  await q("UPDATE users SET current_journey_id = $2 WHERE id = $1", [g.user.id, journeyId]);
  refresh();
  return { ok: true };
}

/* ---------------- today ---------------- */
export async function toggleDose(payload: { journeyId: string; itemId: string; date: string; slot: string; done: boolean }): Promise<Result> {
  const g = await guard(payload.journeyId, "checkin");
  if (!g) return fail("You cannot update this plan.");
  const today = todayIn(g.journey.timezone);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date) || payload.date > today || payload.date < addDays(today, -2)) return fail("You can only update today and the two days before.");
  if (payload.slot !== "any" && !isTime(payload.slot)) return fail("Unknown time slot.");
  await repo.setTaskDone(g.journey.id, payload.itemId, payload.date, payload.slot, g.user.id, payload.done);
  refresh();
  return { ok: true };
}

const checkinSchema = checkinFields.extend({ journeyId: z.string() });

export async function submitCheckin(payload: unknown): Promise<Result<{ flags: FlagResult[]; streak: number }>> {
  const p = checkinSchema.safeParse(payload);
  if (!p.success) return fail("Answer each question, then save.");
  const g = await guard(p.data.journeyId, "checkin");
  if (!g) return fail("You cannot check in on this journey.");
  const r = await recordCheckin(g.journey, g.user.id, p.data);
  refresh();
  return { ok: true, ...r };
}

/* ---------------- plan ---------------- */
const timeList = z.array(z.string().refine(isTime, "Use 24-hour times like 08:00.")).max(12);
const planItemSchema = z.object({
  journeyId: z.string(),
  id: z.string().uuid().optional(),
  kind: z.enum(["medication", "care", "exercise", "appointment", "milestone"]),
  title: z.string().trim().min(1, "Give it a name, as written on the plan.").max(160),
  detail: z.string().trim().max(600).default(""),
  times: timeList.default([]),
  weekdays: z.array(z.number().int().min(0).max(6)).max(7).nullable().default(null),
  start_day: z.number().int().min(0).max(365).default(0),
  end_day: z.number().int().min(0).max(365).nullable().default(null),
  day: z.number().int().min(-30).max(365).nullable().default(null),
  at_time: z.string().refine(isTime).nullable().default(null),
  location: z.string().trim().max(160).default(""),
  why: z.string().trim().max(600).default(""),
  how: z.string().trim().max(1200).default(""),
});

export async function savePlanItem(payload: unknown): Promise<Result> {
  const p = planItemSchema.safeParse(payload);
  if (!p.success) return fail(p.error.issues[0]?.message ?? "Check the item.");
  const g = await guard(p.data.journeyId, "edit");
  if (!g) return fail("Only the person, their main caregiver or their care team can edit the plan.");
  const it = { ...p.data, times: [...new Set(p.data.times)].sort(), weekdays: p.data.weekdays && p.data.weekdays.length && p.data.weekdays.length < 7 ? [...new Set(p.data.weekdays)].sort() : null };
  if (it.end_day !== null && it.end_day < it.start_day) return fail("The last day must be after the first day.");
  if (it.id) await repo.updatePlanItem(g.journey.id, it.id, it);
  else await repo.addPlanItem(g.journey.id, g.user.id, it);
  await repo.logActivity(g.journey.id, g.user.id, "plan", `${it.id ? "Updated" : "Added"} ${it.kind === "care" ? "care task" : it.kind}: ${it.title}`);
  const kindText = { medication: "a medicine", care: "a care task", exercise: "an exercise", appointment: "an appointment", milestone: "a milestone" }[it.kind];
  await teamEdit(g, `${it.id ? "Changed" : "Added"} ${kindText}: ${it.title}`);
  refresh();
  return { ok: true };
}

export async function deletePlanItemAction(journeyId: string, itemId: string): Promise<Result> {
  const g = await guard(journeyId, "edit");
  if (!g) return fail("You cannot edit this plan.");
  const gone = (await repo.planOf(g.journey.id)).items.find((i) => i.id === itemId);
  await repo.deletePlanItem(g.journey.id, itemId);
  if (gone) await teamEdit(g, `Removed from the plan: ${gone.title}`);
  refresh();
  return { ok: true };
}

export async function toggleMilestone(journeyId: string, itemId: string, reached: boolean): Promise<Result> {
  const g = await guard(journeyId, "checkin");
  if (!g) return fail("You cannot update this journey.");
  await repo.setMilestoneReached(g.journey.id, itemId, g.user.id, reached);
  if (reached) await repo.logActivity(g.journey.id, g.user.id, "milestone", "Reached a milestone");
  refresh();
  return { ok: true };
}

export async function addSignAction(payload: { journeyId: string; text: string; action: string }): Promise<Result> {
  const g = await guard(payload.journeyId, "edit");
  if (!g) return fail("You cannot edit this plan.");
  const text = String(payload.text ?? "").trim();
  if (text.length < 3 || text.length > 240) return fail("Type the warning sign as your care team wrote it.");
  if (payload.action !== "call_team" && payload.action !== "emergency") return fail("Choose what to do if this happens.");
  await repo.addWarningSign(g.journey.id, g.user.id, text, payload.action);
  await repo.logActivity(g.journey.id, g.user.id, "plan", "Added a warning sign to the plan");
  await teamEdit(g, `New warning sign: ${text}`);
  refresh();
  return { ok: true };
}
export async function deleteSignAction(journeyId: string, id: string): Promise<Result> {
  const g = await guard(journeyId, "edit");
  if (!g) return fail("You cannot edit this plan.");
  await repo.deleteWarningSign(g.journey.id, id);
  await teamEdit(g, "Removed a warning sign");
  refresh();
  return { ok: true };
}

const thresholdSchema = z.object({ journeyId: z.string(), metric: z.enum(["mood", "pain", "sleep", "appetite", "energy"]), op: z.enum(["gte", "lte"]), value: z.number().int(), days: z.number().int().min(1).max(7), action: z.enum(["call_team", "emergency"]) });
export async function addThresholdAction(payload: unknown): Promise<Result> {
  const p = thresholdSchema.safeParse(payload);
  if (!p.success) return fail("Check the threshold.");
  if (!validThreshold(p.data)) return fail("That value is outside the scale.");
  const g = await guard(p.data.journeyId, "edit");
  if (!g) return fail("You cannot edit this plan.");
  await repo.addThreshold(g.journey.id, g.user.id, p.data);
  await teamEdit(g, "Added a check-in rule");
  refresh();
  return { ok: true };
}
export async function deleteThresholdAction(journeyId: string, id: string): Promise<Result> {
  const g = await guard(journeyId, "edit");
  if (!g) return fail("You cannot edit this plan.");
  await repo.deleteThreshold(g.journey.id, id);
  refresh();
  return { ok: true };
}

const detailsSchema = z.object({
  journeyId: z.string(),
  person_name: z.string().trim().min(1, "Add a name.").max(40),
  discharge_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the discharge date."),
  horizon_days: z.number().int().min(7).max(365),
  care_team_name: z.string().trim().max(120),
  care_team_phone: z.string().trim().max(40),
  emergency_number: z.string().trim().min(2, "Add an emergency number.").max(12),
  diet_notes: z.string().trim().max(600),
  plan_source: z.enum(["clinician", "family", "patient"]),
  plan_entered_by: z.string().trim().max(120),
  instructions: z.string().trim().max(2000).default(""),
});
export async function saveJourneyDetails(payload: unknown): Promise<Result> {
  const p = detailsSchema.safeParse(payload);
  if (!p.success) return fail(p.error.issues[0]?.message ?? "Check the details.");
  const g = await guard(p.data.journeyId, "edit");
  if (!g) return fail("You cannot edit this plan.");
  const { journeyId, ...patch } = p.data;
  await repo.updateJourney(journeyId, patch);
  if (patch.instructions !== g.journey.instructions) await teamEdit(g, "Updated the general instructions");
  else await teamEdit(g, "Updated the plan details");
  refresh();
  return { ok: true };
}

/* ---------------- circle ---------------- */
export async function createInviteAction(journeyId: string, role: string): Promise<Result<{ url: string }>> {
  const g = await guard(journeyId, "owner");
  if (!g) return fail("Only the person or their main caregiver can invite people.");
  if (!["family", "carer", "caregiver", "patient", "clinician"].includes(role)) return fail("Pick a role.");
  if (!rateLimit(`invite:${g.user.id}`, 30, 3600_000).ok) return fail("Too many invites in an hour.");
  const c = await repo.createInvite({ journeyId, role, createdBy: g.user.id });
  await repo.logActivity(journeyId, g.user.id, "circle", `Created an invite link for a ${role}`);
  refresh();
  return { ok: true, url: `${await appOrigin()}/app/join/${c}` };
}
export async function revokeInviteAction(journeyId: string, c: string): Promise<Result> {
  const g = await guard(journeyId, "owner");
  if (!g) return fail("You cannot manage invites here.");
  await repo.revokeInvite(journeyId, c);
  refresh();
  return { ok: true };
}
export async function removeMemberAction(journeyId: string, userId: string): Promise<Result> {
  const g = await guard(journeyId, "owner");
  if (!g) return fail("You cannot manage this circle.");
  await repo.removeMember(journeyId, userId);
  await q("INSERT INTO consent_log (journey_id, user_id, scope, granted, detail) VALUES ($1, $2, 'circle', false, 'member removed')", [journeyId, g.user.id]);
  refresh();
  return { ok: true };
}
export async function leaveCircle(journeyId: string): Promise<Result> {
  const g = await guard(journeyId, "view");
  if (!g || g.access.via !== "circle" || g.access.isOwner) return fail("The journey owner cannot leave. Delete the account from settings instead.");
  await repo.removeMember(journeyId, g.user.id);
  await q("UPDATE users SET current_journey_id = NULL WHERE id = $1", [g.user.id]);
  refresh();
  return { ok: true };
}

export async function addCircleTaskAction(payload: { journeyId: string; title: string; due: string | null; assignee: string | null }): Promise<Result> {
  const g = await guard(payload.journeyId, "view");
  if (!g || g.access.via !== "circle") return fail("Join the care circle to add tasks.");
  const title = String(payload.title ?? "").trim();
  if (!title || title.length > 140) return fail("Describe the task in a few words.");
  const due = payload.due && /^\d{4}-\d{2}-\d{2}$/.test(payload.due) ? payload.due : null;
  const members = await repo.membersOf(g.journey.id);
  const assignee = payload.assignee && members.some((m) => m.user_id === payload.assignee) ? payload.assignee : null;
  await repo.addCircleTask(g.journey.id, g.user.id, title, due, assignee);
  refresh();
  return { ok: true };
}
export async function circleTaskAction(journeyId: string, id: string, op: "done" | "undo" | "claim" | "delete"): Promise<Result> {
  const g = await guard(journeyId, "view");
  if (!g || g.access.via !== "circle") return fail("Join the care circle to update tasks.");
  if (op === "claim") await repo.claimCircleTask(journeyId, id, g.user.id);
  else if (op === "delete") await repo.deleteCircleTask(journeyId, id);
  else await repo.toggleCircleTask(journeyId, id, g.user.id, op === "done");
  refresh();
  return { ok: true };
}

export async function setOrgConsentAction(journeyId: string, granted: boolean): Promise<Result> {
  const g = await guard(journeyId, "owner");
  if (!g) return fail("Only the person or their main caregiver can change sharing.");
  await repo.setOrgConsent(journeyId, g.user.id, granted);
  refresh();
  return { ok: true };
}

export async function acceptInviteAction(c: string, consentOrg: boolean): Promise<Result<{ redirectTo: string }>> {
  const user = await currentUser();
  if (!user) return fail("Sign in first.");
  const inv = await repo.getInvite(String(c));
  if (!inv || inv.revoked_at || new Date(inv.expires_at) < new Date() || inv.uses >= inv.max_uses) return fail("This invite has expired or was revoked. Ask for a new link.");
  try {
    const r = await repo.acceptInvite(inv, user.id, consentOrg);
    await q("UPDATE users SET onboarded_at = COALESCE(onboarded_at, now()) WHERE id = $1", [user.id]);
    refresh();
    return { ok: true, redirectTo: r.orgId ? "/clinic" : "/app?joined=1" };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not join.");
  }
}

/* ---------------- comfort ---------------- */
const favSchema = z
  .array(z.object({ id: z.string().min(1).max(80), name: z.string().min(1).max(160), type: z.enum(FAVORITE_TYPES), image: z.string().url().max(500).nullable().optional(), disambiguation: z.string().max(200).nullable().optional(), resolved: z.boolean() }))
  .max(16);
export async function saveComfort(payload: { journeyId: string; favorites?: unknown; filters?: unknown; outingsOk?: boolean; city?: unknown }): Promise<Result> {
  const g = await guard(payload.journeyId, "checkin");
  if (!g) return fail("You cannot change comfort settings here.");
  const patch: Partial<repo.TasteRow> = {};
  if (payload.favorites !== undefined) {
    const f = favSchema.safeParse(payload.favorites);
    if (!f.success) return fail("Could not save those favorites.");
    patch.favorites = f.data;
  }
  if (payload.filters !== undefined) patch.filters = cleanFilters(payload.filters);
  if (typeof payload.outingsOk === "boolean") patch.outings_ok = payload.outingsOk;
  await repo.saveTaste(g.journey.id, patch);
  if (payload.city !== undefined) {
    const c = citySchema.safeParse(payload.city);
    if (!c.success) return fail("Could not save that place.");
    await repo.updateJourney(g.journey.id, { city: c.data });
  }
  refresh();
  return { ok: true };
}

export async function setShareAction(payload: { journeyId: string; on: boolean; theme: string; message: string; from: string }): Promise<Result<{ url: string | null }>> {
  const g = await guard(payload.journeyId, "owner");
  if (!g) return fail("Only the person or their main caregiver can share the welcome card.");
  const theme = (["dusk", "paper", "sunrise"] as const).find((t) => t === payload.theme) ?? "dusk";
  const card = { theme, message: String(payload.message ?? "").trim().slice(0, 200), from: String(payload.from ?? "").trim().slice(0, 60) };
  await repo.setShare(g.journey.id, g.user.id, Boolean(payload.on), card);
  const j = await repo.getJourney(g.journey.id);
  refresh();
  if (j?.share_slug) revalidatePath(`/w/${j.share_slug}`);
  return { ok: true, url: j?.share_slug ? `${await appOrigin()}/w/${j.share_slug}` : null };
}

/* ---------------- care team ---------------- */
async function orgGuard(orgId: string) {
  const user = await currentUser();
  if (!user) return null;
  const org = (await repo.orgsOf(user.id)).find((o) => o.id === orgId);
  return org ? { user, org } : null;
}

export async function ackFlagAction(journeyId: string, flagId: string, note: string): Promise<Result> {
  const g = await guard(journeyId, "view");
  if (!g) return fail("You cannot review this flag.");
  await repo.ackFlag(flagId, journeyId, g.user.id, String(note ?? "").trim().slice(0, 300));
  await repo.logActivity(journeyId, g.user.id, "flag", "The care team reviewed a flagged check-in");
  refresh();
  return { ok: true };
}

export async function orgInviteAction(orgId: string): Promise<Result<{ url: string }>> {
  const og = await orgGuard(orgId);
  if (!og || og.org.role !== "admin") return fail("Only team admins can invite clinicians.");
  const c = await repo.createInvite({ orgId, role: "clinician", createdBy: og.user.id });
  return { ok: true, url: `${await appOrigin()}/app/join/${c}` };
}


/* ---------------- settings ---------------- */
export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = String(form.get("name") ?? "").trim();
  if (!name || name.length > 60) return { fieldErrors: { name: "Tell us what to call you." } };
  await q("UPDATE users SET display_name = $2, timezone = $3 WHERE id = $1", [user.id, name, validTz(form.get("timezone"))]);
  refresh();
  return { ok: "Saved." };
}

export async function deleteAccount(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  if (String(form.get("confirm") ?? "").trim().toUpperCase() !== "DELETE") return { fieldErrors: { confirm: "Type DELETE to confirm." } };
  await destroySession();
  if (user.is_demo) await endDemoUser(user.id);
  else await repo.deleteUser(user.id);
  redirect("/?deleted=1");
}

export async function completeTour(): Promise<void> {
  const user = await currentUser();
  if (user) await q("UPDATE users SET tour_completed_at = now() WHERE id = $1", [user.id]);
}

/* ---------------- clinician workspace ---------------- */
export async function clinicSetupAction(payload: { name: string; kind: string }): Promise<Result<{ redirectTo: string }>> {
  const user = await currentUser();
  if (!user) return fail("Sign in first.");
  const name = String(payload.name ?? "").trim();
  if (!name || name.length > 80) return fail("Name your care team.");
  const kind = ["clinic", "home_care", "hospital", "employer", "other"].includes(payload.kind) ? payload.kind : "clinic";
  if (!(await repo.orgsOf(user.id)).length) await repo.createOrg(user.id, name, kind);
  await q("UPDATE users SET role_pref = 'clinician', onboarded_at = COALESCE(onboarded_at, now()) WHERE id = $1", [user.id]);
  refresh();
  return { ok: true, redirectTo: "/clinic" };
}

const clinicPlanSchema = z.object({
  orgId: z.string().uuid(),
  personName: z.string().trim().min(1, "Add the patient's first name.").max(40),
  specialty: z.string(),
  dischargeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the discharge date."),
  ledBy: z.enum(["patient", "caregiver"]),
  phone: z.string().trim().max(40),
  emergency: z.string().trim().min(2, "Add the local emergency number.").max(12),
  city: citySchema.optional(),
  horizonDays: z.number().int().min(7).max(365).optional(),
  templateId: z.string().max(60).optional(),
});
/** A clinician starts a plan for a patient from a specialty template or a plan template. Nothing is sent yet. */
export async function createClinicPlan(payload: unknown): Promise<Result<{ journeyId: string }>> {
  const p = clinicPlanSchema.safeParse(payload);
  if (!p.success) return fail(p.error.issues[0]?.message ?? "Check the form.");
  const user = await currentUser();
  if (!user) return fail("Sign in first.");
  const org = (await repo.orgsOf(user.id)).find((o) => o.id === p.data.orgId);
  if (!org) return fail("You are not part of this care team.");
  const tpl = p.data.templateId ? await resolveTemplate(org.id, p.data.templateId) : null;
  if (p.data.templateId && !tpl) return fail("That template was removed. Pick another one.");
  const spec = tpl?.specialty ?? p.data.specialty;
  if (!isSpecialty(spec)) return fail("Pick a specialty template.");
  const s = specialtyOf(spec);
  const id = await repo.createJourney({
    createdBy: user.id,
    orgId: org.id,
    personName: p.data.personName,
    ledBy: p.data.ledBy,
    specialty: s.id,
    dischargeDate: p.data.dischargeDate,
    horizonDays: p.data.horizonDays ?? tpl?.horizonDays ?? s.horizonDays,
    timezone: user.timezone,
    city: p.data.city ?? null,
    planSource: "clinician",
    planEnteredBy: user.display_name,
    careTeamName: org.name,
    careTeamPhone: p.data.phone,
    emergencyNumber: p.data.emergency,
    creatorRole: null,
    consentOrg: true,
    milestones: tpl ? [] : s.milestones,
  });
  if (tpl) await applyTemplate(id, user.id, tpl.body);
  refresh();
  return { ok: true, journeyId: id };
}

async function teamGuard(journeyId: unknown) {
  const g = await guard(journeyId, "edit");
  return g && isTeam(g.access) ? g : null;
}

export async function sendPlanAction(journeyId: string): Promise<Result<{ code: string; pretty: string; url: string }>> {
  const g = await teamGuard(journeyId);
  if (!g) return fail("Only the care team can send this plan.");
  const plan = await repo.planOf(g.journey.id);
  if (!plan.items.some((i) => i.kind !== "milestone")) return fail("Add at least one medicine, task, exercise or appointment before sending.");
  if (!g.journey.emergency_number) return fail("Add the local emergency number first.");
  const unwritten = plan.items.filter((i) => i.needs_review).length;
  if (unwritten) return fail(`${unwritten} item${unwritten > 1 ? "s" : ""} from the template still need${unwritten > 1 ? "" : "s"} your own words. Edit or remove ${unwritten > 1 ? "each one" : "it"} before sending.`);
  const c = await repo.sendPlan(g.journey.id, g.user.id, g.journey.led_by);
  await repo.logActivity(g.journey.id, g.user.id, "plan", `Plan sent to ${g.journey.person_name}`);
  refresh();
  return { ok: true, code: c, pretty: repo.prettyCode(c), url: `${await appOrigin()}/app/join/${c}` };
}

export async function sendMessageAction(payload: { journeyId: string; body: string; kind?: string }): Promise<Result> {
  const g = await guard(payload.journeyId, "view");
  if (!g) return fail("You cannot message on this journey.");
  const body = String(payload.body ?? "").trim();
  if (!body) return fail("Write a message first.");
  if (body.length > 2000) return fail("Keep it under 2000 characters.");
  if (!rateLimit(`msg:${g.user.id}`, 60, 3600_000).ok) return fail("Too many messages in an hour.");
  const team = isTeam(g.access);
  if (!team && g.access.role === "family") return fail("Messages to the care team come from the patient or main caregivers.");
  await repo.addMessage(g.journey.id, g.user.id, team ? "team" : "patient", team ? "message" : payload.kind === "question" ? "question" : "message", body);
  refresh();
  return { ok: true };
}

export async function resolveQuestionsAction(journeyId: string): Promise<Result> {
  const g = await teamGuard(journeyId);
  if (!g) return fail("Only the care team can close questions.");
  await repo.resolveQuestions(g.journey.id, g.user.id);
  refresh();
  return { ok: true };
}

export async function markPlanSeenAction(journeyId: string): Promise<Result> {
  const g = await guard(journeyId, "view");
  if (!g) return fail("Not found.");
  await repo.markPlanSeen(g.journey.id, g.user.id);
  refresh();
  return { ok: true };
}

/** Patient types the code their care team gave them. */
export async function redeemCodeAction(raw: string): Promise<Result<{ redirectTo: string }>> {
  const ip = await clientIp();
  if (!rateLimit(`redeem:${ip}`, 20, 600_000).ok) return fail("Too many tries. Wait a few minutes.");
  const c = repo.normalizeCode(raw);
  if (!/^[A-Za-z0-9]{4,40}$/.test(c)) return fail("Type the 8-character code from your care team.");
  const inv = await repo.getInvite(c);
  if (!inv || inv.revoked_at || new Date(inv.expires_at) < new Date() || inv.uses >= inv.max_uses) return fail("That code is not valid or has expired. Ask your care team for a new one.");
  return { ok: true, redirectTo: `/app/join/${c}` };
}

export async function renameOrgAction(orgId: string, name: string): Promise<Result> {
  const og = await orgGuard(orgId);
  if (!og || og.org.role !== "admin") return fail("Only team admins can rename the team.");
  const n = String(name ?? "").trim();
  if (!n || n.length > 80) return fail("Name your care team.");
  await repo.renameOrg(orgId, n);
  refresh();
  return { ok: true };
}

/* ---------------- outcomes (care team only) ---------------- */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.");
const measureSchema = z.object({
  journeyId: z.string(),
  instrument: z.string().max(40),
  label: z.string().trim().max(80).optional(),
  unit: z.string().trim().max(24).optional(),
  min: z.number().finite().optional(),
  max: z.number().finite().optional(),
  higherIsBetter: z.boolean().optional(),
  target: z.number().finite().nullable().optional(),
});

export async function addMeasureAction(payload: unknown): Promise<Result> {
  const p = measureSchema.safeParse(payload);
  if (!p.success) return fail("Check the measure and try again.");
  const g = await teamGuard(p.data.journeyId);
  if (!g) return fail("Only the care team can choose outcome measures.");
  const inst = instrumentOf(p.data.instrument);
  const m = inst
    ? { instrument: inst.id, label: inst.label, unit: inst.unit, min: inst.min, max: inst.max, higherIsBetter: inst.higherIsBetter }
    : p.data.instrument === CUSTOM_ID && p.data.label && p.data.min !== undefined && p.data.max !== undefined && p.data.max > p.data.min
      ? { instrument: CUSTOM_ID, label: p.data.label, unit: p.data.unit ?? "", min: p.data.min, max: p.data.max, higherIsBetter: p.data.higherIsBetter ?? true }
      : null;
  if (!m) return fail("Name the measure and give it a range where the top is above the bottom.");
  const target = p.data.target ?? null;
  if (target !== null && (target < m.min || target > m.max)) return fail(`A target must be between ${m.min} and ${m.max}.`);
  const row = await addMeasure(g.journey.id, g.user.id, { ...m, target });
  if (!row) return fail("That measure is already on this patient.");
  await repo.logActivity(g.journey.id, g.user.id, "outcome", `Started tracking ${m.label}`);
  refresh();
  return { ok: true };
}

export async function removeMeasureAction(journeyId: string, id: string): Promise<Result> {
  const g = await teamGuard(journeyId);
  if (!g) return fail("Only the care team can change outcome measures.");
  await removeMeasure(g.journey.id, String(id));
  refresh();
  return { ok: true };
}

const valueSchema = z.object({ journeyId: z.string(), measureId: z.string().uuid(), value: z.number().finite(), on: isoDate, note: z.string().trim().max(300).default("") });
export async function recordOutcomeAction(payload: unknown): Promise<Result> {
  const p = valueSchema.safeParse(payload);
  if (!p.success) return fail("Enter a number and a date.");
  const g = await teamGuard(p.data.journeyId);
  if (!g) return fail("Only the care team can record outcomes.");
  const m = await measureById(g.journey.id, p.data.measureId);
  if (!m) return fail("That measure was removed.");
  if (p.data.value < m.min_value || p.data.value > m.max_value) return fail(`${m.label} is recorded from ${m.min_value} to ${m.max_value}.`);
  const today = todayIn(g.journey.timezone);
  if (p.data.on > today || p.data.on < addDays(g.journey.discharge_date, -30)) return fail("Use a date from shortly before discharge up to today.");
  await addValue(g.journey.id, m.id, g.user.id, p.data.value, p.data.on, p.data.note);
  await repo.logActivity(g.journey.id, g.user.id, "outcome", `Recorded ${m.label}`);
  refresh();
  return { ok: true };
}

export async function removeOutcomeValueAction(journeyId: string, id: string): Promise<Result> {
  const g = await teamGuard(journeyId);
  if (!g) return fail("Only the care team can change outcomes.");
  await removeValue(g.journey.id, String(id));
  refresh();
  return { ok: true };
}

const readmitSchema = z.object({ journeyId: z.string(), admitted: isoDate, discharged: isoDate.nullable().default(null), note: z.string().trim().max(300).default("") });
export async function recordReadmissionAction(payload: unknown): Promise<Result> {
  const p = readmitSchema.safeParse(payload);
  if (!p.success) return fail("Pick the admission date.");
  const g = await teamGuard(p.data.journeyId);
  if (!g) return fail("Only the care team can record a readmission.");
  const today = todayIn(g.journey.timezone);
  if (p.data.admitted < g.journey.discharge_date || p.data.admitted > today) return fail("The admission date must be between discharge and today.");
  if (p.data.discharged && (p.data.discharged < p.data.admitted || p.data.discharged > today)) return fail("Discharge must be on or after admission, and not in the future.");
  await addReadmission(g.journey.id, g.user.id, p.data.admitted, p.data.discharged, p.data.note);
  await repo.logActivity(g.journey.id, g.user.id, "outcome", "Recorded a hospital readmission");
  refresh();
  return { ok: true };
}

export async function closeReadmissionAction(journeyId: string, id: string, discharged: string): Promise<Result> {
  const g = await teamGuard(journeyId);
  if (!g) return fail("Only the care team can update a readmission.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(discharged) || discharged > todayIn(g.journey.timezone)) return fail("Pick a discharge date up to today.");
  await closeReadmission(g.journey.id, String(id), discharged);
  refresh();
  return { ok: true };
}

export async function removeReadmissionAction(journeyId: string, id: string): Promise<Result> {
  const g = await teamGuard(journeyId);
  if (!g) return fail("Only the care team can change readmissions.");
  await removeReadmission(g.journey.id, String(id));
  refresh();
  return { ok: true };
}

/* ---------------- plan templates (care team) ---------------- */
const tItem = z.object({
  kind: z.enum(["medication", "care", "exercise", "appointment"]),
  title: z.string().trim().min(1, "Every item needs a title.").max(160),
  detail: z.string().trim().max(600).default(""),
  why: z.string().trim().max(600).default(""),
  how: z.string().trim().max(1200).default(""),
  times: z.array(z.string().refine(isTime, "Use 24-hour times like 08:00.")).max(12).default([]),
  weekdays: z.array(z.number().int().min(0).max(6)).max(7).nullable().default(null),
  start_day: z.number().int().min(0).max(365).default(0),
  end_day: z.number().int().min(0).max(365).nullable().default(null),
  day: z.number().int().min(-30).max(365).nullable().default(null),
  at_time: z.string().refine(isTime).nullable().default(null),
  location: z.string().trim().max(160).default(""),
  needs_review: z.boolean().optional(),
});
const tBody = z.object({
  instructions: z.string().trim().max(4000).default(""),
  items: z.array(tItem).max(80),
  milestones: z.array(z.object({ title: z.string().trim().min(1).max(120), day: z.number().int().min(0).max(365).nullable() })).max(20),
  signs: z.array(z.object({ text: z.string().trim().min(1).max(300), action: z.enum(["call_team", "emergency"]) })).max(30),
  thresholds: z.array(z.object({ metric: z.enum(["mood", "pain", "sleep", "appetite", "energy"]), op: z.enum(["gte", "lte"]), value: z.number(), days: z.number().int().min(1).max(14), action: z.enum(["call_team", "emergency"]) })).max(20),
  measures: z.array(z.string().max(40)).max(12),
});
const tMeta = z.object({ name: z.string().trim().min(2, "Name the template.").max(80), description: z.string().trim().max(400).default(""), specialty: z.string(), horizonDays: z.number().int().min(7).max(365) });

export async function saveTemplateAction(payload: unknown): Promise<Result<{ id: string }>> {
  const p = z.object({ orgId: z.string().uuid(), id: z.string().uuid().nullable(), meta: tMeta, body: tBody }).safeParse(payload);
  if (!p.success) return fail(p.error.issues[0]?.message ?? "Check the template.");
  const og = await orgGuard(p.data.orgId);
  if (!og) return fail("You are not part of this care team.");
  if (!isSpecialty(p.data.meta.specialty)) return fail("Pick a specialty.");
  const body = { ...p.data.body, measures: p.data.body.measures.filter((m) => instrumentOf(m)) };
  const meta = { name: p.data.meta.name, description: p.data.meta.description, specialty: p.data.meta.specialty, horizonDays: p.data.meta.horizonDays, body };
  if (p.data.id) {
    if (!(await teamTemplate(og.org.id, p.data.id))) return fail("That template was removed.");
    await updateTemplate(og.org.id, p.data.id, meta);
    refresh();
    return { ok: true, id: p.data.id };
  }
  const row = await createTemplate(og.org.id, og.user.id, { ...meta, basedOn: null });
  refresh();
  return { ok: true, id: row!.id };
}

/** Copies a built-in structure template into the team's library so it can be edited. */
export async function copyBuiltinTemplateAction(orgId: string, builtinId: string): Promise<Result<{ id: string }>> {
  const og = await orgGuard(orgId);
  if (!og) return fail("You are not part of this care team.");
  const b = builtinTemplate(builtinId);
  if (!b) return fail("Unknown template.");
  const row = await createTemplate(og.org.id, og.user.id, { name: b.name, description: b.description, specialty: b.specialty, horizonDays: b.horizonDays, body: b.body, basedOn: b.id });
  refresh();
  return { ok: true, id: row!.id };
}

export async function saveJourneyAsTemplateAction(journeyId: string, name: string): Promise<Result<{ id: string }>> {
  const g = await teamGuard(journeyId);
  if (!g || !g.journey.org_id) return fail("Only the care team can save templates.");
  const n = String(name ?? "").trim();
  if (n.length < 2 || n.length > 80) return fail("Name the template.");
  const body = await bodyFromJourney(g.journey.id);
  const row = await createTemplate(g.journey.org_id, g.user.id, { name: n, description: `Saved from a plan for ${specialtyOf(g.journey.specialty).label.toLowerCase()}.`, specialty: g.journey.specialty, horizonDays: g.journey.horizon_days, body, basedOn: null });
  refresh();
  return { ok: true, id: row!.id };
}

export async function deleteTemplateAction(orgId: string, id: string): Promise<Result> {
  const og = await orgGuard(orgId);
  if (!og) return fail("You are not part of this care team.");
  await deleteTemplate(og.org.id, String(id));
  refresh();
  return { ok: true };
}

/** Research consent: separate from sharing with the care team. Owner only, and only for team plans. */
export async function setResearchConsentAction(journeyId: string, granted: boolean): Promise<Result> {
  const g = await guard(journeyId, "owner");
  if (!g) return fail("Only the person or their main caregiver can change research consent.");
  if (!g.journey.org_id) return fail("Research applies only to plans from a care team on loci.");
  if (granted && !g.journey.consent_org) return fail("Share with the care team first. Research uses only data the team can already see.");
  await setResearchConsent(g.journey.id, g.user.id, Boolean(granted));
  refresh();
  return { ok: true };
}

/* ---------------- reminders ---------------- */
const ReminderInput = z.object({
  journeyId: z.string(),
  checkinTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  steps: z.boolean(),
  inApp: z.boolean(),
  sms: z.boolean(),
  whatsapp: z.boolean(),
  phone: z.string().max(40),
});

export async function saveReminderPrefsAction(payload: z.infer<typeof ReminderInput>): Promise<Result> {
  const p = ReminderInput.safeParse(payload);
  if (!p.success) return fail("Check the reminder time.");
  const g = await guard(p.data.journeyId, "view");
  if (!g) return fail("You cannot set reminders here.");
  const c = connectedChannels();
  if ((p.data.sms && !c.sms) || (p.data.whatsapp && !c.whatsapp)) return fail("That channel is not connected, so nothing could be sent.");
  const phone = p.data.phone.trim() ? normalisePhone(p.data.phone) : null;
  if ((p.data.sms || p.data.whatsapp) && !phone) return fail("Add a mobile number with the country code, like +1 212 555 0100.");
  await savePrefs(g.user.id, g.journey.id, { checkin_time: p.data.checkinTime, steps: p.data.steps, in_app: p.data.inApp, sms: p.data.sms, whatsapp: p.data.whatsapp, phone });
  refresh();
  return { ok: true };
}

export async function sendTestReminderAction(journeyId: string, channel: "sms" | "whatsapp"): Promise<Result> {
  const g = await guard(journeyId, "view");
  if (!g) return fail("You cannot send reminders here.");
  if (channel !== "sms" && channel !== "whatsapp") return fail("Unknown channel.");
  if (!rateLimit(`remind-test:${g.user.id}`, 5, 3600_000).ok) return fail("Too many test messages. Try again later.");
  const r = await sendTest(g.user.id, g.journey, channel);
  if (r.ok) return { ok: true };
  return fail(r.error === "not_connected" ? "Not connected. Nothing was sent." : r.error);
}
