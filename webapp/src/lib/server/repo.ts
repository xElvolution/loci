import "server-only";
import { randomBytes } from "node:crypto";
import { one, q, tx } from "./db";
import type { City, Favorite } from "@/lib/qloo/types";
import type { Checkin, PlanItem, TaskLog, Threshold, WarningSign } from "@/lib/care/types";
import { addDays, toIso, todayIn } from "@/lib/care/dates";

export type CircleRole = "patient" | "caregiver" | "family" | "carer" | "clinician";

export type Journey = {
  id: string;
  created_by: string | null;
  org_id: string | null;
  person_name: string;
  led_by: "patient" | "caregiver";
  specialty: string;
  discharge_date: string;
  horizon_days: number;
  timezone: string;
  city: City | null;
  plan_source: "clinician" | "family" | "patient";
  plan_entered_by: string;
  care_team_name: string;
  care_team_phone: string;
  emergency_number: string;
  diet_notes: string;
  consent_org: boolean;
  research_consent: boolean;
  share_slug: string | null;
  card: CardConfig;
  thriving_at: Date | null;
  created_at: Date;
  plan_sent_at: Date | null;
  plan_updated_at: Date | null;
  instructions: string;
};

export type CardConfig = { theme?: "dusk" | "paper" | "sunrise"; message?: string; from?: string };

export type Access =
  | { via: "circle"; role: CircleRole; isOwner: boolean; canEditPlan: boolean; canCheckIn: boolean; orgRole: null }
  | { via: "org"; role: "clinician"; isOwner: false; canEditPlan: boolean; canCheckIn: false; orgRole: "admin" | "clinician" };

const JOURNEY_COLS = `j.id, j.created_by, j.org_id, j.person_name, j.led_by, j.specialty, to_char(j.discharge_date, 'YYYY-MM-DD') AS discharge_date,
  j.horizon_days, j.timezone, j.city, j.plan_source, j.plan_entered_by, j.care_team_name, j.care_team_phone, j.emergency_number,
  j.diet_notes, j.consent_org, j.research_consent, j.share_slug, j.card, j.thriving_at, j.created_at, j.plan_sent_at, j.plan_updated_at, j.instructions`;

export const code = (n = 9) => randomBytes(n).toString("base64url").replace(/[-_]/g, "x").slice(0, n + 3);

/* ---------- access ---------- */

export async function accessFor(userId: string, journeyId: string): Promise<Access | null> {
  const row = await one<{ role: CircleRole | null; is_owner: boolean | null; org_role: "admin" | "clinician" | null; consent_org: boolean; team_plan: boolean }>(
    `SELECT cm.role, cm.is_owner, om.role AS org_role, j.consent_org, (j.org_id IS NOT NULL AND j.plan_source = 'clinician') AS team_plan
       FROM journeys j
       LEFT JOIN circle_members cm ON cm.journey_id = j.id AND cm.user_id = $1
       LEFT JOIN org_members om ON om.org_id = j.org_id AND om.user_id = $1
      WHERE j.id = $2`,
    [userId, journeyId],
  );
  if (!row) return null;
  if (row.role) {
    // a plan written by a care team is edited by that team; the family follows it
    const editor = row.team_plan ? row.role === "clinician" : row.is_owner || row.role === "patient" || row.role === "caregiver" || row.role === "clinician";
    return { via: "circle", role: row.role, isOwner: Boolean(row.is_owner), canEditPlan: Boolean(editor), canCheckIn: row.role !== "family", orgRole: null };
  }
  if (row.org_role && row.consent_org) return { via: "org", role: "clinician", isOwner: false, canEditPlan: true, canCheckIn: false, orgRole: row.org_role };
  return null;
}

/* ---------- journeys ---------- */

export async function getJourney(id: string): Promise<Journey | null> {
  return one<Journey>(`SELECT ${JOURNEY_COLS} FROM journeys j WHERE j.id = $1`, [id]);
}

export type JourneyListItem = Journey & { role: CircleRole; is_owner: boolean };
export async function listJourneys(userId: string): Promise<JourneyListItem[]> {
  return q<JourneyListItem>(
    `SELECT ${JOURNEY_COLS}, cm.role, cm.is_owner FROM circle_members cm JOIN journeys j ON j.id = cm.journey_id WHERE cm.user_id = $1 ORDER BY cm.joined_at`,
    [userId],
  );
}

/** The journey the user is looking at: their saved choice, else their first circle. */
export async function currentJourney(user: { id: string; current_journey_id: string | null }): Promise<{ journey: Journey; access: Access } | null> {
  if (user.current_journey_id) {
    const access = await accessFor(user.id, user.current_journey_id);
    const journey = access ? await getJourney(user.current_journey_id) : null;
    if (journey && access) return { journey, access };
  }
  const first = (await listJourneys(user.id))[0];
  if (!first) return null;
  const access = await accessFor(user.id, first.id);
  return access ? { journey: first, access } : null;
}

export type NewJourney = {
  createdBy: string;
  personName: string;
  ledBy: "patient" | "caregiver";
  specialty: string;
  dischargeDate: string;
  horizonDays: number;
  timezone: string;
  city: City | null;
  planSource: Journey["plan_source"];
  planEnteredBy: string;
  careTeamName: string;
  careTeamPhone: string;
  emergencyNumber: string;
  creatorRole: CircleRole | null;
  orgId?: string | null;
  consentOrg?: boolean;
  milestones: string[];
};

