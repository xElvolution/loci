import "server-only";
import { one, q } from "./db";
import * as repo from "./repo";
import { addMeasure } from "./outcomes";
import { instrumentOf } from "@/lib/care/instruments";
import { BUILTIN_TEMPLATES, builtinTemplate, type TemplateBody } from "@/lib/care/templates";
import { isSpecialty, specialtyOf } from "@/lib/care/specialties";

export type TeamTemplate = { id: string; name: string; description: string; specialty: string; horizon_days: number; body: TemplateBody; based_on: string | null; updated_at: Date; author: string | null };

export async function teamTemplates(orgId: string): Promise<TeamTemplate[]> {
  return q<TeamTemplate>(
    `SELECT t.id, t.name, t.description, t.specialty, t.horizon_days, t.body, t.based_on, t.updated_at, u.display_name AS author
       FROM plan_templates t LEFT JOIN users u ON u.id = t.created_by WHERE t.org_id = $1 ORDER BY t.updated_at DESC`,
    [orgId],
  );
}

export async function teamTemplate(orgId: string, id: string): Promise<TeamTemplate | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return one<TeamTemplate>(
    `SELECT t.id, t.name, t.description, t.specialty, t.horizon_days, t.body, t.based_on, t.updated_at, u.display_name AS author
       FROM plan_templates t LEFT JOIN users u ON u.id = t.created_by WHERE t.org_id = $1 AND t.id = $2`,
    [orgId, id],
  );
}

export async function createTemplate(orgId: string, userId: string, t: { name: string; description: string; specialty: string; horizonDays: number; body: TemplateBody; basedOn: string | null }) {
  return one<{ id: string }>(
    "INSERT INTO plan_templates (org_id, name, description, specialty, horizon_days, body, based_on, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
    [orgId, t.name, t.description, t.specialty, t.horizonDays, JSON.stringify(t.body), t.basedOn, userId],
  );
}

export async function updateTemplate(orgId: string, id: string, t: { name: string; description: string; specialty: string; horizonDays: number; body: TemplateBody }) {
  await q("UPDATE plan_templates SET name=$3, description=$4, specialty=$5, horizon_days=$6, body=$7, updated_at=now() WHERE org_id=$1 AND id=$2", [orgId, id, t.name, t.description, t.specialty, t.horizonDays, JSON.stringify(t.body)]);
}

export async function deleteTemplate(orgId: string, id: string) {
  await q("DELETE FROM plan_templates WHERE org_id = $1 AND id = $2", [orgId, id]);
}

/** A built-in or team template, by id, for this team. */
export async function resolveTemplate(orgId: string, id: string) {
  const b = builtinTemplate(id);
  if (b) return { id: b.id, name: b.name, specialty: b.specialty, horizonDays: b.horizonDays, ledBy: b.ledBy, body: b.body };
  const t = await teamTemplate(orgId, id);
  if (!t || !isSpecialty(t.specialty)) return null;
  return { id: t.id, name: t.name, specialty: t.specialty, horizonDays: t.horizon_days, ledBy: specialtyOf(t.specialty).ledBy, body: t.body };
}

/** Copies a template's structure into a new draft plan. */
export async function applyTemplate(journeyId: string, userId: string, body: TemplateBody) {
  if (body.instructions) await repo.updateJourney(journeyId, { instructions: body.instructions });
  for (const [i, it] of body.items.entries()) await repo.addPlanItem(journeyId, userId, { ...it, sort: i });
  for (const [i, m] of body.milestones.entries())
    await repo.addPlanItem(journeyId, userId, { kind: "milestone", title: m.title, detail: "", why: "", how: "", times: [], weekdays: null, start_day: 0, end_day: null, day: m.day, at_time: null, location: "", sort: i });
  for (const s of body.signs) await repo.addWarningSign(journeyId, userId, s.text, s.action);
  for (const t of body.thresholds) await repo.addThreshold(journeyId, userId, t);
  for (const id of body.measures) {
    const inst = instrumentOf(id);
    if (inst) await addMeasure(journeyId, userId, { instrument: inst.id, label: inst.label, unit: inst.unit, min: inst.min, max: inst.max, higherIsBetter: inst.higherIsBetter, target: null });
  }
}

/** The team's own plan, captured as a reusable template. Patient names and dates are not part of it. */
export async function bodyFromJourney(journeyId: string): Promise<TemplateBody> {
  const j = await repo.getJourney(journeyId);
  const plan = await repo.planOf(journeyId);
  const measures = await q<{ instrument: string }>("SELECT instrument FROM outcome_measures WHERE journey_id = $1 AND instrument <> 'custom' ORDER BY created_at", [journeyId]);
  return {
    instructions: j?.instructions ?? "",
    items: plan.items
      .filter((i) => i.kind !== "milestone")
      .map((i) => ({ kind: i.kind, title: i.title, detail: i.detail, why: i.why ?? "", how: i.how ?? "", times: i.times, weekdays: i.weekdays, start_day: i.start_day, end_day: i.end_day, day: i.day, at_time: i.at_time, location: i.location, needs_review: !!i.needs_review })),
    milestones: plan.items.filter((i) => i.kind === "milestone").map((m) => ({ title: m.title, day: m.day })),
    signs: plan.signs.map((s) => ({ text: s.text, action: s.action })),
    thresholds: plan.thresholds.map((t) => ({ metric: t.metric, op: t.op, value: t.value, days: t.days, action: t.action })),
    measures: measures.map((m) => m.instrument),
  };
}

export { BUILTIN_TEMPLATES };
