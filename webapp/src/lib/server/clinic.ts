import "server-only";
import { notFound, redirect } from "next/navigation";
import { currentUser, type User } from "./auth";
import { accessFor, getJourney, orgsOf, type Access, type Journey, type Org } from "./repo";

/** Clinician workspace pages: a signed-in user who belongs to a care team. */
export async function requireClinician(next = "/clinic"): Promise<{ user: User; org: Org; orgs: Org[] }> {
  const user = await currentUser();
  if (!user) redirect(`/clinic/signin?next=${encodeURIComponent(next)}`);
  const orgs = await orgsOf(user.id);
  if (!orgs.length) redirect("/clinic/setup");
  return { user, org: orgs[0], orgs };
}

/** One patient in the workspace. 404 unless the journey belongs to this team and the patient shares with it. */
export async function clinicPatient(id: string, next: string): Promise<{ user: User; org: Org; journey: Journey; access: Access }> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { user, orgs } = await requireClinician(next);
  const journey = await getJourney(id);
  const org = journey ? orgs.find((o) => o.id === journey.org_id) : undefined;
  const access = journey && org ? await accessFor(user.id, id) : null;
  if (!journey || !org || !access) notFound();
  return { user, org, journey, access };
}
