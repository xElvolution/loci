import Link from "next/link";
import { clinicPatient } from "@/lib/server/clinic";
import { familyJoined, openPlanCode, planOf, prettyCode } from "@/lib/server/repo";
import { appOrigin } from "@/lib/server/origin";
import { specialtyOf } from "@/lib/care/specialties";
import { dayNumber, prettyDate, todayIn, toIso } from "@/lib/care/dates";
import { PatientHeader } from "@/components/clinic/PatientHeader";
import { SendPlan } from "@/components/clinic/ClinicTools";
import { PlanEditor } from "@/components/plan/PlanEditor";
import { PlanSteps } from "@/components/plan/PlanSteps";
import { SaveAsTemplate } from "@/components/clinic/TemplateTools";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Care plan" };

export default async function ClinicPlan(props: PageProps<"/clinic/p/[id]/plan">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const { journey, access } = await clinicPatient(id, `/clinic/p/${id}/plan`);
  const [plan, c, joined] = await Promise.all([planOf(journey.id), openPlanCode(journey.id), familyJoined(journey.id)]);
  const s = specialtyOf(journey.specialty);
  const preview = sp.view === "preview";
  const origin = await appOrigin();
  const sent = Boolean(journey.plan_sent_at);
  const filled = plan.items.filter((i) => i.kind !== "milestone").length;
  const missing = plan.items.filter((i) => i.kind !== "milestone" && !i.why && !i.how).length;
  const unwritten = plan.items.filter((i) => i.needs_review).length;
  return (
    <div>
      <PatientHeader journey={journey} tab="plan" day={dayNumber(journey.discharge_date, todayIn(journey.timezone))} />
      {sp.new === "1" && !sent && (
        <section className="mb-6 rounded-3xl border border-lilac/30 bg-lilac/[0.07] p-5 md:p-6">
          <p className="label-mono text-lilac">Step 2 of 3 · Plan</p>
          <h2 className="mt-1 text-lg font-bold">{unwritten ? "The template structure is ready" : `The ${s.label.toLowerCase()} template is ready`}</h2>
          <p className="mt-1 text-sm text-[#e9e4ff]/90">It has {plan.items.filter((i) => i.kind === "milestone").length} everyday milestones and the prompts below. Add each medicine, task, exercise and appointment in your own words, with a short why and a step-by-step how. Then set the warning signs and check-in rules that should flag to your team.</p>
        </section>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <div className="mb-4 flex gap-1 rounded-full border border-white/8 bg-white/[0.03] p-1" role="tablist" aria-label="Plan view" data-tour="clinic-plan-tabs">
            <Link href={`/clinic/p/${journey.id}/plan`} role="tab" aria-selected={!preview} className={`inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-sm ${!preview ? "bg-white/10 text-white" : "text-haze hover:text-white"}`} data-testid="view-edit">
              <Icon name="edit" className="h-4 w-4" /> Edit
            </Link>
            <Link href={`/clinic/p/${journey.id}/plan?view=preview`} role="tab" aria-selected={preview} className={`inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-sm ${preview ? "bg-white/10 text-white" : "text-haze hover:text-white"}`} data-testid="view-preview">
              <Icon name="eye" className="h-4 w-4" /> What {journey.person_name} sees
            </Link>
          </div>
          {preview ? (
            <div className="rounded-[2rem] border border-white/10 bg-night/60 p-4 md:p-6" data-testid="plan-preview">
              <p className="label-mono mb-4 text-[11px] text-haze">Preview of the patient&apos;s plan screen</p>
              <PlanSteps
                items={plan.items}
                signs={plan.signs}
                thresholds={plan.thresholds}
                discharge={journey.discharge_date}
                instructions={journey.instructions}
                team={journey.care_team_name}
                author={journey.plan_entered_by}
                phone={journey.care_team_phone}
                emergency={journey.emergency_number}
                preview
              />
            </div>
          ) : (
            <PlanEditor
              journeyId={journey.id}
              canEdit={access.canEditPlan}
              team
              items={plan.items}
              signs={plan.signs}
              thresholds={plan.thresholds}
              prompts={s.prompts}
              details={{
                person_name: journey.person_name,
                discharge_date: journey.discharge_date,
                horizon_days: journey.horizon_days,
                care_team_name: journey.care_team_name,
                care_team_phone: journey.care_team_phone,
                emergency_number: journey.emergency_number,
                diet_notes: journey.diet_notes,
                plan_source: "clinician",
                plan_entered_by: journey.plan_entered_by,
                instructions: journey.instructions,
              }}
            />
          )}
        </div>
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start" data-tour="clinic-send">
          <SendPlan
            journeyId={journey.id}
            sent={sent}
            person={journey.person_name}
            code={sent && c ? prettyCode(c) : null}
            url={sent && c ? `${origin}/app/join/${c}` : null}
            joined={joined ? { name: joined.name, when: prettyDate(toIso(joined.joined_at)) } : null}
          />
          <section className="glass rounded-3xl p-5 text-sm">
            <p className="label-mono text-haze">Checklist</p>
            <ul className="mt-3 space-y-2">
              {unwritten > 0 && <Check ok={false} text={`${unwritten} template item${unwritten === 1 ? "" : "s"} still need${unwritten === 1 ? "s" : ""} your words (sending is blocked)`} />}
              <Check ok={filled > 0} text={`${filled} plan item${filled === 1 ? "" : "s"} added`} />
              <Check ok={filled > 0 && missing === 0} text={missing ? `${missing} item${missing === 1 ? "" : "s"} without a why or how` : "Every item has a why or how"} />
              <Check ok={plan.signs.length > 0} text={`${plan.signs.length} warning sign${plan.signs.length === 1 ? "" : "s"}`} />
              <Check ok={plan.thresholds.length > 0} text={`${plan.thresholds.length} check-in rule${plan.thresholds.length === 1 ? "" : "s"}`} />
              <Check ok={Boolean(journey.care_team_phone)} text={journey.care_team_phone ? `Team phone ${journey.care_team_phone}` : "No team phone yet"} />
            </ul>
          </section>
          {access.canEditPlan && journey.org_id && <SaveAsTemplate journeyId={journey.id} />}
        </aside>
      </div>
    </div>
  );
}

function Check({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className="flex items-start gap-2">
      <Icon name={ok ? "check" : "info"} className={`mt-0.5 h-4 w-4 shrink-0 ${ok ? "text-mint" : "text-ember"}`} />
      <span className="min-w-0">{text}</span>
    </li>
  );
}
