import Link from "next/link";
import { clinicPatient } from "@/lib/server/clinic";
import { familyJoined, messagesOf, openPlanCode, prettyCode } from "@/lib/server/repo";
import { journeyOverview } from "@/lib/server/journey-service";
import { prettyDate, prettyTime, rangeDays, toIso } from "@/lib/care/dates";
import { adherence, RECURRING } from "@/lib/care/schedule";
import { METRICS } from "@/lib/care/types";
import { describeThreshold } from "@/lib/care/rules";
import { TrendChart } from "@/components/journey/TrendChart";
import { KIND_META } from "@/components/care/bits";
import { Icon } from "@/components/ui/Icon";
import { LinkButton, Stat } from "@/components/ui/primitives";
import { AckFlag } from "@/components/team/TeamTools";
import { PatientHeader } from "@/components/clinic/PatientHeader";

export const metadata = { title: "Patient tracking" };
const COLORS = { mood: "#ffc15e", pain: "#ff6b5a", sleep: "#b48cff", appetite: "#7cf5d3", energy: "#8fd3ff" } as const;
const ROLE: Record<string, string> = { patient: "Patient", caregiver: "Main caregiver", family: "Family", carer: "Paid carer", clinician: "Clinician" };

function ago(d: Date) {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : prettyDate(toIso(new Date(d)));
}

