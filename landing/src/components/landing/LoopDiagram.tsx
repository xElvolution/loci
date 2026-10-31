"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

const NODES = [
  { k: "plan", who: "Clinician", title: "Plan", body: "Start from a specialty template and write each medicine, task, exercise, appointment and warning sign: what, why and how.", icon: "edit", hue: "#b48cff" },
  { k: "follow", who: "Patient and family", title: "Follow", body: "Enter the code, then tick off today's steps, check in for two minutes and ask the team questions.", icon: "check", hue: "#ff9a5a" },
  { k: "track", who: "Clinician", title: "Track", body: "Adherence, check-in trends, flagged check-ins against your own rules, notes and questions, live.", icon: "trend", hue: "#7cf5d3" },
  { k: "adjust", who: "Clinician", title: "Adjust", body: "Change the plan in place. The patient sees \u201cyour care team updated your plan\u201d and what changed.", icon: "refresh", hue: "#ffc15e" },
] as const;

const STEP_MS = 4200;
// node centers on the ring, as % of the square (top, right, bottom, left)
const POS = [
  { x: 50, y: 10 },
  { x: 90, y: 50 },
  { x: 50, y: 90 },
  { x: 10, y: 50 },
];

/* ---------- micro-scenes ---------- */

function Row({ d, still, children, className = "" }: { d: number; still: boolean; children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={still ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: still ? 0 : d, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Typed({ text, d, still }: { text: string; d: number; still: boolean }) {
  if (still) return <>{text}</>;
  return (
    <span className="relative inline-block">
      <motion.span
        className="inline-block overflow-hidden whitespace-nowrap align-bottom"
        initial={{ maxWidth: 0 }}
        animate={{ maxWidth: 400 }}
        transition={{ delay: d, duration: 0.9, ease: "linear" }}
      >
        {text}
      </motion.span>
    </span>
  );
}

function ScenePlan({ still }: { still: boolean }) {
  const lines = [
    { t: "8 am", v: "Pain relief, as prescribed", c: "text-lilac" },
    { t: "10 am", v: "Physio sheet A, 3 sets", c: "text-mint" },
    { t: "Watch", v: "Calf swelling: call us", c: "text-coral" },
  ];
  return (
    <div className="space-y-2.5">
      <Row d={0} still={still} className="flex items-center justify-between gap-2 text-xs text-haze">
        <span className="label-mono text-[10px] text-lilac">Plan editor</span>
        <span className="truncate">Knee template</span>
      </Row>
      {lines.map((l, i) => (
        <Row key={l.v} d={0.25 + i * 0.75} still={still} className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px]">
          <span className={`w-11 shrink-0 font-mono text-[11px] ${l.c}`}>{l.t}</span>
          <span className="min-w-0 overflow-hidden text-[#f4f1ff]"><Typed text={l.v} d={0.35 + i * 0.75} still={still} /></span>
        </Row>
      ))}
      <Row d={2.7} still={still} className="flex flex-wrap items-center gap-2 pt-1">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-lilac px-3 py-1.5 text-xs font-semibold text-night"><Icon name="send" className="h-3.5 w-3.5" /> Sent</span>
        <span className="font-mono text-xs text-haze">code K7P 3QX</span>
      </Row>
    </div>
  );
}

function Tick({ d, still, done = true }: { d: number; still: boolean; done?: boolean }) {
  return (
    <span className="relative grid h-5 w-5 shrink-0 place-items-center rounded-md border border-white/25">
      {done && (
        <motion.span
          className="absolute inset-0 grid place-items-center rounded-md bg-ember text-night"
          initial={still ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: still ? 0 : d, type: "spring", stiffness: 500, damping: 22 }}
        >
          <Icon name="check" className="h-3.5 w-3.5" />
        </motion.span>
      )}
    </span>
  );
}

function SceneFollow({ still }: { still: boolean }) {
  const items = ["Pain relief, 8 am", "Physio sheet A", "Short walk with Sam"];
  return (
    <div className="space-y-2.5">
      <Row d={0} still={still} className="flex items-center justify-between gap-2 text-xs text-haze">
        <span className="label-mono text-[10px] text-[#ff9a5a]">Today, day 9</span>
        <span>2 of 3 done</span>
      </Row>
      {items.map((it, i) => (
        <Row key={it} d={0.15 + i * 0.15} still={still} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] text-[#f4f1ff]">
          <Tick d={0.7 + i * 0.6} still={still} done={i < 2} />
          <span className="min-w-0 truncate">{it}</span>
        </Row>
      ))}
      <Row d={2.1} still={still} className="flex items-center justify-between gap-2 rounded-xl border border-[#ff9a5a]/30 bg-[#ff9a5a]/10 px-3 py-2 text-[13px]">
        <span className="text-[#f4f1ff]">Check-in: how is the pain?</span>
        <span className="flex shrink-0 gap-1" aria-hidden="true">
          {[3, 5, 7].map((v, i) => (
            <motion.span
              key={v}
              className={`grid h-6 w-6 place-items-center rounded-full font-mono text-[11px] ${i === 2 ? "bg-coral text-night" : "bg-white/10 text-haze"}`}
              initial={still ? false : { scale: i === 2 ? 0.6 : 1 }}
              animate={{ scale: 1 }}
              transition={{ delay: still ? 0 : 2.6, type: "spring", stiffness: 400, damping: 14 }}
            >
              {v}
            </motion.span>
          ))}
        </span>
      </Row>
    </div>
  );
}

function SceneTrack({ still }: { still: boolean }) {
  const days = [100, 100, 66, 100, 100, 66, 66];
  return (
    <div className="space-y-2.5">
      <Row d={0} still={still} className="flex items-center justify-between gap-2 text-xs text-haze">
        <span className="label-mono shrink-0 text-[10px] text-mint">Dashboard</span>
        <span className="truncate">Daniel, day 9</span>
      </Row>
      <Row d={0.1} still={still} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2 text-[13px]">
          <span className="text-[#f4f1ff]">Adherence, last 7 days</span>
          <span className="font-mono text-mint">86%</span>
        </div>
        <div className="mt-2 flex h-12 items-end gap-1.5" aria-hidden="true">
          {days.map((h, i) => (
            <motion.span
              key={i}
              className={`flex-1 origin-bottom rounded-t ${h === 100 ? "bg-mint/80" : "bg-mint/35"}`}
              style={{ height: `${h}%` }}
              initial={still ? false : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: still ? 0 : 0.3 + i * 0.12, duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
            />
          ))}
        </div>
      </Row>
      <Row d={1.8} still={still} className="flex items-center justify-between gap-2 rounded-xl border border-coral/40 bg-coral/10 px-3 py-2 text-[13px]">
        <span className="flex min-w-0 items-start gap-2 text-[#f4f1ff]"><Icon name="flag" className="mt-0.5 h-4 w-4 shrink-0 text-coral" /><span className="min-w-0">Pain 7 crossed your rule of 6</span></span>
        <span className="shrink-0 text-xs text-coral">Flagged</span>
      </Row>
    </div>
  );
}

function SceneAdjust({ still }: { still: boolean }) {
  return (
    <div className="space-y-2.5">
      <Row d={0} still={still} className="flex items-center justify-between gap-2 text-xs text-haze">
        <span className="label-mono text-[10px] text-ember">Plan, edited in place</span>
        <span>v2</span>
      </Row>
      <Row d={0.1} still={still} className="relative flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] text-haze">
        <span className="w-11 shrink-0 font-mono text-[11px]">10 am</span>
        <span className="relative min-w-0 truncate">
          Physio sheet A, 3 sets
          <motion.span
            className="absolute top-1/2 left-0 h-px w-full origin-left bg-coral"
            initial={still ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: still ? 0 : 0.7, duration: 0.5 }}
            aria-hidden="true"
          />
        </span>
      </Row>
      <Row d={1.2} still={still} className="flex items-center gap-2.5 rounded-xl border border-ember/40 bg-ember/10 px-3 py-2 text-[13px] text-[#f4f1ff]">
        <span className="w-11 shrink-0 font-mono text-[11px] text-ember">10 am</span>
        <span className="min-w-0 truncate">Physio sheet B, 2 sets</span>
      </Row>
      <Row d={2.0} still={still} className="flex items-start gap-2.5 rounded-xl bg-paper px-3 py-2.5 text-[13px] text-ink">
        <Icon name="bell" className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
        <span className="min-w-0"><b>Your care team updated your plan.</b> Physio is gentler this week.</span>
      </Row>
    </div>
  );
}

const SCENES = [ScenePlan, SceneFollow, SceneTrack, SceneAdjust];

/* ---------- ring ---------- */

function Ring({ active, turns, still, onPick }: { active: number; turns: number; still: boolean; onPick: (i: number) => void }) {
  const hue = NODES[active].hue;
  return (
    <div className="relative mx-auto aspect-square w-[calc(100%-2rem)] max-w-[340px] sm:max-w-[400px]" data-testid="loop-ring">
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="loop-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b48cff" />
            <stop offset="35%" stopColor="#ff9a5a" />
            <stop offset="70%" stopColor="#7cf5d3" />
            <stop offset="100%" stopColor="#ffc15e" />
          </linearGradient>
        </defs>
        <circle cx="200" cy="200" r="160" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
        <circle cx="200" cy="200" r="160" fill="none" stroke="url(#loop-grad)" strokeWidth="2" strokeDasharray="3 9" opacity="0.55" className={still ? "" : "anim-ring-march"} />
        {/* progress arc from Plan to the active step */}
        <motion.circle
          cx="200" cy="200" r="160" fill="none" stroke={hue} strokeWidth="4" strokeLinecap="round"
          transform="rotate(-90 200 200)"
          initial={false}
          animate={{ pathLength: still ? 1 : Math.max(0.02, active / 4 + 0.001), stroke: hue }}
          transition={{ duration: still ? 0 : 0.9, ease: [0.4, 0, 0.2, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${hue})` }}
        />
        {/* traveller: always moves forward, so Adjust flows back round to Follow */}
        {!still && (
          <motion.g initial={false} animate={{ rotate: turns * 90 }} transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }} style={{ originX: "200px", originY: "200px" }}>
            <circle cx="200" cy="40" r="9" fill={hue} opacity="0.25" />
            <circle cx="200" cy="40" r="5" fill="#fff" />
          </motion.g>
        )}
      </svg>
      {NODES.map((n, i) => {
        const on = still || i === active;
        return (
          <button
            key={n.k}
            type="button"
            onClick={() => onPick(i)}
            aria-label={`${n.title}: ${n.who}`}
            aria-pressed={i === active}
            className="absolute grid h-14 w-14 place-items-center rounded-2xl border transition-[background,border-color,box-shadow,transform] duration-500 focus-visible:ring-2 focus-visible:ring-ember focus-visible:outline-none sm:h-16 sm:w-16"
            style={{
              left: `${POS[i].x}%`,
              top: `${POS[i].y}%`,
              background: on ? `${n.hue}26` : "#0f0c29",
              borderColor: on ? n.hue : "rgba(255,255,255,0.12)",
              color: on ? n.hue : "#b9b0e6",
              boxShadow: i === active && !still ? `0 0 0 6px ${n.hue}1f, 0 0 32px ${n.hue}66` : "none",
              transform: `translate(-50%, -50%) scale(${i === active && !still ? 1.08 : 1})`,
            }}
            data-testid={`loop-node-${n.k}`}
          >
            <Icon name={n.icon} className="h-6 w-6" />
          </button>
        );
      })}
      {/* centre: the step in words */}
      <div className="absolute inset-[22%] grid place-items-center text-center">
        <div className="min-w-0">
          {still ? (
            <>
              <p className="font-mono text-xs text-haze">Plan, follow, track, adjust</p>
              <p className="mt-2 text-2xl font-bold sm:text-3xl">and back again</p>
            </>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <p className="font-mono text-xs" style={{ color: NODES[active].hue }}>0{active + 1} of 04</p>
                <p className="mt-1 text-3xl font-bold sm:text-4xl">{NODES[active].title}</p>
                <p className="label-mono mt-2 text-[10px] text-haze">{NODES[active].who}</p>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

/** The care loop: plan, follow, track, adjust, and back to follow. Plays itself while on screen; tap a step to hold it. Static and complete with reduced motion. */
export function LoopDiagram() {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { amount: 0.35 });
  const [active, setActive] = useState(0);
  const [turns, setTurns] = useState(0);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (reduce || !inView || held) return;
    const t = setTimeout(() => {
      // after Adjust, the loop returns to Follow: the patient always has the current plan
      setActive((a) => (a === 3 ? 1 : a + 1));
      setTurns((n) => n + (active === 3 ? 2 : 1));
    }, STEP_MS);
    return () => clearTimeout(t);
  }, [reduce, inView, held, active]);

  useEffect(() => {
    if (!held) return;
    const t = setTimeout(() => setHeld(false), 12000);
    return () => clearTimeout(t);
  }, [held, active]);

  const pick = (i: number) => {
    setHeld(true);
    setTurns((n) => n + ((i - active + 4) % 4));
    setActive(i);
  };

  if (reduce) {
    return (
      <div className="relative" data-testid="loop-diagram" data-mode="static">
        <ol className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {NODES.map((n, i) => {
            const S = SCENES[i];
            return (
              <li key={n.k} className="min-w-0 rounded-3xl border border-white/10 bg-dusk-950/80 p-5 sm:p-6" data-testid={`loop-step-${n.k}`}>
                <StepHead n={n} i={i} />
                <p className="mt-2 text-[15px] leading-relaxed text-haze text-pretty">{n.body}</p>
                <div className="mt-4 rounded-2xl border border-white/10 bg-night/70 p-4"><S still /></div>
              </li>
            );
          })}
        </ol>
        <LoopNote />
      </div>
    );
  }

  const Scene = SCENES[active];
  const n = NODES[active];
  return (
    <div ref={root} className="relative" data-testid="loop-diagram" data-mode="animated" data-active={n.k}>
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-14">
        <Ring active={active} turns={turns} still={false} onPick={pick} />
        <div className="min-w-0">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-dusk-950/80 p-5 sm:p-7" data-testid="loop-scene">
            <span className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full opacity-25 blur-3xl transition-colors duration-700" style={{ background: n.hue }} aria-hidden="true" />
            <div className="relative min-h-[392px] sm:min-h-[340px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={n.k} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}>
                  <StepHead n={n} i={active} />
                  <p className="mt-2 text-[15px] leading-relaxed text-haze text-pretty" aria-live="polite">{n.body}</p>
                  <div className="mt-5 rounded-2xl border border-white/10 bg-night/70 p-4"><Scene still={false} /></div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2" role="group" aria-label="Loop steps">
            {NODES.map((s, i) => (
              <button
                key={s.k}
                type="button"
                onClick={() => pick(i)}
                aria-pressed={i === active}
                className={`relative min-w-0 overflow-hidden rounded-xl border px-2 py-2.5 text-left text-[13px] font-semibold transition focus-visible:ring-2 focus-visible:ring-ember focus-visible:outline-none ${i === active ? "border-white/25 bg-white/[0.07] text-[#f4f1ff]" : "border-white/10 text-haze hover:text-[#f4f1ff]"}`}
                data-testid={`loop-step-${s.k}`}
              >
                <span className="block truncate text-center sm:text-left"><span className="hidden font-mono text-[10px] opacity-70 sm:inline">0{i + 1} </span>{s.title}</span>
                {i === active && (
                  <motion.span
                    key={`${active}-${held}`}
                    className="absolute bottom-0 left-0 h-0.5 w-full origin-left"
                    style={{ background: s.hue }}
                    initial={{ scaleX: held ? 1 : 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: held || !inView ? 0 : STEP_MS / 1000, ease: "linear" }}
                    aria-hidden="true"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      <LoopNote />
    </div>
  );
}

function StepHead({ n, i }: { n: (typeof NODES)[number]; i: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl" style={{ background: `${n.hue}22`, color: n.hue }}>
        <Icon name={n.icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="label-mono text-[10px]" style={{ color: n.hue }}>0{i + 1} · {n.who}</p>
        <h3 className="text-2xl font-bold">{n.title}</h3>
      </div>
    </div>
  );
}

function LoopNote() {
  return (
    <div className="mt-8 flex items-start gap-3 rounded-3xl border border-dashed border-white/15 px-4 py-2.5 text-sm text-haze md:mx-auto md:max-w-3xl md:items-center md:rounded-full">
      <Icon name="refresh" className="h-4 w-4 shrink-0 text-ember" />
      <span className="min-w-0">Adjust loops back to Follow: the patient always has the current plan, and the team always sees how it is going.</span>
    </div>
  );
}
