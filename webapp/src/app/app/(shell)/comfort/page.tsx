import { Suspense } from "react";
import { requireJourney } from "@/lib/server/journey-service";
import { comfortFor } from "@/lib/server/comfort-service";
import { logsBetween, planOf, tasteOf, type Journey } from "@/lib/server/repo";
import { todayIn, dayNumber } from "@/lib/care/dates";
import { dosesFor } from "@/lib/care/schedule";
import { composeGoodDay, composeRituals } from "@/lib/care/goodday";
import type { Pick } from "@/lib/care/comfort";
import { ComfortSettings } from "@/components/comfort/ComfortSettings";
import { ShareCard } from "@/components/comfort/ShareCard";
import { PickArt } from "@/components/comfort/PickArt";
import { Icon } from "@/components/ui/Icon";
import { PageTitle } from "@/components/ui/primitives";
import type { Access } from "@/lib/server/repo";
import { appOrigin } from "@/lib/server/origin";

export const metadata = { title: "Comfort" };

export default async function ComfortPage() {
  const { journey, access } = await requireJourney("/app/comfort");
  const taste = await tasteOf(journey.id);
  const isSelf = access.via === "circle" && access.role === "patient";
  return (
    <div className="space-y-6">
      <div data-tour="comfort-head">
        <PageTitle eyebrow="Comfort, powered by Qloo taste AI" title="A good day," accent={isSelf ? "built around you." : `built around ${journey.person_name}.`} />
        <p className="-mt-4 mb-6 flex max-w-3xl items-start gap-2 text-sm text-haze">
          <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
          Picks are aggregate taste affinity: what people with similar taste tend to enjoy. They are for comfort only and never shape the medical plan. Qloo receives favorites, the city and ticked filters, never names, conditions or check-ins.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <ComfortSettings journeyId={journey.id} canEdit={access.canCheckIn} favorites={taste.favorites} filters={taste.filters} outingsOk={taste.outings_ok} city={journey.city} personName={isSelf ? "you" : journey.person_name} />
        <Suspense key={JSON.stringify([taste, journey.city])} fallback={<ResultsSkeleton />}>
          <Results journey={journey} access={access} outingsOk={taste.outings_ok} />
        </Suspense>
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="min-w-0 space-y-4" aria-busy="true" aria-label="Loading comfort picks">
      {[0, 1, 2].map((k) => (
        <div key={k} className="glass h-48 animate-pulse rounded-3xl" />
      ))}
    </div>
  );
}

const SOURCE_STYLE = { plan: "border-lilac/40 bg-lilac/10 text-lilac", comfort: "border-ember/40 bg-ember/10 text-ember", checkin: "border-mint/40 bg-mint/10 text-mint" } as const;

