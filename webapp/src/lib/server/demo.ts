import "server-only";
import { q, tx } from "./db";
import { createSession } from "./auth";
import { code, purgeExpiredDemos } from "./repo";
import { httpTransport, qlooConfigured } from "./qloo-http";
import { searchEntities } from "@/lib/qloo/api";
import type { Favorite } from "@/lib/qloo/types";
import { DEMO_JOURNEYS, DEMO_ORG, type DemoChoice, type DemoJourney } from "@/lib/care/demo-fixtures";
import { addDays, todayIn } from "@/lib/care/dates";
import { dosesFor } from "@/lib/care/schedule";
import { evaluate } from "@/lib/care/rules";
import type { Checkin, PlanItem, Threshold, WarningSign } from "@/lib/care/types";
import { rng } from "@/lib/care/random";

const DEMO_HOURS = 24;

async function resolveFavorites(list: DemoJourney["favorites"]): Promise<Favorite[]> {
  if (!qlooConfigured()) return list.map((f, i) => ({ id: `local-${i}`, name: f.name, type: f.type, resolved: false }));
  return Promise.all(
    list.map(async (f, i): Promise<Favorite> => {
      try {
        const [hit] = await searchEntities(httpTransport, f.name, [f.type], 1);
        if (hit) return { id: hit.id, name: hit.name, type: f.type, image: hit.image, disambiguation: hit.disambiguation, resolved: true };
      } catch {
        /* fall through to unresolved */
      }
      return { id: `local-${i}`, name: f.name, type: f.type, resolved: false };
    }),
  );
}

type Run = <R extends import("pg").QueryResultRow>(text: string, params?: unknown[]) => Promise<R[]>;

async function fakeUser(run: Run, name: string, expires: Date, role = "caregiver") {
  const [u] = await run<{ id: string }>("INSERT INTO users (display_name, is_demo, demo_expires_at, role_pref, onboarded_at, tour_completed_at) VALUES ($1, true, $2, $3, now(), now()) RETURNING id", [name, expires, role]);
  return u.id;
}

