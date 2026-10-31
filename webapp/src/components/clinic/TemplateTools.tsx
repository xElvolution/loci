"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { copyBuiltinTemplateAction, deleteTemplateAction, saveJourneyAsTemplateAction, saveTemplateAction } from "@/app/actions";
import { Icon } from "@/components/ui/Icon";
import { Button, inputClass } from "@/components/ui/primitives";
import { SPECIALTIES } from "@/lib/care/specialties";
import { INSTRUMENTS } from "@/lib/care/instruments";
import type { TemplateBody, TemplateItem } from "@/lib/care/templates";

const bare = inputClass.replace("w-full ", "");

export function SaveAsTemplate({ journeyId }: { journeyId: string }) {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="glass rounded-3xl p-5 text-sm"
      data-testid="save-as-template"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveJourneyAsTemplateAction(journeyId, name);
          setMsg(r.ok ? { ok: true, text: "Saved to your team templates." } : { ok: false, text: r.error });
          if (r.ok) setName("");
        });
      }}
    >
      <p className="label-mono text-haze">Reuse this plan</p>
      <p className="mt-2 text-haze">Save the items, warning signs, rules and measures as a team template. The patient&apos;s name and dates are not saved.</p>
      <div className="mt-3 flex gap-2">
        <input className={`${bare} min-w-0 flex-1`} placeholder="Template name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} data-testid="template-name" />
        <Button type="submit" variant="outline" disabled={pending || name.trim().length < 2} className="h-11 shrink-0 px-4" data-testid="template-save">Save</Button>
      </div>
      {msg && <p className={`mt-2 ${msg.ok ? "text-mint" : "text-coral"}`} role="status">{msg.text}</p>}
    </form>
  );
}

export function CopyBuiltin({ orgId, id }: { orgId: string; id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-10 px-4 text-sm"
        disabled={pending}
        data-testid="copy-builtin"
        onClick={() =>
          start(async () => {
            const r = await copyBuiltinTemplateAction(orgId, id);
            if (!r.ok) setErr(r.error);
            else router.push(`/clinic/templates/${r.id}`);
          })
        }
      >
        <Icon name="edit" className="h-4 w-4" /> Copy and edit
      </Button>
      {err && <span className="text-xs text-coral">{err}</span>}
    </>
  );
}

export function DeleteTemplate({ orgId, id, name }: { orgId: string; id: string; name: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      className="grid h-10 w-10 place-items-center rounded-full text-haze transition hover:bg-coral/15 hover:text-coral"
      aria-label={`Delete ${name}`}
      disabled={pending}
      onClick={() => confirm(`Delete the template "${name}"? Plans already made from it stay as they are.`) && start(async () => { await deleteTemplateAction(orgId, id); router.refresh(); })}
    >
      <Icon name="trash" className="h-4 w-4" />
    </button>
  );
}

const KINDS = [
  ["medication", "Medicine"],
  ["care", "Care task"],
  ["exercise", "Exercise"],
  ["appointment", "Appointment"],
] as const;

const blank = (kind: TemplateItem["kind"]): TemplateItem => ({ kind, title: "", detail: "", why: "", how: "", times: [], weekdays: null, start_day: 0, end_day: null, day: null, at_time: null, location: "" });

