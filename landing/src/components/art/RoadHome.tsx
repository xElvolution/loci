"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { boxFaces, makeProj, pts, rng, routePath, windows, type Box } from "@/lib/art/iso";
import { useReducedMotionSafe } from "@/lib/hooks/useReducedMotionSafe";

const P = makeProj(400, 70);
const N = 12;
const WAY: [number, number][] = [
  [2.7, 9.2],
  [5, 9.2],
  [5, 6.6],
  [7.6, 6.6],
  [7.6, 3.6],
  [10.2, 3.6],
  [10.2, 2.95],
];
const MILESTONES = [
  { t: 0, label: "Discharge" },
  { t: 0.27, label: "Day 3" },
  { t: 0.52, label: "Day 14" },
  { t: 0.78, label: "Day 30" },
  { t: 1, label: "Thriving" },
];

const TOWERS: Box[] = [
  { i: 2.2, j: 0.6, w: 1.2, d: 1.2, h: 3.2, tone: 0 },
  { i: 3.8, j: 1.0, w: 1.0, d: 1.4, h: 4.6, tone: 1 },
  { i: 5.4, j: 0.4, w: 1.4, d: 1.0, h: 2.6, tone: 2 },
  { i: 6.0, j: 1.8, w: 1.0, d: 1.0, h: 3.6, tone: 1 },
  { i: 0.8, j: 4.2, w: 1.4, d: 1.4, h: 2.8, tone: 2 },
  { i: 2.6, j: 5.2, w: 1.2, d: 1.2, h: 1.8, tone: 0 },
  { i: 10.4, j: 5.2, w: 1.2, d: 1.4, h: 2.2, tone: 1 },
  { i: 8.6, j: 5.0, w: 1.2, d: 1.2, h: 1.4, tone: 2 },
  { i: 6.2, j: 10.0, w: 1.4, d: 1.2, h: 1.1, tone: 3 },
];
const HOSPITAL: Box = { i: 0.6, j: 8.2, w: 2.0, d: 2.0, h: 4.2, tone: 4 };
const HOME: Box = { i: 9.5, j: 1.4, w: 1.5, d: 1.5, h: 1.25, tone: 5 };
const TONES = [
  { top: "#3b2f86", left: "#1c1546", right: "#2a2163" },
  { top: "#463a99", left: "#211a52", right: "#30276f" },
  { top: "#34296f", left: "#18123d", right: "#251d58" },
  { top: "#ff8a6f", left: "#7a2e3c", right: "#a8434a" },
  { top: "#d9f7ee", left: "#5d7f97", right: "#89aec2" },
  { top: "#ffd9a0", left: "#7a4a35", right: "#a86a44" },
];
const TREES: [number, number, number][] = [
  [8.6, 8.4, 0.5], [9.5, 9.1, 0.42], [10.4, 8.3, 0.48], [8.9, 10.2, 0.4], [10.6, 10.0, 0.45], [3.8, 10.6, 0.38], [4.2, 7.6, 0.36], [6.4, 5.2, 0.34], [8.6, 2.4, 0.32], [11.2, 3.9, 0.36], [1.4, 6.9, 0.34], [6.8, 8.2, 0.3],
];

function polyPoint(t: number) {
  const p = WAY.map(([i, j]) => P(i, j));
  const seg = p.slice(1).map((b, k) => Math.hypot(b.x - p[k].x, b.y - p[k].y));
  const total = seg.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, t)) * total;
  for (let k = 0; k < seg.length; k++) {
    if (d <= seg[k] || k === seg.length - 1) {
      const f = seg[k] ? Math.min(1, d / seg[k]) : 0;
      return { x: p[k].x + (p[k + 1].x - p[k].x) * f, y: p[k].y + (p[k + 1].y - p[k].y) * f };
    }
    d -= seg[k];
  }
  return p[p.length - 1];
}