async function seedJourney(run: Run, d: DemoJourney, opts: { ownerId: string; orgId: string; adminId: string; expires: Date; favorites: Favorite[]; withToday: boolean; tz: string }) {
  const today = todayIn(opts.tz);
  const discharge = addDays(today, -d.day);
  const [j] = await run<{ id: string }>(
    `INSERT INTO journeys (created_by, org_id, person_name, led_by, specialty, discharge_date, horizon_days, timezone, city, plan_source, plan_entered_by,
       care_team_name, care_team_phone, emergency_number, diet_notes, consent_org, consent_org_at, created_at, plan_sent_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$15,$8,'clinician',$9,$10,$11,$12,$13,true, now(), now() - make_interval(days => $14), now() - make_interval(days => $14)) RETURNING id`,
    [opts.adminId, opts.orgId, d.personName, d.ledBy, d.specialty, discharge, d.horizon, JSON.stringify(d.city), d.careTeam, d.careTeam, d.phone, d.emergency, d.dietNotes, d.day, opts.tz],
  );
  const jid = j.id;
  await run("INSERT INTO circle_members (journey_id, user_id, role, is_owner, joined_at) VALUES ($1, $2, $3, true, now() - make_interval(days => $4))", [jid, opts.ownerId, d.persona.role, d.day]);
  const circleIds: string[] = [];
  for (const [i, m] of d.circle.entries()) {
    const id = await fakeUser(run, m.name, opts.expires);
    circleIds.push(id);
    await run("INSERT INTO circle_members (journey_id, user_id, role, joined_at) VALUES ($1, $2, $3, now() - make_interval(days => $4))", [jid, id, m.role, Math.max(0, d.day - 1 - i)]);
  }

  // plan
  const items: PlanItem[] = [];
  const addItem = async (kind: PlanItem["kind"], p: Partial<PlanItem> & { title: string }, sort: number) => {
    const [row] = await run<PlanItem>(
      `INSERT INTO plan_items (journey_id, kind, title, detail, times, weekdays, start_day, end_day, day, at_time, location, sort, created_by, reached_at, why, how)
       VALUES ($1,$2,$3,$4,$5,$6,0,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id, kind, title, detail, why, how, times, weekdays, start_day, end_day, day, at_time, location, sort, reached_at`,
      [jid, kind, p.title, p.detail ?? "", p.times ?? [], p.weekdays ?? null, p.end_day ?? null, p.day ?? null, p.at_time ?? null, p.location ?? "", sort, opts.adminId, p.reached_at ?? null, p.why ?? "", p.how ?? ""],
    );
    items.push(row);
  };
  for (const [i, m] of d.meds.entries()) await addItem("medication", { title: m.title, detail: m.detail, times: m.times, end_day: m.endDay ?? null, why: m.why, how: m.how }, i);
  for (const [i, c] of d.care.entries()) await addItem("care", { title: c.title, detail: c.detail, times: c.times, weekdays: c.weekdays ?? null, why: c.why, how: c.how }, i);
  for (const [i, e] of d.exercise.entries()) await addItem("exercise", { title: e.title, detail: e.detail, times: e.times, weekdays: e.weekdays ?? null, why: e.why, how: e.how }, i);
  for (const [i, a] of d.appointments.entries()) await addItem("appointment", { title: a.title, day: a.day, at_time: a.at, location: a.location }, i);
  for (const [i, m] of d.milestones.entries()) {
    const reached = m.day !== null && m.day <= d.day ? new Date(Date.now() - (d.day - m.day) * 86400_000) : null;
    await addItem("milestone", { title: m.title, day: m.day, reached_at: reached }, i);
  }
  const signs: WarningSign[] = [];
  for (const [i, s] of d.signs.entries()) {
    const [row] = await run<WarningSign>("INSERT INTO warning_signs (journey_id, text, action, sort, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING id, text, action, sort", [jid, s.text, s.action, i, opts.adminId]);
    signs.push(row);
  }
  const thresholds: Threshold[] = [];
  for (const t of d.thresholds) {
    const [row] = await run<Threshold>("INSERT INTO thresholds (journey_id, metric, op, value, days, action, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, metric, op, value, days, action", [jid, t.metric, t.op, t.value, t.days, t.action, opts.adminId]);
    thresholds.push(row);
  }

  // history: check-ins and task logs from discharge day to yesterday (today too for others)
  const r = rng(d.key.length * 7919 + d.day);
  const lastDay = opts.withToday ? d.day : d.day - 1;
  const history: Checkin[] = [];
  const checkRows: unknown[] = [];
  const logRows: unknown[] = [];
  const flagRows: unknown[] = [];
  const doers = [opts.ownerId, ...circleIds];
  for (let k = 0; k <= lastDay; k++) {
    const date = addDays(discharge, k);
    const tt = d.day ? k / d.day : 1;
    const val = (key: keyof DemoJourney["arc"], min: number, max: number) => {
      const [a, b] = d.arc[key];
      const v = Math.round(a + (b - a) * tt + (r() - 0.5) * 1.6);
      return Math.max(min, Math.min(max, v));
    };
    const c: Checkin = { for_date: date, mood: val("mood", 1, 5), pain: val("pain", 0, 10), sleep: val("sleep", 1, 5), appetite: val("appetite", 1, 5), energy: val("energy", 1, 5), signs: [] };
    for (const f of d.flagDays) {
      const th = thresholds.find((t) => t.metric === f.metric);
      if (th && k <= f.day && k > f.day - th.days) c[f.metric] = f.value;
    }
    // a skipped day now and then keeps the history honest
    const skip = k > 0 && k < lastDay && r() < 0.06 && !d.flagDays.some((f) => Math.abs(f.day - k) < 3);
    if (!skip) {
      const flags = d.flagDays.some((f) => f.day === k) ? evaluate(c, history, thresholds, signs) : [];
      history.push(c);
      const id = crypto.randomUUID();
      checkRows.push({ id, journey_id: jid, for_date: date, by_user: opts.ownerId, mood: c.mood, pain: c.pain, sleep: c.sleep, appetite: c.appetite, energy: c.energy, note: "" });
      const fd = d.flagDays.find((f) => f.day === k);
      for (const f of flags) flagRows.push({ journey_id: jid, checkin_id: id, source: f.source, ref_id: f.refId, action: f.action, reason: f.reason, ack: fd?.ack ?? false, k });
    }
    const due = dosesFor(items, discharge, date, []);
    for (const dose of due) {
      if (r() < d.adherence || (k === d.day && r() < 0.5)) logRows.push({ item_id: dose.item.id, journey_id: jid, for_date: date, slot: dose.slot, done_by: doers[Math.floor(r() * Math.min(2, doers.length))] });
    }
  }
  if (checkRows.length)
    await run(
      `INSERT INTO checkins (id, journey_id, for_date, by_user, mood, pain, sleep, appetite, energy, note, created_at)
       SELECT id, journey_id, for_date, by_user, mood, pain, sleep, appetite, energy, note, for_date + time '20:00' FROM jsonb_to_recordset($1::jsonb)
         AS x(id uuid, journey_id uuid, for_date date, by_user uuid, mood int, pain int, sleep int, appetite int, energy int, note text)`,
      [JSON.stringify(checkRows)],
    );
  if (logRows.length)
    await run(
      `INSERT INTO task_logs (item_id, journey_id, for_date, slot, done_by, done_at)
       SELECT item_id, journey_id, for_date, slot, done_by, for_date + time '12:00' FROM jsonb_to_recordset($1::jsonb) AS x(item_id uuid, journey_id uuid, for_date date, slot text, done_by uuid)`,
      [JSON.stringify(logRows)],
    );
  for (const f of flagRows as { journey_id: string; checkin_id: string; source: string; ref_id: string; action: string; reason: string; ack: boolean; k: number }[]) {
    await run(
      `INSERT INTO flags (journey_id, checkin_id, source, ref_id, action, reason, created_at, ack_by, ack_at, ack_note)
       VALUES ($1,$2,$3,$4,$5,$6, now() - make_interval(days => $7), $8, CASE WHEN $9 THEN now() - make_interval(days => $7) + interval '3 hours' END, $10)`,
      [f.journey_id, f.checkin_id, f.source, f.ref_id, f.action, f.reason, d.day - f.k, f.ack ? opts.adminId : null, f.ack, f.ack ? "Called back. Plan reviewed with the patient, no change needed." : ""],
    );
  }
  for (const t of d.circleTasks) {
    const who = t.who === null ? null : circleIds[t.who] ?? null;
    await run("INSERT INTO circle_tasks (journey_id, title, due_date, assignee, done_at, done_by, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7)", [
      jid,
      t.title,
      t.due === null ? null : addDays(today, t.due),
      who,
      t.done ? new Date(Date.now() - 86400_000) : null,
      t.done ? who : null,
      opts.ownerId,
    ]);
  }
  const feed: [number, string | null, string][] = [
    [d.day * 24, opts.adminId, `Discharge plan entered by ${d.careTeam}`],
    ...d.circle.map((m, i): [number, string | null, string] => [Math.max(1, d.day - 1 - i) * 24, circleIds[i], `${m.name} joined the care circle`]),
    ...d.circleTasks.filter((t) => t.done).map((t): [number, string | null, string] => [20, t.who === null ? null : circleIds[t.who], `Done: ${t.title}`]),
    [14, opts.ownerId, "Checked in"],
  ];
  for (const [hours, uid, text] of feed) await run("INSERT INTO activity (journey_id, user_id, kind, text, created_at) VALUES ($1,$2,'demo',$3, now() - make_interval(hours => $4))", [jid, uid, text, hours]);
  await run("INSERT INTO taste (journey_id, favorites, filters, outings_ok) VALUES ($1,$2,$3,$4)", [jid, JSON.stringify(opts.favorites), d.filters, d.outingsOk]);
  return jid;
}

