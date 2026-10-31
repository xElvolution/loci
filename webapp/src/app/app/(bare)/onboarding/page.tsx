import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/server/auth";
import { listJourneys, orgsOf } from "@/lib/server/repo";
import { Wordmark } from "@/components/brand/Wordmark";
import { Onboarding } from "@/components/onboarding/Onboarding";

export const metadata = { title: "Get started" };

export default async function OnboardingPage(props: PageProps<"/app/onboarding">) {
  const user = await requireUser("/app/onboarding");
  const sp = await props.searchParams;
  const another = sp.another === "1";
  if (user.onboarded_at && !another) {
    const [j, o] = await Promise.all([listJourneys(user.id), orgsOf(user.id)]);
    if (j.length) redirect("/app");
    if (o.length) redirect("/clinic");
  }
  return (
    <div className="dusk-sky min-h-dvh">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
        <Link href="/" aria-label="loci home" className="text-[#f4f1ff]">
          <Wordmark className="h-7 w-auto" />
        </Link>
        {user.onboarded_at && (
          <Link href="/app" className="text-sm text-haze hover:text-white">
            Cancel
          </Link>
        )}
      </div>
      <div className="px-5 pt-4 pb-20 md:pt-10">
        <Onboarding userName={user.display_name} another={another} />
      </div>
    </div>
  );
}
