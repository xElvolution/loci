import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { currentUser, safeNext } from "@/lib/server/auth";

export const metadata = { title: "Create an account" };

export default async function SignUp(props: PageProps<"/app/signup">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? safeNext(sp.next) : undefined;
  const user = await currentUser();
  if (user && !user.is_demo) redirect(next ?? "/app");
  return (
    <AuthFrame eyebrow="For patients and families" title="Start a recovery" accent="journey." sub="For yourself or someone you care for. Free for patients and families. Got a code from your care team? Create the account and your plan is waiting.">
      <AuthForm mode="signup" next={next} />
      <p className="mt-6 text-xs text-haze/80">We keep the minimum: a name, an email and what you choose to enter. No ads, and your data is never sold.</p>
      <p className="mt-4 text-center text-sm text-haze">
        Have a code? <Link href="/app/redeem" className="text-ember underline-offset-4 hover:underline">Enter it first</Link> · Clinician? <Link href="/clinic/signup" className="text-ember underline-offset-4 hover:underline">Clinician sign up</Link>
      </p>
    </AuthFrame>
  );
}