export default async function ClinicPatientPage(props: PageProps<"/clinic/p/[id]">) {
  const { id } = await props.params;
  const { journey } = await clinicPatient(id, `/clinic/p/${id}`);
  const [o, msgs, joined, c] = await Promise.all([journeyOverview(journey), messagesOf(journey.id, 30), familyJoined(journey.id), openPlanCode(journey.id)]);
  const dates = rangeDays(o.today, 14);
  const by = new Map(o.checkins.map((x) => [x.for_date, x]));
  const notes = o.checkins.filter((x) => x.note).slice(-6).reverse();
  const week = rangeDays(o.today, 7).filter((d) => d >= journey.discharge_date);
  const perItem = o.plan.items
    .filter((i) => RECURRING.includes(i.kind))
    .map((i) => ({ item: i, a: adherence([i], journey.discharge_date, week, o.logs) }))
    .filter((x) => x.a.scheduled > 0);
  const openQ = msgs.filter((m) => m.kind === "question" && !m.resolved_at);
  const lastQ = msgs.filter((m) => m.side === "patient").slice(-3).reverse();
  const done = o.doses.filter((d) => d.done).length;

  if (!journey.plan_sent_at || !joined)
    return (
      <div>
        <PatientHeader journey={journey} tab="overview" day={o.day} questions={openQ.length} />
        <section className="glass rounded-3xl p-6 text-center md:p-10" data-testid="not-joined">
          <Icon name="send" className="mx-auto h-8 w-8 text-ember" />
          <h2 className="mt-3 text-xl font-bold">{journey.plan_sent_at ? `Waiting for ${journey.person_name} to join` : "This plan has not been sent yet"}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-haze">
            {journey.plan_sent_at
              ? "Tracking starts when they enter the code in the loci app. Tick-offs, check-ins and questions then show here as they happen."
              : "Finish the plan, preview what the patient will see, then send it with a code."}
          </p>
          {journey.plan_sent_at && c && <p className="mt-4 font-mono text-2xl font-bold tracking-[0.2em]" data-testid="waiting-code">{prettyCode(c)}</p>}
          <LinkButton href={`/clinic/p/${journey.id}/plan`} className="mt-5 h-11 px-5">
            <Icon name="list" className="h-4 w-4" /> {journey.plan_sent_at ? "Open the plan" : "Finish and send"}
          </LinkButton>
        </section>
      </div>
    );

  return (
    <div className="space-y-6">
      <PatientHeader journey={journey} tab="overview" day={o.day} questions={openQ.length} />

      <section className="grid grid-cols-2 gap-4 rounded-3xl border border-white/8 bg-gradient-to-br from-dusk-800/70 to-night p-5 md:grid-cols-4 md:p-6" aria-label="Summary" data-tour="clinic-track">
        <Stat label="Today" value={`${done} of ${o.doses.length}`} sub="Plan items ticked off" />
        <Stat label="Plan done, 7 days" value={o.adh7.rate === null ? "None" : `${Math.round(o.adh7.rate * 100)}%`} sub={`${o.adh7.done} of ${o.adh7.scheduled} scheduled`} />
        <Stat label="Check-ins" value={o.todayCheckin ? <span className="text-mint">Done today</span> : "Not yet today"} sub={`Streak ${o.streak.current} day${o.streak.current === 1 ? "" : "s"}`} />
        <Stat label="Flags to review" value={<span className={o.openFlags.length ? "text-coral" : ""}>{o.openFlags.length}</span>} sub={openQ.length ? `${openQ.length} open question${openQ.length > 1 ? "s" : ""}` : "No open questions"} />
      </section>

      {o.openFlags.length > 0 && (
        <section className="rounded-3xl border border-coral/30 bg-coral/[0.06] p-5 md:p-6" data-testid="patient-flags">
          <p className="label-mono text-coral">Flagged check-ins</p>
          <p className="mt-1 text-sm text-haze">Matched rules on this plan. {journey.person_name} was shown your call buttons.</p>
          <ul className="mt-3 divide-y divide-white/5">
            {o.openFlags.map((f) => (
              <li key={f.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
                <span className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${f.action === "emergency" ? "bg-coral text-night" : "bg-ember/20 text-ember"}`}>{f.action === "emergency" ? "Emergency" : "Call back"}</span>
                <span className="min-w-0 flex-1 text-sm break-words">
                  <span className="text-haze">{f.for_date ? prettyDate(f.for_date) : ""} · </span>
                  {f.reason}
                </span>
                <AckFlag journeyId={journey.id} flagId={f.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" data-testid="trends">
        {METRICS.map((m) => (
          <TrendChart key={m} metric={m} dates={dates} color={COLORS[m]} values={dates.map((d) => by.get(d)?.[m] ?? null)} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass min-w-0 rounded-3xl p-5 md:p-6" data-testid="today-items">
          <p className="label-mono text-haze">Today, in {journey.person_name}&apos;s time</p>
          <ul className="mt-3 space-y-2">
            {o.doses.map((d) => (
              <li key={`${d.item.id}-${d.slot}`} className="flex items-center gap-3 text-sm">
                <Icon name={d.done ? "check" : KIND_META[d.item.kind].icon} className={`h-4 w-4 shrink-0 ${d.done ? "text-mint" : "text-haze"}`} />
                <span className={`min-w-0 flex-1 truncate ${d.done ? "" : "text-haze"}`}>{d.item.title}</span>
                <span className="shrink-0 text-xs text-haze">{d.slot === "any" ? "any time" : prettyTime(d.slot)}</span>
              </li>
            ))}
            {!o.doses.length && <li className="text-sm text-haze">Nothing scheduled today.</li>}
          </ul>
          {perItem.length > 0 && (
            <>
              <p className="label-mono mt-6 text-haze">Adherence, last 7 days</p>
              <ul className="mt-3 space-y-3">
                {perItem.map(({ item, a }) => (
                  <li key={item.id} className="text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate">{item.title}</span>
                      <span className="shrink-0 text-xs text-haze tabular-nums">{a.done}/{a.scheduled}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-gradient-to-r from-mint to-lilac" style={{ width: `${Math.round((a.rate ?? 0) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <div className="min-w-0 space-y-6">
          <section className="glass rounded-3xl p-5 md:p-6" data-testid="patient-notes">
            <div className="flex items-center justify-between gap-2">
              <p className="label-mono text-haze">Notes and questions</p>
              <Link href={`/clinic/p/${journey.id}/messages`} className="text-sm text-ember hover:underline">Open thread</Link>
            </div>
            <ul className="mt-3 space-y-3 text-sm">
              {lastQ.map((m) => (
                <li key={m.id} className="break-words">
                  <span className="text-xs text-haze">{ago(m.created_at)} · {m.kind === "question" ? (m.resolved_at ? "question, answered" : "question, waiting") : "message"} · </span>
                  {m.body}
                </li>
              ))}
              {notes.map((x) => (
                <li key={x.id} className="break-words">
                  <span className="text-xs text-haze">{prettyDate(x.for_date)} · check-in note · </span>
                  {x.note}
                </li>
              ))}
              {!lastQ.length && !notes.length && <li className="text-haze">No notes or questions yet.</li>}
            </ul>
          </section>

          <section className="glass rounded-3xl p-5 md:p-6" data-testid="circle-status">
            <p className="label-mono text-haze">Care circle</p>
            <ul className="mt-3 space-y-2 text-sm">
              {o.members.map((m) => (
                <li key={m.user_id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate font-medium">{m.display_name}</span>
                  <span className="shrink-0 text-xs text-haze">{ROLE[m.role] ?? m.role}{m.is_owner ? ", leads" : ""}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-haze">
              {o.tasks.filter((t) => t.done_at).length} of {o.tasks.length} circle errands done{o.tasks.some((t) => !t.done_at && !t.assignee) ? `, ${o.tasks.filter((t) => !t.done_at && !t.assignee).length} unclaimed` : ""}.
            </p>
          </section>

          <section className="glass rounded-3xl p-5 md:p-6">
            <p className="label-mono text-haze">Rules on this plan</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {o.plan.signs.map((w) => (
                <li key={w.id} className="flex gap-2"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${w.action === "emergency" ? "bg-coral" : "bg-ember"}`} /><span className="min-w-0 break-words">{w.text}</span></li>
              ))}
              {o.plan.thresholds.map((t) => (
                <li key={t.id} className="flex gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-lilac" /><span className="min-w-0 break-words">{describeThreshold(t)}</span></li>
              ))}
              {!o.plan.signs.length && !o.plan.thresholds.length && <li className="text-haze">No warning signs or rules yet.</li>}
            </ul>
            <Link href={`/clinic/p/${journey.id}/plan`} className="mt-4 inline-flex items-center gap-1.5 text-sm text-ember hover:underline"><Icon name="edit" className="h-4 w-4" /> Change the plan or rules</Link>
          </section>
        </div>
      </div>

      <section className="glass rounded-3xl p-5 md:p-6" data-testid="activity">
        <p className="label-mono text-haze">Live activity</p>
        <ul className="mt-3 space-y-2 text-sm">
          {o.activity.map((a) => (
            <li key={a.id} className="flex gap-3">
              <span className="w-20 shrink-0 text-xs text-haze">{ago(a.created_at)}</span>
              <span className="min-w-0 break-words">{a.name ? <span className="font-medium">{a.name}: </span> : null}{a.text}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
