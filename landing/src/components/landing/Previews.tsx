"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/ui/Icon";

/** Small animated product vignettes for the landing page. They show the real UI patterns. */
export function TodayPreview() {
  const rows = [
    { t: "8 am", title: "Pain relief, as on your discharge letter", icon: "pill", done: true },
    { t: "9:30 am", title: "Physio sheet A", icon: "walk", done: true },
    { t: "10 am", title: "Ice and elevate the knee", icon: "care", done: false },
    { t: "2 pm", title: "Pain relief, as on your discharge letter", icon: "pill", done: false },
  ];
  return (
    <div className="rounded-[28px] border border-white/10 bg-dusk-950/90 p-4 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="label-mono text-[10px] text-ember">Day 9 of 84</p>
          <p className="text-lg font-bold">Good morning, Daniel</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-ember/15 px-2.5 py-1 text-xs font-semibold text-ember">
          <Icon name="flame" className="h-3.5 w-3.5" /> 7
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {rows.map((r, k) => (
          <motion.li key={k} className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5" initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 * k }}>
            <span className="w-14 shrink-0 font-mono text-[11px] text-haze">{r.t}</span>
            <Icon name={r.icon} className="h-4 w-4 shrink-0 text-lilac" />
            <span className="min-w-0 flex-1 truncate text-[13px]">{r.title}</span>
            <motion.span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${r.done ? "border-mint bg-mint text-night" : "border-haze/40"}`}
              initial={{ scale: 0.6 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + 0.15 * k, type: "spring", stiffness: 400, damping: 14 }}
            >
              {r.done && <Icon name="check" className="h-3.5 w-3.5" />}
            </motion.span>
          </motion.li>
        ))}
      </ul>
      <div className="mt-3 rounded-2xl border border-coral/30 bg-coral/10 p-3">
        <p className="flex items-center gap-2 text-xs font-semibold text-coral">
          <Icon name="phone" className="h-4 w-4" /> When to call, from your care team
        </p>
        <p className="mt-1 text-[12px] text-[#f4dcd6]">Calf pain, swelling or warmth in either leg</p>
      </div>
    </div>
  );
}

export function DashboardPreview() {
  const rows = [
    { n: "Daniel", s: "Orthopedics", d: 9, a: 0.9, flag: false, line: [7, 6, 8, 8, 5, 4, 4, 3] },
    { n: "Grace", s: "Elder care", d: 16, a: 0.82, flag: true, line: [3, 3, 2, 3, 2, 1, 1, 1] },
    { n: "Amara", s: "Postpartum", d: 13, a: 0.86, flag: false, line: [2, 3, 3, 3, 4, 4, 4, 4] },
    { n: "Rosa", s: "Neuro rehab", d: 22, a: 0.78, flag: true, line: [3, 2, 2, 2, 1, 1, 2, 1] },
  ];
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-dusk-950/90">
      <div className="grid grid-cols-3 gap-2 border-b border-white/8 p-4 text-center">
        {[
          ["Active journeys", "9"],
          ["Plan adherence, 7 days", "86%"],
          ["Flags to review", "3"],
        ].map(([l, v]) => (
          <div key={l} className="min-w-0">
            <p className="text-2xl font-bold tabular-nums">{v}</p>
            <p className="truncate text-[10px] text-haze">{l}</p>
          </div>
        ))}
      </div>
      <ul className="divide-y divide-white/6">
        {rows.map((r, k) => (
          <motion.li key={r.n} className="flex items-center gap-3 px-4 py-3" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.12 * k }}>
            <div className="w-24 min-w-0 shrink-0">
              <p className="truncate text-sm font-semibold">{r.n}</p>
              <p className="truncate text-[11px] text-haze">
                {r.s} · day {r.d}
              </p>
            </div>
            <svg viewBox="0 0 70 24" className="h-6 w-16 shrink-0 sm:w-20" aria-hidden="true">
              <polyline fill="none" stroke={r.flag ? "#ff6b5a" : "#7cf5d3"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={r.line.map((v, i) => `${i * 10},${22 - v * 2.4}`).join(" ")} />
            </svg>
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-mint to-ember" initial={{ width: 0 }} whileInView={{ width: `${r.a * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.2 + 0.1 * k }} />
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.flag ? "bg-coral/15 text-coral" : "bg-white/5 text-haze"}`}>{r.flag ? "Flag" : "Steady"}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
