import { clinicPatient } from "@/lib/server/clinic";
import { messagesOf } from "@/lib/server/repo";
import { dayNumber, todayIn } from "@/lib/care/dates";
import { PatientHeader } from "@/components/clinic/PatientHeader";
import { MessageThread } from "@/components/clinic/MessageThread";
import { Composer, ResolveQuestions } from "@/components/clinic/ClinicTools";

export const metadata = { title: "Messages" };

export default async function ClinicMessages(props: PageProps<"/clinic/p/[id]/messages">) {
  const { id } = await props.params;
  const { journey } = await clinicPatient(id, `/clinic/p/${id}/messages`);
  const msgs = await messagesOf(journey.id);
  const open = msgs.filter((m) => m.kind === "question" && !m.resolved_at).length;
  return (
    <div className="mx-auto max-w-3xl">
      <PatientHeader journey={journey} tab="messages" day={dayNumber(journey.discharge_date, todayIn(journey.timezone))} questions={open} />
      {open > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ember/30 bg-ember/[0.06] px-4 py-3 text-sm">
          <span>{open} question{open > 1 ? "s" : ""} waiting. A reply marks them answered.</span>
          <ResolveQuestions journeyId={journey.id} />
        </div>
      )}
      <MessageThread messages={msgs} viewer="team" empty={`No messages yet. ${journey.person_name} can ask questions from the Ask tab in their app.`} />
      <div className="mt-5">
        <Composer journeyId={journey.id} side="team" placeholder={`Reply to ${journey.person_name}`} />
      </div>
      <p className="mt-3 text-xs text-haze/80">Messages are for practical questions about the plan. Patients are told this is not for emergencies and to call you if worried.</p>
    </div>
  );
}
