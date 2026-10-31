"use client";

import Link from "next/link";
import { AnimatePresence, motion, useInView, useReducedMotion, type PanInfo } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

export type Plan = { name: string; price: string; unit?: string; note: string; items: string[]; cta: { href: string; label: string } | null; live: boolean; featured?: boolean };

const AUTO_MS = 4800;

/** Tag palettes, alternating light, dark, light. */
const SKINS = [
  { card: "bg-[#fffaf0] text-ink", sub: "text-ink-soft", tick: "text-coral", chip: "bg-mint/40 text-ink", btn: "bg-ink text-paper hover:bg-dusk-800", string: "#4a4166" },
  { card: "bg-ink text-paper", sub: "text-paper/70", tick: "text-ember", chip: "bg-ember text-night", btn: "bg-gradient-to-br from-ember to-coral text-night hover:brightness-110", string: "#4a4166" },
  { card: "bg-[#ece3ff] text-ink", sub: "text-ink-soft", tick: "text-violet", chip: "bg-white/70 text-ink-soft", btn: "bg-ink text-paper hover:bg-dusk-800", string: "#4a4166" },
];

// The punched hole: a transparent circle cut from the top of the tag.
const HOLE = "radial-gradient(circle at 50% 30px, transparent 11px, #000 11.5px)";

