"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMeasureAction, closeReadmissionAction, recordOutcomeAction, recordReadmissionAction, removeMeasureAction, removeOutcomeValueAction, removeReadmissionAction } from "@/app/actions";
import { Icon } from "@/components/ui/Icon";
import { Button, inputClass } from "@/components/ui/primitives";
import type { Instrument } from "@/lib/care/instruments";

function useAct() {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, then?: () => void) =>
    start(async () => {
      setErr(null);
      const r = await fn();
      if (!r.ok) setErr(r.error ?? "Something went wrong.");
      else {
        then?.();
        router.refresh();
      }
    });
  return { pending, err, run };
}

export function AddMeasure({ journeyId, suggested, other, taken }: { journeyId: string; suggested: Instrument[]; other: Instrument[]; taken: string[] }) {
  const { pending, err, run } = useAct();
  const [inst, setInst] = useState(suggested.find((s) => !taken.includes(s.id))?.id ?? "custom");
  const [label, setLabel] = useState("");
  const [unit, setUnit] = useState("");
  const [min, setMin] = useState("0");
  const [max, setMax] = useState("10");
  const [hib, setHib] = useState(true);
  const [target, setTarget] = useState("");
  const custom = inst === "custom";
  return (
    <form
      className="glass rounded-3xl p-4 md:p-5"
      data-testid="add-measure"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () => addMeasureAction({ journeyId, instrument: inst, label: custom ? label : undefined, unit: custom ? unit : undefined, min: custom ? Number(min) : undefined, max: custom ? Number(max) : undefined, higherIsBetter: custom ? hib : undefined, target: target === "" ? null : Number(target) }),
          () => setTarget(""),
        );
      }}
    >
      <p className="font-semibold">Track an outcome</p>
      <p className="mt-1 text-xs text-haze">Pick what your team measures. loci stores only the totals you enter and never scores or interprets them.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_auto]">
        <label className="min-w-0 text-sm">
          <span className="sr-only">Instrument</span>
          <select className={inputClass} value={inst} onChange={(e) => setInst(e.target.value)} data-testid="measure-instrument">
            {suggested.length > 0 && (
              <optgroup label="Suggested for this specialty">
                {suggested.map((i) => (
                  <option key={i.id} value={i.id} disabled={taken.includes(i.id)}>{i.label} ({i.entry})</option>
                ))}
              </optgroup>
            )}
            <optgroup label="Other measures">
              {other.map((i) => (
                <option key={i.id} value={i.id} disabled={taken.includes(i.id)}>{i.label} ({i.entry})</option>
              ))}
            </optgroup>
            <option value="custom">Your own measure</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="sr-only">Target (optional)</span>
          <input className={inputClass} inputMode="decimal" placeholder="Target (optional)" value={target} onChange={(e) => setTarget(e.target.value)} data-testid="measure-target" />
        </label>
        <Button type="submit" disabled={pending || (custom && !label.trim())} className="h-11 px-5" data-testid="measure-add">
          <Icon name="plus" className="h-4 w-4" /> Add
        </Button>
      </div>
      {custom && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          <input className={`${inputClass} md:col-span-2`} placeholder="Name, as your team calls it" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={80} data-testid="measure-label" />
          <input className={inputClass} placeholder="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} maxLength={24} />
          <input className={inputClass} inputMode="decimal" aria-label="Lowest value" value={min} onChange={(e) => setMin(e.target.value)} />
          <input className={inputClass} inputMode="decimal" aria-label="Highest value" value={max} onChange={(e) => setMax(e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-haze sm:col-span-2 md:col-span-5">
            <input type="checkbox" checked={hib} onChange={(e) => setHib(e.target.checked)} className="h-4 w-4 accent-[#ff9a5a]" /> Higher values are better
          </label>
        </div>
      )}
      {err && <p className="mt-2 text-sm text-coral" role="alert">{err}</p>}
    </form>
  );
}

