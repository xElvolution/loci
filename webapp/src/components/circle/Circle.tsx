"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCircleTaskAction, circleTaskAction, createInviteAction, leaveCircle, removeMemberAction, revokeInviteAction, setOrgConsentAction } from "@/app/actions";
import { Icon } from "@/components/ui/Icon";
import { Button, inputClass } from "@/components/ui/primitives";
import { prettyDate } from "@/lib/care/dates";

export type MemberView = { id: string; name: string; role: string; owner: boolean; me: boolean };
export type TaskView = { id: string; title: string; due: string | null; assignee: string | null; assigneeName: string | null; done: boolean; doneName: string | null };
export type InviteView = { code: string; role: string; expires: string };

const ROLE_LABEL: Record<string, string> = { patient: "Patient", caregiver: "Main caregiver", family: "Family and friends", carer: "Paid carer", clinician: "Clinician" };
const ROLE_HELP: Record<string, string> = {
  caregiver: "Can edit the plan, check in and invite people.",
  family: "Sees progress and shares errands. Cannot check in or edit.",
  carer: "Ticks off tasks and checks in. Cannot edit the plan.",
  clinician: "Edits the plan and warning signs, and checks in.",
  patient: "The person recovering.",
};
const COLORS = ["#ffc15e", "#ff6b5a", "#7cf5d3", "#b48cff", "#8fd3ff", "#ffd36b", "#f3c98b"];

