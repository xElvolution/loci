import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { Sidebar } from "@/components/Sidebar";
import { APP_URL, LANDING_URL } from "@/lib/urls";

export function Chrome({ current, children }: { current?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-night">
      <header className="sticky top-0 z-20 border-b border-white/8 bg-night/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 md:px-8">
          <Link href="/" className="flex items-center gap-3 text-[#f4f1ff]" aria-label="loci docs home">
            <Wordmark className="h-7 w-auto" animated={false} />
            <span className="label-mono text-haze">docs</span>
          </Link>
          <div className="flex items-center gap-1 text-sm">
            <a href={LANDING_URL} className="hidden rounded-full px-3 py-2 text-haze transition hover:text-white sm:inline">About loci</a>
            <a href={`${APP_URL}/app/demo`} className="inline-flex h-10 items-center rounded-full bg-gradient-to-br from-ember to-coral px-4 font-semibold text-night">Try the demo</a>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 md:grid-cols-[240px_minmax(0,1fr)] md:px-8 md:py-12">
        <details className="md:hidden rounded-2xl border border-white/10 bg-white/5 p-4" data-testid="mobile-nav">
          <summary className="cursor-pointer text-sm font-semibold text-white">All pages</summary>
          <div className="mt-4"><Sidebar current={current} /></div>
        </details>
        <aside className="hidden md:block">
          <div className="sticky top-24"><Sidebar current={current} /></div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
      <footer className="border-t border-white/8 py-8 text-center text-xs text-haze/80">
        Taste picks by Qloo are aggregate affinity.
      </footer>
    </div>
  );
}
