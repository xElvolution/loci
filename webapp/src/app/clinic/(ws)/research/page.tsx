import { requireClinician } from "@/lib/server/clinic";
import { logResearchAccess, orgResearch, researchAccessLog } from "@/lib/server/research";
import { specialtyOf } from "@/lib/care/specialties";
import { instrumentOf } from "@/lib/care/instruments";
import { prettyDate, toIso } from "@/lib/care/dates";
import { PageTitle } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Research" };

const pct = (x: number) => `${Math.round(x * 100)}%`;

export default async function ResearchPage() {
  const { user, org } = await requireClinician("/clinic/research");
  const admin = org.role === "admin";
  const a = admin ? await orgResearch(org.id) : null;
  if (a) await logResearchAccess(org.id, user.id, "view", a);
  const log = admin ? await researchAccessLog(org.id) : [];
  const empty = a && !a.checkins.length && !a.outcomes.length && !a.cohorts.length;
  return (
    <div className="space-y-6">
      <div>
        <PageTitle eyebrow={org.name} title="Research," accent="groups only." />
        <p className="-mt-2 max-w-2xl text-haze">Anonymous group numbers from patients who switched on the separate research consent and share with your team. No names, dates, notes, messages, custom measures or taste data. Any group with fewer than {a?.k ?? 10} people is hidden. Every view and export is logged.</p>
      </div>

      {!admin && <p className="glass rounded-3xl p-5 text-sm text-haze" data-testid="research-admin-only">Only team admins can open research numbers.</p>}

      {a && (
        <>
          <section className="grid gap-3 sm:grid-cols-3" data-testid="research-kpis">
            <Kpi label="Consenting patients" value={a.cohort >= a.k ? String(a.cohort) : `fewer than ${a.k}`} testid="research-cohort" />
            <Kpi label="Minimum group size (k)" value={String(a.k)} />
            <Kpi label="Groups hidden as too small" value={String(a.suppressed)} testid="research-suppressed" />
          </section>

          {empty ? (
            <section className="glass rounded-3xl p-5 md:p-6" data-testid="research-empty">
              <p className="font-semibold">Nothing to show yet</p>
              <p className="mt-1 text-sm text-haze">Every group has fewer than {a.k} consenting patients, so all of it stays hidden. Numbers appear once enough people in the same specialty and week of recovery have opted in.</p>
            </section>
          ) : (
            <>
              <Table title="Recovery by specialty" head={["Specialty", "Patients", "Returned to hospital"]} rows={a.cohorts.map((c) => [specialtyOf(c.specialty).label, String(c.journeys), pct(c.readmittedShare)])} />
              <Table title="Check-ins by week of recovery" head={["Specialty", "Week", "Patients", "Check-ins", "Mood", "Pain", "Sleep", "Energy", "Flagged"]} rows={a.checkins.map((c) => [specialtyOf(c.specialty).short, c.week, String(c.journeys), String(c.checkins), String(c.mood), String(c.pain), String(c.sleep), String(c.energy), pct(c.flaggedShare)])} />
              <Table title="Outcome measures by week" head={["Specialty", "Measure", "Week", "Patients", "Values", "Mean"]} rows={a.outcomes.map((c) => [specialtyOf(c.specialty).short, instrumentOf(c.instrument)?.short ?? c.instrument, c.week, String(c.journeys), String(c.values), String(c.mean)])} />
            </>
          )}

          <a href={`/api/research/export?org=${org.id}`} className="inline-flex h-11 items-center gap-2 rounded-full border border-haze/30 px-5 text-sm transition hover:border-ember/70 hover:text-ember" data-testid="research-export">
            <Icon name="download" className="h-4 w-4" /> Export aggregate CSV
          </a>

          <section className="glass rounded-3xl p-5 md:p-6">
            <p className="label-mono text-haze">Access log</p>
            <ul className="mt-3 space-y-1.5 text-sm" data-testid="research-log">
              {log.map((l, i) => (
                <li key={i} className="flex flex-wrap justify-between gap-2">
                  <span>{l.name ?? "Former member"} · {l.kind === "export" ? "exported CSV" : "viewed"}</span>
                  <span className="text-haze">{prettyDate(toIso(l.created_at))} · {l.cells_shown} shown, {l.cells_suppressed} hidden</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, testid }: { label: string; value: string; testid?: string }) {
  return (
    <div className="glass rounded-3xl p-5">
      <p className="label-mono text-[11px] text-haze">{label}</p>
      <p className="mt-1 text-2xl font-bold" data-testid={testid}>{value}</p>
    </div>
  );
}

function Table({ title, head, rows }: { title: string; head: string[]; rows: string[][] }) {
  return (
    <section className="glass min-w-0 rounded-3xl p-5 md:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-haze">All groups here are below the minimum size, so they are hidden.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-haze"><tr>{head.map((h) => <th key={h} className="py-2 pr-4 font-medium">{h}</th>)}</tr></thead>
            <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-white/5">{r.map((c, k) => <td key={k} className="py-2 pr-4">{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
