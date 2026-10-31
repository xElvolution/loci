"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clinicSetupAction, createClinicPlan, markPlanSeenAction, redeemCodeAction, renameOrgAction, resolveQuestionsAction, sendMessageAction, sendPlanAction } from "@/app/actions";
import { Icon } from "@/components/ui/Icon";
import { Button, inputClass } from "@/components/ui/primitives";
import { SPECIALTIES } from "@/lib/care/specialties";

/** Re-reads server data every few seconds while the tab is visible, so each side sees the other live. */
export function LiveRefresh({ every = 8000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && router.refresh();
    const id = setInterval(tick, every);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, every]);
  return null;
}

export function CopyField({ value, label, testid, mono = true }: { value: string; label: string; testid?: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex min-w-0 gap-2">
      <input readOnly value={value} className={`${inputClass} min-w-0 ${mono ? "font-mono text-sm" : ""}`} aria-label={label} onFocus={(e) => e.currentTarget.select()} data-testid={testid} />
      <Button
        type="button"
        variant="outline"
        className="h-12 shrink-0 px-4"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          } catch {
            setCopied(false);
          }
        }}
      >
        <Icon name={copied ? "check" : "copy"} className="h-4 w-4" /> <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
      </Button>
    </div>
  );
}

const KINDS = [
  ["clinic", "Clinic or practice"],
  ["hospital", "Hospital ward or department"],
  ["home_care", "Home care agency"],
  ["other", "Other care team"],
] as const;

export function ClinicSetup({ suggested }: { suggested: string }) {
  const [name, setName] = useState(suggested);
  const [kind, setKind] = useState("clinic");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await clinicSetupAction({ name, kind });
          if (!r.ok) setErr(r.error);
          else router.push(r.redirectTo);
        });
      }}
    >
      <label className="block">
        <span className="text-sm font-medium">Care team name</span>
        <input className={`${inputClass} mt-1.5`} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required placeholder="Riverside joint care team" data-testid="org-name" />
        <span className="mt-1 block text-xs text-haze">Patients see this name on their plan and next to your messages.</span>
      </label>
      <label className="block">
        <span className="text-sm font-medium">Kind of team</span>
        <select className={`${inputClass} mt-1.5`} value={kind} onChange={(e) => setKind(e.target.value)}>
          {KINDS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </label>
      {err && <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral" role="alert">{err}</p>}
      <Button type="submit" disabled={pending} className="h-12 text-base">{pending ? "Setting up" : "Open the workspace"}</Button>
    </form>
  );
}