/** Edits a team template as one document: details, items, milestones, warning signs and measures. */
export function TemplateEditor(props: { orgId: string; id: string; name: string; description: string; specialty: string; horizonDays: number; body: TemplateBody }) {
  const [meta, setMeta] = useState({ name: props.name, description: props.description, specialty: props.specialty, horizonDays: props.horizonDays });
  const [body, setBody] = useState<TemplateBody>(props.body);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const setItem = (i: number, patch: Partial<TemplateItem>) => setBody({ ...body, items: body.items.map((it, k) => (k === i ? { ...it, ...patch } : it)) });
  const save = () =>
    start(async () => {
      setMsg(null);
      const r = await saveTemplateAction({ orgId: props.orgId, id: props.id, meta, body: { ...body, items: body.items.map((it) => ({ ...it, times: it.times.filter(Boolean) })) } });
      setMsg(r.ok ? { ok: true, text: "Template saved." } : { ok: false, text: r.error });
      if (r.ok) router.refresh();
    });
  return (
    <div className="space-y-6" data-testid="template-editor">
      <section className="glass grid gap-4 rounded-3xl p-5 md:grid-cols-2 md:p-6">
        <label className="block md:col-span-2">
          <span className="text-sm font-medium">Name</span>
          <input className={`${inputClass} mt-1.5`} value={meta.name} maxLength={80} onChange={(e) => setMeta({ ...meta, name: e.target.value })} data-testid="tpl-name" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium">Description</span>
          <textarea className={`${inputClass} mt-1.5 h-20 py-2`} value={meta.description} maxLength={400} onChange={(e) => setMeta({ ...meta, description: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Specialty</span>
          <select className={`${inputClass} mt-1.5`} value={meta.specialty} onChange={(e) => setMeta({ ...meta, specialty: e.target.value })}>
            {SPECIALTIES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Recovery length in days</span>
          <input type="number" min={7} max={365} className={`${inputClass} mt-1.5`} value={meta.horizonDays} onChange={(e) => setMeta({ ...meta, horizonDays: Number(e.target.value) })} />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium">General instructions</span>
          <textarea className={`${inputClass} mt-1.5 h-24 py-2`} value={body.instructions} maxLength={4000} onChange={(e) => setBody({ ...body, instructions: e.target.value })} placeholder="Your team's general guidance, in plain words." />
        </label>
      </section>

      <section className="space-y-3" aria-labelledby="tpl-items">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="tpl-items" className="text-xl font-bold">Plan items</h2>
          <div className="flex flex-wrap gap-2">
            {KINDS.map(([k, l]) => (
              <Button key={k} type="button" variant="outline" className="h-9 px-3 text-xs" onClick={() => setBody({ ...body, items: [...body.items, blank(k)] })} data-testid={`tpl-add-${k}`}>
                <Icon name="plus" className="h-3.5 w-3.5" /> {l}
              </Button>
            ))}
          </div>
        </div>
        {body.items.length === 0 && <p className="text-sm text-haze">No items yet.</p>}
        {body.items.map((it, i) => (
          <div key={i} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4" data-testid="tpl-item">
            <div className="flex flex-wrap items-start gap-2">
              <select className={`${bare} w-full sm:w-36 sm:shrink-0`} value={it.kind} onChange={(e) => setItem(i, { kind: e.target.value as TemplateItem["kind"] })} aria-label="Kind">
                {KINDS.map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </select>
              <input className={`${bare} min-w-0 flex-1 basis-40`} value={it.title} maxLength={160} placeholder="Title" onChange={(e) => setItem(i, { title: e.target.value })} aria-label="Title" data-testid="tpl-item-title" />
              <button type="button" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-haze hover:bg-coral/15 hover:text-coral" aria-label={`Remove ${it.title || "item"}`} onClick={() => setBody({ ...body, items: body.items.filter((_, k) => k !== i) })}>
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <textarea className={`${inputClass} h-20 py-2`} placeholder="Details" value={it.detail} maxLength={600} onChange={(e) => setItem(i, { detail: e.target.value })} aria-label="Details" />
              <textarea className={`${inputClass} h-20 py-2`} placeholder="Why your team asks" value={it.why} maxLength={600} onChange={(e) => setItem(i, { why: e.target.value })} aria-label="Why" />
              <textarea className={`${inputClass} h-20 py-2`} placeholder="How, one step per line" value={it.how} maxLength={1200} onChange={(e) => setItem(i, { how: e.target.value })} aria-label="How" />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-haze">
              {it.kind !== "appointment" ? (
                <>
                  <label className="flex items-center gap-1.5">Times <input className={`${bare} h-9 w-36`} placeholder="08:00, 20:00" value={it.times.join(", ")} onChange={(e) => setItem(i, { times: e.target.value.split(/[,\s]+/).filter(Boolean) })} /></label>
                  <label className="flex items-center gap-1.5">From day <input type="number" min={0} className={`${bare} h-9 w-20`} value={it.start_day} onChange={(e) => setItem(i, { start_day: Number(e.target.value) })} /></label>
                  <label className="flex items-center gap-1.5">to day <input type="number" min={0} className={`${bare} h-9 w-20`} value={it.end_day ?? ""} onChange={(e) => setItem(i, { end_day: e.target.value === "" ? null : Number(e.target.value) })} /></label>
                </>
              ) : (
                <label className="flex items-center gap-1.5">Day after discharge <input type="number" className={`${bare} h-9 w-20`} value={it.day ?? ""} onChange={(e) => setItem(i, { day: e.target.value === "" ? null : Number(e.target.value) })} /></label>
              )}
              <label className="flex items-center gap-1.5">
                <input type="checkbox" className="h-4 w-4 accent-[#ff9a5a]" checked={!!it.needs_review} onChange={(e) => setItem(i, { needs_review: e.target.checked })} /> Ask the clinician to write this for each patient
              </label>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="glass rounded-3xl p-5">
          <p className="font-semibold">Milestones</p>
          <ul className="mt-3 space-y-2">
            {body.milestones.map((m, i) => (
              <li key={i} className="flex gap-2">
                <input className={`${bare} min-w-0 flex-1`} value={m.title} maxLength={120} onChange={(e) => setBody({ ...body, milestones: body.milestones.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)) })} aria-label="Milestone" />
                <button type="button" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-haze hover:text-coral" aria-label="Remove milestone" onClick={() => setBody({ ...body, milestones: body.milestones.filter((_, k) => k !== i) })}>
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <Button type="button" variant="outline" className="mt-3 h-9 px-3 text-xs" onClick={() => setBody({ ...body, milestones: [...body.milestones, { title: "", day: null }] })}>
            <Icon name="plus" className="h-3.5 w-3.5" /> Milestone
          </Button>
        </div>
        <div className="glass rounded-3xl p-5">
          <p className="font-semibold">Warning signs</p>
          <p className="mt-1 text-xs text-haze">Your team&apos;s words. Each one shows the patient your call buttons.</p>
          <ul className="mt-3 space-y-2">
            {body.signs.map((sg, i) => (
              <li key={i} className="flex gap-2">
                <input className={`${bare} min-w-0 flex-1`} value={sg.text} maxLength={300} onChange={(e) => setBody({ ...body, signs: body.signs.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)) })} aria-label="Warning sign" data-testid="tpl-sign" />
                <select className={`${bare} w-32 shrink-0`} value={sg.action} onChange={(e) => setBody({ ...body, signs: body.signs.map((x, k) => (k === i ? { ...x, action: e.target.value as "call_team" | "emergency" } : x)) })} aria-label="Action">
                  <option value="call_team">Call team</option>
                  <option value="emergency">Emergency</option>
                </select>
                <button type="button" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-haze hover:text-coral" aria-label="Remove warning sign" onClick={() => setBody({ ...body, signs: body.signs.filter((_, k) => k !== i) })}>
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <Button type="button" variant="outline" className="mt-3 h-9 px-3 text-xs" onClick={() => setBody({ ...body, signs: [...body.signs, { text: "", action: "call_team" }] })} data-testid="tpl-add-sign">
            <Icon name="plus" className="h-3.5 w-3.5" /> Warning sign
          </Button>
        </div>
      </section>

      <section className="glass rounded-3xl p-5">
        <p className="font-semibold">Outcome measures to start tracking</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {INSTRUMENTS.map((m) => {
            const on = body.measures.includes(m.id);
            return (
              <button key={m.id} type="button" aria-pressed={on} onClick={() => setBody({ ...body, measures: on ? body.measures.filter((x) => x !== m.id) : [...body.measures, m.id] })} className={`rounded-full border px-3 py-1.5 text-sm transition ${on ? "border-mint/60 bg-mint/10 text-mint" : "border-white/10 text-haze hover:text-white"}`}>
                {m.short}
              </button>
            );
          })}
        </div>
      </section>

      <div className="z-10 flex flex-wrap items-center gap-3 rounded-3xl border border-white/10 bg-night/90 p-2 pl-5 backdrop-blur md:sticky md:bottom-4 md:rounded-full">
        <span className="min-w-0 flex-1 text-sm text-haze">{msg ? <span className={msg.ok ? "text-mint" : "text-coral"} role="status">{msg.text}</span> : "Changes apply to new plans made from this template."}</span>
        <Button type="button" onClick={save} disabled={pending} className="h-11 px-5" data-testid="tpl-save">{pending ? "Saving" : "Save template"}</Button>
      </div>
    </div>
  );
}