/** Start a fresh demo: a short-lived account with the chosen journey and the clinic around it. */
export type DemoSide = "patient" | "clinic";

/**
 * One shared demo world: the featured patient and Dr. Maya Chen are both real
 * demo accounts, paired, so whatever one side does shows up on the other.
 */
export async function startDemo(choice: Exclude<DemoChoice, "clinic">, tz: string, side: DemoSide = "patient"): Promise<{ redirectTo: string }> {
  const ids = await createDemoWorld(choice, tz);
  await createSession(side === "clinic" ? ids.clinician : ids.patient, 1);
  return { redirectTo: side === "clinic" ? "/clinic" : "/app" };
}

/** Builds the paired demo world without signing anyone in (the web and the mobile API sign in differently). */
export async function createDemoWorld(choice: Exclude<DemoChoice, "clinic">, tz: string): Promise<{ patient: string; clinician: string; expires: Date }> {
  await purgeExpiredDemos().catch(() => 0);
  const featured = DEMO_JOURNEYS.find((d) => d.key === choice) ?? DEMO_JOURNEYS[0];
  const favorites = await resolveFavorites(featured.favorites);
  const expires = new Date(Date.now() + DEMO_HOURS * 3600_000);
  const ids = await tx(async (run) => {
    const [u] = await run<{ id: string }>(
      "INSERT INTO users (display_name, is_demo, demo_expires_at, role_pref, timezone, onboarded_at) VALUES ($1, true, $2, $3, $4, now()) RETURNING id",
      [featured.persona.name, expires, featured.persona.role, tz],
    );
    const [a] = await run<{ id: string }>(
      "INSERT INTO users (display_name, is_demo, demo_expires_at, role_pref, timezone, onboarded_at, demo_pair) VALUES ('Dr. Maya Chen', true, $1, 'clinician', $2, now(), $3) RETURNING id",
      [expires, tz, u.id],
    );
    const adminId = a.id;
    await run("UPDATE users SET demo_pair = $2 WHERE id = $1", [u.id, adminId]);
    const [o] = await run<{ id: string }>("INSERT INTO orgs (name, kind, owner_id, invite_code) VALUES ($1, $2, $3, $4) RETURNING id", [DEMO_ORG.name, DEMO_ORG.kind, adminId, code(8)]);
    await run("INSERT INTO org_members (org_id, user_id, role) VALUES ($1, $2, 'admin')", [o.id, adminId]);
    let current: string | null = null;
    for (const d of DEMO_JOURNEYS) {
      const isFeatured = d.key === featured.key;
      const ownerId = isFeatured ? u.id : await fakeUser(run, d.persona.name, expires, d.persona.role);
      const jid = await seedJourney(run, d, { ownerId, orgId: o.id, adminId, expires, favorites: isFeatured ? favorites : d.favorites.map((f, i) => ({ id: `local-${i}`, name: f.name, type: f.type, resolved: false })), withToday: !isFeatured, tz });
      if (isFeatured) current = jid;
      // fake users and journeys expire with the demo account
      await run("UPDATE journeys SET created_by = $2 WHERE id = $1", [jid, u.id]);
      await seedThread(run, jid, ownerId, adminId, d, isFeatured);
      if (isFeatured) await seedOutcomes(run, jid, adminId, tz, d.day);
    }
    await run("UPDATE users SET current_journey_id = $2 WHERE id = $1", [u.id, current]);
    return { patient: u.id, clinician: adminId };
  });
  return { ...ids, expires };
}

