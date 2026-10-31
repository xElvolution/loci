"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { submitCheckin } from "@/app/actions";
import { Icon } from "@/components/ui/Icon";
import { CallButtons } from "@/components/care/bits";
import { METRIC_META, type FlagResult, type Metric, type WarningSign } from "@/lib/care/types";

const FACES = ["M9 16c1.5-1.5 4.5-1.5 6 0", "M9 15.5c1.5-.8 4.5-.8 6 0", "M9 15h6", "M9 14.5c1.5.8 4.5.8 6 0", "M8.5 14c1.8 2.2 5.2 2.2 7 0"];
const FIVE: Exclude<Metric, "pain">[] = ["mood", "sleep", "appetite", "energy"];
const ASK: Record<Metric, (who: string) => string> = {
  mood: (w) => `How is ${w} mood?`,
  pain: (w) => `How much pain ${w === "your" ? "do you" : "are they"} have right now?`,
  sleep: (w) => `How was ${w} sleep last night?`,
  appetite: (w) => `How is ${w} appetite?`,
  energy: (w) => `How is ${w} energy?`,
};

export type CheckinInitial = { mood: number; pain: number; sleep: number; appetite: number; energy: number; signs: string[]; note: string } | null;

export function CheckinForm(props: { journeyId: string; personName: string; isSelf: boolean; signs: WarningSign[]; initial: CheckinInitial; phone: string; team: string; emergency: string }) {
  const who = props.isSelf ? "your" : `${props.personName}'s`;
  const [v, setV] = useState({ mood: props.initial?.mood ?? 0, pain: props.initial?.pain ?? -1, sleep: props.initial?.sleep ?? 0, appetite: props.initial?.appetite ?? 0, energy: props.initial?.energy ?? 0 });
  const [signs, setSigns] = useState<string[]>(props.initial?.signs ?? []);
  const [note, setNote] = useState(props.initial?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ flags: FlagResult[]; streak: number } | null>(null);
  const [pending, start] = useTransition();
  const answered = FIVE.every((m) => v[m] > 0) && v.pain >= 0;

  const submit = () =>
    start(async () => {
      setError(null);
      const r = await submitCheckin({ journeyId: props.journeyId, ...v, signs, note });
      if (!r.ok) setError(r.error);
      else {
        setResult({ flags: r.flags, streak: r.streak });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

  if (result) {
    const emergency = result.flags.some((f) => f.action === "emergency");
    if (result.flags.length)
      return (
        <motion.section initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className={`rounded-[32px] border p-6 md:p-8 ${emergency ? "border-coral bg-coral/15" : "border-ember/50 bg-ember/10"}`} role="alert" data-testid="escalation">
          <p className={`label-mono ${emergency ? "text-coral" : "text-ember"}`}>Your care team asked to hear about this</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance">{emergency ? `Call ${props.emergency} now.` : `Contact ${props.team || "your care team"} today.`}</h2>
          <ul className="mt-4 space-y-2">
            {result.flags.map((f) => (
              <li key={f.refId} className="flex items-start gap-2 text-[15px]">
                <Icon name="alert" className={`mt-0.5 h-4 w-4 shrink-0 ${f.action === "emergency" ? "text-coral" : "text-ember"}`} /> {f.reason}
              </li>
            ))}
          </ul>
          <CallButtons phone={props.phone} team={props.team} emergency={props.emergency} />
          <p className="mt-5 text-sm text-haze">This is a rule your care team wrote into the plan, not a diagnosis. Your check-in is saved{props.isSelf ? "" : " and the circle can see it"}. If anything feels wrong, trust yourself and call.</p>
          <Link href="/app" className="mt-5 inline-flex items-center gap-2 text-sm text-haze underline-offset-4 hover:text-white hover:underline">
            Back to today
          </Link>
        </motion.section>
      );
    return (
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[32px] border border-mint/30 bg-gradient-to-br from-mint/10 via-dusk-900 to-night p-8 text-center" data-testid="checkin-done">
        {Array.from({ length: 14 }, (_, k) => (
          <motion.span
            key={k}
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 h-2 w-2 rounded-full"
            style={{ background: ["#ffc15e", "#ff6b5a", "#7cf5d3", "#b48cff"][k % 4] }}
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{ x: Math.cos((k / 14) * Math.PI * 2) * 160, y: Math.sin((k / 14) * Math.PI * 2) * 110, opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        ))}
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint text-night">
          <Icon name="check" className="h-8 w-8" />
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight">Checked in. {result.streak > 1 ? `${result.streak} days in a row.` : "Day one of the streak."}</h2>
        <p className="mx-auto mt-2 max-w-md text-haze">Nothing you shared matched the warning signs or thresholds in the plan. Small steps count.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/app/comfort" className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-br from-ember to-coral px-5 font-semibold text-night">
            See today&apos;s good-day plan <Icon name="arrowR" className="h-4 w-4" />
          </Link>
          <Link href="/app" className="inline-flex h-11 items-center rounded-full border border-white/15 px-5">
            Back to today
          </Link>
        </div>
      </motion.section>
    );
  }

  return (
    <div data-tour="checkin-form" className="space-y-4">
      {FIVE.slice(0, 1).map((m) => (
        <Scale5 key={m} m={m} label={ASK[m](who)} value={v[m]} onChange={(n) => setV({ ...v, [m]: n })} faces />
      ))}
      <section className="glass rounded-3xl p-5 md:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold">{ASK.pain(who)}</h2>
          <span className="font-mono text-2xl font-bold text-ember tabular-nums" aria-hidden="true">
            {v.pain < 0 ? "?" : v.pain}
          </span>
        </div>
        <input type="range" min={0} max={10} step={1} value={Math.max(0, v.pain)} onChange={(e) => setV({ ...v, pain: Number(e.target.value) })} onPointerDown={() => v.pain < 0 && setV({ ...v, pain: 0 })} className="scale mt-4" aria-label="Pain from 0, none, to 10, worst" data-testid="pain" />
        <div className="mt-1 flex justify-between text-xs text-haze">
          <span>0 none</span>
          <span>10 worst imaginable</span>
        </div>
        {v.pain < 0 && (
          <button type="button" onClick={() => setV({ ...v, pain: 0 })} className="mt-2 text-xs text-haze underline underline-offset-4">
            No pain at all
          </button>
        )}
      </section>
      {FIVE.slice(1).map((m) => (
        <Scale5 key={m} m={m} label={ASK[m](who)} value={v[m]} onChange={(n) => setV({ ...v, [m]: n })} />
      ))}

      {props.signs.length > 0 && (
        <section className="rounded-3xl border border-coral/25 bg-coral/[0.06] p-5 md:p-6">
          <h2 className="text-lg font-bold">Is any of this happening now?</h2>
          <p className="mt-1 text-sm text-haze">The warning signs from the plan, in the care team&apos;s words.</p>
          <ul className="mt-4 space-y-2">
            {props.signs.map((s) => {
              const on = signs.includes(s.id);
              return (
                <li key={s.id}>
                  <button type="button" aria-pressed={on} onClick={() => setSigns(on ? signs.filter((x) => x !== s.id) : [...signs, s.id])} className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${on ? "border-coral bg-coral/15" : "border-white/10 hover:border-white/25"}`}>
                    <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 ${on ? "border-coral bg-coral text-night" : "border-haze/40"}`}>{on && <Icon name="check" className="h-3.5 w-3.5" />}</span>
                    <span className="text-[15px] leading-snug">{s.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="glass rounded-3xl p-5 md:p-6">
        <label htmlFor="note" className="text-lg font-bold">
          Anything else? <span className="text-sm font-normal text-haze">Optional</span>
        </label>
        <textarea id="note" value={note} onChange={(e) => setNote(e.target.value.slice(0, 600))} rows={3} placeholder="A good moment, a worry, a question for the next visit" className="mt-3 w-full rounded-2xl border border-haze/20 bg-night/60 p-4 text-[15px] outline-none focus:border-ember/80" />
        <p className="mt-1 text-xs text-haze/80">Visible to the care circle, and to the clinic if you share with them.</p>
      </section>

      {error && (
        <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral" role="alert">
          {error}
        </p>
      )}
      <div className="sticky bottom-24 z-10 xl:bottom-4">
        <button type="button" onClick={submit} disabled={!answered || pending} data-testid="save-checkin" className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-ember to-coral text-base font-semibold text-night shadow-[0_16px_40px_-12px_rgba(255,107,90,0.8)] transition hover:brightness-110 disabled:opacity-50">
          {pending ? "Saving" : answered ? "Save today's check-in" : "Answer each question to save"}
        </button>
      </div>
    </div>
  );
}

function Scale5({ m, label, value, onChange, faces = false }: { m: Exclude<Metric, "pain">; label: string; value: number; onChange: (n: number) => void; faces?: boolean }) {
  const meta = METRIC_META[m];
  return (
    <section className="glass rounded-3xl p-5 md:p-6">
      <h2 className="text-lg font-bold" id={`q-${m}`}>
        {label}
      </h2>
      <div className="mt-4 grid grid-cols-5 gap-2" role="radiogroup" aria-labelledby={`q-${m}`}>
        {[1, 2, 3, 4, 5].map((n) => {
          const on = value === n;
          return (
            <button key={n} type="button" role="radio" aria-checked={on} aria-label={`${n} of 5${n === 1 ? `, ${meta.low}` : n === 5 ? `, ${meta.high}` : ""}`} data-testid={`${m}-${n}`} onClick={() => onChange(n)} className={`relative flex h-16 flex-col items-center justify-center rounded-2xl border transition ${on ? "border-ember bg-ember/15 text-white" : "border-white/10 text-haze hover:border-white/25"}`}>
              {faces ? (
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9.5" />
                  <circle cx="9" cy="10" r="0.9" fill="currentColor" />
                  <circle cx="15" cy="10" r="0.9" fill="currentColor" />
                  <path d={FACES[n - 1]} />
                </svg>
              ) : (
                <span className="text-xl font-bold tabular-nums">{n}</span>
              )}
              <AnimatePresence>{on && <motion.span layoutId={`dot-${m}`} className="absolute -bottom-1 h-1.5 w-6 rounded-full bg-ember" />}</AnimatePresence>
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-haze">
        <span>{meta.low}</span>
        <span>{meta.high}</span>
      </div>
    </section>
  );
}
