import Link from "next/link";
import { requireJourney, journeyOverview } from "@/lib/server/journey-service";
import { specialtyOf } from "@/lib/care/specialties";
import { addDays, nowMinutesIn, prettyDate, prettyTime } from "@/lib/care/dates";
import { Glyph } from "@/components/art/Glyph";
import { Icon } from "@/components/ui/Icon";
import { CallButtons, Disclaimer, ProgressRing } from "@/components/care/bits";
import { DoseList, type DoseView } from "@/components/today/DoseList";
import { METRIC_META, METRICS } from "@/lib/care/types";
import { PlanUpdated } from "@/components/plan/PlanUpdated";
import { prefsOf } from "@/lib/server/reminders/service";
import { checkinDue } from "@/lib/care/reminders";

export const metadata = { title: "Today" };

function greeting(min: number) {
  if (min < 12 * 60) return "Good morning";
  if (min < 18 * 60) return "Good afternoon";
  return "Good evening";
}

export default async function Today(props: PageProps<"/app">) {
  const sp = await props.searchParams;
  const { user, journey, access } = await requireJourney("/app");
  const teamPlan = Boolean(journey.org_id && journey.plan_source === "clinician");
  const o = await journeyOverview(journey);
  const s = specialtyOf(journey.specialty);
  const now = nowMinutesIn(journey.timezone);
  const toMin = (t: string) => (t === "any" ? 9999 : Number(t.slice(0, 2)) * 60 + Number(t.slice(3)));
  const doses: DoseView[] = o.doses.map((d) => ({
    itemId: d.item.id,
    slot: d.slot,
    time: d.slot === "any" ? "Any time" : prettyTime(d.slot),
    title: d.item.title,
    detail: d.item.detail,
    kind: d.item.kind,
    done: d.done,
    due: !d.done && toMin(d.slot) <= now,
  }));
  const isSelf = access.via === "circle" && access.role === "patient";
  const who = isSelf ? "you" : journey.person_name;
  const progress = Math.max(0, Math.min(1, o.day / journey.horizon_days));
  const reached = o.milestones.filter((m) => m.reached_at).length;
  const todayFlags = o.openFlags.filter((f) => f.for_date === o.today);
  const apptDate = o.nextAppointment?.day != null ? addDays(journey.discharge_date, o.nextAppointment.day) : null;
  const rp = await prefsOf(user.id, journey.id);
  const remindCheckin = rp.in_app && access.canCheckIn && checkinDue({ checkinTime: rp.checkin_time, nowMinutes: now, checkedInToday: Boolean(o.todayCheckin) });
  const nextStep = rp.steps ? doses.find((d) => !d.done && d.slot !== "any" && toMin(d.slot) >= now - 30) : undefined;

  return (
    <div className="space-y-6">
      {sp.joined === "1" && teamPlan && (
        <section className="rounded-3xl border border-mint/30 bg-mint/[0.07] p-5 md:p-6" data-testid="joined-welcome">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Icon name="spark" className="h-5 w-5 text-mint" /> Your plan from {journey.care_team_name || "your care team"} is here</h2>
          <p className="mt-1 text-sm text-[#e9e4ff]/90">Today shows what is due. Open Plan for each step in your team&apos;s words, check in once a day, and use Ask for questions.</p>
          <Link href="/app/plan" className="mt-3 inline-flex items-center gap-1.5 text-sm text-mint hover:underline">Read my plan <Icon name="arrowR" className="h-4 w-4" /></Link>
        </section>
      )}
      {teamPlan && <PlanUpdated journeyId={journey.id} userId={user.id} team={journey.care_team_name} />}
      {remindCheckin && (
        <Link href="/app/checkin" className="flex items-center gap-3 rounded-3xl border border-ember/30 bg-ember/[0.08] p-4 text-sm transition hover:border-ember/60" data-testid="reminder-checkin">
          <Icon name="bell" className="h-5 w-5 shrink-0 text-ember" />
          <span className="min-w-0 flex-1">Reminder: it is past {prettyTime(rp.checkin_time!)}. Time for {isSelf ? "your" : `${journey.person_name}'s`} daily check-in.</span>
          <Icon name="arrowR" className="h-4 w-4 shrink-0" />
        </Link>
      )}
      {nextStep && (
        <p className="flex items-center gap-2 rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm" data-testid="reminder-step">
          <Icon name="clock" className="h-4 w-4 shrink-0 text-lilac" /> Next step at {nextStep.time}: <span className="font-semibold">{nextStep.title}</span>
        </p>
      )}
      <section data-tour="today-head" className="relative overflow-hidden rounded-[32px] border border-white/8 bg-gradient-to-br from-dusk-800/80 via-dusk-900 to-night p-5 md:p-8">
        <span className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full opacity-25 blur-3xl" style={{ background: s.hue }} aria-hidden="true" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="label-mono flex items-center gap-2 text-ember">
              <Glyph name={s.glyph} className="h-4 w-4" color={s.hue} /> {s.short} · {o.day < 0 ? `home in ${-o.day} days` : `Day ${o.day} of ${journey.horizon_days}`}
            </p>
            <h1 className="mt-2 text-[32px] leading-[1.05] font-bold tracking-tight text-balance md:text-5xl">
              {greeting(now)}, {user.display_name.split(" ")[0]}.
            </h1>
            <p className="mt-2 max-w-xl text-haze text-pretty">
              {isSelf ? "Here is your day, straight from your plan." : `Here is ${journey.person_name}'s day, straight from the plan.`} {reached} of {o.milestones.length} milestones reached on the way to <span className="font-serif-i text-ember">{s.thriving.toLowerCase()}</span>.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <div className="relative">
              <ProgressRing value={progress} size={96} label={`Day ${o.day} of ${journey.horizon_days}`} />
              <span className="absolute inset-0 grid place-items-center text-center">
                <span>
                  <span className="block text-2xl font-bold tabular-nums">{Math.max(0, o.day)}</span>
                  <span className="block text-[10px] text-haze">days home</span>
                </span>
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-ember/15 text-ember">
                  <Icon name="flame" className="h-4 w-4" />
                </span>
                <span>
                  <span className="font-bold tabular-nums">{o.streak.current}</span> day streak
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-mint/15 text-mint">
                  <Icon name="check" className="h-4 w-4" />
                </span>
                <span>
                  <span className="font-bold tabular-nums">{o.adh7.rate === null ? "No" : `${Math.round(o.adh7.rate * 100)}%`}</span> of the plan, 7 days
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/app/journey" className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 transition hover:bg-white/10">
            <Icon name="calendar" className="h-5 w-5 shrink-0 text-ember" />
            <span className="min-w-0">
              <span className="block text-xs text-haze">Next appointment</span>
              <span className="block truncate text-sm font-semibold">{o.nextAppointment ? `${o.nextAppointment.title}, ${apptDate ? prettyDate(apptDate) : ""}${o.nextAppointment.at_time ? ` at ${prettyTime(o.nextAppointment.at_time)}` : ""}` : "None in the plan yet"}</span>
            </span>
          </Link>
          <Link href="/app/journey" className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 transition hover:bg-white/10">
            <Icon name="flag" className="h-5 w-5 shrink-0 text-mint" />
            <span className="min-w-0">
              <span className="block text-xs text-haze">Next milestone</span>
              <span className="block truncate text-sm font-semibold">{o.nextMilestone ? o.nextMilestone.title : "Add milestones in the plan"}</span>
            </span>
          </Link>
        </div>
      </section>

      {todayFlags.length > 0 && (
        <section className="rounded-3xl border border-coral/40 bg-coral/10 p-5" role="alert">
          <p className="flex items-center gap-2 font-semibold text-coral">
            <Icon name="alert" className="h-5 w-5" /> Today&apos;s check-in matched something your care team asked to hear about
          </p>
          <ul className="mt-2 space-y-1 text-sm text-[#f8e3de]">
            {todayFlags.map((f) => (
              <li key={f.id}>{f.reason}</li>
            ))}
          </ul>
          <CallButtons phone={journey.care_team_phone} team={journey.care_team_name} emergency={journey.emergency_number} />
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <section data-tour="today-tasks" className="glass min-w-0 rounded-3xl p-5 md:p-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="label-mono text-haze">From the plan</p>
              <h2 className="text-xl font-bold">Today, {prettyDate(o.today, { weekday: "long", month: "short", day: "numeric" })}</h2>
            </div>
            {access.canEditPlan && (
              <Link href="/app/plan" className="text-sm text-haze underline-offset-4 hover:text-white hover:underline">
                Edit plan
              </Link>
            )}
          </div>
          <DoseList journeyId={journey.id} date={o.today} doses={doses} canTick={access.canCheckIn} />
        </section>

        <div className="min-w-0 space-y-6">
          <section className="glass rounded-3xl p-5 md:p-6">
            <p className="label-mono text-haze">Daily check-in</p>
            {o.todayCheckin ? (
              <>
                <h2 className="mt-1 text-xl font-bold" data-testid="today-checkin-done">Checked in today</h2>
                <ul className="mt-3 grid grid-cols-5 gap-2 text-center">
                  {METRICS.map((m) => (
                    <li key={m} className="rounded-2xl bg-white/5 px-1 py-2">
                      <span className="block text-lg font-bold tabular-nums">{o.todayCheckin![m]}</span>
                      <span className="block truncate text-[10px] text-haze">{METRIC_META[m].label}</span>
                    </li>
                  ))}
                </ul>
                {access.canCheckIn && (
                  <Link href="/app/checkin" className="mt-3 inline-block text-sm text-haze underline-offset-4 hover:text-white hover:underline">
                    Update today&apos;s answers
                  </Link>
                )}
              </>
            ) : (
              <>
                <h2 className="mt-1 text-xl font-bold">{access.canCheckIn ? `How is ${who === "you" ? "it going" : `${who} doing`} today?` : "No check-in yet today"}</h2>
                <p className="mt-1 text-sm text-haze">Two minutes. Keeps the streak{o.streak.current ? ` at ${o.streak.current + 1}` : " going"}.</p>
                {access.canCheckIn && (
                  <Link href="/app/checkin" className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-br from-ember to-coral px-5 text-[15px] font-semibold text-night shadow-[0_10px_30px_-10px_rgba(255,107,90,0.7)] transition hover:brightness-110">
                    Check in now <Icon name="arrowR" className="h-4 w-4" />
                  </Link>
                )}
              </>
            )}
          </section>

          <section data-tour="when-to-call" className="rounded-3xl border border-coral/25 bg-gradient-to-br from-coral/12 to-transparent p-5 md:p-6">
            <p className="label-mono text-coral">When to call</p>
            <h2 className="mt-1 text-lg font-bold">From {journey.plan_entered_by || journey.care_team_name || "the care plan"}</h2>
            {o.plan.signs.length ? (
              <ul className="mt-3 space-y-2">
                {o.plan.signs.slice(0, 5).map((w) => (
                  <li key={w.id} className="flex items-start gap-2 text-[14px] leading-snug">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${w.action === "emergency" ? "bg-coral" : "bg-ember"}`} />
                    <span>
                      {w.text} <span className="text-xs text-haze">({w.action === "emergency" ? "emergency" : "call the team"})</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-haze">No warning signs in the plan yet. Copy them from the discharge letter in the plan, word for word.</p>
            )}
            <CallButtons phone={journey.care_team_phone} team={journey.care_team_name} emergency={journey.emergency_number} />
          </section>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="glass rounded-3xl p-5 md:p-6">
          <div className="flex items-center justify-between">
            <p className="label-mono text-haze">Care circle</p>
            <Link href="/app/circle" className="text-sm text-haze hover:text-white">Open</Link>
          </div>
          <div className="mt-3 flex -space-x-2">
            {o.members.slice(0, 7).map((m, k) => (
              <span key={m.user_id} title={m.display_name} className="grid h-10 w-10 place-items-center rounded-full border-2 border-night text-sm font-bold text-night" style={{ background: ["#ffc15e", "#ff6b5a", "#7cf5d3", "#b48cff", "#8fd3ff", "#ffd36b", "#f3c98b"][k % 7] }}>
                {m.display_name.slice(0, 1)}
              </span>
            ))}
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {o.tasks.filter((t) => !t.done_at).slice(0, 3).map((t) => (
              <li key={t.id} className="flex items-center gap-2">
                <Icon name="users" className="h-4 w-4 shrink-0 text-lilac" />
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                <span className="shrink-0 text-xs text-haze">{t.assignee_name ?? "Open"}</span>
              </li>
            ))}
            {!o.tasks.some((t) => !t.done_at) && <li className="text-haze">No open errands. Add one in the circle.</li>}
          </ul>
        </section>
        <Link href="/app/comfort" className="group relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-lilac/20 via-dusk-900 to-ember/10 p-5 transition hover:border-white/20 md:p-6">
          <p className="label-mono text-mint">Comfort, by Qloo</p>
          <h2 className="mt-1 text-xl font-bold">A good day, planned around {who === "you" ? "what you love" : `what ${who} loves`}</h2>
          <p className="mt-2 text-sm text-haze">Music, shows, meals near home within your filters, gentle outings and a welcome-home card.</p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ember">
            See today&apos;s plan <Icon name="arrowR" className="h-4 w-4 transition group-hover:translate-x-1" />
          </span>
        </Link>
      </div>

      <Disclaimer />
    </div>
  );
}
