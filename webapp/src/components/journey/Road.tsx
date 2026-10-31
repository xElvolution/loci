"use client";

import { motion, useReducedMotion } from "motion/react";

export type RoadMark = { id: string; day: number; kind: "appointment" | "milestone"; title: string; reached: boolean };

const W = 1000;
const H = 260;
const pointAt = (t: number) => ({ x: 40 + t * (W - 80), y: 132 + Math.sin(t * Math.PI * 2.6 + 0.4) * 58 });

const CHAR = 7.3; // average glyph width of the 13px label font in viewBox units
const LANES = [-40, 48, -64, 72, -88];
export type Placed = { cx: number; y: number; dy: number; text: string } | null;

/** Places each label above or below its mark so no two labels overlap and none leaves the drawing. */
export function layoutLabels(points: { x: number; y: number; title: string }[], w = W, h = H): Placed[] {
  // rectangles in viewBox units: {l, r, t, b}. The hospital and home drawings are taken.
  const s = pointAt(0);
  const e = pointAt(1);
  const taken: { l: number; r: number; t: number; b: number }[] = [
    { l: s.x - 18, r: s.x + 18, t: s.y - 46, b: s.y - 12 },
    { l: e.x - 22, r: e.x + 22, t: e.y - 52, b: e.y - 14 },
  ];
  const pad = 5;
  const free = (r: { l: number; r: number; t: number; b: number }) => r.t >= 4 && r.b <= h - 24 && !taken.some((o) => r.l < o.r + pad && r.r > o.l - pad && r.t < o.b + 5 && r.b > o.t - 5);
  const order = points.map((p, i) => ({ ...p, i })).sort((a, b) => a.x - b.x);
  const out: Placed[] = points.map(() => null);
  order.forEach((p, k) => {
    for (const max of [24, 14]) {
      const text = p.title.length > max ? `${p.title.slice(0, max - 1).trimEnd()}…` : p.title;
      const width = text.length * CHAR;
      const l = Math.min(Math.max(p.x - width / 2, 4), w - 4 - width);
      const lanes = k % 2 === 0 ? LANES : [LANES[1], LANES[0], LANES[3], LANES[2], LANES[4]];
      for (const dy of lanes) {
        const y = p.y + dy;
        const rect = { l, r: l + width, t: y - 12, b: y + 3 };
        if (free(rect)) {
          taken.push(rect);
          out[p.i] = { cx: l + width / 2, y, dy, text };
          return;
        }
      }
    }
  });
  return out;
}

/** The journey as a winding road from hospital to home, with plan items placed on their day. */
export function Road({ day, horizon, marks }: { day: number; horizon: number; marks: RoadMark[] }) {
  const reduce = useReducedMotion();
  const samples = Array.from({ length: 121 }, (_, i) => pointAt(i / 120));
  const d = samples.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const t = Math.max(0, Math.min(1, day / horizon));
  const me = pointAt(t);
  const travelled = samples.filter((_, i) => i / 120 <= t);
  const dDone = travelled.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const start = pointAt(0);
  const end = pointAt(1);
  const labels = layoutLabels(marks.map((m) => ({ ...pointAt(Math.max(0, Math.min(1, m.day / horizon))), title: m.title })));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Day ${Math.max(0, day)} of ${horizon} on the way home`}>
      <defs>
        <linearGradient id="road-done" x1="0" x2="1">
          <stop offset="0" stopColor="#7cf5d3" />
          <stop offset="1" stopColor="#ffc15e" />
        </linearGradient>
        <radialGradient id="road-home">
          <stop offset="0" stopColor="#ffc15e" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ffc15e" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => {
        const p = pointAt(f);
        return (
          <text key={f} x={p.x} y={H - 6} textAnchor="middle" className="fill-haze/50 font-mono text-[13px]">
            Day {Math.round(f * horizon)}
          </text>
        );
      })}
      <path d={d} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="22" strokeLinecap="round" />
      <path d={d} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="2 10" strokeLinecap="round" />
      <motion.path d={dDone} fill="none" stroke="url(#road-done)" strokeWidth="6" strokeLinecap="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: "easeOut" }} />
      {/* hospital */}
      <g transform={`translate(${start.x - 16} ${start.y - 44})`}>
        <rect width="32" height="30" rx="4" fill="#2a2350" stroke="#8fd3ff" strokeWidth="1.5" />
        <path d="M16 7v16M8 15h16" stroke="#8fd3ff" strokeWidth="3" strokeLinecap="round" />
      </g>
      {/* home */}
      <circle cx={end.x} cy={end.y - 26} r="44" fill="url(#road-home)" />
      <g transform={`translate(${end.x - 18} ${end.y - 50})`}>
        <path d="M2 16L18 2l16 14v18H2z" fill="#3b2d4f" stroke="#ffc15e" strokeWidth="1.8" strokeLinejoin="round" />
        <rect x="14" y="20" width="8" height="14" rx="1" fill="#ffc15e" />
      </g>
      {marks.map((m, k) => {
        const p = pointAt(Math.max(0, Math.min(1, m.day / horizon)));
        const lab = labels[k];
        const color = m.kind === "appointment" ? "#ffc15e" : m.reached ? "#7cf5d3" : "#b48cff";
        return (
          <motion.g key={m.id} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + k * 0.06 }}>
            <title>{`Day ${m.day}: ${m.title}`}</title>
            {lab && <line x1={p.x} y1={p.y} x2={p.x} y2={p.y + (lab.dy < 0 ? lab.dy + 6 : lab.dy - 14)} stroke={color} strokeOpacity="0.5" strokeWidth="1.5" className="hidden md:block" />}
            <circle cx={p.x} cy={p.y} r="7" fill="#151231" stroke={color} strokeWidth="3" />
            {m.reached && <path d={`M${p.x - 3} ${p.y}l2 2.5 4-4.5`} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />}
            {lab && (
              <text x={lab.cx} y={lab.y} textAnchor="middle" className="hidden fill-[#e9e4ff] text-[13px] font-medium md:block" data-testid="road-label">
                {lab.text}
              </text>
            )}
          </motion.g>
        );
      })}
      {day >= 0 && (
        <g>
          <motion.circle cx={me.x} cy={me.y} r="16" fill="#ff6b5a" fillOpacity="0.25" animate={reduce ? undefined : { r: [14, 24, 14], opacity: [0.6, 0.1, 0.6] }} transition={{ duration: 2.4, repeat: Infinity }} />
          <circle cx={me.x} cy={me.y} r="10" fill="#ff6b5a" stroke="#fff3e6" strokeWidth="3" />
        </g>
      )}
    </svg>
  );
}
