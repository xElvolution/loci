import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { currentUser, safeNext } from "@/lib/server/auth";

export const metadata = { title: "Clinician sign in" };

export default async function ClinicSignIn(props: PageProps<"/clinic/signin">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? safeNext(sp.next) : undefined;
  const user = await currentUser();
  if (user && !user.is_demo) redirect(next ?? "/clinic");
  return (
    <AuthFrame eyebrow="For clinicians and care teams" title="Your patients," accent="at home." sub="Plans you sent, today's check-ins, flags to review and questions waiting for an answer.">
      <AuthForm mode="signin" side="clinic" next={next} />
      <p className="mt-6 text-center text-sm text-haze">
        Just looking? <Link href="/app/demo" className="text-ember underline-offset-4 hover:underline">See the demo as a clinician</Link>
      </p>
      <p className="mt-2 text-center text-sm text-haze">
        Patient or family? <Link href="/app/signin" className="text-ember underline-offset-4 hover:underline">Sign in here</Link>
      </p>
    </AuthFrame>
  );
}
