"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

export type Plan = { name: string; price: string; unit?: string; note: string; items: string[]; cta: { href: string; label: string } | null; live: boolean; featured?: boolean };

/** Plans side by side on desktop; a swipeable, snapping carousel with dots and arrows on phones and tablets. */
export function PricingPlans({ plans }: { plans: Plan[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const mid = el.scrollLeft + el.clientWidth / 2;
    let best = 0, dist = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const card = c as HTMLElement;
      const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - mid);
      if (d < dist) { dist = d; best = i; }
    });
    setActive(best);
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const go = (i: number) => {
    const el = track.current;
    const card = el?.children[Math.max(0, Math.min(plans.length - 1, i))] as HTMLElement | undefined;
    if (!el || !card) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="mt-12">
      <div
        ref={track}
        role="region"
        aria-roledescription="carousel"
        aria-label="Plans"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); go(active + 1); }
          if (e.key === "ArrowLeft") { e.preventDefault(); go(active - 1); }
        }}
        className="relative -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[7.5vw] pb-2 outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-ember md:-mx-8 lg:mx-0 lg:grid lg:snap-none lg:grid-cols-3 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
        data-testid="pricing-track"
      >
        {plans.map((p, k) => (
          <article
            key={p.name}
            aria-roledescription="slide"
            aria-label={`${k + 1} of ${plans.length}: ${p.name}`}
            className={`flex w-[85vw] max-w-[420px] shrink-0 snap-center flex-col rounded-3xl p-7 lg:w-auto lg:max-w-none ${p.featured ? "bg-ink text-paper" : "paper-card"}`}
            data-testid="pricing-card"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xl font-bold">{p.name}</h3>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${p.featured ? "bg-ember text-night" : p.live ? "bg-mint/40 text-ink" : "ink-chip text-ink-soft"}`}>{p.note}</span>
            </div>
            <p className="mt-5 text-4xl font-bold tracking-tight">
              {p.price} {p.unit && <span className={`text-sm font-normal ${p.featured ? "text-paper/70" : "text-ink-soft"}`}>{p.unit}</span>}
            </p>
            <ul className="mt-6 space-y-3 text-base">
              {p.items.map((i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Icon name="check" className={`mt-1 h-4 w-4 shrink-0 ${p.featured ? "text-ember" : "text-coral"}`} /> {i}
                </li>
              ))}
            </ul>
            {p.cta && (
              <div className="mt-auto pt-7">
                <Link href={p.cta.href} className={`inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-semibold transition ${p.featured ? "bg-gradient-to-br from-ember to-coral text-night hover:brightness-110" : "bg-ink text-paper hover:bg-dusk-800"}`}>
                  {p.cta.label} <Icon name="arrowR" className="h-4 w-4" />
                </Link>
              </div>
            )}
          </article>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-center gap-4 lg:hidden" data-testid="pricing-controls">
        <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous plan" className="grid h-11 w-11 place-items-center rounded-full border border-ink/20 text-ink transition hover:bg-ink/5 disabled:opacity-35" data-testid="pricing-prev">
          <Icon name="arrowL" className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1" role="group" aria-label="Choose a plan">
          {plans.map((p, k) => (
            <button key={p.name} type="button" onClick={() => go(k)} aria-label={`Show ${p.name}`} aria-current={k === active ? "true" : undefined} className="grid h-11 w-8 place-items-center" data-testid="pricing-dot">
              <span className={`block h-2.5 rounded-full transition-all ${k === active ? "w-6 bg-coral" : "w-2.5 bg-ink/25"}`} />
            </button>
          ))}
        </div>
        <button type="button" onClick={() => go(active + 1)} disabled={active === plans.length - 1} aria-label="Next plan" className="grid h-11 w-11 place-items-center rounded-full border border-ink/20 text-ink transition hover:bg-ink/5 disabled:opacity-35" data-testid="pricing-next">
          <Icon name="arrowR" className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
