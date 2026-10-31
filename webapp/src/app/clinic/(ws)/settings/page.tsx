import Link from "next/link";
import { requireClinician } from "@/lib/server/clinic";
import { orgMembers } from "@/lib/server/repo";
import { signOut } from "@/app/actions";
import { RenameOrg } from "@/components/clinic/ClinicTools";
import { InviteClinician } from "@/components/team/TeamTools";
import { Icon } from "@/components/ui/Icon";
import { PageTitle } from "@/components/ui/primitives";
import { ReplayTourButton } from "@/components/tour/ProductTour";

export const metadata = { title: "Team settings" };

export default async function ClinicSettings() {
  const { user, org } = await requireClinician("/clinic/settings");
  const members = await orgMembers(org.id);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageTitle eyebrow="Workspace" title="Your" accent="care team.">
        <div data-tour="replay-tour" className="shrink-0">
          <ReplayTourButton />
        </div>
      </PageTitle>
      <nav className="grid gap-3 sm:grid-cols-2 lg:hidden" aria-label="Workspace tools">
        <Link href="/clinic/templates" className="glass flex items-center gap-3 rounded-3xl p-4 text-sm hover:text-white" data-testid="tools-templates"><Icon name="list" className="h-5 w-5 text-lilac" /> Plan templates</Link>
        <Link href="/clinic/research" className="glass flex items-center gap-3 rounded-3xl p-4 text-sm hover:text-white" data-testid="tools-research"><Icon name="trend" className="h-5 w-5 text-mint" /> Research, groups only</Link>
      </nav>
      <section className="glass rounded-3xl p-5 md:p-6">
        <p className="label-mono text-haze">Team name</p>
        <p className="mt-1 mb-3 text-sm text-haze">Patients see it on their plan and next to your replies.</p>
        <RenameOrg orgId={org.id} name={org.name} canEdit={org.role === "admin"} />
      </section>
      <section className="glass rounded-3xl p-5 md:p-6">
        <p className="label-mono text-haze">Clinicians · {members.length}</p>
        <ul className="mt-3 space-y-2 text-sm">
          {members.map((m) => (
            <li key={m.user_id} className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate font-medium">{m.display_name}{m.user_id === user.id ? " (you)" : ""}</span>
              <span className="shrink-0 text-xs text-haze">{m.role === "admin" ? "Admin" : "Clinician"}</span>
            </li>
          ))}
        </ul>
      </section>
      {org.role === "admin" && <InviteClinician orgId={org.id} />}
      <section className="glass rounded-3xl p-5 text-sm md:p-6">
        <p className="label-mono text-haze">How sharing works</p>
        <ul className="mt-3 space-y-2 text-haze">
          <li className="flex gap-2"><Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0 text-mint" /> You see a patient only after they enter your code and agree to share. They can stop sharing from their Circle page.</li>
          <li className="flex gap-2"><Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-mint" /> Flags come only from rules your team writes. loci does not diagnose, score risk or give advice.</li>
          <li className="flex gap-2"><Icon name="sun" className="mt-0.5 h-4 w-4 shrink-0 text-mint" /> The patient&apos;s comfort and taste settings stay private to their circle and are never shown here.</li>
        </ul>
      </section>
      <form action={signOut}>
        <button className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm text-haze hover:text-white">
          <Icon name="logout" className="h-4 w-4" /> {user.is_demo ? "Leave the demo" : "Sign out"}
        </button>
      </form>
    </div>
  );
}
