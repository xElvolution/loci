"use client";

import Link from "next/link";
import { AnimatePresence, motion, useInView, useReducedMotion, type PanInfo } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Glyph } from "@/components/art/Glyph";
import { SPECIALTIES, type SpecialtyId } from "@/lib/care/specialties";

const AUTO_MS = 2500;

/** Deck order and copy. Lengths come from each specialty template's real journey length. */
const DECK: { id: SpecialtyId; title: string; line: string }[] = [
  { id: "maternity", title: "Maternity and postpartum", line: "The first weeks home with a new baby, for the parent who gave birth and the people around them." },
  { id: "surgery", title: "General surgery", line: "Wound care, walking goals and follow-ups after an operation, in your surgical team's words." },
  { id: "orthopedics", title: "Orthopedic and joint", line: "A new hip or knee, a fracture or spine surgery, with the physio program your therapist writes." },
  { id: "neuro", title: "Stroke and neuro rehab", line: "Long, steady rehab at home, often led by family, with the therapy plan the team sets." },
  { id: "cardiac", title: "Cardiac", line: "Home after a heart attack, a procedure or heart failure care, with the rehab steps your team gives." },
  { id: "pediatrics", title: "Pediatrics", line: "A child home from hospital, with the parent or carer following the plan the team wrote." },
  { id: "mental_health", title: "Mental health", line: "Leaving inpatient or crisis care, with the routines and support plan agreed with the team." },
  { id: "oncology", title: "Oncology", line: "Between treatment cycles, with side-effect watch points and visits your oncology team sets." },
  { id: "respiratory", title: "Respiratory", line: "Home after pneumonia, COPD or asthma care, with inhalers and breathing work as prescribed." },
  { id: "diabetes", title: "Diabetes and metabolic", line: "A new diagnosis or a change in treatment, with checks and routines your team writes." },
  { id: "elder", title: "Elder care and falls", line: "An older parent home after a fall or a stay, with the family circle sharing the load." },
  { id: "general", title: "Any other hospital stay", line: "Whatever brought you in, a blank plan your clinician fills in, step by step." },
];

export const DECK_TITLES = DECK.map((d) => d.title);

function lengthLabel(days: number) {
  return days % 7 === 0 ? `Template: ${days / 7} weeks` : `Template: ${days} days`;
}

const CARDS = DECK.map((d) => {
  const s = SPECIALTIES.find((x) => x.id === d.id)!;
  return { ...d, glyph: s.glyph, hue: s.hue, badge: lengthLabel(s.horizonDays) };
});

// Strict alternation: even cards dark, odd cards light (12 cards, so it holds across the loop).
const DARK = { card: "bg-dusk-700 text-[#f4f1ff]", sub: "text-haze", badge: "bg-white/10 text-[#f4f1ff] ring-1 ring-white/15", btn: "bg-gradient-to-br from-ember to-coral text-night", glyph: (h: string) => h };
const LIGHT = { card: "bg-paper text-ink", sub: "text-ink-soft", badge: "bg-ink/[0.07] text-ink ring-1 ring-ink/10", btn: "bg-ink text-paper", glyph: () => "#3b2f86" };
const skin = (k: number) => (k % 2 === 0 ? DARK : LIGHT);

// The punched hole: 16px circle whose top edge sits 20px below the card top.
const HOLE = "radial-gradient(circle at 50% 28px, transparent 8px, #000 8.6px)";

// Stack positions: front, second, third, and a hidden slot the next card fades in from.
const POS = [
  { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, zIndex: 30 },
  { x: 15, y: 15, rotate: 4, scale: 0.95, opacity: 1, zIndex: 20 },
  { x: -15, y: 25, rotate: -4, scale: 0.9, opacity: 1, zIndex: 10 },
  { x: 0, y: 30, rotate: 0, scale: 0.85, opacity: 0, zIndex: 0 },
];

type Move = { kind: "next" | "prev"; dir: 1 | -1 };

const mod = (n: number) => ((n % CARDS.length) + CARDS.length) % CARDS.length;