export function RecordValue({ journeyId, measureId, label, unit, min, max, today }: { journeyId: string; measureId: string; label: string; unit: string; min: number; max: number; today: string }) {
  const { pending, err, run } = useAct();
  const [value, setValue] = useState("");
  const [on, setOn] = useState(today);
  return (
    <form
      className="mt-3 flex flex-wrap items-end gap-2"
      data-testid="record-value"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => recordOutcomeAction({ journeyId, measureId, value: Number(value), on }), () => setValue(""));
      }}
    >
      <label className="min-w-0 flex-1 text-xs text-haze">
        {label} ({min} to {max} {unit})
        <input className={`${inputClass} mt-1`} inputMode="decimal" required value={value} onChange={(e) => setValue(e.target.value)} data-testid="value-input" />
      </label>
      <label className="text-xs text-haze">
        Date
        <input type="date" className={`${inputClass} mt-1`} max={today} value={on} onChange={(e) => setOn(e.target.value)} data-testid="value-date" />
      </label>
      <Button type="submit" disabled={pending || value === ""} className="h-11 px-4" data-testid="value-save">Record</Button>
      {err && <p className="w-full text-sm text-coral" role="alert">{err}</p>}
    </form>
  );
}

export function RemoveButton({ journeyId, id, kind, label }: { journeyId: string; id: string; kind: "measure" | "value" | "readmission"; label: string }) {
  const { pending, run } = useAct();
  const fn = kind === "measure" ? removeMeasureAction : kind === "value" ? removeOutcomeValueAction : removeReadmissionAction;
  return (
    <button
      type="button"
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-haze transition hover:bg-white/5 hover:text-coral disabled:opacity-50"
      aria-label={label}
      title={label}
      disabled={pending}
      onClick={() => {
        if (kind !== "measure" || confirm("Stop tracking this measure and delete its values?")) run(() => fn(journeyId, id));
      }}
    >
      <Icon name="trash" className="h-4 w-4" />
    </button>
  );
}

export function RecordReadmission({ journeyId, today, discharge }: { journeyId: string; today: string; discharge: string }) {
  const { pending, err, run } = useAct();
  const [admitted, setAdmitted] = useState(today);
  const [discharged, setDischarged] = useState("");
  const [note, setNote] = useState("");
  return (
    <form
      className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-[150px_150px_minmax(0,1fr)_auto] md:items-end"
      data-testid="record-readmission"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => recordReadmissionAction({ journeyId, admitted, discharged: discharged || null, note }), () => setNote(""));
      }}
    >
      <label className="text-xs text-haze">
        Admitted
        <input type="date" className={`${inputClass} mt-1`} min={discharge} max={today} value={admitted} onChange={(e) => setAdmitted(e.target.value)} data-testid="readmit-date" />
      </label>
      <label className="text-xs text-haze">
        Discharged (if home again)
        <input type="date" className={`${inputClass} mt-1`} min={admitted} max={today} value={discharged} onChange={(e) => setDischarged(e.target.value)} />
      </label>
      <label className="min-w-0 text-xs text-haze sm:col-span-2 md:col-span-1">
        Note for the team (optional)
        <input className={`${inputClass} mt-1`} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <Button type="submit" variant="outline" disabled={pending} className="h-11 px-4" data-testid="readmit-save">Record readmission</Button>
      {err && <p className="text-sm text-coral sm:col-span-2 md:col-span-4" role="alert">{err}</p>}
    </form>
  );
}

export function CloseReadmission({ journeyId, id, today }: { journeyId: string; id: string; today: string }) {
  const { pending, err, run } = useAct();
  const [d, setD] = useState(today);
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <input type="date" aria-label="Discharge date" className={`${inputClass} h-9 w-40`} max={today} value={d} onChange={(e) => setD(e.target.value)} />
      <Button type="button" variant="outline" className="h-9 px-3 text-sm" disabled={pending} onClick={() => run(() => closeReadmissionAction(journeyId, id, d))}>Home again</Button>
      {err && <span className="text-xs text-coral">{err}</span>}
    </span>
  );
}
