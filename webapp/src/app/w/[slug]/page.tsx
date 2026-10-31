import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { journeyBySlug } from "@/lib/server/repo";
import { comfortFor } from "@/lib/server/comfort-service";
import { composeRituals } from "@/lib/care/goodday";
import { WelcomeCard } from "@/components/share/WelcomeCard";
import { Wordmark } from "@/components/brand/Wordmark";
import { RoadHome } from "@/components/art/RoadHome";

export async function generateMetadata(props: PageProps<"/w/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const j = /^[A-Za-z0-9]{6,40}$/.test(slug) ? await journeyBySlug(slug) : null;
  return j ? { title: `${j.person_name} is home`, description: "A welcome-home card made with loci.", robots: { index: false } } : { title: "Card not found" };
}

/** Public welcome card. Shows a first name, a message and taste rituals. Never health information. */
export default async function SharedCard(props: PageProps<"/w/[slug]">) {
  const { slug } = await props.params;
  const j = /^[A-Za-z0-9]{6,40}$/.test(slug) ? await journeyBySlug(slug) : null;
  if (!j) notFound();
  const comfort = await comfortFor(j);
  const rituals = composeRituals(j.person_name, comfort.sections);
  const card = j.card ?? {};
  return (
    <div className="dusk-sky relative min-h-dvh overflow-x-clip px-5 py-8">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-30" aria-hidden="true">
        <RoadHome className="mx-auto h-auto w-full max-w-5xl" />
      </div>
      <div className="relative mx-auto max-w-xl">
        <Link href="/" aria-label="loci home" className="inline-block text-[#f4f1ff]">
          <Wordmark className="h-7 w-auto" />
        </Link>
        <div className="mt-10">
          <WelcomeCard theme={card.theme ?? "dusk"} personName={j.person_name} message={card.message || `Welcome home, ${j.person_name}.`} from={card.from ?? ""} rituals={rituals} />
        </div>
        <p className="mt-8 text-center text-sm text-haze">
          Made with loci, the way home after hospital. <Link href="/" className="text-ember underline underline-offset-4">See how it works</Link>
        </p>
      </div>
    </div>
  );
}