function Tag({ p, k, total, testid = "pricing-card" }: { p: Plan; k: number; total: number; testid?: string }) {
  const s = SKINS[k % SKINS.length];
  return (
    <div className="relative h-full [filter:drop-shadow(0_18px_28px_rgba(26,20,51,0.18))]">
      <article
        aria-roledescription="slide"
        aria-label={`${k + 1} of ${total}: ${p.name}`}
        className={`relative flex h-full flex-col rounded-[30px] px-6 pt-16 pb-7 sm:px-7 ${s.card}`}
        style={{ WebkitMaskImage: HOLE, maskImage: HOLE }}
        data-testid={testid}
      >
        {/* perforation under the hole */}
        <span className={`pointer-events-none absolute top-[54px] right-6 left-6 border-t-2 border-dashed opacity-20 ${k === 1 ? "border-paper" : "border-ink"}`} aria-hidden="true" />
        <div className="flex items-center justify-between gap-2">
          <h3 className="min-w-0 text-xl font-bold">{p.name}</h3>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.chip}`}>{p.note}</span>
        </div>
        <p className="mt-4 text-4xl font-bold tracking-tight">
          {p.price} {p.unit && <span className={`text-sm font-normal ${s.sub}`}>{p.unit}</span>}
        </p>
        <ul className="mt-6 space-y-3 text-base">
          {p.items.map((i) => (
            <li key={i} className="flex items-start gap-2.5">
              <Icon name="check" className={`mt-1 h-4 w-4 shrink-0 ${s.tick}`} /> <span className="min-w-0">{i}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-7">
          {p.cta ? (
            <Link href={p.cta.href} className={`inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-semibold transition ${s.btn}`}>
              {p.cta.label} <Icon name="arrowR" className="h-4 w-4" />
            </Link>
          ) : (
            <p className={`text-sm ${s.sub}`}>Planned, not on sale yet. Watch the changelog for when it opens.</p>
          )}
        </div>
      </article>
      {/* eyelet ring around the hole */}
      <span className="pointer-events-none absolute top-[19px] left-1/2 h-[22px] w-[22px] -translate-x-1/2 rounded-full border-2 border-ink/25" aria-hidden="true" />
    </div>
  );
}

function StringLoop({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 40 46" className={`pointer-events-none absolute left-1/2 z-10 h-[46px] w-10 -translate-x-1/2 ${className}`} aria-hidden="true">
      <path d="M20 2 C 6 10, 8 30, 20 42 C 32 30, 34 10, 20 2" fill="none" stroke="#4a4166" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Pricing as punched price tags. Desktop: three tags side by side. Phones and tablets: a stack, one tag on top, swipe or tap through, with dots, arrows and a gentle auto-advance that stops for good as soon as you touch it. */
export function PricingPlans({ plans }: { plans: Plan[] }) {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { amount: 0.5 });
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  const [touched, setTouched] = useState(false);
  const n = plans.length;

  const go = (i: number, d: number, user = true) => {
    if (user) setTouched(true);
    setDir(d);
    setActive(((i % n) + n) % n);
  };

  useEffect(() => {
    if (reduce || touched || !inView) return;
    const t = setTimeout(() => go(active + 1, 1, false), AUTO_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, touched, inView, active]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const dx = info.offset.x + info.velocity.x * 0.15;
    if (dx < -60) go(active + 1, 1);
    else if (dx > 60) go(active - 1, -1);
    else setTouched(true);
  };

  const auto = !reduce && !touched;

  return (
    <div className="mt-14">
      {/* desktop: three tags */}
      <div className="hidden grid-cols-3 items-stretch gap-6 pt-6 lg:grid" data-testid="pricing-grid">
        {plans.map((p, k) => (
          <div key={p.name} className={`relative transition-transform duration-500 hover:rotate-0 ${k === 0 ? "-rotate-[1.5deg]" : k === 2 ? "rotate-[1.5deg]" : "-translate-y-2"}`}>
            <StringLoop className="-top-[12px]" />
            <Tag p={p} k={k} total={n} />
          </div>
        ))}
      </div>

      {/* phones and tablets: the stack */}
      <div className="-mx-5 overflow-x-clip px-5 md:-mx-8 md:px-8 lg:hidden" ref={root}>
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Plans"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") { e.preventDefault(); go(active + 1, 1); }
            if (e.key === "ArrowLeft") { e.preventDefault(); go(active - 1, -1); }
          }}
          onPointerDown={() => setTouched(true)}
          className="relative mx-auto max-w-[420px] rounded-[34px] px-1 pt-9 pb-12 outline-none focus-visible:ring-2 focus-visible:ring-ember"
          data-testid="pricing-track"
          data-active={active}
        >
          {/* fixed back layers: they never move, only take the colours of the tags waiting behind */}
          <div className="pointer-events-none absolute inset-x-1 top-9 bottom-12" aria-hidden="true">
            {[2, 1].map((depth) => {
              const behind = (active + depth) % n;
              return (
                <span
                  key={depth}
                  className={`absolute inset-x-0 top-[72px] bottom-0 rounded-[30px] transition-colors duration-500 ${SKINS[behind % SKINS.length].card}`}
                  style={{ transform: `translateY(${depth * 16}px) rotate(${depth === 1 ? -2.5 : 3}deg) scale(${1 - depth * 0.05})`, opacity: depth === 1 ? 0.95 : 0.7, boxShadow: "0 10px 24px rgba(26,20,51,0.12)" }}
                  data-testid="pricing-layer"
                />
              );
            })}
          </div>
          <StringLoop className="top-[24px]" />
          <div className="relative grid">
            {/* sizer: keeps the stack as tall as the tallest tag */}
            {plans.map((p, k) => (
              <div key={p.name} className="invisible col-start-1 row-start-1" aria-hidden="true">
                <Tag p={p} k={k} total={n} testid="pricing-sizer" />
              </div>
            ))}
            <AnimatePresence initial={false} custom={dir}>
              <motion.div
                key={active}
                className="col-start-1 row-start-1 touch-pan-y"
                custom={dir}
                variants={{
                  enter: () => ({ opacity: 0, scale: 0.94, y: 14 }),
                  center: { opacity: 1, scale: 1, y: 0, x: 0, rotate: 0, zIndex: 2 },
                  exit: (d: number) => ({ opacity: 0, x: d > 0 ? "-115%" : "115%", rotate: d > 0 ? -8 : 8, zIndex: 3 }),
                }}
                initial={reduce ? false : "enter"}
                animate="center"
                exit={reduce ? { opacity: 0, transition: { duration: 0 } } : "exit"}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
                drag={reduce ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={onDragEnd}
                data-testid="pricing-active"
                data-plan={plans[active].name}
              >
                <Tag p={plans[active]} k={active} total={n} testid="pricing-slide" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-4" data-testid="pricing-controls">
          <button type="button" onClick={() => go(active - 1, -1)} aria-label="Previous plan" className="grid h-11 w-11 place-items-center rounded-full border border-ink/20 text-ink transition hover:bg-ink/5" data-testid="pricing-prev">
            <Icon name="arrowL" className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1" role="group" aria-label="Choose a plan">
            {plans.map((p, k) => (
              <button key={p.name} type="button" onClick={() => go(k, k >= active ? 1 : -1)} aria-label={`Show ${p.name}`} aria-current={k === active ? "true" : undefined} className="grid h-11 w-8 place-items-center" data-testid="pricing-dot">
                <span className={`relative block h-2.5 overflow-hidden rounded-full transition-all ${k === active ? "w-7 bg-coral/30" : "w-2.5 bg-ink/25"}`}>
                  {k === active && (
                    <motion.span
                      key={`${active}-${auto}-${inView}`}
                      className="absolute inset-0 origin-left rounded-full bg-coral"
                      initial={{ scaleX: auto && inView ? 0 : 1 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: auto && inView ? AUTO_MS / 1000 : 0, ease: "linear" }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => go(active + 1, 1)} aria-label="Next plan" className="grid h-11 w-11 place-items-center rounded-full border border-ink/20 text-ink transition hover:bg-ink/5" data-testid="pricing-next">
            <Icon name="arrowR" className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-ink-soft">Swipe the tag or tap the dots</p>
      </div>
    </div>
  );
}
