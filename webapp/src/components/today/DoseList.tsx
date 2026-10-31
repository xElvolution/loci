"use client";

import { useOptimistic, useTransition } from "react";
import { motion } from "motion/react";
import { toggleDose } from "@/app/actions";
import { Icon } from "@/components/ui/Icon";
import { KIND_META } from "@/components/care/bits";
import type { PlanKind } from "@/lib/care/types";

export type DoseView = { itemId: string; slot: string; time: string; title: string; detail: string; kind: PlanKind; done: boolean; due: boolean };

export function DoseList({ journeyId, date, doses, canTick }: { journeyId: string; date: string; doses: DoseView[]; canTick: boolean }) {
  const [pending, start] = useTransition();
  const [list, setOptimistic] = useOptimistic(doses, (state, u: { key: string; done: boolean }) => state.map((d) => (`${d.itemId}|${d.slot}` === u.key ? { ...d, done: u.done } : d)));
  const done = list.filter((d) => d.done).length;

  if (!list.length)
    return (
      <p className="rounded-2xl border border-dashed border-white/15 p-5 text-sm text-haze">
        Nothing scheduled today. Add medicines, care tasks and exercises in the plan so they show up here.
      </p>
    );

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8" role="progressbar" aria-valuemin={0} aria-valuemax={list.length} aria-valuenow={done} aria-label="Done today">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-mint via-ember to-coral" initial={false} animate={{ width: `${(done / list.length) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </div>
        <span className="font-mono text-xs text-haze tabular-nums">
          {done}/{list.length}
        </span>
      </div>
      <ul className="space-y-2">
        {list.map((d) => {
          const key = `${d.itemId}|${d.slot}`;
          const meta = KIND_META[d.kind];
          return (
            <li key={key}>
              <button
                type="button"
                disabled={!canTick || pending}
                aria-pressed={d.done}
                onClick={() =>
                  start(async () => {
                    setOptimistic({ key, done: !d.done });
                    await toggleDose({ journeyId, itemId: d.itemId, date, slot: d.slot, done: !d.done });
                  })
                }
                className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition sm:px-4 ${d.done ? "border-mint/25 bg-mint/[0.06]" : d.due ? "border-ember/30 bg-ember/[0.06]" : "border-white/8 bg-white/[0.03] hover:border-white/20"} disabled:cursor-default`}
              >
                <span className="w-14 shrink-0 font-mono text-[12px] text-haze sm:w-16">{d.time}</span>
                <Icon name={meta.icon} className={`h-[18px] w-[18px] shrink-0 ${meta.tone}`} />
                <span className="min-w-0 flex-1">
                  <span className={`block text-[15px] leading-snug ${d.done ? "text-haze line-through decoration-haze/40" : ""}`}>{d.title}</span>
                  {d.detail && <span className="mt-0.5 block text-xs leading-snug text-haze/80">{d.detail}</span>}
                </span>
                <motion.span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${d.done ? "border-mint bg-mint text-night" : "border-haze/40 text-transparent group-hover:border-ember"}`}
                  initial={false}
                  animate={{ scale: d.done ? [1, 1.25, 1] : 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <Icon name="check" className="h-4 w-4" />
                </motion.span>
                <span className="sr-only">{d.done ? "Done, tap to undo" : "Mark as done"}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {!canTick && <p className="mt-3 text-xs text-haze">You follow this journey as family, so you can see progress but not tick tasks.</p>}
    </div>
  );
}
