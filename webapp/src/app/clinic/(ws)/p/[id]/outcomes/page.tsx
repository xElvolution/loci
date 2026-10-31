import { clinicPatient } from "@/lib/server/clinic";
import { messagesOf } from "@/lib/server/repo";
import { journeyOverview } from "@/lib/server/journey-service";
import { measuresOf, readmissionsOf, valuesOf } from "@/lib/server/outcomes";
import { addDays, prettyDate } from "@/lib/care/dates";
import { adherence } from "@/lib/care/schedule";
import { instrumentsFor, readmissionFreeDays } from "@/lib/care/instruments";
import { PatientHeader } from "@/components/clinic/PatientHeader";
import { AdherenceBars, OutcomeChart } from "@/components/clinic/OutcomeChart";
import { AddMeasure, CloseReadmission, RecordReadmission, RecordValue, RemoveButton } from "@/components/clinic/OutcomeTools";
import { Stat } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Outcomes" };
const COLORS = ["#7cf5d3", "#ffc15e", "#b48cff", "#8fd3ff", "#ff6b5a"];

export default async function OutcomesPage(props: PageProps<"/clinic/p/[id]/outcomes">) {
  const { id } = await props.params;
  const { journey } = await clinicPatient(id, `/clinic/p/${id}/outcomes`);
  const [o, measures, values, readmits, msgs] = await Promise.all([journeyOverview(journey), measuresOf(journey.id), valuesOf(journey.id), readmissionsOf(journey.id), messagesOf(journey.id, 30)]);
  const openQ = msgs.filter((m) => m.kind === "question" && !m.resolved_at).length;
  const rf = readmissionFreeDays(journey.discharge_date, o.today, readmits);
  const { suggested, other } = instrumentsFor(journey.specialty);
  const end = o.today > journey.discharge_date ? o.today : addDays(journey.discharge_date, 1);

  // weekly adherence since discharge, up to 8 most recent weeks
  const weeks: { label: string; rate: number | null }[] = [];
  for (let s = journey.discharge_date, n = 1; s <= o.today; s = addDays(s, 7), n++) {
    const days: string[] = [];
    for (let d = s; d < addDays(s, 7) && d <= o.today; d = addDays(d, 1)) days.push(d);
    weeks.push({ label: `Wk ${n}`, rate: adherence(o.plan.items, journey.discharge_date, days, o.logs).rate });
  }
  const recentWeeks = weeks.slice(-8);
  const reached = o.milestones.filter((m) => m.reached_at).length;

  return (
    <div className="space-y-6">
      <PatientHeader journey={journey} tab="outcomes" day={o.day} questions={openQ} />

      <section className="grid grid-cols-2 gap-4 rounded-3xl border border-white/8 bg-gradient-to-br from-dusk-800/70 to-night p-5 md:grid-cols-4 md:p-6" aria-label="Outcome summary" data-testid="outcome-kpis">
        <Stat
          label="Readmission-free"
          value={rf.inHospital ? <span className="text-coral">In hospital</span> : <span data-testid="readmission-free">{rf.days} day{rf.days === 1 ? "" : "s"}</span>}
          sub={rf.readmitted ? `since ${prettyDate(rf.since)}` : "since discharge"}
        />
        <Stat label="Plan followed, 7 days" value={o.adh7.rate === null ? "None" : `${Math.round(o.adh7.rate * 100)}%`} sub={`${o.adh7.done} of ${o.adh7.scheduled} scheduled`} />
        <Stat label="Milestones" value={`${reached} of ${o.milestones.length}`} sub="reached, as marked by the family or team" />
        <Stat label="Measures tracked" value={measures.length} sub={`${values.length} value${values.length === 1 ? "" : "s"} entered`} />
      </section>

      <section className="space-y-4" aria-labelledby="measures-h">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="measures-h" className="text-xl font-bold">Clinician-entered measures</h2>
            <p className="text-sm text-haze">Values your team records at reviews or visits. {journey.person_name} does not see these here.</p>
          </div>
        </div>
        {measures.length === 0 && <p className="glass rounded-3xl p-5 text-sm text-haze" data-testid="no-measures">No measures yet. Choose what your team tracks for this patient below.</p>}
        <div className="grid gap-4 lg:grid-cols-2">
          {measures.map((m, i) => {
            const pts = values.filter((v) => v.measure_id === m.id);
            return (
              <div key={m.id} className="min-w-0" data-testid="measure">
                <OutcomeChart label={m.label} unit={m.unit} min={m.min_value} max={m.max_value} higherIsBetter={m.higher_is_better} target={m.target} points={pts.map((p) => ({ date: p.measured_on, value: p.value }))} start={journey.discharge_date} end={end} color={COLORS[i % COLORS.length]} />
                <div className="mt-2 rounded-3xl border border-white/8 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Record {m.label}</p>
                    <RemoveButton journeyId={journey.id} id={m.id} kind="measure" label={`Stop tracking ${m.label}`} />
                  </div>
                  <RecordValue journeyId={journey.id} measureId={m.id} label={m.label} unit={m.unit} min={m.min_value} max={m.max_value} today={o.today} />
                  {pts.length > 0 && (
                    <ul className="mt-3 divide-y divide-white/5 text-sm">
                      {pts.slice(-5).reverse().map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-2 py-1.5">
                          <span className="tabular-nums">
                            <span className="font-semibold">{p.value}</span> {m.unit} <span className="text-haze">· {prettyDate(p.measured_on)}{p.by_name ? ` · ${p.by_name}` : ""}</span>
                          </span>
                          <RemoveButton journeyId={journey.id} id={p.id} kind="value" label="Delete this value" />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <AddMeasure journeyId={journey.id} suggested={suggested} other={other} taken={measures.map((m) => m.instrument).filter((x) => x !== "custom")} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AdherenceBars weeks={recentWeeks} />
        <div className="glass min-w-0 rounded-3xl p-4" data-testid="milestone-progress">
          <p className="font-semibold">Milestones</p>
          <ul className="mt-3 space-y-2 text-sm">
            {o.milestones.length === 0 && <li className="text-haze">No milestones on this plan.</li>}
            {o.milestones.map((m) => (
              <li key={m.id} className="flex items-center gap-2">
                <Icon name={m.reached_at ? "check" : "flag"} className={`h-4 w-4 shrink-0 ${m.reached_at ? "text-mint" : "text-haze"}`} />
                <span className={`min-w-0 flex-1 ${m.reached_at ? "" : "text-haze"}`}>{m.title}</span>
                <span className="shrink-0 text-xs text-haze">{m.reached_at ? "reached" : m.day !== null ? `planned day ${m.day}` : "planned"}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="glass rounded-3xl p-5 md:p-6" aria-labelledby="readmit-h" data-testid="readmissions">
        <h2 id="readmit-h" className="text-xl font-bold">Readmissions</h2>
        <p className="mt-1 text-sm text-haze">Record any return to hospital so readmission-free days stay accurate.</p>
        {readmits.length > 0 && (
          <ul className="mt-3 divide-y divide-white/5 text-sm">
            {readmits.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  Admitted {prettyDate(r.admitted_on)}
                  {r.discharged_on ? `, home ${prettyDate(r.discharged_on)}` : ", still in hospital"}
                  {r.note && <span className="text-haze"> · {r.note}</span>}
                </span>
                <span className="flex items-center gap-2">
                  {!r.discharged_on && <CloseReadmission journeyId={journey.id} id={r.id} today={o.today} />}
                  <RemoveButton journeyId={journey.id} id={r.id} kind="readmission" label="Delete this readmission" />
                </span>
              </li>
            ))}
          </ul>
        )}
        <RecordReadmission journeyId={journey.id} today={o.today} discharge={journey.discharge_date} />
      </section>
    </div>
  );
}
