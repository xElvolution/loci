import { requireJourney } from "@/lib/server/journey-service";
import { planOf } from "@/lib/server/repo";
import { specialtyOf } from "@/lib/care/specialties";
import { PlanEditor } from "@/components/plan/PlanEditor";
import { Disclaimer } from "@/components/care/bits";
import { Icon } from "@/components/ui/Icon";
import { PageTitle } from "@/components/ui/primitives";
import { PlanSteps } from "@/components/plan/PlanSteps";
import { PlanUpdated } from "@/components/plan/PlanUpdated";

export const metadata = { title: "Plan" };

export default async function PlanPage(props: PageProps<"/app/plan">) {
  const { user, journey, access } = await requireJourney("/app/plan");
  const sp = await props.searchParams;
  const plan = await planOf(journey.id);
  const s = specialtyOf(journey.specialty);
  if (journey.org_id && journey.plan_source === "clinician")
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div data-tour="plan-head">
          <PageTitle eyebrow={`${s.label} · from ${journey.care_team_name || "your care team"}`} title="Your plan," accent="step by step." />
          <p className="-mt-2 text-haze">Every word here was written by {journey.plan_entered_by || journey.care_team_name || "your care team"}. If something is unclear, ask them from the Ask tab.</p>
        </div>
        <PlanUpdated journeyId={journey.id} userId={user.id} team={journey.care_team_name} showLink={false} />
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
        />
        <Disclaimer className="mt-6" />
      </div>
    );
  const source = journey.plan_source === "clinician" ? `Entered by ${journey.plan_entered_by || journey.care_team_name || "the care team"}` : "Copied from the discharge letter";
  return (
    <div className="mx-auto max-w-4xl">
      <div data-tour="plan-head">
        <PageTitle eyebrow={`${s.label} template · ${source}`} title="The plan," accent="in your team's words." />
      </div>
      {sp.welcome === "1" && (
        <section className="mb-6 rounded-3xl border border-mint/30 bg-mint/[0.07] p-5 md:p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Icon name="spark" className="h-5 w-5 text-mint" /> The journey is ready
          </h2>
          <p className="mt-1 text-sm text-[#e9e4ff]/90">
            Now add the plan. Keep the discharge letter next to you and copy each medicine, task, exercise, appointment and warning sign exactly as written. If something is unclear, ask the care team rather than guessing. You can also invite a clinician from the care circle to fill it in.
          </p>
        </section>
      )}
      <PlanEditor
        journeyId={journey.id}
        canEdit={access.canEditPlan}
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
          plan_source: journey.plan_source,
          plan_entered_by: journey.plan_entered_by,
        }}
      />
      <Disclaimer className="mt-6" />
    </div>
  );
}
