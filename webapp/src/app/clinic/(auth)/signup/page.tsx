import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { currentUser } from "@/lib/server/auth";

export const metadata = { title: "Clinician sign up" };

export default async function ClinicSignUp() {
  const user = await currentUser();
  if (user && !user.is_demo) redirect("/clinic");
  return (
    <AuthFrame eyebrow="For clinicians and care teams" title="Write the plan once," accent="follow it at home." sub="Build a recovery plan from a specialty template, send it with a code, and see check-ins, tick-offs and questions as they happen.">
      <AuthForm mode="signup" side="clinic" />
      <p className="mt-6 text-xs text-haze/80">Use your work email. Patients only share with your team after they enter your code and agree, and they can stop sharing at any time.</p>
      <p className="mt-4 text-center text-sm text-haze">
        Recovering, or caring for someone? <Link href="/app/signup" className="text-ember underline-offset-4 hover:underline">Patient and family sign up</Link>
      </p>
    </AuthFrame>
  );
}
