import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export function LegalPage({ eyebrow, title, accent, intro, updated, children }: { eyebrow: string; title: string; accent: string; intro: string; updated?: string; children: ReactNode }) {
  return (
    <div className="overflow-x-clip">
      <SiteHeader current="page" />
      <section className="dusk-sky relative pt-28 pb-14 md:pt-36 md:pb-20">
        <div className="map-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-5 md:px-8">
          <p className="label-mono text-ember">{eyebrow}</p>
          <h1 className="mt-4 text-[40px] leading-[1.02] font-bold tracking-tight text-balance sm:text-6xl">
            {title} <span className="font-serif-i font-normal text-ember">{accent}</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-haze text-pretty">{intro}</p>
          {updated && <p className="mt-4 text-sm text-haze/70">Last updated {updated}</p>}
        </div>
      </section>
      <section className="paper py-14 md:py-20">
        <div className="legal mx-auto max-w-3xl space-y-12 px-5 md:px-8">{children}</div>
      </section>
      <SiteFooter />
    </div>
  );
}

export function LegalSection({ n, title, id, children }: { n: string; title: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <p className="font-mono text-sm text-coral">{n}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
      <div className="mt-4 space-y-4 text-[16px] leading-relaxed text-ink-soft [&_a]:font-semibold [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">{children}</div>
    </section>
  );
}
