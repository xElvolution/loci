"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { addSignAction, addThresholdAction, deletePlanItemAction, deleteSignAction, deleteThresholdAction, saveJourneyDetails, savePlanItem } from "@/app/actions";
import { KIND_META } from "@/components/care/bits";
import { Icon } from "@/components/ui/Icon";
import { Button, inputClass } from "@/components/ui/primitives";
import { addDays, diffDays, prettyDate, prettyTime } from "@/lib/care/dates";
import { describeThreshold } from "@/lib/care/rules";
import { METRIC_META, METRICS, type Action, type Metric, type PlanItem, type PlanKind, type Threshold, type WarningSign } from "@/lib/care/types";

const KINDS: PlanKind[] = ["medication", "care", "exercise", "appointment", "milestone"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const small = "h-10 rounded-xl border border-haze/20 bg-night/60 px-3 text-sm outline-none focus:border-ember/80";

export type Prompts = Record<"medication" | "care" | "exercise" | "appointment" | "warning", string>;
export type Details = {
  person_name: string;
  discharge_date: string;
  horizon_days: number;
  care_team_name: string;
  care_team_phone: string;
  emergency_number: string;
  diet_notes: string;
  plan_source: "clinician" | "family" | "patient";
  plan_entered_by: string;
  instructions?: string;
};

type Draft = { id?: string; kind: PlanKind; title: string; detail: string; times: string[]; weekdays: number[]; start_day: number; end_day: number | null; date: string; at_time: string; location: string; why: string; how: string };

function draftOf(kind: PlanKind, discharge: string, it?: PlanItem): Draft {
  return {
    id: it?.id,
    kind,
    title: it?.title ?? "",
    detail: it?.detail ?? "",
    times: it?.times ?? [],
    weekdays: it?.weekdays ?? [],
    start_day: it?.start_day ?? 0,
    end_day: it?.end_day ?? null,
    date: it?.day != null ? addDays(discharge, it.day) : "",
    at_time: it?.at_time ?? "",
    location: it?.location ?? "",
    why: it?.why ?? "",
    how: it?.how ?? "",
  };
}

export function PlanEditor(props: { journeyId: string; canEdit: boolean; items: PlanItem[]; signs: WarningSign[]; thresholds: Threshold[]; details: Details; prompts: Prompts; team?: boolean }) {
  const [open, setOpen] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const discharge = props.details.discharge_date;

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Something went wrong.");
      else after?.();
    });

  const save = (d: Draft) =>
    run(
      () =>
        savePlanItem({
          journeyId: props.journeyId,
          id: d.id,
          kind: d.kind,
          title: d.title,
          detail: d.detail,
          times: ["medication", "care", "exercise"].includes(d.kind) ? d.times : [],
          weekdays: d.weekdays.length ? d.weekdays : null,
          start_day: d.start_day,
          end_day: d.end_day,
          day: d.date ? diffDays(d.date, discharge) : null,
          at_time: d.kind === "appointment" && d.at_time ? d.at_time : null,
          location: d.location,
          why: d.why,
          how: d.how,
        }),
      () => setOpen(null),
    );

  const when = (it: PlanItem) => {
    if (it.kind === "appointment" || it.kind === "milestone") {
      if (it.day === null) return "No date set";
      return `${prettyDate(addDays(discharge, it.day))}${it.at_time ? `, ${prettyTime(it.at_time)}` : ""}${it.location ? ` · ${it.location}` : ""}`;
    }
    const t = it.times.length ? it.times.map(prettyTime).join(", ") : "Once, any time";
    const w = it.weekdays && it.weekdays.length ? ` · ${it.weekdays.map((d) => DAYS[d]).join(" ")}` : " · every day";
    const r = it.end_day !== null ? ` · days ${it.start_day} to ${it.end_day}` : it.start_day ? ` · from day ${it.start_day}` : "";
    return t + w + r;
  };

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral" role="alert">
          {error}
        </p>
      )}
      {KINDS.map((kind) => {
        const items = props.items.filter((i) => i.kind === kind);
        const meta = KIND_META[kind];
        const prompt = kind === "milestone" ? "Everyday moments to celebrate. Set an approximate day if your team gave one." : props.prompts[kind];
        return (
          <section key={kind} className="glass rounded-3xl p-5 md:p-6" data-testid={`plan-${kind}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/5 ${meta.tone}`}>
                  <Icon name={meta.icon} className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold">{meta.plural}</h2>
                  <p className="text-sm text-haze">{prompt}</p>
                </div>
              </div>
              {props.canEdit && (
                <Button type="button" variant="outline" className="h-10 shrink-0 px-4 text-sm" onClick={() => setOpen(draftOf(kind, discharge))} data-testid={`add-${kind}`}>
                  <Icon name="plus" className="h-4 w-4" /> Add
                </Button>
              )}
            </div>
            <ul className="mt-4 space-y-2">
              {items.map((it) => (
                <li key={it.id} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold break-words">
                      {it.title}
                      {it.needs_review && <span className="ml-2 inline-block rounded-full border border-ember/50 bg-ember/10 px-2 py-0.5 align-middle text-[11px] font-semibold text-ember" data-testid="needs-words">Needs your words</span>}
                    </p>
                    {it.detail && <p className={`mt-0.5 text-sm break-words ${it.needs_review ? "text-ember/80 italic" : "text-[#e9e4ff]/85"}`}>{it.detail}</p>}
                    {props.team && (it.why || it.how) && (
                      <p className="mt-1 text-xs break-words text-lilac/90">
                        {it.why && <span>Why: {it.why} </span>}
                        {it.how && <span>How: {it.how}</span>}
                      </p>
                    )}
                    {props.team && kind !== "milestone" && !it.why && !it.how && <p className="mt-1 text-xs text-ember/80">Add a why and how so the patient knows what to do.</p>}
                    <p className="mt-1 text-xs text-haze">{when(it)}</p>
                  </div>
                  {props.canEdit && (
                    <div className="flex shrink-0 gap-1">
                      <button type="button" onClick={() => setOpen(draftOf(kind, discharge, it))} className="grid h-9 w-9 place-items-center rounded-full text-haze hover:bg-white/10 hover:text-white" aria-label={`Edit ${it.title}`}>
                        <Icon name="edit" className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => confirm(`Remove "${it.title}" from the plan?`) && run(() => deletePlanItemAction(props.journeyId, it.id))} className="grid h-9 w-9 place-items-center rounded-full text-haze hover:bg-coral/15 hover:text-coral" aria-label={`Remove ${it.title}`}>
                        <Icon name="trash" className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
              {!items.length && <li className="rounded-2xl border border-dashed border-white/10 px-4 py-4 text-sm text-haze">Nothing here yet.</li>}
            </ul>
            <AnimatePresence>
              {open && open.kind === kind && <ItemForm key={open.id ?? "new"} draft={open} onCancel={() => setOpen(null)} onSave={save} pending={pending} team={props.team} />}
            </AnimatePresence>
          </section>
        );
      })}

      <SignsEditor {...props} run={run} pending={pending} />
      <ThresholdEditor {...props} run={run} pending={pending} />
      <DetailsEditor {...props} run={run} pending={pending} />
    </div>
  );
}

function ItemForm({ draft, onCancel, onSave, pending, team }: { draft: Draft; onCancel: () => void; onSave: (d: Draft) => void; pending: boolean; team?: boolean }) {
  const [d, setD] = useState(draft);
  const [time, setTime] = useState("08:00");
  const recurring = ["medication", "care", "exercise"].includes(d.kind);
  const label = KIND_META[d.kind].label.toLowerCase();
  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(d);
      }}
    >
      <div className="mt-4 grid gap-4 rounded-2xl border border-ember/30 bg-ember/[0.04] p-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="text-sm font-medium">{d.kind === "medication" ? "Medicine name, as on the label" : `Name of the ${label}`}</span>
          <input className={`${inputClass} mt-1.5`} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} maxLength={160} required autoFocus data-testid="item-title" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium">{d.kind === "medication" ? "Dose and instructions, word for word" : "Details, as written by the care team"}</span>
          <textarea className="mt-1.5 w-full rounded-2xl border border-haze/20 bg-night/60 p-3 text-[15px] outline-none focus:border-ember/80" rows={2} value={d.detail} onChange={(e) => setD({ ...d, detail: e.target.value })} maxLength={600} />
        </label>
        {team && d.kind !== "milestone" && (
          <>
            <label className="block">
              <span className="text-sm font-medium">Why your team is asking</span>
              <span className="block text-xs text-haze">Shown to the patient as &ldquo;Why your team asked&rdquo;. Plain language helps.</span>
              <textarea className="mt-1.5 w-full rounded-2xl border border-haze/20 bg-night/60 p-3 text-[15px] outline-none focus:border-ember/80" rows={2} value={d.why} onChange={(e) => setD({ ...d, why: e.target.value })} maxLength={600} data-testid="item-why" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">How to do it, step by step</span>
              <span className="block text-xs text-haze">One step per sentence or per line. Shown as numbered steps.</span>
              <textarea className="mt-1.5 w-full rounded-2xl border border-haze/20 bg-night/60 p-3 text-[15px] outline-none focus:border-ember/80" rows={3} value={d.how} onChange={(e) => setD({ ...d, how: e.target.value })} maxLength={1200} data-testid="item-how" />
            </label>
          </>
        )}
        {recurring && (
          <>
            <div className="md:col-span-2">
              <span className="text-sm font-medium">Times of day</span>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {d.times.map((t) => (
                  <button key={t} type="button" onClick={() => setD({ ...d, times: d.times.filter((x) => x !== t) })} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-sm" aria-label={`Remove ${t}`}>
                    {prettyTime(t)} <Icon name="x" className="h-3.5 w-3.5" />
                  </button>
                ))}
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={small} aria-label="Time to add" />
                <button type="button" onClick={() => time && !d.times.includes(time) && setD({ ...d, times: [...d.times, time].sort() })} className="h-10 rounded-xl border border-white/15 px-3 text-sm hover:border-white/30">
                  Add time
                </button>
              </div>
              {!d.times.length && <p className="mt-1.5 text-xs text-haze">No times means once a day, whenever suits.</p>}
            </div>
            <div className="md:col-span-2">
              <span className="text-sm font-medium">Days of the week</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {DAYS.map((name, k) => {
                  const on = d.weekdays.includes(k);
                  return (
                    <button key={name} type="button" aria-pressed={on} onClick={() => setD({ ...d, weekdays: on ? d.weekdays.filter((x) => x !== k) : [...d.weekdays, k] })} className={`h-9 w-12 rounded-full border text-sm ${on ? "border-ember bg-ember/15 text-ember" : "border-white/15 text-haze"}`}>
                      {name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-haze">Leave all off for every day.</p>
            </div>
            <label className="block">
              <span className="text-sm font-medium">Starts on day</span>
              <input type="number" min={0} max={365} className={`${inputClass} mt-1.5`} value={d.start_day} onChange={(e) => setD({ ...d, start_day: Math.max(0, Number(e.target.value) || 0) })} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Last day <span className="text-haze">(blank if ongoing)</span></span>
              <input type="number" min={0} max={365} className={`${inputClass} mt-1.5`} value={d.end_day ?? ""} onChange={(e) => setD({ ...d, end_day: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })} />
            </label>
          </>
        )}
        {!recurring && (
          <label className="block">
            <span className="text-sm font-medium">{d.kind === "appointment" ? "Date" : "Around which date? (optional)"}</span>
            <input type="date" className={`${inputClass} mt-1.5`} value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} required={d.kind === "appointment"} />
          </label>
        )}
        {d.kind === "appointment" && (
          <>
            <label className="block">
              <span className="text-sm font-medium">Time</span>
              <input type="time" className={`${inputClass} mt-1.5`} value={d.at_time} onChange={(e) => setD({ ...d, at_time: e.target.value })} />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium">Where</span>
              <input className={`${inputClass} mt-1.5`} value={d.location} onChange={(e) => setD({ ...d, location: e.target.value })} maxLength={160} placeholder="Clinic name, or video call" />
            </label>
          </>
        )}
        <div className="flex gap-2 md:col-span-2">
          <Button type="submit" disabled={pending} data-testid="save-item">
            {pending ? "Saving" : d.id ? "Save changes" : `Add ${label}`}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </motion.form>
  );
}

type RunFn = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) => void;

function ActionPicker({ value, onChange }: { value: Action; onChange: (a: Action) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as Action)} className={small} aria-label="What to do">
      <option value="call_team">Call the care team</option>
      <option value="emergency">Call the emergency number</option>
    </select>
  );
}

