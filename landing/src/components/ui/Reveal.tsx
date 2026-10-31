"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/** Fade-and-rise on first scroll into view. Content is visible without JS. */
export function Reveal({ children, delay = 0, className = "", as = "div" }: { children: ReactNode; delay?: number; className?: string; as?: "div" | "li" | "section" }) {
  const C = motion[as];
  return (
    <C className={className} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay, ease: [0.2, 0.7, 0.2, 1] }}>
      {children}
    </C>
  );
}
