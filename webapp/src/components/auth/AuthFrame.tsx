import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { RoadHome } from "@/components/art/RoadHome";

export function AuthFrame({ title, accent, sub, eyebrow, children }: { title: string; accent: string; sub: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <div className="dusk-sky grid min-h-dvh md:grid-cols-[minmax(0,520px)_1fr]">
      <div className="flex flex-col px-5 py-8 md:px-12">
        <Link href="/" aria-label="loci home" className="text-[#f4f1ff]">
          <Wordmark className="h-8 w-auto" />
        </Link>
        <div className="my-auto w-full max-w-md py-10">
          {eyebrow && <p className="label-mono mb-3 text-ember">{eyebrow}</p>}
          <h1 className="text-4xl font-bold tracking-tight text-balance">
            {title} <span className="font-serif-i font-normal text-ember">{accent}</span>
          </h1>
          <p className="mt-3 text-haze text-pretty">{sub}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden border-l border-haze/10 md:block">
        <div className="absolute inset-0 grid place-items-center p-10">
          <RoadHome className="h-auto w-full max-w-3xl" />
        </div>
        <p className="absolute right-8 bottom-8 left-8 font-serif-i text-2xl text-haze/90">Nobody should find the way home alone.</p>
      </div>
    </div>
  );
}