function Building({ b, lit, flick }: { b: Box; lit: (k: number) => boolean; flick: (k: number) => boolean }) {
  const f = boxFaces(P, b);
  const tone = TONES[b.tone];
  return (
    <g>
      <polygon points={pts(f.left)} fill={tone.left} />
      <polygon points={pts(f.right)} fill={tone.right} />
      <polygon points={pts(f.top)} fill={tone.top} />
      {windows(P, b).map((w) =>
        lit(w.k) ? <polygon key={w.k} points={pts(w.q)} fill="#ffc15e" opacity={0.85} className={flick(w.k) ? "anim-flicker" : undefined} /> : <polygon key={w.k} points={pts(w.q)} fill="#0b0a1f" opacity={0.35} />,
      )}
    </g>
  );
}

export function RoadHome({ className = "" }: { className?: string }) {
  const reduce = useReducedMotionSafe();
  const progress = useMotionValue(0);
  const [reached, setReached] = useState(0);
  const x = useTransform(progress, (t) => polyPoint(t).x);
  const y = useTransform(progress, (t) => polyPoint(t).y);
  const trail = useTransform(progress, (t) => Math.max(0.001, t));

  useEffect(() => {
    if (reduce) {
      progress.set(1);
      const id = requestAnimationFrame(() => setReached(MILESTONES.length));
      return () => cancelAnimationFrame(id);
    }
    const controls = animate(progress, [0, 1], {
      duration: 11,
      ease: [0.45, 0, 0.3, 1],
      repeat: Infinity,
      repeatDelay: 3,
      onUpdate: (v) => {
        const n = MILESTONES.filter((m) => v >= m.t - 0.002).length;
        setReached((prev) => (prev === n ? prev : n));
      },
    });
    return () => controls.stop();
  }, [progress, reduce]);

  const d = useMemo(() => routePath(P, WAY, 12), []);
  const r = useMemo(() => rng(42), []);
  const lights = useMemo(() => Array.from({ length: 400 }, () => r()), [r]);
  const stars = useMemo(() => {
    const s = rng(7);
    return Array.from({ length: 46 }, () => ({ x: 50 + s() * 700, y: -36 + s() * 150, r: 0.6 + s() * 1.3, delay: s() * 4 }));
  }, []);
  const home = reached >= MILESTONES.length;
  const ground = [P(0, 0), P(N, 0), P(N, N), P(0, N)];
  const park = [P(8, 7.8), P(11.2, 7.8), P(11.2, 11), P(8, 11)];
  const hf = boxFaces(P, HOSPITAL);
  const homeF = boxFaces(P, HOME);
  const roofL = P(HOME.i, HOME.j + HOME.d / 2, HOME.h + 0.9);
  const roofR = P(HOME.i + HOME.w, HOME.j + HOME.d / 2, HOME.h + 0.9);
  const sign = P(HOSPITAL.i + HOSPITAL.w, HOSPITAL.j + 1, 3.3);

  return (
    <svg viewBox="40 -40 720 470" className={className} role="img" aria-label="Animated map: a glowing route leads from a hospital, past milestones, to a home whose windows light up">
      <defs>
        <radialGradient id="rh-ground" cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#2a2163" />
          <stop offset="1" stopColor="#140f33" />
        </radialGradient>
        <linearGradient id="rh-route" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#7cf5d3" />
          <stop offset="0.5" stopColor="#ffc15e" />
          <stop offset="1" stopColor="#ff6b5a" />
        </linearGradient>
        <radialGradient id="rh-glow">
          <stop offset="0" stopColor="#ffc15e" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffc15e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rh-home" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffb86b" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ff6b5a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {stars.map((s, k) => (
        <circle key={k} cx={s.x} cy={s.y} r={s.r} fill="#ece8ff" className="anim-twinkle" style={{ animationDelay: `${s.delay}s` }} />
      ))}
      <g transform="translate(676 -6)">
        <circle r="20" fill="#ffe3a3" />
        <circle r="20" cx="9" cy="-6" fill="#0f0c29" />
      </g>

      <polygon points={pts(ground)} fill="url(#rh-ground)" stroke="#b9b0e6" strokeOpacity="0.18" />
      <g stroke="#b9b0e6" strokeOpacity="0.06">
        {Array.from({ length: N - 1 }, (_, k) => k + 1).map((k) => (
          <g key={k}>
            <line x1={P(k, 0).x} y1={P(k, 0).y} x2={P(k, N).x} y2={P(k, N).y} />
            <line x1={P(0, k).x} y1={P(0, k).y} x2={P(N, k).x} y2={P(N, k).y} />
          </g>
        ))}
      </g>
      <polygon points={pts(park)} fill="#1f4a4a" opacity="0.65" />
      <ellipse cx={P(9.6, 9.6).x} cy={P(9.6, 9.6).y} rx="26" ry="12" fill="#2f6f8f" opacity="0.7" />

      {/* the road home */}
      <path d={d} fill="none" stroke="#0b0a1f" strokeOpacity="0.55" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#2c2370" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#ffc15e" strokeOpacity="0.35" strokeWidth="1.6" strokeDasharray="6 14" className="anim-march" />
      <motion.path d={d} fill="none" stroke="url(#rh-route)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" style={{ pathLength: trail }} />

      {[...TOWERS.slice(0, 6)].map((b, k) => (
        <Building key={`t${k}`} b={b} lit={(w) => lights[(k * 37 + w) % 400] > 0.45} flick={(w) => lights[(k * 53 + w) % 400] > 0.93} />
      ))}

      {/* hospital */}
      <g>
        <polygon points={pts(hf.left)} fill={TONES[4].left} />
        <polygon points={pts(hf.right)} fill={TONES[4].right} />
        <polygon points={pts(hf.top)} fill={TONES[4].top} />
        {windows(P, HOSPITAL).map((w) => (
          <polygon key={w.k} points={pts(w.q)} fill={lights[(w.k * 7) % 400] > 0.3 ? "#e9fff8" : "#3b5a70"} opacity="0.9" />
        ))}
        <g transform={`translate(${sign.x - 10} ${sign.y - 12})`}>
          <rect width="20" height="20" rx="5" fill="#7cf5d3" className="anim-glow" />
          <path d="M6 5v10M14 5v10M6 10h8" stroke="#0b0a1f" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      </g>

      {TREES.map(([i, j, s], k) => {
        const b = P(i, j);
        return (
          <g key={k} className="anim-sway" style={{ animationDelay: `${(k % 5) * 0.7}s` }}>
            <rect x={b.x - 1.5} y={b.y - 10 * s - 2} width="3" height={10 * s + 2} fill="#3a2a2a" />
            <ellipse cx={b.x} cy={b.y - 22 * s} rx={16 * s} ry={20 * s} fill={k % 3 ? "#2e7d6b" : "#3f9a7f"} />
            <ellipse cx={b.x - 4 * s} cy={b.y - 28 * s} rx={7 * s} ry={8 * s} fill="#7cf5d3" opacity="0.25" />
          </g>
        );
      })}

      {TOWERS.slice(6).map((b, k) => (
        <Building key={`f${k}`} b={b} lit={(w) => lights[(k * 91 + w) % 400] > 0.4} flick={() => false} />
      ))}
      {(() => {
        const c = TOWERS[8];
        const a1 = P(c.i, c.j + c.d, c.h);
        const a2 = P(c.i + c.w, c.j + c.d, c.h);
        return <path d={`M${a1.x} ${a1.y} L${a2.x} ${a2.y} L${a2.x + 6} ${a2.y + 9} L${a1.x + 6} ${a1.y + 9} Z`} fill="#ffc15e" opacity="0.9" />;
      })()}

      {/* home */}
      <g>
        <ellipse cx={P(10.25, 2.15).x} cy={P(10.25, 2.15).y} rx="80" ry="44" fill="url(#rh-home)" opacity={home ? 1 : 0.25} style={{ transition: "opacity 900ms ease" }} />
        <polygon points={pts(homeF.left)} fill={TONES[5].left} />
        <polygon points={pts(homeF.right)} fill={TONES[5].right} />
        <polygon points={pts([P(HOME.i, HOME.j + HOME.d, HOME.h), P(HOME.i + HOME.w, HOME.j + HOME.d, HOME.h), roofR, roofL])} fill="#ff6b5a" />
        <polygon points={pts([P(HOME.i + HOME.w, HOME.j, HOME.h), P(HOME.i + HOME.w, HOME.j + HOME.d, HOME.h), roofR])} fill="#c4483f" />
        <polygon points={pts([P(HOME.i + 0.25, HOME.j + HOME.d, 0.35), P(HOME.i + 0.55, HOME.j + HOME.d, 0.35), P(HOME.i + 0.55, HOME.j + HOME.d, 0.75), P(HOME.i + 0.25, HOME.j + HOME.d, 0.75)])} fill={home ? "#ffe3a3" : "#3a2440"} style={{ transition: "fill 600ms ease" }} />
        <polygon points={pts([P(HOME.i + 0.8, HOME.j + HOME.d, 0), P(HOME.i + 1.1, HOME.j + HOME.d, 0), P(HOME.i + 1.1, HOME.j + HOME.d, 0.7), P(HOME.i + 0.8, HOME.j + HOME.d, 0.7)])} fill={home ? "#ffc15e" : "#2a1c33"} style={{ transition: "fill 600ms ease" }} />
        <polygon points={pts([P(HOME.i + HOME.w, HOME.j + 0.4, 0.35), P(HOME.i + HOME.w, HOME.j + 0.8, 0.35), P(HOME.i + HOME.w, HOME.j + 0.8, 0.75), P(HOME.i + HOME.w, HOME.j + 0.4, 0.75)])} fill={home ? "#ffe3a3" : "#3a2440"} style={{ transition: "fill 600ms ease" }} />
        <motion.g initial={false} animate={home ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 10, scale: 0.6 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} style={{ originX: `${roofL.x + 14}px`, originY: `${roofL.y - 26}px` }}>
          <path transform={`translate(${(roofL.x + roofR.x) / 2 - 9} ${Math.min(roofL.y, roofR.y) - 40})`} d="M9 16S0 10.5 0 5a4.5 4.5 0 0 1 9-1.4A4.5 4.5 0 0 1 18 5c0 5.5-9 11-9 11z" fill="#ff6b5a" stroke="#ffe3a3" strokeWidth="1.2" />
        </motion.g>
      </g>

      {/* milestones */}
      {MILESTONES.map((m, k) => {
        const p = polyPoint(m.t);
        const on = reached > k;
        const right = k === MILESTONES.length - 1;
        return (
          <g key={m.label} transform={`translate(${p.x} ${p.y})`}>
            <circle r={on ? 7 : 5} fill={on ? "#ffc15e" : "#3b2f86"} stroke="#0b0a1f" strokeWidth="2" style={{ transition: "r 300ms ease, fill 300ms ease" }} />
            {on && <circle r="7" fill="none" stroke="#ffc15e" className="anim-ripple" style={{ transformBox: "fill-box", transformOrigin: "center" }} />}
            <g transform={`translate(${right ? 14 : 0} ${right ? -2 : -16})`}>
              <rect x={right ? 0 : -m.label.length * 3.6 - 8} y="-11" width={m.label.length * 7.2 + 16} height="18" rx="9" fill="#0b0a1f" opacity={on ? 0.85 : 0.55} />
              <text x={right ? m.label.length * 3.6 + 8 : 0} y="2" textAnchor="middle" fontFamily="var(--font-jetbrains), monospace" fontSize="10" letterSpacing="0.06em" fill={on ? "#ffc15e" : "#b9b0e6"}>
                {m.label.toUpperCase()}
              </text>
            </g>
          </g>
        );
      })}

      {/* traveler */}
      <motion.g style={{ x, y }}>
        <circle r="22" fill="url(#rh-glow)" />
        <circle r="6.5" fill="#fff4dc" stroke="#ff6b5a" strokeWidth="2.5" />
      </motion.g>
    </svg>
  );
}
