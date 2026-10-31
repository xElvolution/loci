import { AppShell } from "@/components/shell/AppShell";
import { LiveRefresh } from "@/components/clinic/ClinicTools";
import { requireClinician } from "@/lib/server/clinic";
import { clinicJourneys, orgOpenQuestions } from "@/lib/server/repo";
import { ProductTour } from "@/components/tour/ProductTour";

export default async function ClinicLayout({ children }: LayoutProps<"/clinic">) {
  const { user, org } = await requireClinician("/clinic");
  const [questions, list] = await Promise.all([orgOpenQuestions(org.id), clinicJourneys(org.id)]);
  const tourPatient = list.find((j) => j.plan_sent_at)?.id ?? list[0]?.id ?? null;
  return (
    <AppShell side="clinic" orgName={org.name} badge={questions.length} userName={user.display_name} isDemo={user.is_demo} journeys={[]} currentId={null} hasTeam safety={null}>
      {children}
      <LiveRefresh />
      <ProductTour autoStart={!user.tour_completed_at} userKey={user.id} context={{ side: "clinic", hasJourney: false, hasTeam: true, patientId: tourPatient }} />
    </AppShell>
  );
}
