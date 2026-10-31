import Link from "next/link";
import { currentUser } from "@/lib/server/auth";
import { getInvite } from "@/lib/server/repo";
import { specialtyOf } from "@/lib/care/specialties";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { JoinForm } from "@/components/join/JoinForm";
import { LinkButton } from "@/components/ui/primitives";

export const metadata = { title: "Join", robots: { index: false } };

const ROLE: Record<string, string> = { patient: "as the patient", caregiver: "as the main caregiver", family: "as family or a friend", carer: "as a carer", clinician: "as a clinician" };

export default async function JoinPage(props: PageProps<"/app/join/[code]">) {
  const { code } = await props.params;
  const inv = /^[A-Za-z0-9]{4,40}$/.test(code) ? await getInvite(code) : null;
  const valid = inv && !inv.revoked_at && new Date(inv.expires_at) > new Date() && inv.uses < inv.max_uses;
  const user = await currentUser();
  const next = `/app/join/${code}`;
  if (!valid)
    return (
      <AuthFrame title="This invite" accent="has expired." sub="Invite links last a limited time and can be revoked. Ask the person who sent it for a new one.">
        <LinkButton href="/">Go to loci</LinkButton>
      </AuthFrame>
    );
  const isOrg = Boolean(inv.org_id && !inv.journey_id);
  const orgName = inv.journey_id ? inv.journey_org_name : inv.org_name;
  const lead = inv.role === "patient" || inv.role === "caregiver";
  const teamPlan = Boolean(inv.journey_id && orgName && lead && inv.consent_org);
  return (
    <AuthFrame
      eyebrow={teamPlan ? `From ${orgName}` : undefined}
      title={isOrg ? `Join ${inv.org_name ?? "the care team"}` : teamPlan ? `${inv.person_name}, your care plan` : `Join ${inv.person_name}'s`}
      accent={isOrg ? "on loci." : teamPlan ? "is ready." : `care circle ${ROLE[inv.role] ?? ""}.`}
      sub={
        isOrg
          ? "Follow patients who choose to share their recovery with your team."
          : teamPlan
            ? `${specialtyOf(inv.specialty ?? "general").label} recovery. Your team wrote each step: what to do, why and how. Tick things off, check in each day and ask them questions.`
            : `${specialtyOf(inv.specialty ?? "general").label} recovery. See the plan, share errands and celebrate the milestones together.`
      }
    >
      {user ? (
        <JoinForm code={code} orgName={orgName} isOrgInvite={isOrg} askConsent={Boolean(inv.journey_id && orgName && lead)} teamPlan={teamPlan} />
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          <LinkButton href={`/app/signup?next=${encodeURIComponent(next)}`} data-testid="join-signup">{teamPlan ? "Create my account" : "Create an account"}</LinkButton>
          <LinkButton href={`/app/signin?next=${encodeURIComponent(next)}`} variant="outline">I have an account</LinkButton>
        </div>
      )}
      <p className="mt-6 text-xs text-haze/80">
        By joining you agree to the <Link href="/privacy" className="underline">privacy page</Link> and <Link href="/safety" className="underline">safe use notes</Link>.
      </p>
    </AuthFrame>
  );
}
