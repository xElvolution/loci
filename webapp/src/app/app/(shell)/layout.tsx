import { requireUser } from "@/lib/server/auth";
import { currentJourney, unreadTeamMessages } from "@/lib/server/repo";
import { navContext } from "@/lib/server/journey-service";
import { AppShell } from "@/components/shell/AppShell";
import { ProductTour } from "@/components/tour/ProductTour";
import { LiveRefresh } from "@/components/clinic/ClinicTools";
import { redirect } from "next/navigation";

export default async function ShellLayout({ children }: LayoutProps<"/app">) {
  const user = await requireUser("/app");
  if (!user.onboarded_at) redirect(user.role_pref === "clinician" ? "/clinic/setup" : "/app/onboarding");
  const [nav, cur] = await Promise.all([navContext(user), currentJourney(user)]);
  const j = cur?.journey ?? null;
  // clinicians without a journey of their own work in the clinician workspace
  if (!j && nav.orgs.length) redirect("/clinic");
  const unread = j && j.org_id ? await unreadTeamMessages(j.id, user.id) : 0;
  return (
    <AppShell
      userName={user.display_name}
      isDemo={user.is_demo}
      journeys={nav.journeys}
      currentId={j?.id ?? null}
      hasTeam={nav.orgs.length > 0}
      badge={unread}
      safety={j ? { emergency: j.emergency_number, phone: j.care_team_phone, team: j.care_team_name } : null}
    >
      {children}
      {j?.org_id && <LiveRefresh every={15000} />}
      <ProductTour autoStart={!user.tour_completed_at} userKey={user.id} context={{ side: "patient", hasJourney: Boolean(j), hasTeam: nav.orgs.length > 0, teamPlan: Boolean(j?.org_id && j.plan_source === "clinician") }} />
    </AppShell>
  );
}