async function Results({ journey, access, outingsOk }: { journey: Journey; access: Access; outingsOk: boolean }) {
  const today = todayIn(journey.timezone);
  const [comfort, plan, logs, origin] = await Promise.all([comfortFor(journey), planOf(journey.id), logsBetween(journey.id, today, today), appOrigin()]);
  const day = dayNumber(journey.discharge_date, today);
  const doses = dosesFor(plan.items, journey.discharge_date, today, logs);
  const appts = plan.items.filter((i) => i.kind === "appointment" && i.day === day);
  const s = comfort.sections;
  const blocks = composeGoodDay({ dateIso: today, personName: journey.person_name, doses, appointments: appts, comfort: s, outingsOk });
  const rituals = composeRituals(journey.person_name, s);
  const canShare = access.via === "circle" && (access.isOwner || access.role === "patient" || access.role === "caregiver");
  const card = journey.card ?? {};

  const notice =
    comfort.status === "no_favorites"
      ? "Add a few favorites, like a singer, a show or a book, and loci will plan around them."
      : comfort.status === "no_city"
        ? "Add a home city to see meals and gentle places nearby."
        : comfort.status === "unavailable"
          ? "Taste picks are taking a break right now. The plan, check-ins and circle all still work."
          : null;

  return (
    <div className="min-w-0 space-y-6">
      {notice && (
        <p className="glass flex items-start gap-3 rounded-3xl p-5 text-sm text-haze" role="status">
          <Icon name="info" className="h-5 w-5 shrink-0 text-ember" /> {notice}
        </p>
      )}

      <section className="glass rounded-3xl p-5 md:p-6" data-testid="good-day">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label-mono text-haze">Today&apos;s good-day plan</p>
            <h2 className="text-xl font-bold">Plan steps where the team set them, comfort in between</h2>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className={`rounded-full border px-2.5 py-1 ${SOURCE_STYLE.plan}`}>From the plan</span>
            <span className={`rounded-full border px-2.5 py-1 ${SOURCE_STYLE.comfort}`}>Taste pick</span>
            <span className={`rounded-full border px-2.5 py-1 ${SOURCE_STYLE.checkin}`}>Check-in</span>
          </div>
        </div>
        <ol className="relative mt-5 space-y-3 before:absolute before:top-2 before:bottom-2 before:left-[4.6rem] before:w-px before:bg-white/10">
          {blocks.map((b) => (
            <li key={b.key} className="relative flex items-start gap-4">
              <span className="w-14 shrink-0 pt-2 text-right font-mono text-xs text-haze tabular-nums">{b.time}</span>
              <span className={`relative z-10 mt-2.5 h-3 w-3 shrink-0 rounded-full border-2 ${b.source === "plan" ? "border-lilac bg-night" : b.source === "checkin" ? "border-mint bg-night" : "border-ember bg-ember"}`} />
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-white/[0.04] px-3 py-2.5">
                {b.pick && <PickArt name={b.pick.name} image={b.pick.image} kind={b.pick.kind} className="h-10 w-10 rounded-xl" />}
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold break-words">{b.title}</span>
                  <span className="block text-xs text-haze">{b.detail}</span>
                </span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {comfort.status === "ok" && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Shelf title="Soundtrack" icon="music" picks={s.soundtrack} />
            <Shelf title="Screen time" icon="tv" picks={s.screen} />
            <Shelf title="Reading and listening" icon="book" picks={s.reading} />
            <section className="glass min-w-0 rounded-3xl p-5 md:p-6">
              <h3 className="flex items-center gap-2 font-bold">
                <Icon name="meal" className="h-5 w-5 text-ember" /> Meals near home
              </h3>
              {journey.diet_notes && (
                <p className="mt-3 rounded-2xl border border-lilac/30 bg-lilac/10 px-3 py-2 text-sm">
                  <span className="label-mono block text-lilac">Food notes from the care team</span>
                  {journey.diet_notes}
                </p>
              )}
              <PickList picks={s.meals} empty="No places matched every ticked filter nearby." />
              {s.cuisines.length > 0 && (
                <div className="mt-4">
                  <p className="label-mono text-haze/80">Cuisines this taste leans toward</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {s.cuisines.map((c) => (
                      <li key={c.id} className="rounded-full bg-white/8 px-3 py-1 text-xs">
                        {c.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>
          {outingsOk && <Shelf title="Gentle places nearby" icon="tree" picks={s.outings} wide />}
        </>
      )}

      <ShareCard journeyId={journey.id} canShare={canShare} personName={journey.person_name} rituals={rituals} url={journey.share_slug ? `${origin}/w/${journey.share_slug}` : null} theme={card.theme ?? "dusk"} message={card.message ?? ""} from={card.from ?? ""} />

      <details className="glass rounded-3xl p-5 md:p-6" data-testid="qloo-trace">
        <summary className="cursor-pointer font-semibold">
          How these picks were made <span className="text-sm font-normal text-haze">({comfort.trace.length} Qloo calls)</span>
        </summary>
        <p className="mt-3 text-sm text-haze">Every call loci made to the Qloo Insights API for this page. Responses are cached privately on our server for a day and never shown raw.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead className="text-haze">
              <tr>
                <th className="py-2 pr-3 font-medium">Step</th>
                <th className="py-2 pr-3 font-medium">Endpoint and parameters</th>
                <th className="py-2 pr-3 font-medium">Results</th>
                <th className="py-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {comfort.trace.map((t, k) => (
                <tr key={k} className="align-top">
                  <td className="py-2 pr-3 font-sans font-medium">{t.step}</td>
                  <td className="py-2 pr-3 break-all text-haze">
                    {t.endpoint}
                    {Object.entries(t.params)
                      .filter(([key]) => !/signal\.interests\.entities$/.test(key))
                      .slice(0, 6)
                      .map(([key, v]) => (
                        <span key={key} className="block">
                          {key}={v.length > 80 ? `${v.slice(0, 79)}…` : v}
                        </span>
                      ))}
                    {t.note && <span className="block font-sans text-ember/80">{t.note}</span>}
                  </td>
                  <td className="py-2 pr-3 tabular-nums">{t.status === 200 ? t.results : String(t.status)}</td>
                  <td className="py-2 tabular-nums">{t.cached ? "cached" : `${t.ms} ms`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="text-xs text-haze/70">Generated {new Date(comfort.generatedAt).toISOString().slice(0, 16).replace("T", " ")} UTC. Picks refresh daily.</p>
    </div>
  );
}

function Shelf({ title, icon, picks, wide = false }: { title: string; icon: string; picks: Pick[]; wide?: boolean }) {
  return (
    <section className={`glass min-w-0 rounded-3xl p-5 md:p-6 ${wide ? "" : ""}`}>
      <h3 className="flex items-center gap-2 font-bold">
        <Icon name={icon} className="h-5 w-5 text-ember" /> {title}
      </h3>
      <PickList picks={picks} empty="Nothing strong enough to suggest yet." grid={wide} />
    </section>
  );
}

function PickList({ picks, empty, grid = false }: { picks: Pick[]; empty: string; grid?: boolean }) {
  if (!picks.length) return <p className="mt-3 text-sm text-haze">{empty}</p>;
  return (
    <ul className={`mt-4 ${grid ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3"}`}>
      {picks.slice(0, grid ? 9 : 5).map((p) => (
        <li key={p.id} className="flex min-w-0 items-center gap-3">
          <PickArt name={p.name} image={p.image} kind={p.kind} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{p.name}</span>
            {p.subtitle && <span className="block truncate text-xs text-haze">{p.subtitle}</span>}
            <span className="block truncate text-xs text-ember/90">{p.because.length ? `Because of ${p.because.join(" and ")}` : p.tags.slice(0, 3).join(" · ")}</span>
          </span>
          {p.affinity !== null && (
            <span className="shrink-0 rounded-full bg-white/8 px-2 py-0.5 font-mono text-[10px] text-haze tabular-nums" title="Aggregate taste affinity from Qloo, 0 to 100">
              {Math.round(p.affinity * 100)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
