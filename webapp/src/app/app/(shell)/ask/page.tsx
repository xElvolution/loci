import { requireJourney } from "@/lib/server/journey-service";
import { markAskSeen, messagesOf } from "@/lib/server/repo";
import { MessageThread } from "@/components/clinic/MessageThread";
import { Composer, LiveRefresh } from "@/components/clinic/ClinicTools";
import { CallButtons } from "@/components/care/bits";
import { LinkButton, PageTitle } from "@/components/ui/primitives";

export const metadata = { title: "Ask your care team" };

export default async function AskPage() {
  const { user, journey, access } = await requireJourney("/app/ask");
  const team = journey.care_team_name || "your care team";
  const teamPlan = Boolean(journey.org_id && journey.plan_source === "clinician");
  if (!teamPlan || !journey.consent_org)
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div data-tour="ask-head">
          <PageTitle eyebrow="Ask" title="Questions for" accent="your care team." />
        </div>
        <section className="glass rounded-3xl p-6">
          <p className="text-[15px]">
            {teamPlan
              ? `Sharing with ${team} is switched off, so messages are paused. You can turn sharing back on from Circle.`
              : "This journey is not connected to a care team on loci yet. If your team gave you a code, enter it to receive their plan and message them here."}
          </p>
          {!teamPlan && <LinkButton href="/app/redeem" className="mt-4 h-11 px-5">Enter a care team code</LinkButton>}
          <CallButtons phone={journey.care_team_phone} team={journey.care_team_name} emergency={journey.emergency_number} />
        </section>
      </div>
    );
  const msgs = await messagesOf(journey.id);
  await markAskSeen(journey.id, user.id);
  const canSend = access.via === "circle" && access.role !== "family";
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div data-tour="ask-head">
        <PageTitle eyebrow={`Ask · ${team}`} title="Ask your" accent="care team." />
        <p className="-mt-2 text-haze">For practical questions about the plan. Your team replies here. If you feel worse or are worried, call them now.</p>
      </div>
      <MessageThread messages={msgs} viewer="patient" empty={`No messages yet. Ask ${team} anything about your plan.`} />
      {canSend ? (
        <Composer journeyId={journey.id} side="patient" placeholder="For example: can I shower with the dressing on?" />
      ) : (
        <p className="glass rounded-3xl p-5 text-sm text-haze">Messages to the care team come from {journey.person_name} or the main caregiver.</p>
      )}
      <section className="rounded-3xl border border-coral/30 bg-coral/[0.06] p-5">
        <p className="text-sm">Not for emergencies or urgent symptoms.</p>
        <CallButtons phone={journey.care_team_phone} team={journey.care_team_name} emergency={journey.emergency_number} />
      </section>
      <LiveRefresh />
    </div>
  );
}