export async function createJourney(n: NewJourney): Promise<string> {
  return tx(async (run) => {
    const [j] = await run<{ id: string }>(
      `INSERT INTO journeys (created_by, org_id, person_name, led_by, specialty, discharge_date, horizon_days, timezone, city, plan_source,
         plan_entered_by, care_team_name, care_team_phone, emergency_number, consent_org, consent_org_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, CASE WHEN $15 THEN now() END) RETURNING id`,
      [n.createdBy, n.orgId ?? null, n.personName, n.ledBy, n.specialty, n.dischargeDate, n.horizonDays, n.timezone, n.city ? JSON.stringify(n.city) : null, n.planSource,
        n.planEnteredBy, n.careTeamName, n.careTeamPhone, n.emergencyNumber, Boolean(n.consentOrg)],
    );
    if (n.creatorRole) {
      await run("INSERT INTO circle_members (journey_id, user_id, role, is_owner) VALUES ($1, $2, $3, true)", [j.id, n.createdBy, n.creatorRole]);
      await run("UPDATE users SET current_journey_id = $2 WHERE id = $1", [n.createdBy, j.id]);
    }
    for (const [i, title] of n.milestones.entries()) {
      await run("INSERT INTO plan_items (journey_id, kind, title, sort, created_by) VALUES ($1, 'milestone', $2, $3, $4)", [j.id, title, i, n.createdBy]);
    }
    await run("INSERT INTO taste (journey_id) VALUES ($1)", [j.id]);
    await run("INSERT INTO activity (journey_id, user_id, kind, text) VALUES ($1, $2, 'journey', $3)", [j.id, n.createdBy, `Journey started for ${n.personName}`]);
    if (n.consentOrg) await run("INSERT INTO consent_log (journey_id, user_id, scope, granted, detail) VALUES ($1, $2, 'org', true, 'at creation')", [j.id, n.createdBy]);
    return j.id;
  });
}

export async function updateJourney(id: string, patch: Partial<Pick<Journey, "instructions" | "person_name" | "discharge_date" | "horizon_days" | "care_team_name" | "care_team_phone" | "emergency_number" | "diet_notes" | "plan_entered_by" | "plan_source" | "timezone">> & { city?: City | null }) {
  const sets: string[] = [];
  const vals: unknown[] = [id];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    vals.push(k === "city" ? (v ? JSON.stringify(v) : null) : v);
    sets.push(`${k} = $${vals.length}`);
  }
  if (!sets.length) return;
  await q(`UPDATE journeys SET ${sets.join(", ")}, updated_at = now() WHERE id = $1`, vals);
}

/* ---------- plan ---------- */

const PLAN_COLS = `id, kind, title, detail, why, how, times, weekdays, start_day, end_day, day, at_time, location, sort, reached_at, needs_review`;

export async function planOf(journeyId: string) {
  const [items, signs, thresholds] = await Promise.all([
    q<PlanItem>(`SELECT ${PLAN_COLS} FROM plan_items WHERE journey_id = $1 ORDER BY kind, sort, created_at`, [journeyId]),
    q<WarningSign>("SELECT id, text, action, sort FROM warning_signs WHERE journey_id = $1 ORDER BY sort, created_at", [journeyId]),
    q<Threshold>("SELECT id, metric, op, value, days, action FROM thresholds WHERE journey_id = $1 ORDER BY created_at", [journeyId]),
  ]);
  return { items, signs, thresholds };
}

