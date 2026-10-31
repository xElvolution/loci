import Link from "next/link";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { RedeemForm } from "@/components/clinic/ClinicTools";

export const metadata = { title: "Enter your care team code" };

export default async function RedeemPage(props: PageProps<"/app/redeem">) {
  const sp = await props.searchParams;
  const initial = typeof sp.code === "string" ? sp.code.slice(0, 20) : "";
  return (
    <AuthFrame eyebrow="For patients and families" title="Your plan from" accent="your care team." sub="Your clinic, ward or home care team wrote your recovery plan in loci. Type the code they gave you to get it.">
      <RedeemForm initial={initial} />
      <p className="mt-6 text-center text-sm text-haze">
        No code? You can still <Link href="/app/signup" className="text-ember underline-offset-4 hover:underline">start a journey yourself</Link> and copy the plan from your discharge letter.
      </p>
    </AuthFrame>
  );
}