function SignsEditor({ journeyId, canEdit, signs, prompts, run, pending }: { journeyId: string; canEdit: boolean; signs: WarningSign[]; prompts: Prompts; run: RunFn; pending: boolean }) {
  const [text, setText] = useState("");
  const [action, setAction] = useState<Action>("call_team");
  return (
    <section className="rounded-3xl border border-coral/25 bg-coral/[0.05] p-5 md:p-6" data-testid="plan-signs">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Icon name="alert" className="h-5 w-5 text-coral" /> Warning signs
      </h2>
      <p className="mt-1 text-sm text-haze">{prompts.warning}</p>
      <ul className="mt-4 space-y-2">
        {signs.map((s) => (
          <li key={s.id} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-night/40 px-4 py-3">
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${s.action === "emergency" ? "bg-coral" : "bg-ember"}`} />
            <span className="min-w-0 flex-1 text-[15px] break-words">
              {s.text}
              <span className="block text-xs text-haze">{s.action === "emergency" ? "Call the emergency number" : "Call the care team"}</span>
            </span>
            {canEdit && (
              <button type="button" onClick={() => run(() => deleteSignAction(journeyId, s.id))} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-haze hover:bg-coral/15 hover:text-coral" aria-label="Remove warning sign">
                <Icon name="trash" className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
        {!signs.length && <li className="text-sm text-haze">None yet. Copy them from the discharge letter, word for word.</li>}
      </ul>
      {canEdit && (
        <form
          className="mt-4 flex flex-col gap-2 md:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) run(() => addSignAction({ journeyId, text, action }), () => setText(""));
          }}
        >
          <input className={`${inputClass} md:flex-1`} value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder="Exactly as the care team wrote it" aria-label="Warning sign text" data-testid="sign-text" />
          <div className="flex gap-2">
            <ActionPicker value={action} onChange={setAction} />
            <Button type="submit" disabled={pending || !text.trim()} className="h-10 px-4 text-sm">
              Add
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

function ThresholdEditor({ journeyId, canEdit, thresholds, run, pending }: { journeyId: string; canEdit: boolean; thresholds: Threshold[]; run: RunFn; pending: boolean }) {
  const [t, setT] = useState<{ metric: Metric; op: "gte" | "lte"; value: number; days: number; action: Action }>({ metric: "pain", op: "gte", value: 7, days: 1, action: "call_team" });
  const meta = METRIC_META[t.metric];
  return (
    <section className="glass rounded-3xl p-5 md:p-6" data-testid="plan-thresholds">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Icon name="bell" className="h-5 w-5 text-ember" /> Check-in thresholds
      </h2>
      <p className="mt-1 text-sm text-haze">Only add these when a clinician gives you a number. When a check-in matches, loci shows the call buttons. It never decides what a number means.</p>
      <ul className="mt-4 space-y-2">
        {thresholds.map((x) => (
          <li key={x.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <span className="min-w-0 flex-1 text-sm">
              {describeThreshold(x)}
              <span className="block text-xs text-haze">{x.action === "emergency" ? "Call the emergency number" : "Call the care team"}</span>
            </span>
            {canEdit && (
              <button type="button" onClick={() => run(() => deleteThresholdAction(journeyId, x.id))} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-haze hover:bg-coral/15 hover:text-coral" aria-label="Remove threshold">
                <Icon name="trash" className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
        {!thresholds.length && <li className="text-sm text-haze">None set.</li>}
      </ul>
      {canEdit && (
        <form
          className="mt-4 flex flex-wrap items-center gap-2 text-sm"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => addThresholdAction({ journeyId, ...t }));
          }}
        >
          <span>If</span>
          <select className={small} value={t.metric} onChange={(e) => { const m = e.target.value as Metric; setT({ ...t, metric: m, value: METRIC_META[m].min === 0 ? 7 : 2, op: METRIC_META[m].higherIsBetter ? "lte" : "gte" }); }} aria-label="Answer">
            {METRICS.map((m) => (
              <option key={m} value={m}>{METRIC_META[m].label.toLowerCase()}</option>
            ))}
          </select>
          <span>is</span>
          <select className={small} value={t.op} onChange={(e) => setT({ ...t, op: e.target.value as "gte" | "lte" })} aria-label="Comparison">
            <option value="gte">at or above</option>
            <option value="lte">at or below</option>
          </select>
          <input type="number" className={`${small} w-20`} min={meta.min} max={meta.max} value={t.value} onChange={(e) => setT({ ...t, value: Number(e.target.value) })} aria-label={`Value from ${meta.min} to ${meta.max}`} />
          <span>for</span>
          <select className={small} value={t.days} onChange={(e) => setT({ ...t, days: Number(e.target.value) })} aria-label="Days in a row">
            {[1, 2, 3, 4, 5, 7].map((n) => (
              <option key={n} value={n}>{n === 1 ? "1 day" : `${n} days in a row`}</option>
            ))}
          </select>
          <span>then</span>
          <ActionPicker value={t.action} onChange={(a) => setT({ ...t, action: a })} />
          <Button type="submit" disabled={pending} className="h-10 px-4 text-sm">
            Add
          </Button>
        </form>
      )}
    </section>
  );
}

function DetailsEditor({ journeyId, canEdit, details, run, pending, team }: { journeyId: string; canEdit: boolean; details: Details; run: RunFn; pending: boolean; team?: boolean }) {
  const [d, setD] = useState({ ...details, instructions: details.instructions ?? "" });
  const [saved, setSaved] = useState(false);
  const field = (k: keyof Details, label: string, extra: Partial<React.ComponentProps<"input">> = {}) => (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input className={`${inputClass} mt-1.5`} disabled={!canEdit} value={String(d[k])} onChange={(e) => { setSaved(false); setD({ ...d, [k]: extra.type === "number" ? Number(e.target.value) : e.target.value }); }} {...extra} />
    </label>
  );
  return (
    <section className="glass rounded-3xl p-5 md:p-6" data-testid="plan-details">
      <h2 className="text-lg font-bold">{team ? "Patient details and general instructions" : "Journey details"}</h2>
      <form
        className="mt-4 grid gap-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => saveJourneyDetails({ journeyId, ...d }), () => setSaved(true));
        }}
      >
        {field("person_name", "Name or nickname", { maxLength: 40 })}
        {field("discharge_date", "Discharge date", { type: "date" })}
        {field("horizon_days", "Journey length in days", { type: "number", min: 7, max: 365 })}
        {field("plan_entered_by", "Plan written by", { maxLength: 120, placeholder: "Clinician or team name" })}
        {field("care_team_name", "Care team name", { maxLength: 120 })}
        {field("care_team_phone", "Care team phone", { maxLength: 40, inputMode: "tel" })}
        {field("emergency_number", "Emergency number", { maxLength: 12, inputMode: "tel" })}
        <label className="block">
          <span className="text-sm font-medium">Plan source</span>
          <select disabled={!canEdit} className={`${inputClass} mt-1.5`} value={d.plan_source} onChange={(e) => setD({ ...d, plan_source: e.target.value as Details["plan_source"] })}>
            <option value="clinician">Entered by a clinician</option>
            <option value="family">Copied by family from the discharge letter</option>
            <option value="patient">Copied by the patient from the discharge letter</option>
          </select>
        </label>
        {team && (
          <label className="block md:col-span-2">
            <span className="text-sm font-medium">General instructions for the patient</span>
            <span className="block text-xs text-haze">Plain language, shown at the top of their plan. For example how to rest, what to avoid, who to call for what.</span>
            <textarea disabled={!canEdit} className="mt-1.5 w-full rounded-2xl border border-haze/20 bg-night/60 p-3 text-[15px] outline-none focus:border-ember/80" rows={4} maxLength={2000} value={d.instructions} onChange={(e) => { setSaved(false); setD({ ...d, instructions: e.target.value }); }} data-testid="plan-instructions" />
          </label>
        )}
        <label className="block md:col-span-2">
          <span className="text-sm font-medium">Diet notes from the care team</span>
          <textarea disabled={!canEdit} className="mt-1.5 w-full rounded-2xl border border-haze/20 bg-night/60 p-3 text-[15px] outline-none focus:border-ember/80" rows={2} maxLength={600} value={d.diet_notes} onChange={(e) => setD({ ...d, diet_notes: e.target.value })} placeholder="Shown next to meal ideas, word for word" />
        </label>
        {canEdit && (
          <div className="flex items-center gap-3 md:col-span-2">
            <Button type="submit" disabled={pending}>Save details</Button>
            {saved && <span className="text-sm text-mint">Saved</span>}
          </div>
        )}
      </form>
    </section>
  );
}