function Card({ k, href, front }: { k: number; href: string; front: boolean }) {
  const c = CARDS[k];
  const s = skin(k);
  return (
    <article
      className={`flex h-full w-full flex-col items-center rounded-[20px] px-6 pt-14 pb-6 text-center shadow-[0_24px_50px_rgba(0,0,0,0.35)] ${s.card}`}
      style={{ WebkitMaskImage: HOLE, maskImage: HOLE }}
      aria-hidden={front ? undefined : true}
      data-testid="deck-card"
      data-title={c.title}
    >
      <Glyph name={c.glyph} className="h-10 w-10" color={s.glyph(c.hue)} />
      <h3 className="mt-4 font-serif text-[30px] leading-[1.05] text-balance sm:text-[34px]">{c.title}</h3>
      <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${s.badge}`}>{c.badge}</span>
      <p className={`mt-4 text-[15px] leading-relaxed text-pretty ${s.sub}`}>{c.line}</p>
      <div className="mt-auto pt-5">
        <Link
          href={href}
          tabIndex={front ? 0 : -1}
          draggable={false}
          className={`inline-flex h-11 items-center rounded-full px-6 text-[15px] font-semibold transition hover:brightness-110 ${s.btn}`}
          data-testid={front ? "deck-open-app" : undefined}
        >
          Open the app
        </Link>
      </div>
    </article>
  );
}

/** Specialties as a deck of punched tags. Swipe either way, or let it deal itself. Static grid with reduced motion. */
export function SpecialtyDeck({ href }: { href: string }) {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { amount: 0.4 });
  const [cursor, setCursor] = useState(0);
  const [move, setMove] = useState<Move>({ kind: "next", dir: -1 });
  // pause while hovered (mouse), pressed (touch or mouse), or driven from the keyboard
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const [kbd, setKbd] = useState(false);
  const paused = hover || press || kbd;
  const busy = useRef(0);

  const go = useCallback((kind: Move["kind"], dir: Move["dir"]) => {
    const now = Date.now();
    if (now - busy.current < 220) return;
    busy.current = now;
    setMove({ kind, dir });
    setCursor((c) => c + (kind === "next" ? 1 : -1));
  }, []);

  useEffect(() => {
    if (reduce || !inView || paused) return;
    const t = setTimeout(() => go("next", -1), AUTO_MS);
    return () => clearTimeout(t);
  }, [reduce, inView, paused, cursor, go]);

  if (reduce) {
    return (
      <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-3" data-testid="specialty-deck" data-mode="static">
        {CARDS.map((_, k) => (
          <li key={k} className="min-w-0"><Card k={k} href={href} front /></li>
        ))}
      </ul>
    );
  }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const v = info.offset.x + info.velocity.x * 0.2;
    if (Math.abs(v) > 80) go("next", v < 0 ? -1 : 1);
  };

  const front = mod(cursor);
  const slots = [0, 1, 2, 3].map((p) => ({ n: cursor + p, p }));

  return (
    <div
      ref={root}
      className="relative"
      data-testid="specialty-deck"
      data-mode="animated"
      data-front={CARDS[front].title}
      role="region"
      aria-roledescription="carousel"
      aria-label="Specialties"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); setKbd(true); go("next", -1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); setKbd(true); go("prev", 1); }
      }}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
      onPointerLeave={() => { setHover(false); setPress(false); }}
      onPointerDown={() => { setPress(true); setKbd(false); }}
      onPointerUp={() => setPress(false)}
      onPointerCancel={() => setPress(false)}
      onFocus={(e) => e.target.matches(":focus-visible") && setKbd(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setKbd(false)}
    >
      <p className="sr-only" aria-live="polite" data-testid="deck-live">
        {`Card ${front + 1} of ${CARDS.length}: ${CARDS[front].title}. ${CARDS[front].badge}.`}
      </p>
      <div className="relative mx-auto h-[440px] w-[min(300px,calc(100vw-5rem))] select-none lg:h-[490px] lg:w-[340px]" data-testid="deck-stage">
        <AnimatePresence initial={false} custom={move}>
          {slots.map(({ n, p }) => {
            const k = mod(n);
            return (
              <motion.div
                key={n}
                className="absolute inset-x-0 top-0 h-[410px] touch-pan-y lg:h-[460px]"
                custom={move}
                variants={{
                  pos: () => POS[p],
                  enter: (m: Move) => (m.kind === "prev" && p === 0 ? { x: -380, y: 40, rotate: -18, scale: 1, opacity: 1, zIndex: 40 } : POS[3]),
                  exit: (m: Move) =>
                    m.kind === "next"
                      ? { x: m.dir * 420, y: 60, rotate: m.dir * 18, opacity: 1, zIndex: 40, transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] } }
                      : { ...POS[3], transition: { duration: 0.25 } },
                }}
                initial="enter"
                animate="pos"
                exit="exit"
                transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                drag={p === 0 ? "x" : false}
                dragSnapToOrigin
                dragElastic={0.9}
                onDragEnd={p === 0 ? onDragEnd : undefined}
                style={{ pointerEvents: p === 0 ? "auto" : "none" }}
                data-testid={p === 0 ? "deck-front" : undefined}
                data-pos={p}
              >
                <Card k={k} href={href} front={p === 0} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <div className="sr-only focus-within:not-sr-only focus-within:mt-3 focus-within:flex focus-within:justify-center focus-within:gap-3">
        <button type="button" onClick={() => go("prev", 1)} className="rounded-full border border-white/20 px-4 py-2 text-sm" data-testid="deck-prev">Previous specialty</button>
        <button type="button" onClick={() => go("next", -1)} className="rounded-full border border-white/20 px-4 py-2 text-sm" data-testid="deck-next">Next specialty</button>
      </div>
    </div>
  );
}
