import Link from "next/link";
import { planSeenAt, planUpdatesSince } from "@/lib/server/repo";
import { PlanSeen } from "@/components/clinic/ClinicTools";
import { Icon } from "@/components/ui/Icon";

function ago(d: Date) {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return m < 1 ? "just now" : `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}

/** "Your care team updated your plan", listing what changed since this person last looked. */
export async function PlanUpdated({ journeyId, userId, team, showLink = true }: { journeyId: string; userId: string; team: string; showLink?: boolean }) {
  const since = await planSeenAt(journeyId, userId);
  if (!since) return null;
  const updates = await planUpdatesSince(journeyId, since);
  if (!updates.length) return null;
  return (
    <section className="rounded-3xl border border-lilac/35 bg-gradient-to-br from-lilac/15 to-lilac/[0.04] p-5 md:p-6" data-testid="plan-updated" role="status">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label-mono flex items-center gap-2 text-lilac"><Icon name="bell" className="h-4 w-4" /> Plan updated</p>
          <h2 className="mt-1 text-lg font-bold">Your care team updated your plan</h2>
          <p className="text-sm text-haze">{team || "Your care team"} made {updates.length === 1 ? "a change" : `${updates.length} changes`}. Please read {updates.length === 1 ? "it" : "them"} before your next step.</p>
        </div>
        <PlanSeen journeyId={journeyId} />
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {updates.map((u) => (
          <li key={u.id} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lilac" />
            <span className="min-w-0 break-words">{u.text} <span className="text-xs text-haze">· {u.name ?? "care team"}, {ago(u.created_at)}</span></span>
          </li>
        ))}
      </ul>
      {showLink && (
        <Link href="/app/plan" className="mt-3 inline-flex items-center gap-1.5 text-sm text-lilac hover:underline">
          See the full plan <Icon name="arrowR" className="h-4 w-4" />
        </Link>
      )}
    </section>
  );
}
