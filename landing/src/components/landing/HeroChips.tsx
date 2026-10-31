"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/ui/Icon";

const CHIPS = [
  { icon: "check", text: "Check-in done", sub: "Day 9 · 7 day streak", cls: "left-[2%] top-[6%]", tone: "from-mint/30 to-mint/5 text-mint", delay: 0.6 },
  { icon: "users", text: "Marisol picked up the prescription", sub: "Care circle", cls: "right-[0%] top-[0%] hidden sm:flex", tone: "from-lilac/30 to-lilac/5 text-lilac", delay: 1.1 },
  { icon: "tv", text: "Tonight: Somebody Somewhere", sub: "Because you love Ted Lasso", cls: "right-[4%] bottom-[2%]", tone: "from-ember/30 to-ember/5 text-ember", delay: 1.6 },
] as const;

export function HeroChips() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {CHIPS.map((c, k) => (
        <motion.div
          key={c.text}
          className={`absolute ${c.cls} flex max-w-[15rem] items-center gap-2.5 rounded-2xl border border-white/10 bg-dusk-900/80 px-3 py-2 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.8)] backdrop-blur-md`}
          initial={{ opacity: 0, y: 14, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: c.delay, type: "spring", stiffness: 200, damping: 20 }}
        >
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${c.tone} ${k === 1 ? "anim-float-slow" : "anim-float"}`}>
            <Icon name={c.icon} className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-[#f4f1ff]">{c.text}</span>
            <span className="block truncate text-[11px] text-haze">{c.sub}</span>
          </span>
        </motion.div>
      ))}
    </div>
  );
}
