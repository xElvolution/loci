import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { Glyph } from "@/components/art/Glyph";
import { DemoStart } from "@/components/demo/DemoStart";
import { DEMO_JOURNEYS, DEMO_ORG } from "@/lib/care/demo-fixtures";
import { specialtyOf } from "@/lib/care/specialties";

export const metadata = { title: "Try the demo" };

export default async function Demo(props: PageProps<"/app/demo">) {
  const sp = await props.searchParams;
  const d = DEMO_JOURNEYS.find((x) => x.key === "daniel") ?? DEMO_JOURNEYS[0];
  const s = specialtyOf(d.specialty);
  return (
    <div className="dusk-sky min-h-dvh">
      <div className="mx-auto max-w-5xl px-5 py-8 md:py-12">
        <Link href="/" aria-label="loci home" className="inline-block text-[#f4f1ff]">
          <Wordmark className="h-8 w-auto" />
        </Link>
        <h1 className="mt-10 text-4xl font-bold tracking-tight text-balance md:text-6xl">
          Try the <span className="font-serif-i font-normal text-ember">demo.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-haze text-pretty">
          One recovery, two sides. A care team writes and tracks the plan; the patient follows it at home. You get a private demo world that disappears within 24 hours. Nothing to sign up for.
        </p>
        {sp.busy && <p className="mt-4 rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">Lots of demos from this network in the last hour. Try again in a little while.</p>}
        <DemoStart
          patient={{ name: d.personName, story: `${s.short}, day ${d.day} at home in ${d.city.name}.`, glyph: <Glyph name={s.glyph} className="h-7 w-7" color={s.hue} /> }}
          clinician="Dr. Maya Chen"
          team={DEMO_ORG.name}
        />
      </div>
    </div>
  );
}
