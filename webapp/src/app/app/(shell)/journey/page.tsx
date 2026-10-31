import { requireJourney, journeyOverview } from "@/lib/server/journey-service";
import { specialtyOf } from "@/lib/care/specialties";
import { addDays, prettyDate, prettyTime, rangeDays } from "@/lib/care/dates";
import { adherence, earnedBadges } from "@/lib/care/schedule";
import { METRICS } from "@/lib/care/types";
import { Road, type RoadMark } from "@/components/journey/Road";
import { MilestoneList } from "@/components/journey/MilestoneList";
import { TrendChart } from "@/components/journey/TrendChart";
import { Disclaimer, KIND_META, ProgressRing } from "@/components/care/bits";
import { Icon } from "@/components/ui/Icon";
import { PageTitle } from "@/components/ui/primitives";

export const metadata = { title: "Journey" };
const COLORS = { mood: "#ffc15e", pain: "#ff6b5a", sleep: "#b48cff", appetite: "#7cf5d3", energy: "#8fd3ff" } as const;

export default async function JourneyPage() {
  const { journey, access } = await requireJourney("/app/journey");
  const o = await journeyOverview(journey);
  const s = specialtyOf(journey.specialty);
  const marks: RoadMark[] = [
    ...o.appointments.map((a) => ({ id: a.id, day: a.day ?? 0, kind: "appointment" as const, title: a.title, reached: (a.day ?? 0) < o.day })),
    ...o.milestones.filter((m) => m.day !== null).map((m) => ({ id: m.id, day: m.day ?? 0, kind: "milestone" as const, title: m.title, reached: Boolean(m.reached_at) })),
  ].filter((m) => m.day >= 0 && m.day <= journey.horizon_days).sort((a, b) => a.day - b.day);

  const span = Math.min(30, Math.max(7, o.day + 1));
  const dates = rangeDays(o.today, span);
  const byDate = new Map(o.checkins.map((c) => [c.for_date, c]));
  const since = dates.filter((d) => d >= journey.discharge_date);
  const perKind = (["medication", "care", "exercise"] as const).map((k) => ({ k, a: adherence(o.plan.items, journey.discharge_date, since, o.logs, [k]) })).filter((x) => x.a.scheduled > 0);
  const badges = earnedBadges(o.checkins.length, o.streak.best);
  const upcoming = o.appointments.filter((a) => (a.day ?? 0) >= o.day).slice(0, 4);

  return (
    <div className="space-y-6">
      <PageTitle eyebrow={`${s.label} · Discharged ${prettyDate(journey.discharge_date, { month: "short", day: "numeric", year: "numeric" })}`} title={o.day < 0 ? "The road home starts" : `Day ${o.day}.`} accent={o.day < 0 ? `in ${-o.day} days` : `${Math.max(0, journey.horizon_days - o.day)} to go.`} />

      <section data-tour="journey-road" className="relative overflow-hidden rounded-[32px] border border-white/8 bg-gradient-to-b from-dusk-800/70 to-night p-4 md:p-6">
        <div className="mask-fade-x -mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
          <div className="min-w-[640px] md:min-w-0">
            <Road day={o.day} horizon={journey.horizon_days} marks={marks} />
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-haze">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-coral" /> {access.via === "circle" && access.role === "patient" ? "You" : journey.person_name}, today</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border-2 border-ember" /> Appointment</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border-2 border-lilac" /> Milestone</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border-2 border-mint" /> Reached</span>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="glass min-w-0 rounded-3xl p-5 md:p-6">
          <p className="label-mono text-haze">Milestones</p>
          <h2 className="mt-1 mb-4 text-xl font-bold">Moments along the way</h2>
          <MilestoneList
            journeyId={journey.id}
            canEdit={access.canCheckIn}
            items={o.milestones.map((m) => ({ id: m.id, title: m.title, reached: Boolean(m.reached_at), when: m.reached_at ? `Reached ${prettyDate(new Date(m.reached_at).toISOString().slice(0, 10))}` : m.day !== null ? `Around day ${m.day}, ${prettyDate(addDays(journey.discharge_date, m.day))}` : null }))}
          />
        </section>
        <div className="min-w-0 space-y-6">
          <section className="glass rounded-3xl p-5 md:p-6">
            <p className="label-mono text-haze">Coming up</p>
            <ul className="mt-3 space-y-3">
              {upcoming.map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-ember/15 text-ember"><Icon name="calendar" className="h-5 w-5" /></span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{a.title}</span>
                    <span className="block text-sm text-haze">
                      {prettyDate(addDays(journey.discharge_date, a.day ?? 0), { weekday: "long", month: "short", day: "numeric" })}
                      {a.at_time ? `, ${prettyTime(a.at_time)}` : ""}
                      {a.location ? ` · ${a.location}` : ""}
                    </span>
                  </span>
                </li>
              ))}
              {!upcoming.length && <li className="text-sm text-haze">No upcoming appointments in the plan.</li>}
            </ul>
          </section>
          <section className="glass rounded-3xl p-5 md:p-6">
            <p className="label-mono text-haze">Showing up</p>
            <div className="mt-3 flex flex-wrap items-center gap-6">
              {perKind.map(({ k, a }) => (
                <div key={k} className="flex items-center gap-3">
                  <div className="relative">
                    <ProgressRing value={a.rate ?? 0} size={64} stroke={7} label={`${KIND_META[k].plural} ${Math.round((a.rate ?? 0) * 100)} percent done`} />
                    <span className="absolute inset-0 grid place-items-center text-sm font-bold tabular-nums">{Math.round((a.rate ?? 0) * 100)}%</span>
                  </div>
                  <span className="text-sm">
                    <span className="block font-semibold">{KIND_META[k].plural}</span>
                    <span className="text-xs text-haze">{a.done} of {a.scheduled}, last {since.length} days</span>
                  </span>
                </div>
              ))}
              {!perKind.length && <p className="text-sm text-haze">Nothing recurring in the plan yet.</p>}
            </div>
            <ul className="mt-5 flex flex-wrap gap-2">
              {badges.map((b) => (
                <li key={b.id} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${b.earned ? "border-ember/50 bg-ember/10 text-ember" : "border-white/10 text-haze/60"}`}>
                  <Icon name={b.earned ? "star" : "lock"} className="h-3.5 w-3.5" /> {b.label}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-haze/80">Badges come from showing up to check in, never from how anyone is feeling. Best streak: {o.streak.best} days.</p>
          </section>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="label-mono text-haze">Check-in answers</p>
            <h2 className="text-xl font-bold">The last {dates.length} days</h2>
          </div>
          <p className="hidden text-xs text-haze md:block">Gaps are days without a check-in.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {METRICS.map((m) => (
            <TrendChart key={m} metric={m} dates={dates} color={COLORS[m]} values={dates.map((d) => byDate.get(d)?.[m] ?? null)} />
          ))}
        </div>
      </section>

      {o.flags.length > 0 && (
        <section className="glass rounded-3xl p-5 md:p-6">
          <p className="label-mono text-haze">Times the plan said to call</p>
          <ul className="mt-3 divide-y divide-white/5">
            {o.flags.slice(0, 8).map((f) => (
              <li key={f.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4">
                <span className="w-28 shrink-0 text-xs text-haze">{f.for_date ? prettyDate(f.for_date) : ""}</span>
                <span className="min-w-0 flex-1 text-sm">{f.reason}</span>
                <span className={`shrink-0 text-xs ${f.ack_at ? "text-mint" : "text-ember"}`}>{f.ack_at ? `Reviewed${f.ack_name ? ` by ${f.ack_name}` : ""}` : "Not reviewed yet"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Disclaimer />
    </div>
  );
}
