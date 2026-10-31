import Link from "next/link";
import { clinicJourneys, orgOpenFlags, orgOpenQuestions, orgWindow, prettyCode } from "@/lib/server/repo";
import { requireClinician } from "@/lib/server/clinic";
import { specialtyOf } from "@/lib/care/specialties";
import { addDays, dayNumber, prettyDate, rangeDays, todayIn } from "@/lib/care/dates";
import { adherence } from "@/lib/care/schedule";
import { Glyph } from "@/components/art/Glyph";
import { Sparkline } from "@/components/care/bits";
import { Icon } from "@/components/ui/Icon";
import { LinkButton, PageTitle, Stat } from "@/components/ui/primitives";
import { AckFlag } from "@/components/team/TeamTools";

export const metadata = { title: "Patients" };

type Status = "draft" | "waiting" | "active";
const STATUS: Record<Status, { label: string; cls: string }> = {
  draft: { label: "Draft, not sent", cls: "border-white/15 text-haze" },
  waiting: { label: "Sent, waiting to join", cls: "border-ember/40 text-ember" },
  active: { label: "Following the plan", cls: "border-mint/40 text-mint" },
};

function ago(d: Date | null) {
  if (!d) return "No activity yet";
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

export default async function ClinicHome() {
  const { user, org } = await requireClinician("/clinic");
  const tz = user.timezone || "UTC";
  const today = todayIn(tz);
  const [list, flags, questions] = await Promise.all([clinicJourneys(org.id), orgOpenFlags(org.id), orgOpenQuestions(org.id)]);
  const win = await orgWindow(list.map((j) => j.id), addDays(today, -13), today);
  const days14 = rangeDays(today, 14);
  const rows = list.map((j) => {
    const jt = todayIn(j.timezone);
    const by = new Map(win.checkins.filter((c) => c.journey_id === j.id).map((c) => [c.for_date, c]));
    const week = rangeDays(jt, 7).filter((d) => d >= j.discharge_date);
    const a = adherence(win.items.filter((i) => i.journey_id === j.id), j.discharge_date, week, win.logs.filter((l) => l.journey_id === j.id));
    const status: Status = !j.plan_sent_at ? "draft" : j.family_joined ? "active" : "waiting";
    return { j, status, day: dayNumber(j.discharge_date, jt), mood: days14.map((d) => by.get(d)?.mood ?? null), pain: days14.map((d) => by.get(d)?.pain ?? null), checkedToday: by.has(jt), adh: a.rate };
  });
  const rank = (r: (typeof rows)[number]) => r.j.emergency_flags * 100 + r.j.open_flags * 10 + r.j.open_questions * 5 + (r.status === "draft" ? 1 : 0);
  rows.sort((a, b) => rank(b) - rank(a) || Number(a.checkedToday) - Number(b.checkedToday));
  const active = rows.filter((r) => r.status === "active");
  const todayRate = active.length ? active.filter((r) => r.checkedToday).length / active.length : null;
  const adhRows = active.filter((r) => r.adh !== null);
  const avgAdh = adhRows.length ? adhRows.reduce((s, r) => s + (r.adh ?? 0), 0) / adhRows.length : null;

  return (
    <div className="space-y-6">
      <div data-tour="clinic-head">
        <PageTitle eyebrow={org.name} title="Your patients," accent="at home.">
          <LinkButton href="/clinic/new" className="h-11 px-5" data-testid="new-plan-link">
            <Icon name="plus" className="h-4 w-4" /> New care plan
          </LinkButton>
        </PageTitle>
      </div>

      <section className="grid grid-cols-2 gap-4 rounded-3xl border border-white/8 bg-gradient-to-br from-dusk-800/70 to-night p-5 md:grid-cols-4 md:p-6" aria-label="Summary" data-tour="clinic-kpis">
        <Stat label="Following a plan" value={active.length} sub={`${rows.length - active.length} draft or waiting`} />
        <Stat label="Flags to review" value={<span className={flags.length ? "text-coral" : ""}>{flags.length}</span>} sub="From rules your team set" />
        <Stat label="Open questions" value={<span className={questions.length ? "text-ember" : ""}>{questions.length}</span>} sub={questions.length ? "Waiting for a reply" : "All answered"} />
        <Stat label="Checked in today" value={todayRate === null ? "None" : `${Math.round(todayRate * 100)}%`} sub={avgAdh === null ? "In each patient's time zone" : `Plan done, 7 days: ${Math.round(avgAdh * 100)}%`} />
      </section>

      {flags.length > 0 && (
        <section className="rounded-3xl border border-coral/30 bg-coral/[0.06] p-5 md:p-6" data-testid="flag-queue" data-tour="clinic-flags">
          <p className="label-mono text-coral">Flags to review</p>
          <p className="mt-1 text-sm text-haze">Each matched a warning sign or threshold your team wrote. The patient was shown your call buttons.</p>
          <ul className="mt-4 divide-y divide-white/5">
            {flags.map((f) => (
              <li key={f.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
                <span className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${f.action === "emergency" ? "bg-coral text-night" : "bg-ember/20 text-ember"}`}>{f.action === "emergency" ? "Emergency" : "Call back"}</span>
                <Link href={`/clinic/p/${f.journey_id}`} className="min-w-0 flex-1 text-sm hover:underline">
                  <span className="font-semibold">{f.person_name}</span> <span className="text-haze">· {f.for_date ? prettyDate(f.for_date) : ""}</span>
                  <span className="block break-words text-[#f8e3de]">{f.reason}</span>
                </Link>
                <AckFlag journeyId={f.journey_id} flagId={f.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {questions.length > 0 && (
        <section className="glass rounded-3xl p-5 md:p-6" data-testid="question-queue">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="label-mono text-ember">Questions waiting</p>
            <Link href="/clinic/inbox" className="text-sm text-haze hover:text-white">Open inbox</Link>
          </div>
          <ul className="mt-3 divide-y divide-white/5">
            {questions.slice(0, 4).map((m) => (
              <li key={m.id} className="py-3">
                <Link href={`/clinic/p/${m.journey_id}/messages`} className="block text-sm hover:underline">
                  <span className="font-semibold">{m.person_name}</span> <span className="text-haze">· {m.name ?? "Patient"} · {ago(m.created_at)}</span>
                  <span className="block break-words text-[#efeaff]">{m.body}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Patients" data-tour="clinic-list">
        <div className="hidden min-w-0 overflow-x-auto rounded-3xl md:block glass md:p-3">
          <table className="w-full min-w-[860px] text-left text-sm" data-testid="patient-table">
            <thead className="text-xs text-haze">
              <tr>
                <th className="px-3 py-3 font-medium">Patient</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Day</th>
                <th className="px-3 py-3 font-medium">Mood, 14 days</th>
                <th className="px-3 py-3 font-medium">Pain, 14 days</th>
                <th className="px-3 py-3 font-medium">Plan done, 7 d</th>
                <th className="px-3 py-3 font-medium">Needs you</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r) => {
                const s = specialtyOf(r.j.specialty);
                const href = r.status === "draft" ? `/clinic/p/${r.j.id}/plan` : `/clinic/p/${r.j.id}`;
                return (
                  <tr key={r.j.id} className="transition hover:bg-white/[0.03]" data-testid="patient-row">
                    <td className="px-3 py-3">
                      <Link href={href} className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5"><Glyph name={s.glyph} className="h-5 w-5" color={s.hue} /></span>
                        <span className="min-w-0">
                          <span className="block font-semibold">{r.j.person_name}</span>
                          <span className="block text-xs text-haze">{s.short} · {ago(r.j.last_activity)}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
                      {r.status === "waiting" && r.j.invite_code && <span className="mt-1 block font-mono text-[11px] text-haze">{prettyCode(r.j.invite_code)}</span>}
                    </td>
                    <td className="px-3 py-3 tabular-nums">{r.status === "draft" ? <span className="text-haze">Not started</span> : r.day}</td>
                    <td className="px-3 py-3"><Sparkline values={r.mood} min={1} max={5} color="#ffc15e" /></td>
                    <td className="px-3 py-3"><Sparkline values={r.pain} min={0} max={10} color="#ff6b5a" /></td>
                    <td className="px-3 py-3 tabular-nums">{r.adh === null ? <span className="text-haze">None yet</span> : `${Math.round(r.adh * 100)}%`}</td>
                    <td className="px-3 py-3"><Needs r={r} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ul className="space-y-3 md:hidden" data-testid="patient-cards">
          {rows.map((r) => {
            const s = specialtyOf(r.j.specialty);
            const href = r.status === "draft" ? `/clinic/p/${r.j.id}/plan` : `/clinic/p/${r.j.id}`;
            return (
              <li key={r.j.id}>
                <Link href={href} className="glass block min-w-0 rounded-3xl p-4" data-testid="patient-row">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5"><Glyph name={s.glyph} className="h-5 w-5" color={s.hue} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{r.j.person_name}</span>
                      <span className="block truncate text-xs text-haze">{s.short}{r.status !== "draft" ? ` · day ${r.day}` : ""} · {ago(r.j.last_activity)}</span>
                    </span>
                    <Icon name="arrowR" className="h-4 w-4 shrink-0 text-haze" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
                    <Needs r={r} />
                  </div>
                  {r.status === "active" && (
                    <div className="mt-3 flex items-center gap-4 text-xs text-haze">
                      <span className="flex items-center gap-1.5">Mood <Sparkline values={r.mood} min={1} max={5} color="#ffc15e" className="h-6 w-16" /></span>
                      <span className="flex items-center gap-1.5">Pain <Sparkline values={r.pain} min={0} max={10} color="#ff6b5a" className="h-6 w-16" /></span>
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        {!rows.length && (
          <div className="glass rounded-3xl p-8 text-center">
            <p className="text-lg font-semibold">No patients yet</p>
            <p className="mt-1 text-sm text-haze">Create a care plan from a specialty template, then send it with a code.</p>
            <LinkButton href="/clinic/new" className="mt-4 h-11 px-5"><Icon name="plus" className="h-4 w-4" /> New care plan</LinkButton>
          </div>
        )}
      </section>

      <p className="flex items-start gap-2 text-xs text-haze/80">
        <Icon name="shield" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint" />
        Flags are simple rules your team writes: a ticked warning sign, or a check-in answer past a threshold. loci does not score risk, predict or diagnose. Keep your usual escalation process. Patients can stop sharing at any time.
      </p>
    </div>
  );
}

function Needs({ r }: { r: { j: { emergency_flags: number; open_flags: number; open_questions: number }; checkedToday: boolean; status: Status } }) {
  const out: React.ReactNode[] = [];
  if (r.j.emergency_flags) out.push(<span key="e" className="rounded-full bg-coral px-2.5 py-1 text-[11px] font-semibold text-night">Emergency flag</span>);
  else if (r.j.open_flags) out.push(<span key="f" className="rounded-full bg-ember/20 px-2.5 py-1 text-[11px] font-semibold text-ember">{r.j.open_flags} flag{r.j.open_flags > 1 ? "s" : ""}</span>);
  if (r.j.open_questions) out.push(<span key="q" className="rounded-full bg-lilac/20 px-2.5 py-1 text-[11px] font-semibold text-[#e3dcff]">{r.j.open_questions} question{r.j.open_questions > 1 ? "s" : ""}</span>);
  if (!out.length) {
    if (r.status === "draft") return <span className="text-xs text-haze">Finish and send</span>;
    if (r.status === "waiting") return <span className="text-xs text-haze">Waiting for the code</span>;
    return r.checkedToday ? <span className="inline-flex items-center gap-1 text-xs text-mint"><Icon name="check" className="h-3.5 w-3.5" /> Checked in</span> : <span className="text-xs text-haze">No check-in yet today</span>;
  }
  return <span className="flex flex-wrap gap-1.5">{out}</span>;
}