type TplOption = { id: string; name: string; specialty: string; group: "Your team" | "loci structure" };
export function NewPlanForm({ orgId, today, defaultPhone, defaultEmergency, templates = [], initialTemplate = "" }: { orgId: string; today: string; defaultPhone: string; defaultEmergency: string; templates?: TplOption[]; initialTemplate?: string }) {
  const first = templates.find((t) => t.id === initialTemplate);
  const [f, setF] = useState({ personName: "", specialty: first?.specialty ?? "orthopedics", dischargeDate: today, ledBy: (first?.specialty === "neuro" || first?.specialty === "pediatrics" ? "caregiver" : "patient") as "patient" | "caregiver", phone: defaultPhone, emergency: defaultEmergency, templateId: initialTemplate });
  const tpl = templates.find((t) => t.id === f.templateId);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const s = SPECIALTIES.find((x) => x.id === f.specialty);
  return (
    <form
      className="grid gap-5 md:grid-cols-2"
      data-testid="new-plan"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setErr(null);
          const r = await createClinicPlan({ orgId, ...f, templateId: f.templateId || undefined });
          if (!r.ok) setErr(r.error);
          else router.push(`/clinic/p/${r.journeyId}/plan?new=1`);
        });
      }}
    >
      <label className="block">
        <span className="text-sm font-medium">Patient first name or nickname</span>
        <input className={`${inputClass} mt-1.5`} value={f.personName} onChange={(e) => setF({ ...f, personName: e.target.value })} maxLength={40} required data-testid="np-name" />
        <span className="mt-1 block text-xs text-haze">Only a first name. Do not add record numbers or full names.</span>
      </label>
      <label className="block">
        <span className="text-sm font-medium">Specialty template</span>
        <select className={`${inputClass} mt-1.5`} value={f.specialty} disabled={!!tpl} onChange={(e) => setF({ ...f, specialty: e.target.value })} data-testid="np-specialty">
          {SPECIALTIES.map((x) => (
            <option key={x.id} value={x.id}>{x.label}</option>
          ))}
        </select>
        {s && !tpl && <span className="mt-1 block text-xs text-haze">{s.milestones.length} everyday milestones and prompts for each section. You write every instruction.</span>}
      </label>
      {templates.length > 0 && (
        <label className="block md:col-span-2">
          <span className="text-sm font-medium">Start from a plan template (optional)</span>
          <select className={`${inputClass} mt-1.5`} value={f.templateId} onChange={(e) => { const t = templates.find((x) => x.id === e.target.value); setF({ ...f, templateId: e.target.value, specialty: t?.specialty ?? f.specialty }); }} data-testid="np-template">
            <option value="">No template, just the specialty sections</option>
            {(["Your team", "loci structure"] as const).map((g) => {
              const list = templates.filter((t) => t.group === g);
              return list.length ? (
                <optgroup key={g} label={g === "Your team" ? "Your team's templates" : "loci structure templates"}>
                  {list.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </optgroup>
              ) : null;
            })}
          </select>
          {tpl && <span className="mt-1 block text-xs text-haze">{tpl.group === "Your team" ? "Copies your team's items, warning signs, rules and measures. Review them for this patient." : "Adds the sections and suggested measures. Each item is marked \"Needs your words\" until you write it."}</span>}
        </label>
      )}
      <label className="block">
        <span className="text-sm font-medium">Discharge or start date</span>
        <input type="date" className={`${inputClass} mt-1.5`} value={f.dischargeDate} onChange={(e) => setF({ ...f, dischargeDate: e.target.value })} required />
      </label>
      <label className="block">
        <span className="text-sm font-medium">The plan goes to</span>
        <select className={`${inputClass} mt-1.5`} value={f.ledBy} onChange={(e) => setF({ ...f, ledBy: e.target.value as "patient" | "caregiver" })}>
          <option value="patient">The patient</option>
          <option value="caregiver">A parent or caregiver</option>
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium">Team phone the patient should call</span>
        <input className={`${inputClass} mt-1.5`} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} maxLength={40} inputMode="tel" placeholder="(212) 555-0100" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Local emergency number</span>
        <input className={`${inputClass} mt-1.5`} value={f.emergency} onChange={(e) => setF({ ...f, emergency: e.target.value })} maxLength={12} inputMode="tel" required />
      </label>
      {err && <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral md:col-span-2" role="alert">{err}</p>}
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending} className="h-12 px-6 text-base" data-testid="np-create">
          {pending ? "Creating" : "Create draft plan"} <Icon name="arrowR" className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

export function SendPlan({ journeyId, sent, code, url, person, joined }: { journeyId: string; sent: boolean; code: string | null; url: string | null; person: string; joined: { name: string; when: string } | null }) {
  const [res, setRes] = useState<{ pretty: string; url: string } | null>(code && url ? { pretty: code, url } : null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const send = () =>
    start(async () => {
      setErr(null);
      const r = await sendPlanAction(journeyId);
      if (!r.ok) setErr(r.error);
      else {
        setRes({ pretty: r.pretty, url: r.url });
        router.refresh();
      }
    });
  if (joined)
    return (
      <section className="rounded-3xl border border-mint/30 bg-mint/[0.06] p-5 md:p-6" data-testid="send-plan">
        <p className="label-mono text-mint">Live</p>
        <h2 className="mt-1 text-lg font-bold">{joined.name} is following this plan</h2>
        <p className="mt-1 text-sm text-haze">Joined {joined.when}. Every change you save here reaches them straight away, with a note saying your team updated the plan.</p>
      </section>
    );
  return (
    <section className={`rounded-3xl border p-5 md:p-6 ${sent ? "border-mint/30 bg-mint/[0.06]" : "border-ember/30 bg-ember/[0.06]"}`} data-testid="send-plan">
      <p className={`label-mono ${sent ? "text-mint" : "text-ember"}`}>{sent ? "Sent" : "Ready to send?"}</p>
      <h2 className="mt-1 text-lg font-bold">{sent ? `Waiting for ${person} to enter the code` : `Send the plan to ${person}`}</h2>
      <p className="mt-1 text-sm text-haze">
        {sent
          ? "Give them this code or link. Once they join, you see their tick-offs, check-ins and questions here. You can keep editing the plan."
          : "You get a private code and link. Give it to the patient or caregiver in person, by text or on the discharge sheet. It works for 30 days."}
      </p>
      {res ? (
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs text-haze">Code to type in the loci app</p>
            <p className="mt-1 font-mono text-3xl font-bold tracking-[0.2em] text-[#f4f1ff] tabular-nums" data-testid="plan-code">{res.pretty}</p>
          </div>
          <CopyField value={res.url} label="Plan link" testid="plan-link" />
        </div>
      ) : null}
      {(!sent || !res) && (
        <Button type="button" className="mt-4 h-12 px-6" disabled={pending} onClick={send} data-testid="send-plan-btn">
          <Icon name="send" className="h-4 w-4" /> {pending ? "Sending" : sent ? "Show the code again" : "Send plan to patient"}
        </Button>
      )}
      {err && <p className="mt-3 text-sm text-coral" role="alert">{err}</p>}
    </section>
  );
}

export function Composer({ journeyId, side, placeholder }: { journeyId: string; side: "patient" | "team"; placeholder: string }) {
  const [body, setBody] = useState("");
  const [question, setQuestion] = useState(side === "patient");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <form
      className="glass rounded-3xl p-4 md:p-5"
      data-testid="composer"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setErr(null);
          const r = await sendMessageAction({ journeyId, body, kind: question ? "question" : "message" });
          if (!r.ok) setErr(r.error);
          else {
            setBody("");
            router.refresh();
            ref.current?.focus();
          }
        });
      }}
    >
      <label className="sr-only" htmlFor="msg">Message</label>
      <textarea ref={ref} id="msg" className="w-full resize-y rounded-2xl border border-haze/20 bg-night/60 p-3 text-[15px] outline-none focus:border-ember/80" rows={3} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} placeholder={placeholder} data-testid="msg-body" />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        {side === "patient" ? (
          <label className="flex items-center gap-2 text-sm text-haze">
            <input type="checkbox" checked={question} onChange={(e) => setQuestion(e.target.checked)} className="h-4 w-4 accent-[#ff9a5a]" />
            This is a question for my team
          </label>
        ) : (
          <span className="text-xs text-haze">Replying answers any open questions in this thread.</span>
        )}
        <Button type="submit" disabled={pending || !body.trim()} className="h-11 px-5" data-testid="msg-send">
          <Icon name="send" className="h-4 w-4" /> {pending ? "Sending" : "Send"}
        </Button>
      </div>
      {err && <p className="mt-2 text-sm text-coral" role="alert">{err}</p>}
      {side === "patient" && <p className="mt-3 text-xs text-haze/80">Not for emergencies or urgent symptoms. Your team replies in working hours. If you are worried now, call them.</p>}
    </form>
  );
}

