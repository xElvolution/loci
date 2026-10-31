import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { LinkButton } from "@/components/ui/primitives";
import { DOCS_URL, LANDING_URL } from "@/lib/urls";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-night py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 text-sm text-haze md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-3">
          <Wordmark className="h-6 w-auto text-[#f4f1ff]" animated={false} />
          <span>The way home after hospital.</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/safety" className="hover:text-white">Safety</Link>
          <Link href="/app/demo" className="hover:text-white">Demo</Link>
          <Link href="/app/signin" className="hover:text-white">Sign in</Link>
          <a href={LANDING_URL} className="hover:text-white">About loci</a>
          <a href={DOCS_URL} className="hover:text-white">Docs</a>
        </div>
        <p className="max-w-sm text-xs text-haze/80">loci is not a medical device and does not give medical advice. Taste picks by Qloo are aggregate affinity.</p>
      </div>
    </footer>
  );
}

/** Cream atlas-paper reading page for policy and safety documents. */
export function DocPage({ eyebrow, title, accent, intro, children }: { eyebrow: string; title: string; accent: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="overflow-x-clip">
      <header className="dusk-sky relative pb-20">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-20 md:px-8" aria-label="Main">
          <Link href="/" aria-label="loci home" className="text-[#f4f1ff]">
            <Wordmark className="h-7 w-auto" />
          </Link>
          <LinkButton href="/app/demo" className="h-10 px-4 text-sm">Try the demo</LinkButton>
        </nav>
        <div className="mx-auto max-w-3xl px-5 pt-10 md:pt-16">
          <p className="label-mono text-ember">{eyebrow}</p>
          <h1 className="mt-3 text-4xl leading-[1.05] font-bold tracking-tight text-balance md:text-6xl">
            {title} <span className="font-serif-i font-normal text-ember">{accent}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-haze text-pretty">{intro}</p>
        </div>
      </header>
      <main className="paper relative -mt-10 rounded-t-[40px] px-5 py-14 text-ink md:py-20">
        <div className="doc mx-auto max-w-3xl space-y-10">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function DocSection({ n, title, children, id }: { n: string; title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="grid scroll-mt-24 gap-3 md:grid-cols-[72px_1fr]">
      <span className="font-mono text-sm text-ink-soft">{n}</span>
      <div className="min-w-0">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <div className="mt-3 space-y-3 text-[16px] leading-relaxed text-ink-soft [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink">{children}</div>
      </div>
    </section>
  );
}
