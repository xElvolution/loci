import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { currentUser, safeNext } from "@/lib/server/auth";

export const metadata = { title: "Sign in" };

export default async function SignIn(props: PageProps<"/app/signin">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? safeNext(sp.next) : undefined;
  const user = await currentUser();
  if (user && !user.is_demo) redirect(next ?? "/app");
  return (
    <AuthFrame title="Welcome back to" accent="the road home." sub="Today's plan, the check-in and your care circle are where you left them.">
      <AuthForm mode="signin" next={next} />
      <p className="mt-6 text-center text-sm text-haze">
        Just looking? <Link href="/app/demo" className="text-ember underline-offset-4 hover:underline">Try the demo</Link>
      </p>
      <p className="mt-2 text-center text-sm text-haze">
        Clinician? <Link href="/clinic/signin" className="text-ember underline-offset-4 hover:underline">Sign in to the clinician workspace</Link>
      </p>
    </AuthFrame>
  );
}