export function ResolveQuestions({ journeyId }: { journeyId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => { await resolveQuestionsAction(journeyId); router.refresh(); })}
      className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs hover:border-mint hover:text-mint"
      data-testid="resolve-q"
    >
      Mark answered
    </button>
  );
}

export function PlanSeen({ journeyId }: { journeyId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button type="button" variant="outline" className="h-10 shrink-0 px-4 text-sm" disabled={pending} onClick={() => start(async () => { await markPlanSeenAction(journeyId); router.refresh(); })} data-testid="plan-seen">
      <Icon name="check" className="h-4 w-4" /> Got it
    </Button>
  );
}

export function RedeemForm({ initial = "" }: { initial?: string }) {
  const [codeText, setCode] = useState(initial);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setErr(null);
          const r = await redeemCodeAction(codeText);
          if (!r.ok) setErr(r.error);
          else router.push(r.redirectTo);
        });
      }}
    >
      <label className="block">
        <span className="text-sm font-medium">Code from your care team</span>
        <input
          className={`${inputClass} mt-1.5 text-center font-mono text-2xl tracking-[0.25em] uppercase`}
          value={codeText}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={20}
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="ABCD-EFGH"
          required
          data-testid="redeem-code"
        />
        <span className="mt-1 block text-xs text-haze">It is on your discharge sheet or in the text from your team. 8 letters and numbers.</span>
      </label>
      {err && <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral" role="alert">{err}</p>}
      <Button type="submit" disabled={pending} className="h-12 text-base" data-testid="redeem-go">{pending ? "Checking" : "Get my plan"}</Button>
    </form>
  );
}

export function RenameOrg({ orgId, name, canEdit }: { orgId: string; name: string; canEdit: boolean }) {
  const [v, setV] = useState(name);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="flex min-w-0 flex-col gap-3 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await renameOrgAction(orgId, v);
          setMsg(r.ok ? "Saved" : r.error);
          if (r.ok) router.refresh();
        });
      }}
    >
      <input className={`${inputClass} min-w-0 flex-1`} value={v} onChange={(e) => { setV(e.target.value); setMsg(null); }} maxLength={80} disabled={!canEdit} aria-label="Care team name" />
      {canEdit && <Button type="submit" variant="outline" className="h-12 shrink-0 px-5" disabled={pending}>Save name</Button>}
      {msg && <span className="self-center text-sm text-haze">{msg}</span>}
    </form>
  );
}
