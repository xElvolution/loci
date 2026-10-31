"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

/** The homecomings loci has a template for. Kept honest: each maps to a real specialty template. */
export const HOMECOMINGS = [
  "after surgery",
  "after a birth",
  "after a stroke",
  "after a heart attack",
  "after a child's stay",
  "after mental health care",
  "after cancer treatment",
  "after a new knee or hip",
  "after an elder's fall",
  "after any hospital stay",
];

/** "For every kind of coming home", with the homecoming phrase changing in place. Static and complete with reduced motion. */
export function HomecomingRotator({ interval = 2400 }: { interval?: number }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((n) => (n + 1) % HOMECOMINGS.length), interval);
    return () => clearInterval(t);
  }, [reduce, interval]);

  if (reduce) {
    return (
      <p className="mt-5 text-xl font-semibold text-[#f4f1ff] md:text-2xl" data-testid="homecoming-rotator">
        For every kind of coming home: <span className="text-ember">after surgery, a birth, a stroke, a heart attack, a child&apos;s stay, mental health care and more.</span>
      </p>
    );
  }
  return (
    <p className="mt-5 text-xl font-semibold text-[#f4f1ff] md:text-2xl" data-testid="homecoming-rotator">
      <span className="block sm:inline">For every kind of coming home,</span>{" "}
      <span className="relative inline-grid h-[1.5em] min-w-0 max-w-full overflow-hidden align-bottom whitespace-nowrap" aria-live="off">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={HOMECOMINGS[i]}
            className="col-start-1 row-start-1 block font-serif-i text-[1.12em] leading-[1.25] font-normal text-ember"
            initial={{ y: "100%", opacity: 0, filter: "blur(6px)" }}
            animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
            exit={{ y: "-100%", opacity: 0, filter: "blur(6px)" }}
            transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
            data-testid="homecoming-phrase"
          >
            {HOMECOMINGS[i]}.
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="sr-only">For every kind of coming home: {HOMECOMINGS.join(", ")}.</span>
    </p>
  );
}

const SCENES = [
  { who: "Ana, 34", what: "home with a newborn", tone: "text-ember border-ember/30 bg-ember/10" },
  { who: "Marcus, 61", what: "after a heart attack", tone: "text-coral border-coral/30 bg-coral/10" },
  { who: "Leo, 8", what: "after his appendix", tone: "text-mint border-mint/30 bg-mint/10" },
  { who: "Grace, 82", what: "after a fall", tone: "text-lilac border-lilac/30 bg-lilac/10" },
  { who: "Sam, 27", what: "leaving mental health care", tone: "text-haze border-haze/30 bg-white/5" },
  { who: "Priya, 45", what: "between chemo cycles", tone: "text-ember border-ember/30 bg-ember/10" },
  { who: "Daniel, 58", what: "with a new knee", tone: "text-mint border-mint/30 bg-mint/10" },
  { who: "Rosa, 70", what: "after a stroke", tone: "text-lilac border-lilac/30 bg-lilac/10" },
  { who: "Kofi, 52", what: "learning life with diabetes", tone: "text-coral border-coral/30 bg-coral/10" },
  { who: "June, 66", what: "after pneumonia", tone: "text-haze border-haze/30 bg-white/5" },
];

/** Two drifting rows of homecomings. Decorative (the specialty grid below carries the content); still and wrapped with reduced motion. */
export function HomecomingMarquee() {
  const rows = [SCENES, [...SCENES.slice(5), ...SCENES.slice(0, 5)]];
  return (
    <div className="relative mt-10 space-y-3 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)] motion-reduce:[mask-image:none]" aria-hidden="true" data-testid="homecoming-marquee">
      {rows.map((row, r) => (
        <div key={r} className={`flex w-max gap-3 motion-reduce:w-full motion-reduce:flex-wrap ${r === 0 ? "anim-drift" : "anim-drift-reverse"}`}>
          {[...row, ...row].map((s, k) => (
            <span key={k} className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[15px] ${s.tone} ${k >= row.length ? "motion-reduce:hidden" : ""}`}>
              <span className="font-semibold text-[#f4f1ff]">{s.who}</span>
              <span>{s.what}</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
