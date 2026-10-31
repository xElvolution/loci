"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { completeTour } from "@/app/actions";
import { Icon } from "@/components/ui/Icon";
import { tourSteps, type TourContext } from "./steps";

export const TOUR_REPLAY_EVENT = "loci-care:tour-replay";
const DONE_KEY = "loci-care:tour-done";

type Box = { top: number; left: number; width: number; height: number };

const EDGE = 12;
const GAP = 14;
const PAD = 8;
const FIND_TIMEOUT_MS = 5000;

function visibleTarget(name: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden") return el;
  }
  return null;
}

/** Height of the phone tab bar, so the coach mark never sits underneath it. */
function bottomInset() {
  const bar = document.querySelector<HTMLElement>("[data-tour-tabbar]");
  if (!bar) return 0;
  const r = bar.getBoundingClientRect();
  return r.height > 0 && getComputedStyle(bar).display !== "none" ? r.height : 0;
}

function topInset() {
  const head = document.querySelector<HTMLElement>("[data-tour-header]");
  return head ? head.getBoundingClientRect().height : 0;
}

function sameBox(a: Box | null, b: Box | null) {
  if (!a || !b) return a === b;
  return Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5;
}

export function ProductTour({ autoStart, context, userKey }: { autoStart: boolean; context: TourContext; userKey: string }) {
  const { side, hasJourney, hasTeam, teamPlan, patientId } = context;
  const steps = useMemo(() => tourSteps({ side, hasJourney, hasTeam, teamPlan, patientId }), [side, hasJourney, hasTeam, teamPlan, patientId]);
  const home = steps[0]?.route ?? "/app";
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [, startTransition] = useTransition();
  const titleId = useId();
  const bodyId = useId();

  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [target, setTarget] = useState<Box | null>(null);
  const [located, setLocated] = useState(false);
  const [viewport, setViewport] = useState({ w: 0, h: 0, bottom: 0 });
  const [cardSize, setCardSize] = useState({ w: 360, h: 220 });

  const cardRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const startedRef = useRef(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const step = steps[index];
  const last = index === steps.length - 1;

  const start = useCallback(() => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    setIndex(0);
    setTarget(null);
    setLocated(false);
    setViewport({ w: window.innerWidth, h: window.innerHeight, bottom: bottomInset() });
    setOpen(true);
  }, []);

  const finish = useCallback(() => {
    setOpen(false);
    try {
      sessionStorage.setItem(DONE_KEY, userKey);
    } catch {
      /* storage unavailable */
    }
    startTransition(() => {
      void completeTour();
    });
    returnFocus.current?.focus?.();
  }, [userKey]);

  // First visit after onboarding: start once the person reaches their home screen.
  useEffect(() => {
    if (!autoStart || startedRef.current || pathname !== home) return;
    let skipped = false;
    try {
      skipped = sessionStorage.getItem(DONE_KEY) === userKey;
    } catch {
      /* storage unavailable */
    }
    if (skipped) return;
    const t = window.setTimeout(() => {
      startedRef.current = true;
      start();
    }, 0);
    return () => window.clearTimeout(t);
  }, [autoStart, pathname, start, home, userKey]);

  // "Replay tour" in Settings.
  useEffect(() => {
    const onReplay = () => {
      startedRef.current = true;
      start();
    };
    window.addEventListener(TOUR_REPLAY_EVENT, onReplay);
    return () => window.removeEventListener(TOUR_REPLAY_EVENT, onReplay);
  }, [start]);

  // Go to the step's page.
  useEffect(() => {
    if (open && step && pathname !== step.route) router.push(step.route, { scroll: false });
  }, [open, step, pathname, router]);

  // Find the target, bring it into view, then follow it every frame (scroll, resize, layout shifts).
  useEffect(() => {
    if (!open || !step) return;
    if (pathname !== step.route) return;
    let raf = 0;
    let scrolled = false;
    const began = performance.now();
    const tick = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const bottom = bottomInset();
      setViewport((v) => (v.w === vw && v.h === vh && v.bottom === bottom ? v : { w: vw, h: vh, bottom }));
      const card = cardRef.current?.getBoundingClientRect();
      if (card) setCardSize((s) => (Math.abs(s.w - card.width) < 0.5 && Math.abs(s.h - card.height) < 0.5 ? s : { w: card.width, h: card.height }));
      const el = visibleTarget(step.target);
      if (el) {
        if (!scrolled) {
          scrolled = true;
          const pinned = Boolean(el.closest("[data-tour-header], [data-tour-tabbar]"));
          const r = el.getBoundingClientRect();
          const top = topInset() + 16;
          const roomBelow = vh - bottom - EDGE - (card?.height ?? 220) - GAP;
          if (!pinned && (r.top < top || r.bottom > roomBelow)) {
            window.scrollTo({ top: Math.max(0, window.scrollY + r.top - top), behavior: reduce ? "auto" : "smooth" });
          }
        }
        const r = el.getBoundingClientRect();
        const box = { top: r.top, left: r.left, width: r.width, height: r.height };
        setTarget((t) => (sameBox(t, box) ? t : box));
        setLocated(true);
      } else if (performance.now() - began > FIND_TIMEOUT_MS) {
        setTarget(null);
        setLocated(true);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, step, pathname, reduce]);

  useEffect(() => {
    if (open && located) primaryRef.current?.focus({ preventScroll: true });
  }, [open, located, index]);

  const goTo = useCallback(
    (i: number) => {
      if (i < 0 || i >= steps.length || i === index) return;
      setTarget(null);
      setLocated(false);
      setIndex(i);
    },
    [index, steps.length],
  );
  const next = useCallback(() => (last ? finish() : goTo(index + 1)), [last, finish, goTo, index]);
  const back = useCallback(() => goTo(index - 1), [goTo, index]);

  // Keyboard: Esc skips, arrows move, Tab stays inside the coach mark.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      } else if (e.key === "Tab" && cardRef.current) {
        const items = Array.from(cardRef.current.querySelectorAll<HTMLElement>("button:not([disabled])"));
        if (!items.length) return;
        const first = items[0];
        const lastItem = items[items.length - 1];
        if (!cardRef.current.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          lastItem.focus();
        } else if (!e.shiftKey && document.activeElement === lastItem) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, next, back, finish]);

  if (!open || !step) return null;

  // Spotlight hugs the target, clipped to the visible viewport.
  const spot =
    located && target
      ? (() => {
          const top = Math.max(EDGE / 2, target.top - PAD);
          const left = Math.max(EDGE / 2, target.left - PAD);
          const bottom = Math.min(viewport.h - EDGE / 2, target.top + target.height + PAD);
          const right = Math.min(viewport.w - EDGE / 2, target.left + target.width + PAD);
          return { top, left, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
        })()
      : null;

  // Coach mark: below the target if it fits, else above, else pinned just above the tab bar.
  const cardW = Math.min(380, viewport.w - EDGE * 2);
  const maxBottom = viewport.h - viewport.bottom - EDGE;
  let cardTop: number;
  let cardLeft: number;
  let placement: "below" | "above" | "center" | "dock" = "center";
  if (spot) {
    const below = spot.top + spot.height + GAP;
    const above = spot.top - GAP - cardSize.h;
    if (below + cardSize.h <= maxBottom) {
      cardTop = below;
      placement = "below";
    } else if (above >= EDGE) {
      cardTop = above;
      placement = "above";
    } else {
      cardTop = Math.max(EDGE, maxBottom - cardSize.h);
      placement = "dock";
    }
    cardLeft = Math.min(Math.max(EDGE, spot.left + spot.width / 2 - cardW / 2), viewport.w - cardW - EDGE);
  } else {
    cardTop = Math.max(EDGE, (maxBottom - cardSize.h) / 2);
    cardLeft = (viewport.w - cardW) / 2;
  }
  const arrowLeft = spot ? Math.min(Math.max(20, spot.left + spot.width / 2 - cardLeft), cardW - 20) : 0;
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 340, damping: 34 };

  return (
    <div data-testid="product-tour" data-step={step.id}>
      {/* Blocks clicks on the page while the tour runs. */}
      <div className="fixed inset-0 z-[70]" aria-hidden="true" onClick={(e) => e.stopPropagation()} />
      {spot ? (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed z-[71] rounded-[20px]"
          initial={false}
          animate={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
          transition={spring}
          style={{ boxShadow: "0 0 0 9999px rgba(8, 6, 26, 0.74)" }}
        >
          <span className="tour-pulse absolute inset-0 rounded-[20px] ring-2 ring-ember" />
        </motion.div>
      ) : (
        <motion.div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[71] bg-[rgba(8,6,26,0.74)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      )}

      <motion.div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="fixed z-[72] rounded-3xl border border-ember/30 bg-dusk-900/95 p-5 text-[#f4f1ff] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl"
        style={{ width: cardW }}
        initial={{ opacity: 0, top: cardTop + 12, left: cardLeft }}
        animate={{ opacity: located ? 1 : 0.85, top: cardTop, left: cardLeft }}
        transition={spring}
        data-placement={placement}
      >
        {spot && (placement === "below" || placement === "above") && (
          <span
            aria-hidden="true"
            className={`absolute h-3 w-3 rotate-45 border-ember/30 bg-dusk-900 ${placement === "below" ? "-top-1.5 border-t border-l" : "-bottom-1.5 border-r border-b"}`}
            style={{ left: arrowLeft - 6 }}
          />
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: reduce ? 0 : 0.18 }}>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-ember to-coral text-night">
                <Icon name={step.icon} className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="label-mono text-[11px] text-haze">
                  Step {index + 1} of {steps.length}
                </p>
                <h2 id={titleId} className="text-lg leading-tight font-bold tracking-tight text-balance">
                  {step.title}
                </h2>
              </div>
            </div>
            <p id={bodyId} className="mt-3 text-[15px] leading-relaxed text-haze text-pretty">
              {step.body}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
          {steps.map((s, i) => (
            <motion.span key={s.id} className={`h-1.5 rounded-full ${i === index ? "bg-ember" : i < index ? "bg-ember/45" : "bg-white/15"}`} animate={{ width: i === index ? 20 : 6 }} transition={spring} />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          {!last && (
            <button type="button" onClick={finish} className="rounded-full px-2 py-2 text-sm text-haze transition hover:text-white">
              Skip tour
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            {index > 0 && (
              <button type="button" onClick={back} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-haze/30 px-4 text-sm transition hover:border-ember/70 hover:text-ember">
                <Icon name="arrowL" className="h-4 w-4" /> Back
              </button>
            )}
            <button
              ref={primaryRef}
              type="button"
              onClick={next}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-br from-ember to-coral px-4 text-sm font-semibold text-night transition hover:brightness-110"
            >
              {last ? (
                <>
                  Finish <Icon name="check" className="h-4 w-4" />
                </>
              ) : (
                <>
                  Next <Icon name="arrowR" className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
        <p className="sr-only" aria-live="polite">
          Step {index + 1} of {steps.length}: {step.title}
        </p>
      </motion.div>
    </div>
  );
}

export function ReplayTourButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(TOUR_REPLAY_EVENT))}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-haze/30 px-4 text-sm transition hover:border-ember/70 hover:text-ember"
    >
      <Icon name="play" className="h-4 w-4" /> Replay tour
    </button>
  );
}
