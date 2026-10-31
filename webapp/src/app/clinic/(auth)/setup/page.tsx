import { redirect } from "next/navigation";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { ClinicSetup } from "@/components/clinic/ClinicTools";
import { currentUser } from "@/lib/server/auth";
import { orgsOf } from "@/lib/server/repo";

export const metadata = { title: "Set up your care team" };

export default async function ClinicSetupPage() {
  const user = await currentUser();
  if (!user) redirect("/clinic/signin?next=/clinic/setup");
  if ((await orgsOf(user.id)).length) redirect("/clinic");
  return (
    <AuthFrame eyebrow="Step 2 of 2" title="Name your" accent="care team." sub="Colleagues you invite share the same patient list. You can rename it later.">
      <ClinicSetup suggested="" />
    </AuthFrame>
  );
}
