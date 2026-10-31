import { redirect } from "next/navigation";
import { currentUser } from "@/lib/server/auth";
import { LANDING_URL } from "@/lib/urls";

export const dynamic = "force-dynamic";

/** The marketing site is its own app (landing/). Signed-in people go straight to their side. */
export default async function Root() {
  const user = await currentUser().catch(() => null);
  if (user) redirect(user.role_pref === "clinician" ? "/clinic" : "/app");
  redirect(LANDING_URL);
}
