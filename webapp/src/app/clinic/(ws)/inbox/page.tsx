import Link from "next/link";
import { requireClinician } from "@/lib/server/clinic";
import { orgOpenQuestions, orgThreads } from "@/lib/server/repo";
import { specialtyOf } from "@/lib/care/specialties";
import { Icon } from "@/components/ui/Icon";
import { PageTitle } from "@/components/ui/primitives";

export const metadata = { title: "Inbox" };

export default async function Inbox() {
  const { org } = await requireClinician("/clinic/inbox");
  const [open, recent] = await Promise.all([
    orgOpenQuestions(org.id),
    orgThreads(org.id),
  ]);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div data-tour="clinic-inbox">
        <PageTitle eyebrow={org.name} title="Questions" accent="from home." />
      </div>
      <section className="glass rounded-3xl p-5 md:p-6" data-testid="inbox-open">
        <p className="label-mono text-ember">Waiting for a reply · {open.length}</p>
        <ul className="mt-3 divide-y divide-white/5">
          {open.map((m) => (
            <li key={m.id}>
              <Link href={`/clinic/p/${m.journey_id}/messages`} className="flex items-start gap-3 py-3 hover:opacity-90">
                <Icon name="chat" className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="font-semibold">{m.person_name}</span> <span className="text-haze">· {specialtyOf(m.specialty).short} · {m.name ?? "Patient"}</span>
                  <span className="block break-words text-[#efeaff]">{m.body}</span>
                </span>
                <Icon name="arrowR" className="mt-0.5 h-4 w-4 shrink-0 text-haze" />
              </Link>
            </li>
          ))}
          {!open.length && <li className="py-4 text-sm text-haze">Nothing waiting. Questions patients send from their Ask tab land here.</li>}
        </ul>
      </section>
      <section className="glass rounded-3xl p-5 md:p-6">
        <p className="label-mono text-haze">Latest in each thread</p>
        <ul className="mt-3 divide-y divide-white/5">
          {recent.map((m) => (
            <li key={m.journey_id}>
              <Link href={`/clinic/p/${m.journey_id}/messages`} className="block py-3 text-sm hover:opacity-90">
                <span className="font-semibold">{m.person_name}</span> <span className="text-haze">· {m.side === "team" ? `You: ${m.name ?? "care team"}` : m.name ?? "Patient"}</span>
                <span className="block truncate text-haze">{m.body}</span>
              </Link>
            </li>
          ))}
          {!recent.length && <li className="py-4 text-sm text-haze">No messages yet.</li>}
        </ul>
      </section>
    </div>
  );
}