export function Circle(props: { journeyId: string; personName: string; canManage: boolean; inCircle: boolean; isOwner: boolean; members: MemberView[]; tasks: TaskView[]; invites: InviteView[]; org: { name: string } | null; consentOrg: boolean; origin: string; today: string }) {
  const router = useRouter();
  const [role, setRole] = useState("family");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [assignee, setAssignee] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Something went wrong.");
      else after?.();
    });

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const open = props.tasks.filter((t) => !t.done);
  const done = props.tasks.filter((t) => t.done);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      {error && (
        <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral lg:col-span-2" role="alert">
          {error}
        </p>
      )}
      <div className="min-w-0 space-y-6">
        <section className="glass rounded-3xl p-5 md:p-6">
          <p className="label-mono text-haze">Shared errands</p>
          <h2 className="mt-1 text-xl font-bold">What the circle is handling</h2>
          {props.inCircle && (
            <form
              className="mt-4 grid min-w-0 gap-2 2xl:grid-cols-[1fr_auto]"
              onSubmit={(e) => {
                e.preventDefault();
                if (title.trim()) run(() => addCircleTaskAction({ journeyId: props.journeyId, title, due: due || null, assignee: assignee || null }), () => { setTitle(""); setDue(""); setAssignee(""); });
              }}
            >
              <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} placeholder="Pick up the prescription, cook Thursday dinner" aria-label="New errand" data-testid="task-title" />
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
                <input type="date" value={due} min={props.today} onChange={(e) => setDue(e.target.value)} className="h-12 min-w-0 rounded-2xl border border-haze/20 bg-night/60 px-3 text-sm outline-none focus:border-ember/80" aria-label="Due date" />
                <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="h-12 min-w-0 rounded-2xl border border-haze/20 bg-night/60 px-3 text-sm outline-none" aria-label="Who">
                  <option value="">Anyone</option>
                  {props.members.map((m) => (
                    <option key={m.id} value={m.id}>{m.me ? "Me" : m.name}</option>
                  ))}
                </select>
                <Button type="submit" disabled={pending || !title.trim()} className="h-12 shrink-0 px-4" aria-label="Add errand">
                  <Icon name="plus" className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}
          <ul className="mt-4 space-y-2">
            {open.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                <button type="button" disabled={!props.inCircle} onClick={() => run(() => circleTaskAction(props.journeyId, t.id, "done"))} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-haze/40 text-transparent transition hover:border-mint hover:text-mint" aria-label={`Mark ${t.title} done`}>
                  <Icon name="check" className="h-4 w-4" />
                </button>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] break-words">{t.title}</span>
                  <span className="block text-xs text-haze">
                    {t.assigneeName ?? "Unclaimed"}
                    {t.due ? ` · by ${prettyDate(t.due)}` : ""}
                  </span>
                </span>
                {props.inCircle && !t.assignee && (
                  <button type="button" onClick={() => run(() => circleTaskAction(props.journeyId, t.id, "claim"))} className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs hover:border-ember hover:text-ember">
                    I will do it
                  </button>
                )}
                {props.inCircle && (
                  <button type="button" onClick={() => run(() => circleTaskAction(props.journeyId, t.id, "delete"))} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-haze hover:text-coral" aria-label={`Delete ${t.title}`}>
                    <Icon name="x" className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
            {!open.length && <li className="text-sm text-haze">No open errands.</li>}
          </ul>
          {done.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-haze">{done.length} done</summary>
              <ul className="mt-2 space-y-1.5">
                {done.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-1 text-sm text-haze">
                    <Icon name="check" className="h-4 w-4 shrink-0 text-mint" />
                    <span className="min-w-0 flex-1 truncate line-through">{t.title}</span>
                    <span className="shrink-0 text-xs">{t.doneName}</span>
                    {props.inCircle && (
                      <button type="button" onClick={() => run(() => circleTaskAction(props.journeyId, t.id, "undo"))} className="shrink-0 text-xs underline underline-offset-4">
                        Undo
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        {props.org && (
          <section className="glass rounded-3xl p-5 md:p-6">
            <p className="label-mono text-haze">Sharing with the care team</p>
            <h2 className="mt-1 text-lg font-bold">{props.org.name}</h2>
            <p className="mt-1 text-sm text-haze">When on, clinicians at {props.org.name} see check-ins, plan progress and flags on their dashboard. Turn it off any time and they lose access straight away.</p>
            <label className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-white/5 px-4 py-3">
              <span className="text-sm font-medium">{props.consentOrg ? "Shared with the care team" : "Not shared"}</span>
              <input type="checkbox" role="switch" className="peer sr-only" checked={props.consentOrg} disabled={!props.canManage || pending} onChange={(e) => run(() => setOrgConsentAction(props.journeyId, e.target.checked))} />
              <span aria-hidden="true" className="relative h-7 w-12 shrink-0 rounded-full bg-white/15 transition peer-checked:bg-mint peer-focus-visible:ring-2 peer-focus-visible:ring-ember after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
            </label>
          </section>
        )}
      </div>

      <div className="min-w-0 space-y-6">
        <section className="glass rounded-3xl p-5 md:p-6">
          <p className="label-mono text-haze">People</p>
          <ul className="mt-3 space-y-2">
            {props.members.map((m, k) => (
              <li key={m.id} className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-night" style={{ background: COLORS[k % COLORS.length] }}>
                  {m.name.slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {m.name} {m.me && <span className="text-xs font-normal text-haze">(you)</span>}
                  </span>
                  <span className="block text-xs text-haze">
                    {ROLE_LABEL[m.role] ?? m.role}
                    {m.owner ? " · owner" : ""}
                  </span>
                </span>
                {props.canManage && !m.owner && !m.me && (
                  <button type="button" onClick={() => confirm(`Remove ${m.name} from the circle?`) && run(() => removeMemberAction(props.journeyId, m.id))} className="shrink-0 text-xs text-haze hover:text-coral">
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
          {props.inCircle && !props.isOwner && (
            <button type="button" onClick={() => confirm("Leave this care circle?") && run(() => leaveCircle(props.journeyId), () => router.push("/app"))} className="mt-4 text-xs text-haze underline underline-offset-4 hover:text-coral">
              Leave this circle
            </button>
          )}
        </section>

        <section data-tour="circle-invite" className="rounded-3xl border border-ember/25 bg-gradient-to-br from-ember/10 to-transparent p-5 md:p-6">
          <p className="label-mono text-ember">Invite by link</p>
          <h2 className="mt-1 text-lg font-bold">Bring someone into {props.personName}&apos;s circle</h2>
          {props.canManage ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Role for the invite">
                {(["caregiver", "family", "carer", "clinician"] as const).map((r) => (
                  <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => { setRole(r); setLink(null); }} className={`rounded-2xl border px-3 py-2.5 text-left text-sm transition ${role === r ? "border-ember bg-ember/15" : "border-white/10 hover:border-white/25"}`}>
                    <span className="block font-semibold">{ROLE_LABEL[r]}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-haze">{ROLE_HELP[role]}</p>
              {link ? (
                <div className="mt-4 flex gap-2">
                  <input readOnly value={link} className={`${inputClass} font-mono text-xs`} aria-label="Invite link" data-testid="invite-link" onFocus={(e) => e.currentTarget.select()} />
                  <Button type="button" onClick={() => copy(link)} className="h-12 shrink-0 px-4">
                    <Icon name={copied ? "check" : "copy"} className="h-4 w-4" /> {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              ) : (
                <Button type="button" className="mt-4" disabled={pending} onClick={() => run(async () => { const r = await createInviteAction(props.journeyId, role); if (r.ok) setLink(r.url); return r; })} data-testid="create-invite">
                  <Icon name="link" className="h-4 w-4" /> Create invite link
                </Button>
              )}
              <p className="mt-3 text-xs text-haze/80">Links work for 7 days. Anyone with the link can join after signing up, so send it privately.</p>
              {props.invites.length > 0 && (
                <ul className="mt-4 space-y-1.5 border-t border-white/8 pt-3">
                  {props.invites.map((i) => (
                    <li key={i.code} className="flex items-center gap-2 text-sm">
                      <span className="min-w-0 flex-1 truncate">
                        {ROLE_LABEL[i.role] ?? i.role} <span className="text-xs text-haze">· until {i.expires}</span>
                      </span>
                      <button type="button" onClick={() => copy(`${props.origin}/app/join/${i.code}`)} className="shrink-0 text-xs text-haze hover:text-white">Copy</button>
                      <button type="button" onClick={() => run(() => revokeInviteAction(props.journeyId, i.code))} className="shrink-0 text-xs text-haze hover:text-coral">Revoke</button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-haze">Only {props.personName} or the main caregiver can invite people.</p>
          )}
        </section>
      </div>
    </div>
  );
}
