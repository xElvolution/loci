"use client";

import { motion, type Variants } from "motion/react";
import { useReducedMotionSafe } from "@/lib/hooks/useReducedMotionSafe";
import { useId } from "react";

type Props = { className?: string; animated?: boolean; title?: string };

/**
 * The LOCI wordmark: geometric lowercase "loci".
 * The "o" is a route ring with stops; the dot of the "i" is a map pin.
 */
const ringHover: Variants = {
  rest: { rotate: 0, transition: { duration: 0 } },
  hover: { rotate: 360, transition: { duration: 0.9, ease: [0.65, 0, 0.35, 1] } },
};
const pinHover: Variants = {
  rest: { y: 0, filter: "drop-shadow(0 0 0px rgba(255,193,94,0))", transition: { duration: 0.3 } },
  hover: {
    y: [0, -9, 0, -4, 0],
    filter: "drop-shadow(0 0 6px rgba(255,193,94,0.95))",
    transition: { y: { duration: 0.8, ease: "easeOut" }, filter: { duration: 0.3 } },
  },
};

export function Wordmark({ className, animated = true, title = "loci" }: Props) {
  const id = useId().replace(/:/g, "");
  const reduce = useReducedMotionSafe();
  const play = animated && !reduce;
  return (
    <motion.svg
      viewBox="0 0 176 76"
      className={className}
      role="img"
      aria-label={title}
      initial="rest"
      animate="rest"
      whileHover={reduce ? undefined : "hover"}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`wm-ring-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFC15E" />
          <stop offset="0.55" stopColor="#FF6B5A" />
          <stop offset="1" stopColor="#B48CFF" />
        </linearGradient>
        <radialGradient id={`wm-pin-${id}`} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#FFE3A3" />
          <stop offset="1" stopColor="#FF6B5A" />
        </radialGradient>
      </defs>
      <g fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="round">
        <path d="M12 8 V62" />
        {/* c */}
        <path d="M121.5 34.5 A17.5 17.5 0 1 0 121.5 59.5" />
        {/* i stem */}
        <path d="M150 37 V62" />
      </g>
      {/* o: route ring (spins once on hover) */}
      <motion.g variants={ringHover}>
      <circle cx="53" cy="47" r="17.5" fill="none" stroke="currentColor" strokeOpacity="0.16" strokeWidth="11" />
      <motion.circle
        cx="53"
        cy="47"
        r="17.5"
        fill="none"
        stroke={`url(#wm-ring-${id})`}
        strokeWidth="11"
        strokeLinecap="round"
        transform="rotate(-90 53 47)"
        initial={play ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1], delay: 0.2 }}
      />
      {[0, 90, 180, 270].map((deg, k) => {
        const a = ((deg - 90) * Math.PI) / 180;
        return (
          <motion.circle
            key={deg}
            cx={53 + Math.cos(a) * 17.5}
            cy={47 + Math.sin(a) * 17.5}
            r="2.4"
            fill="#0B0A1F"
            initial={play ? { scale: 0 } : false}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + k * 0.25, type: "spring", stiffness: 400, damping: 18 }}
          />
        );
      })}
      </motion.g>
      {/* i dot: pin (bounces and glows on hover) */}
      <motion.g variants={pinHover}>
      <motion.g
        initial={play ? { y: -14, opacity: 0 } : false}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.3, type: "spring", stiffness: 260, damping: 14 }}
      >
        <path
          d="M150 26 C143 18.5 139.5 14 139.5 9.5 A10.5 10.5 0 0 1 160.5 9.5 C160.5 14 157 18.5 150 26 Z"
          fill={`url(#wm-pin-${id})`}
        />
        <circle cx="150" cy="9.6" r="3.6" fill="#0B0A1F" />
      </motion.g>
      </motion.g>
    </motion.svg>
  );
}