export type PlanItemInput = Omit<PlanItem, "id" | "reached_at" | "sort"> & { sort?: number };
export async function addPlanItem(journeyId: string, userId: string, it: PlanItemInput) {
  const sort = it.sort ?? (await one<{ n: number }>("SELECT COALESCE(MAX(sort), -1) + 1 AS n FROM plan_items WHERE journey_id = $1 AND kind = $2", [journeyId, it.kind]))?.n ?? 0;
  await q(
    `INSERT INTO plan_items (journey_id, kind, title, detail, times, weekdays, start_day, end_day, day, at_time, location, sort, created_by, why, how, needs_review)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [journeyId, it.kind, it.title, it.detail, it.times, it.weekdays, it.start_day, it.end_day, it.day, it.at_time, it.location, sort, userId, it.why ?? "", it.how ?? "", it.needs_review ?? false],
  );
}
export async function updatePlanItem(journeyId: string, itemId: string, it: Omit<PlanItemInput, "kind">) {
  await q(
    `UPDATE plan_items SET title=$3, detail=$4, times=$5, weekdays=$6, start_day=$7, end_day=$8, day=$9, at_time=$10, location=$11, why=$12, how=$13, needs_review=false WHERE id=$2 AND journey_id=$1`,
    [journeyId, itemId, it.title, it.detail, it.times, it.weekdays, it.start_day, it.end_day, it.day, it.at_time, it.location, it.why ?? "", it.how ?? ""],
  );
}
export async function deletePlanItem(journeyId: string, itemId: string) {
  await q("DELETE FROM plan_items WHERE id = $2 AND journey_id = $1", [journeyId, itemId]);
}
export async function setMilestoneReached(journeyId: string, itemId: string, userId: string, reached: boolean) {
  await q("UPDATE plan_items SET reached_at = CASE WHEN $3 THEN now() END, reached_by = CASE WHEN $3 THEN $4::uuid END WHERE id = $2 AND journey_id = $1 AND kind = 'milestone'", [journeyId, itemId, reached, userId]);
}
export async function addWarningSign(journeyId: string, userId: string, text: string, action: WarningSign["action"]) {
  await q("INSERT INTO warning_signs (journey_id, text, action, sort, created_by) VALUES ($1, $2, $3, (SELECT COUNT(*) FROM warning_signs WHERE journey_id = $1), $4)", [journeyId, text, action, userId]);
}
export async function deleteWarningSign(journeyId: string, id: string) {
  await q("DELETE FROM warning_signs WHERE id = $2 AND journey_id = $1", [journeyId, id]);
}
export async function addThreshold(journeyId: string, userId: string, t: Omit<Threshold, "id">) {
  await q("INSERT INTO thresholds (journey_id, metric, op, value, days, action, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7)", [journeyId, t.metric, t.op, t.value, t.days, t.action, userId]);
}
export async function deleteThreshold(journeyId: string, id: string) {
  await q("DELETE FROM thresholds WHERE id = $2 AND journey_id = $1", [journeyId, id]);
}

/* ---------- daily ---------- */

export async function logsBetween(journeyId: string, from: string, to: string): Promise<TaskLog[]> {
  return q<TaskLog>("SELECT item_id, to_char(for_date, 'YYYY-MM-DD') AS for_date, slot FROM task_logs WHERE journey_id = $1 AND for_date BETWEEN $2 AND $3", [journeyId, from, to]);
}
export async function setTaskDone(journeyId: string, itemId: string, date: string, slot: string, userId: string, done: boolean) {
  if (done) {
    await q(
      `INSERT INTO task_logs (item_id, journey_id, for_date, slot, done_by)
       SELECT id, journey_id, $3, $4, $5 FROM plan_items WHERE id = $2 AND journey_id = $1 ON CONFLICT DO NOTHING`,
      [journeyId, itemId, date, slot, userId],
    );
  } else {
    await q("DELETE FROM task_logs WHERE journey_id = $1 AND item_id = $2 AND for_date = $3 AND slot = $4", [journeyId, itemId, date, slot]);
  }
}

export type CheckinRow = Checkin & { id: string; by_user: string | null; created_at: Date };
export async function checkinsBetween(journeyId: string, from: string, to: string): Promise<CheckinRow[]> {
  return q<CheckinRow>(
    `SELECT id, to_char(for_date, 'YYYY-MM-DD') AS for_date, mood, pain, sleep, appetite, energy, signs::text[] AS signs, note, by_user, created_at
       FROM checkins WHERE journey_id = $1 AND for_date BETWEEN $2 AND $3 ORDER BY for_date`,
    [journeyId, from, to],
  );
}

export async function saveCheckin(journeyId: string, userId: string, c: Checkin, flags: { source: string; refId: string; action: string; reason: string }[]) {
  return tx(async (run) => {
    const [row] = await run<{ id: string }>(
      `INSERT INTO checkins (journey_id, for_date, by_user, mood, pain, sleep, appetite, energy, signs, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::uuid[],$10)
       ON CONFLICT (journey_id, for_date) DO UPDATE SET by_user = EXCLUDED.by_user, mood = EXCLUDED.mood, pain = EXCLUDED.pain, sleep = EXCLUDED.sleep,
         appetite = EXCLUDED.appetite, energy = EXCLUDED.energy, signs = EXCLUDED.signs, note = EXCLUDED.note, created_at = now()
       RETURNING id`,
      [journeyId, c.for_date, userId, c.mood, c.pain, c.sleep, c.appetite, c.energy, c.signs, c.note ?? ""],
    );
    // re-saving a check-in replaces its open flags
    await run("DELETE FROM flags WHERE checkin_id = $1 AND ack_at IS NULL", [row.id]);
    for (const f of flags) {
      await run("INSERT INTO flags (journey_id, checkin_id, source, ref_id, action, reason) VALUES ($1,$2,$3,$4,$5,$6)", [journeyId, row.id, f.source, f.refId, f.action, f.reason]);
    }
    await run("INSERT INTO activity (journey_id, user_id, kind, text) VALUES ($1, $2, 'checkin', $3)", [journeyId, userId, flags.length ? "Checked in and was asked to contact the care team" : "Checked in"]);
    return row.id;
  });
}

export type FlagRow = { id: string; journey_id: string; source: string; action: "call_team" | "emergency"; reason: string; created_at: Date; for_date: string | null; ack_at: Date | null; ack_note: string; ack_name: string | null };
export async function flagsOf(journeyId: string, limit = 30): Promise<FlagRow[]> {
  return q<FlagRow>(
    `SELECT f.id, f.journey_id, f.source, f.action, f.reason, f.created_at, to_char(c.for_date, 'YYYY-MM-DD') AS for_date, f.ack_at, f.ack_note, u.display_name AS ack_name
       FROM flags f LEFT JOIN checkins c ON c.id = f.checkin_id LEFT JOIN users u ON u.id = f.ack_by
      WHERE f.journey_id = $1 ORDER BY f.created_at DESC LIMIT $2`,
    [journeyId, limit],
  );
}
export async function ackFlag(flagId: string, journeyId: string, userId: string, note: string) {
  await q("UPDATE flags SET ack_by = $3, ack_at = now(), ack_note = $4 WHERE id = $1 AND journey_id = $2 AND ack_at IS NULL", [flagId, journeyId, userId, note]);
}

/* ---------- circle ---------- */

export type Member = { user_id: string; display_name: string; role: CircleRole; is_owner: boolean; joined_at: Date };
export async function membersOf(journeyId: string): Promise<Member[]> {
  return q<Member>(
    "SELECT cm.user_id, u.display_name, cm.role, cm.is_owner, cm.joined_at FROM circle_members cm JOIN users u ON u.id = cm.user_id WHERE cm.journey_id = $1 ORDER BY cm.is_owner DESC, cm.joined_at",
    [journeyId],
  );
}
export async function removeMember(journeyId: string, userId: string) {
  await q("DELETE FROM circle_members WHERE journey_id = $1 AND user_id = $2 AND NOT is_owner", [journeyId, userId]);
}

export async function createInvite(opts: { journeyId?: string; orgId?: string; role: string; createdBy: string; days?: number }) {
  const c = code(9);
  await q("INSERT INTO invites (code, journey_id, org_id, role, created_by, expires_at) VALUES ($1, $2, $3, $4, $5, now() + make_interval(days => $6))", [
    c,
    opts.journeyId ?? null,
    opts.orgId ?? null,
    opts.role,
    opts.createdBy,
    opts.days ?? 14,
  ]);
  return c;
}
export type Invite = { code: string; journey_id: string | null; org_id: string | null; role: string; uses: number; max_uses: number; expires_at: Date; revoked_at: Date | null; person_name: string | null; org_name: string | null; inviter: string | null; consent_org: boolean | null; journey_org_name: string | null; specialty: string | null };
export async function getInvite(c: string): Promise<Invite | null> {
  return one<Invite>(
    `SELECT i.code, i.journey_id, i.org_id, i.role, i.uses, i.max_uses, i.expires_at, i.revoked_at, j.person_name, o.name AS org_name, u.display_name AS inviter,
            j.consent_org, jo.name AS journey_org_name, j.specialty
       FROM invites i LEFT JOIN journeys j ON j.id = i.journey_id LEFT JOIN orgs o ON o.id = i.org_id LEFT JOIN users u ON u.id = i.created_by
       LEFT JOIN orgs jo ON jo.id = j.org_id
      WHERE i.code = $1`,
    [c],
  );
}
export async function openInvites(journeyId: string) {
  return q<{ code: string; role: string; expires_at: Date; uses: number }>(
    "SELECT code, role, expires_at, uses FROM invites WHERE journey_id = $1 AND revoked_at IS NULL AND expires_at > now() AND uses < max_uses ORDER BY created_at DESC",
    [journeyId],
  );
}
export async function revokeInvite(journeyId: string, c: string) {
  await q("UPDATE invites SET revoked_at = now() WHERE code = $2 AND journey_id = $1", [journeyId, c]);
}

/** Accept an invite. Returns where to go next. */
export async function acceptInvite(inv: Invite, userId: string, consentOrg: boolean): Promise<{ journeyId?: string; orgId?: string }> {
  return tx(async (run) => {
    const [fresh] = await run<{ ok: boolean }>("UPDATE invites SET uses = uses + 1 WHERE code = $1 AND revoked_at IS NULL AND expires_at > now() AND uses < max_uses RETURNING true AS ok", [inv.code]);
    if (!fresh) throw new Error("This invite has expired or was revoked.");
    if (inv.org_id) {
      await run("INSERT INTO org_members (org_id, user_id, role) VALUES ($1, $2, 'clinician') ON CONFLICT DO NOTHING", [inv.org_id, userId]);
      return { orgId: inv.org_id };
    }
    const jid = inv.journey_id as string;
    // the first patient or caregiver to join a journey a clinic started becomes its owner
    await run(
      `INSERT INTO circle_members (journey_id, user_id, role, is_owner)
       VALUES ($1, $2, $3, $3 IN ('patient', 'caregiver') AND NOT EXISTS (SELECT 1 FROM circle_members WHERE journey_id = $1 AND is_owner))
       ON CONFLICT (journey_id, user_id) DO NOTHING`,
      [jid, userId, inv.role],
    );
    await run("UPDATE users SET current_journey_id = $2 WHERE id = $1", [userId, jid]);
    const [{ name }] = await run<{ name: string }>("SELECT display_name AS name FROM users WHERE id = $1", [userId]);
    await run("INSERT INTO activity (journey_id, user_id, kind, text) VALUES ($1, $2, 'circle', $3)", [jid, userId, `${name} joined the care circle`]);
    await run("INSERT INTO consent_log (journey_id, user_id, scope, granted, detail) VALUES ($1, $2, 'circle', true, $3)", [jid, userId, `joined as ${inv.role}`]);
    if (inv.role === "patient" || inv.role === "caregiver") {
      const [j] = await run<{ org_id: string | null }>("SELECT org_id FROM journeys WHERE id = $1", [jid]);
      if (j?.org_id) {
        await run("UPDATE journeys SET consent_org = $2, consent_org_at = CASE WHEN $2 THEN now() END WHERE id = $1", [jid, consentOrg]);
        await run("INSERT INTO consent_log (journey_id, user_id, scope, granted, detail) VALUES ($1, $2, 'org', $3, 'chosen on join')", [jid, userId, consentOrg]);
      }
      await run("UPDATE circle_members SET plan_seen_at = now() WHERE journey_id = $1 AND user_id = $2", [jid, userId]);
    }
    return { journeyId: jid };
  });
}

export async function setOrgConsent(journeyId: string, userId: string, granted: boolean) {
  await q("UPDATE journeys SET consent_org = $2, consent_org_at = CASE WHEN $2 THEN now() END WHERE id = $1", [journeyId, granted]);
  await q("INSERT INTO consent_log (journey_id, user_id, scope, granted) VALUES ($1, $2, 'org', $3)", [journeyId, userId, granted]);
  if (!granted) {
    // Research uses only team-shared data, so stopping sharing also stops research.
    const r = await q("UPDATE journeys SET research_consent = false, research_consent_at = NULL WHERE id = $1 AND research_consent RETURNING id", [journeyId]);
    if (r.length) await q("INSERT INTO consent_log (journey_id, user_id, scope, granted, detail) VALUES ($1, $2, 'research', false, 'stopped with team sharing')", [journeyId, userId]);
  }
}

export type CircleTask = { id: string; title: string; due_date: string | null; assignee: string | null; assignee_name: string | null; done_at: Date | null; done_name: string | null };
export async function circleTasks(journeyId: string): Promise<CircleTask[]> {
  return q<CircleTask>(
    `SELECT t.id, t.title, to_char(t.due_date, 'YYYY-MM-DD') AS due_date, t.assignee, a.display_name AS assignee_name, t.done_at, d.display_name AS done_name
       FROM circle_tasks t LEFT JOIN users a ON a.id = t.assignee LEFT JOIN users d ON d.id = t.done_by
      WHERE t.journey_id = $1 ORDER BY (t.done_at IS NOT NULL), t.due_date NULLS LAST, t.created_at`,
    [journeyId],
  );
}
export async function addCircleTask(journeyId: string, userId: string, title: string, due: string | null, assignee: string | null) {
  await q("INSERT INTO circle_tasks (journey_id, title, due_date, assignee, created_by) VALUES ($1,$2,$3,$4,$5)", [journeyId, title, due, assignee, userId]);
  await q("INSERT INTO activity (journey_id, user_id, kind, text) VALUES ($1, $2, 'task', $3)", [journeyId, userId, `Added a circle task: ${title}`]);
}
export async function claimCircleTask(journeyId: string, id: string, userId: string) {
  await q("UPDATE circle_tasks SET assignee = $3 WHERE id = $2 AND journey_id = $1", [journeyId, id, userId]);
}
export async function toggleCircleTask(journeyId: string, id: string, userId: string, done: boolean) {
  const row = await one<{ title: string }>(
    "UPDATE circle_tasks SET done_at = CASE WHEN $3 THEN now() END, done_by = CASE WHEN $3 THEN $4::uuid END WHERE id = $2 AND journey_id = $1 RETURNING title",
    [journeyId, id, done, userId],
  );
  if (row && done) await q("INSERT INTO activity (journey_id, user_id, kind, text) VALUES ($1, $2, 'task', $3)", [journeyId, userId, `Done: ${row.title}`]);
}
export async function deleteCircleTask(journeyId: string, id: string) {
  await q("DELETE FROM circle_tasks WHERE id = $2 AND journey_id = $1", [journeyId, id]);
}

export type ActivityRow = { id: string; kind: string; text: string; created_at: Date; name: string | null };
export async function activityOf(journeyId: string, limit = 20): Promise<ActivityRow[]> {
  return q<ActivityRow>(
    "SELECT a.id::text, a.kind, a.text, a.created_at, u.display_name AS name FROM activity a LEFT JOIN users u ON u.id = a.user_id WHERE a.journey_id = $1 ORDER BY a.created_at DESC, a.id DESC LIMIT $2",
    [journeyId, limit],
  );
}
export async function logActivity(journeyId: string, userId: string | null, kind: string, text: string) {
  await q("INSERT INTO activity (journey_id, user_id, kind, text) VALUES ($1, $2, $3, $4)", [journeyId, userId, kind, text]);
}

/* ---------- taste ---------- */

export type TasteRow = { favorites: Favorite[]; filters: string[]; outings_ok: boolean };
export async function tasteOf(journeyId: string): Promise<TasteRow> {
  return (await one<TasteRow>("SELECT favorites, filters, outings_ok FROM taste WHERE journey_id = $1", [journeyId])) ?? { favorites: [], filters: [], outings_ok: false };
}
export async function saveTaste(journeyId: string, t: Partial<TasteRow>) {
  await q(
    `INSERT INTO taste (journey_id, favorites, filters, outings_ok) VALUES ($1, COALESCE($2::jsonb, '[]'), COALESCE($3::text[], '{}'), COALESCE($4, false))
     ON CONFLICT (journey_id) DO UPDATE SET favorites = COALESCE($2::jsonb, taste.favorites), filters = COALESCE($3::text[], taste.filters),
       outings_ok = COALESCE($4, taste.outings_ok), updated_at = now()`,
    [journeyId, t.favorites ? JSON.stringify(t.favorites) : null, t.filters ?? null, t.outings_ok ?? null],
  );
}

/* ---------- share card ---------- */

export async function setShare(journeyId: string, userId: string, on: boolean, card: CardConfig) {
  const slug = on ? code(10) : null;
  await q("UPDATE journeys SET share_slug = CASE WHEN $2 THEN COALESCE(share_slug, $3) END, card = $4 WHERE id = $1", [journeyId, on, slug, JSON.stringify(card)]);
  await q("INSERT INTO consent_log (journey_id, user_id, scope, granted) VALUES ($1, $2, 'share', $3)", [journeyId, userId, on]);
}
export async function journeyBySlug(slug: string): Promise<Journey | null> {
  return one<Journey>(`SELECT ${JOURNEY_COLS} FROM journeys j WHERE j.share_slug = $1`, [slug]);
}

/* ---------- orgs ---------- */

export type Org = { id: string; name: string; kind: string; invite_code: string; role: "admin" | "clinician" };
export async function orgsOf(userId: string): Promise<Org[]> {
  return q<Org>("SELECT o.id, o.name, o.kind, o.invite_code, m.role FROM org_members m JOIN orgs o ON o.id = m.org_id WHERE m.user_id = $1 ORDER BY m.joined_at", [userId]);
}
export async function createOrg(userId: string, name: string, kind: string): Promise<string> {
  return tx(async (run) => {
    const [o] = await run<{ id: string }>("INSERT INTO orgs (name, kind, owner_id, invite_code) VALUES ($1, $2, $3, $4) RETURNING id", [name, kind, userId, code(8)]);
    await run("INSERT INTO org_members (org_id, user_id, role) VALUES ($1, $2, 'admin')", [o.id, userId]);
    return o.id;
  });
}
export async function orgMembers(orgId: string) {
  return q<{ user_id: string; display_name: string; role: string }>("SELECT m.user_id, u.display_name, m.role FROM org_members m JOIN users u ON u.id = m.user_id WHERE m.org_id = $1 ORDER BY m.joined_at", [orgId]);
}

export type OrgJourneyRow = Journey & { open_flags: number; emergency_flags: number; last_checkin: string | null };
export async function orgJourneys(orgId: string): Promise<{ shared: OrgJourneyRow[]; pending: { id: string; person_name: string; specialty: string; discharge_date: string }[] }> {
  const shared = await q<OrgJourneyRow>(
    `SELECT ${JOURNEY_COLS},
       (SELECT COUNT(*)::int FROM flags f WHERE f.journey_id = j.id AND f.ack_at IS NULL) AS open_flags,
       (SELECT COUNT(*)::int FROM flags f WHERE f.journey_id = j.id AND f.ack_at IS NULL AND f.action = 'emergency') AS emergency_flags,
       (SELECT to_char(MAX(c.for_date), 'YYYY-MM-DD') FROM checkins c WHERE c.journey_id = j.id) AS last_checkin
     FROM journeys j WHERE j.org_id = $1 AND j.consent_org ORDER BY j.discharge_date DESC`,
    [orgId],
  );
  const pending = await q<{ id: string; person_name: string; specialty: string; discharge_date: string }>(
    "SELECT id, person_name, specialty, to_char(discharge_date, 'YYYY-MM-DD') AS discharge_date FROM journeys WHERE org_id = $1 AND NOT consent_org ORDER BY created_at DESC",
    [orgId],
  );
  return { shared, pending };
}

/** Bulk data for the dashboard: recent check-ins and task logs for many journeys at once. */
export async function orgWindow(journeyIds: string[], from: string, to: string) {
  if (!journeyIds.length) return { checkins: [] as (CheckinRow & { journey_id: string })[], logs: [] as (TaskLog & { journey_id: string })[], items: [] as (PlanItem & { journey_id: string })[] };
  const [checkins, logs, items] = await Promise.all([
    q<CheckinRow & { journey_id: string }>(
      `SELECT journey_id, id, to_char(for_date, 'YYYY-MM-DD') AS for_date, mood, pain, sleep, appetite, energy, signs::text[] AS signs, note, by_user, created_at
         FROM checkins WHERE journey_id = ANY($1::uuid[]) AND for_date BETWEEN $2 AND $3 ORDER BY for_date`,
      [journeyIds, from, to],
    ),
    q<TaskLog & { journey_id: string }>("SELECT journey_id, item_id, to_char(for_date, 'YYYY-MM-DD') AS for_date, slot FROM task_logs WHERE journey_id = ANY($1::uuid[]) AND for_date BETWEEN $2 AND $3", [journeyIds, from, to]),
    q<PlanItem & { journey_id: string }>(`SELECT journey_id, ${PLAN_COLS} FROM plan_items WHERE journey_id = ANY($1::uuid[])`, [journeyIds]),
  ]);
  return { checkins, logs, items };
}

/* ---------- account ---------- */

export async function exportUser(userId: string) {
  const user = await one("SELECT id, email, display_name, timezone, role_pref, created_at FROM users WHERE id = $1", [userId]);
  const journeys = await listJourneys(userId);
  const out = [];
  for (const j of journeys) {
    const from = addDays(todayIn(j.timezone), -400);
    const to = addDays(todayIn(j.timezone), 1);
    out.push({
      journey: j,
      plan: await planOf(j.id),
      checkins: await checkinsBetween(j.id, from, to),
      taskLogs: await logsBetween(j.id, from, to),
      flags: await flagsOf(j.id, 1000),
      circle: await membersOf(j.id),
      circleTasks: await circleTasks(j.id),
      taste: await tasteOf(j.id),
      consent: await q("SELECT scope, granted, detail, created_at FROM consent_log WHERE journey_id = $1 ORDER BY created_at", [j.id]),
      research_consent: j.research_consent,
      reminders: await q("SELECT checkin_time, steps, in_app, sms, whatsapp, phone, updated_at FROM reminder_prefs WHERE journey_id = $1 AND user_id = $2", [j.id, userId]),
      reminder_deliveries: await q("SELECT channel, kind, for_date, status, error, created_at FROM reminder_deliveries WHERE journey_id = $1 AND user_id = $2 ORDER BY created_at", [j.id, userId]),
      messages: await messagesOf(j.id, 5000),
      outcomes: {
        measures: await q("SELECT id, instrument, label, unit, min_value, max_value, higher_is_better, target, created_at FROM outcome_measures WHERE journey_id = $1 ORDER BY created_at", [j.id]),
        values: await q("SELECT measure_id, value, to_char(measured_on, 'YYYY-MM-DD') AS measured_on, note FROM outcome_values WHERE journey_id = $1 ORDER BY measured_on", [j.id]),
        readmissions: await q("SELECT to_char(admitted_on, 'YYYY-MM-DD') AS admitted_on, to_char(discharged_on, 'YYYY-MM-DD') AS discharged_on, note FROM readmissions WHERE journey_id = $1 ORDER BY admitted_on", [j.id]),
      },
    });
  }
  return { exportedAt: new Date().toISOString(), user, journeys: out, orgs: await orgsOf(userId) };
}

/** Delete the account. Journeys this user owns go with it, including everyone's entries on them. */
export async function deleteUser(userId: string) {
  await tx(async (run) => {
    await run("DELETE FROM journeys WHERE id IN (SELECT journey_id FROM circle_members WHERE user_id = $1 AND is_owner)", [userId]);
    // journeys this user started that nobody has joined yet
    await run("DELETE FROM journeys j WHERE j.created_by = $1 AND NOT EXISTS (SELECT 1 FROM circle_members cm WHERE cm.journey_id = j.id AND cm.user_id <> $1)", [userId]);
    await run("DELETE FROM orgs WHERE owner_id = $1", [userId]);
    await run("DELETE FROM users WHERE id = $1", [userId]);
  });
}

export async function purgeExpiredDemos() {
  const rows = await q<{ id: string }>("SELECT id FROM users WHERE is_demo AND demo_expires_at < now() LIMIT 200");
  for (const r of rows) {
    await q("DELETE FROM journeys WHERE created_by = $1", [r.id]);
    await deleteUser(r.id);
  }
  return rows.length;
}

export { toIso };

export async function orgById(id: string | null) {
  if (!id) return null;
  return one<{ id: string; name: string; kind: string }>("SELECT id, name, kind FROM orgs WHERE id = $1", [id]);
}

export type OrgFlag = FlagRow & { person_name: string; specialty: string };
/** Open flags across journeys that share with this org. */
export async function orgOpenFlags(orgId: string): Promise<OrgFlag[]> {
  return q<OrgFlag>(
    `SELECT f.id, f.journey_id, f.source, f.action, f.reason, f.created_at, to_char(c.for_date, 'YYYY-MM-DD') AS for_date, f.ack_at, f.ack_note, NULL AS ack_name, j.person_name, j.specialty
       FROM flags f JOIN journeys j ON j.id = f.journey_id LEFT JOIN checkins c ON c.id = f.checkin_id
      WHERE j.org_id = $1 AND j.consent_org AND f.ack_at IS NULL
      ORDER BY (f.action = 'emergency') DESC, f.created_at DESC LIMIT 50`,
    [orgId],
  );
}

/* ---------- two-sided: sending plans, updates, messages ---------- */

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
/** A short code a patient can type: 8 characters, no look-alikes. */
export function shortCode(): string {
  const b = randomBytes(8);
  return Array.from(b, (x) => CODE_ALPHABET[x % CODE_ALPHABET.length]).join("");
}
export const prettyCode = (c: string) => (/^[A-Z0-9]{8}$/.test(c) ? `${c.slice(0, 4)}-${c.slice(4)}` : c);
export const normalizeCode = (c: string) => {
  const raw = String(c ?? "").trim();
  const tight = raw.replace(/[^A-Za-z0-9]/g, "");
  return /^[A-Za-z0-9]{8}$/.test(tight) ? tight.toUpperCase() : tight;
};

/** Mark a team plan as sent and create a patient invite code (reuses an open one). */
export async function sendPlan(journeyId: string, userId: string, role: "patient" | "caregiver") {
  await q("UPDATE journeys SET plan_sent_at = COALESCE(plan_sent_at, now()) WHERE id = $1", [journeyId]);
  const open = await one<{ code: string }>(
    "SELECT code FROM invites WHERE journey_id = $1 AND role = $2 AND revoked_at IS NULL AND expires_at > now() AND uses < max_uses AND code ~ '^[A-Z0-9]{8}$' ORDER BY created_at DESC LIMIT 1",
    [journeyId, role],
  );
  if (open) return open.code;
  for (let i = 0; i < 5; i++) {
    const c = shortCode();
    try {
      await q("INSERT INTO invites (code, journey_id, role, created_by, expires_at, max_uses) VALUES ($1, $2, $3, $4, now() + interval '30 days', 1)", [c, journeyId, role, userId]);
      return c;
    } catch {
      /* collision, try again */
    }
  }
  throw new Error("Could not create a code. Try again.");
}

/** Called after a care team edits a plan that was already sent: the family sees a notice. */
export async function notePlanUpdate(journeyId: string, userId: string, text: string) {
  const j = await one<{ plan_sent_at: Date | null }>("SELECT plan_sent_at FROM journeys WHERE id = $1", [journeyId]);
  if (!j?.plan_sent_at) return;
  await q("UPDATE journeys SET plan_updated_at = now() WHERE id = $1", [journeyId]);
  await q("INSERT INTO activity (journey_id, user_id, kind, text) VALUES ($1, $2, 'plan_update', $3)", [journeyId, userId, text]);
}

export async function planSeenAt(journeyId: string, userId: string): Promise<Date | null> {
  const r = await one<{ plan_seen_at: Date | null; joined_at: Date }>("SELECT plan_seen_at, joined_at FROM circle_members WHERE journey_id = $1 AND user_id = $2", [journeyId, userId]);
  return r ? r.plan_seen_at ?? r.joined_at : null;
}
export async function markPlanSeen(journeyId: string, userId: string) {
  await q("UPDATE circle_members SET plan_seen_at = now() WHERE journey_id = $1 AND user_id = $2", [journeyId, userId]);
}
export async function planUpdatesSince(journeyId: string, since: Date) {
  return q<{ id: string; text: string; created_at: Date; name: string | null }>(
    `SELECT a.id, a.text, a.created_at, u.display_name AS name FROM activity a LEFT JOIN users u ON u.id = a.user_id
      WHERE a.journey_id = $1 AND a.kind = 'plan_update' AND a.created_at > $2 ORDER BY a.created_at DESC LIMIT 12`,
    [journeyId, since],
  );
}

export type Message = { id: string; side: "patient" | "team"; kind: "message" | "question" | "update"; body: string; created_at: Date; resolved_at: Date | null; name: string | null; user_id: string | null };
export async function messagesOf(journeyId: string, limit = 200): Promise<Message[]> {
  return q<Message>(
    `SELECT m.id, m.side, m.kind, m.body, m.created_at, m.resolved_at, u.display_name AS name, m.user_id FROM messages m LEFT JOIN users u ON u.id = m.user_id
      WHERE m.journey_id = $1 ORDER BY m.created_at DESC LIMIT $2`,
    [journeyId, limit],
  ).then((r) => r.reverse());
}
export async function addMessage(journeyId: string, userId: string, side: "patient" | "team", kind: Message["kind"], body: string) {
  await tx(async (run) => {
    await run("INSERT INTO messages (journey_id, user_id, side, kind, body) VALUES ($1,$2,$3,$4,$5)", [journeyId, userId, side, kind, body]);
    if (side === "team") await run("UPDATE messages SET resolved_at = now(), resolved_by = $2 WHERE journey_id = $1 AND kind = 'question' AND resolved_at IS NULL", [journeyId, userId]);
    await run("INSERT INTO activity (journey_id, user_id, kind, text) VALUES ($1, $2, 'message', $3)", [journeyId, userId, side === "team" ? "The care team replied to a message" : kind === "question" ? "Asked the care team a question" : "Sent the care team a message"]);
  });
}
export async function resolveQuestions(journeyId: string, userId: string) {
  await q("UPDATE messages SET resolved_at = now(), resolved_by = $2 WHERE journey_id = $1 AND kind = 'question' AND resolved_at IS NULL", [journeyId, userId]);
}
export type OrgQuestion = { id: string; journey_id: string; person_name: string; specialty: string; body: string; created_at: Date; name: string | null };
export async function orgOpenQuestions(orgId: string): Promise<OrgQuestion[]> {
  return q<OrgQuestion>(
    `SELECT m.id, m.journey_id, j.person_name, j.specialty, m.body, m.created_at, u.display_name AS name
       FROM messages m JOIN journeys j ON j.id = m.journey_id LEFT JOIN users u ON u.id = m.user_id
      WHERE j.org_id = $1 AND j.consent_org AND m.kind = 'question' AND m.resolved_at IS NULL ORDER BY m.created_at`,
    [orgId],
  );
}

export type ClinicRow = Journey & { open_flags: number; emergency_flags: number; last_checkin: string | null; members: number; family_joined: boolean; open_questions: number; last_activity: Date | null; invite_code: string | null };
/** Every journey a care team authored or follows, with status for the patient list. */
export async function clinicJourneys(orgId: string): Promise<ClinicRow[]> {
  return q<ClinicRow>(
    `SELECT ${JOURNEY_COLS},
       (SELECT COUNT(*)::int FROM flags f WHERE f.journey_id = j.id AND f.ack_at IS NULL) AS open_flags,
       (SELECT COUNT(*)::int FROM flags f WHERE f.journey_id = j.id AND f.ack_at IS NULL AND f.action = 'emergency') AS emergency_flags,
       (SELECT to_char(MAX(c.for_date), 'YYYY-MM-DD') FROM checkins c WHERE c.journey_id = j.id) AS last_checkin,
       (SELECT COUNT(*)::int FROM circle_members cm WHERE cm.journey_id = j.id) AS members,
       EXISTS (SELECT 1 FROM circle_members cm WHERE cm.journey_id = j.id AND cm.role IN ('patient', 'caregiver')) AS family_joined,
       (SELECT COUNT(*)::int FROM messages m WHERE m.journey_id = j.id AND m.kind = 'question' AND m.resolved_at IS NULL) AS open_questions,
       (SELECT MAX(a.created_at) FROM activity a WHERE a.journey_id = j.id AND NOT EXISTS (SELECT 1 FROM org_members om WHERE om.org_id = j.org_id AND om.user_id = a.user_id)) AS last_activity,
       (SELECT i.code FROM invites i WHERE i.journey_id = j.id AND i.revoked_at IS NULL AND i.expires_at > now() AND i.uses < i.max_uses AND i.code ~ '^[A-Z0-9]{8}$' ORDER BY i.created_at DESC LIMIT 1) AS invite_code
     FROM journeys j WHERE j.org_id = $1 AND j.consent_org ORDER BY j.created_at DESC`,
    [orgId],
  );
}

/** The open patient code for a sent plan, if one is still usable. */
export async function openPlanCode(journeyId: string): Promise<string | null> {
  const r = await one<{ code: string }>(
    "SELECT code FROM invites WHERE journey_id = $1 AND role IN ('patient', 'caregiver') AND revoked_at IS NULL AND expires_at > now() AND uses < max_uses AND code ~ '^[A-Z0-9]{8}$' ORDER BY created_at DESC LIMIT 1",
    [journeyId],
  );
  return r?.code ?? null;
}

/** Whether the patient or a main caregiver has joined this journey. */
export async function familyJoined(journeyId: string): Promise<{ name: string; joined_at: Date } | null> {
  return one<{ name: string; joined_at: Date }>(
    "SELECT u.display_name AS name, cm.joined_at FROM circle_members cm JOIN users u ON u.id = cm.user_id WHERE cm.journey_id = $1 AND cm.role IN ('patient', 'caregiver') ORDER BY cm.joined_at LIMIT 1",
    [journeyId],
  );
}

export type OrgThread = { journey_id: string; person_name: string; specialty: string; body: string; side: string; created_at: Date; name: string | null };
/** The newest message in each thread for a care team. */
export async function orgThreads(orgId: string): Promise<OrgThread[]> {
  const rows = await q<OrgThread>(
    `SELECT DISTINCT ON (m.journey_id) m.journey_id, j.person_name, j.specialty, m.body, m.side, m.created_at, u.display_name AS name
       FROM messages m JOIN journeys j ON j.id = m.journey_id LEFT JOIN users u ON u.id = m.user_id
      WHERE j.org_id = $1 AND j.consent_org ORDER BY m.journey_id, m.created_at DESC`,
    [orgId],
  );
  return rows.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
}

export async function renameOrg(orgId: string, name: string) {
  await q("UPDATE orgs SET name = $2 WHERE id = $1", [orgId, name]);
}

/** Team messages the patient side has not opened yet (drives the Ask badge). */
export async function unreadTeamMessages(journeyId: string, userId: string): Promise<number> {
  const r = await one<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM messages m
      WHERE m.journey_id = $1 AND m.side = 'team'
        AND m.created_at > COALESCE((SELECT COALESCE(ask_seen_at, joined_at) FROM circle_members WHERE journey_id = $1 AND user_id = $2), now())`,
    [journeyId, userId],
  );
  return r?.n ?? 0;
}
export async function markAskSeen(journeyId: string, userId: string) {
  await q("UPDATE circle_members SET ask_seen_at = now() WHERE journey_id = $1 AND user_id = $2", [journeyId, userId]);
}
