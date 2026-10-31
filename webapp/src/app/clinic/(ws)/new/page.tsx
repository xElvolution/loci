import { requireClinician } from "@/lib/server/clinic";
import { clinicJourneys } from "@/lib/server/repo";
import { todayIn } from "@/lib/care/dates";
import { NewPlanForm } from "@/components/clinic/ClinicTools";
import { teamTemplates } from "@/lib/server/templates";
import { BUILTIN_TEMPLATES } from "@/lib/care/templates";
import { Icon } from "@/components/ui/Icon";
import { PageTitle } from "@/components/ui/primitives";

export const metadata = { title: "New care plan" };

export default async function NewPlanPage(props: PageProps<"/clinic/new">) {
  const sp = await props.searchParams;
  const { user, org } = await requireClinician("/clinic/new");
  const mine = await teamTemplates(org.id);
  const templates = [
    ...mine.map((t) => ({ id: t.id, name: t.name, specialty: t.specialty, group: "Your team" as const })),
    ...BUILTIN_TEMPLATES.map((t) => ({ id: t.id, name: t.name, specialty: t.specialty as string, group: "loci structure" as const })),
  ];
  const pre = typeof sp.template === "string" && templates.some((t) => t.id === sp.template) ? sp.template : "";
  const tz = user.timezone || "UTC";
  const recent = (await clinicJourneys(org.id))[0];
  const emergency = recent?.emergency_number || (tz.startsWith("Europe/London") ? "999" : tz.startsWith("Europe/") ? "112" : "911");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div data-tour="clinic-new">
        <PageTitle eyebrow="Step 1 of 3 · Patient" title="Start a" accent="care plan." />
        <p className="-mt-2 text-haze">Pick the specialty template. Next you write the medicines, tasks, exercises, appointments, warning signs and rules, then preview and send.</p>
      </div>
      <section className="glass rounded-3xl p-5 md:p-7">
        <NewPlanForm orgId={org.id} today={todayIn(tz)} defaultPhone={recent?.care_team_phone ?? ""} defaultEmergency={emergency} templates={templates} initialTemplate={pre} />
      </section>
      <ol className="grid gap-3 text-sm sm:grid-cols-3">
        {[
          ["1", "Patient", "Name, template and phone numbers."],
          ["2", "Plan", "Your words: what, why and how for each item."],
          ["3", "Send", "A code and link. They follow, you track."],
        ].map(([n, t, d]) => (
          <li key={n} className="flex items-start gap-3 rounded-2xl border border-white/8 p-4">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/8 text-xs font-bold">{n}</span>
            <span className="min-w-0"><span className="block font-semibold">{t}</span><span className="text-haze">{d}</span></span>
          </li>
        ))}
      </ol>
      <p className="flex items-start gap-2 text-xs text-haze/80">
        <Icon name="shield" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint" /> Templates carry structure and prompts only. loci adds no medical content; every instruction is written by your team.
      </p>
    </div>
  );
}
