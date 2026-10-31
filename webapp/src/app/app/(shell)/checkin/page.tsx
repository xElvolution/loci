import Link from "next/link";
import { requireJourney } from "@/lib/server/journey-service";
import { checkinsBetween, planOf } from "@/lib/server/repo";
import { todayIn, prettyDate } from "@/lib/care/dates";
import { CheckinForm } from "@/components/checkin/CheckinForm";
import { Disclaimer } from "@/components/care/bits";
import { PageTitle } from "@/components/ui/primitives";

export const metadata = { title: "Check in" };

export default async function CheckinPage() {
  const { journey, access } = await requireJourney("/app/checkin");
  const today = todayIn(journey.timezone);
  const [plan, [existing]] = await Promise.all([planOf(journey.id), checkinsBetween(journey.id, today, today)]);
  const isSelf = access.via === "circle" && access.role === "patient";
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle eyebrow={prettyDate(today, { weekday: "long", month: "long", day: "numeric" })} title={isSelf ? "How are you" : `How is ${journey.person_name}`} accent="today?" />
      {access.canCheckIn ? (
        <CheckinForm
          journeyId={journey.id}
          personName={journey.person_name}
          isSelf={isSelf}
          signs={plan.signs}
          initial={existing ? { mood: existing.mood, pain: existing.pain, sleep: existing.sleep, appetite: existing.appetite, energy: existing.energy, signs: existing.signs, note: existing.note ?? "" } : null}
          phone={journey.care_team_phone}
          team={journey.care_team_name}
          emergency={journey.emergency_number}
        />
      ) : (
        <p className="glass rounded-3xl p-6 text-haze">
          Check-ins are done by {journey.person_name} or their main caregivers. You can follow progress on the <Link href="/app/journey" className="text-ember underline">journey</Link>.
        </p>
      )}
      <Disclaimer className="mt-6" />
    </div>
  );
}
