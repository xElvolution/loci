import { requireJourney } from "@/lib/server/journey-service";
import { activityOf, circleTasks, membersOf, openInvites, orgById } from "@/lib/server/repo";
import { appOrigin } from "@/lib/server/origin";
import { prettyDate, todayIn } from "@/lib/care/dates";
import { Circle } from "@/components/circle/Circle";
import { PageTitle } from "@/components/ui/primitives";

export const metadata = { title: "Care circle" };

function ago(d: Date) {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 2) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

export default async function CirclePage() {
  const { user, journey, access } = await requireJourney("/app/circle");
  const canManage = access.via === "circle" && (access.isOwner || access.role === "patient" || access.role === "caregiver");
  const [members, tasks, invites, activity, org, origin] = await Promise.all([
    membersOf(journey.id),
    circleTasks(journey.id),
    canManage ? openInvites(journey.id) : Promise.resolve([]),
    activityOf(journey.id, 25),
    orgById(journey.org_id),
    appOrigin(),
  ]);
  return (
    <div className="space-y-6">
      <PageTitle eyebrow={`${members.length} ${members.length === 1 ? "person" : "people"}`} title={`${journey.person_name}'s`} accent="care circle" />
      <Circle
        journeyId={journey.id}
        personName={journey.person_name}
        canManage={canManage}
        inCircle={access.via === "circle"}
        isOwner={access.isOwner}
        members={members.map((m) => ({ id: m.user_id, name: m.display_name, role: m.role, owner: m.is_owner, me: m.user_id === user.id }))}
        tasks={tasks.map((t) => ({ id: t.id, title: t.title, due: t.due_date, assignee: t.assignee, assigneeName: t.assignee_name, done: Boolean(t.done_at), doneName: t.done_name }))}
        invites={invites.map((i) => ({ code: i.code, role: i.role, expires: prettyDate(new Date(i.expires_at).toISOString().slice(0, 10)) }))}
        org={org}
        consentOrg={journey.consent_org}
        origin={origin}
        today={todayIn(journey.timezone)}
      />
      <section className="glass rounded-3xl p-5 md:p-6">
        <p className="label-mono text-haze">Recent activity</p>
        <ol className="mt-3 space-y-3">
          {activity.map((a) => (
            <li key={a.id} className="flex items-start gap-3 text-sm">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ember/70" />
              <span className="min-w-0 flex-1">
                <span className="font-semibold">{a.name ?? "loci"}</span> <span className="text-[#e9e4ff]/85">{a.text.charAt(0).toLowerCase() + a.text.slice(1)}</span>
              </span>
              <span className="shrink-0 text-xs text-haze">{ago(a.created_at)}</span>
            </li>
          ))}
          {!activity.length && <li className="text-sm text-haze">Nothing yet.</li>}
        </ol>
      </section>
    </div>
  );
}