/** A short, non-clinical message history so both inboxes have something real in them. */
async function seedThread(run: Run, jid: string, ownerId: string, adminId: string, d: DemoJourney, featured: boolean) {
  const at = (h: number) => new Date(Date.now() - h * 3600_000);
  const msg = (uid: string, side: "patient" | "team", kind: "message" | "question" | "update", body: string, h: number, resolved = false) =>
    run(
      "INSERT INTO messages (journey_id, user_id, side, kind, body, created_at, resolved_at, resolved_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [jid, uid, side, kind, body, at(h), resolved ? at(h - 1) : null, resolved ? adminId : null],
    );
  if (featured) {
    await msg(ownerId, "patient", "question", "Where do we park for the wound check on Monday?", 50, true);
    await msg(adminId, "team", "message", `Use the Hudson Street garage. Bring the ticket to the 5th floor desk and we validate it. See you Monday, ${d.personName}.`, 49);
    await run("INSERT INTO activity (journey_id, user_id, kind, text, created_at) VALUES ($1, $2, 'plan_update', 'Added an appointment: Outpatient physio', $3)", [jid, adminId, at(3)]);
    await run("UPDATE journeys SET plan_updated_at = $2 WHERE id = $1", [jid, at(3)]);
    await run("UPDATE circle_members SET plan_seen_at = $3 WHERE journey_id = $1 AND user_id = $2", [jid, ownerId, at(30)]);
    return;
  }
  if (d.key === "amara" || d.key === "rosa") {
    await msg(ownerId, "patient", "question", "Could the next visit be in the afternoon? Mornings are hard for us this week.", 5);
  }
}

export async function demoCount(): Promise<number> {
  const rows = await q<{ n: number }>("SELECT COUNT(*)::int AS n FROM users WHERE is_demo AND demo_expires_at > now() AND email IS NULL");
  return rows[0]?.n ?? 0;
}

/** Demo-only outcome history for the featured patient, entered as if by the demo clinician. */
async function seedOutcomes(run: Run, jid: string, adminId: string, tz: string, day: number) {
  const today = todayIn(tz);
  const discharge = addDays(today, -day);
  const series: { inst: string; label: string; unit: string; min: number; max: number; hib: boolean; target: number | null; pts: [number, number][] }[] = [
    { inst: "tug", label: "Timed Up and Go", unit: "seconds", min: 0, max: 120, hib: false, target: 12, pts: [[1, 24.5], [4, 19.8], [8, 16.2]] },
    { inst: "knee_rom", label: "Knee flexion range", unit: "degrees", min: 0, max: 160, hib: true, target: 110, pts: [[1, 65], [4, 78], [8, 90]] },
  ];
  for (const m of series) {
    const [row] = await run<{ id: string }>(
      "INSERT INTO outcome_measures (journey_id, instrument, label, unit, min_value, max_value, higher_is_better, target, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id",
      [jid, m.inst, m.label, m.unit, m.min, m.max, m.hib, m.target, adminId],
    );
    for (const [d, v] of m.pts) if (d <= day) await run("INSERT INTO outcome_values (measure_id, journey_id, value, measured_on, by_user) VALUES ($1,$2,$3,$4,$5)", [row.id, jid, v, addDays(discharge, d), adminId]);
  }
}
