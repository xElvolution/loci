"use client";

import { useOptimistic, useTransition } from "react";
import { toggleMilestone } from "@/app/actions";
import { Icon } from "@/components/ui/Icon";

export type MilestoneView = { id: string; title: string; when: string | null; reached: boolean };

export function MilestoneList({ journeyId, items, canEdit }: { journeyId: string; items: MilestoneView[]; canEdit: boolean }) {
  const [view, set] = useOptimistic(items, (s, p: { id: string; reached: boolean }) => s.map((m) => (m.id === p.id ? { ...m, reached: p.reached } : m)));
  const [, start] = useTransition();
  if (!view.length) return <p className="text-sm text-haze">No milestones yet. Add them in the plan.</p>;
  return (
    <ul className="space-y-2">
      {view.map((m) => (
        <li key={m.id}>
          <button
            type="button"
            disabled={!canEdit}
            aria-pressed={m.reached}
            onClick={() =>
              start(async () => {
                set({ id: m.id, reached: !m.reached });
                await toggleMilestone(journeyId, m.id, !m.reached);
              })
            }
            className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition disabled:cursor-default ${m.reached ? "border-mint/30 bg-mint/[0.07]" : "border-white/10 hover:border-white/25"}`}
          >
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${m.reached ? "bg-mint text-night" : "border-2 border-lilac/50 text-lilac"}`}>
              <Icon name={m.reached ? "check" : "flag"} className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[15px] font-medium ${m.reached ? "text-white" : ""}`}>{m.title}</span>
              {m.when && <span className="block text-xs text-haze">{m.when}</span>}
            </span>
            {m.reached && <span className="shrink-0 text-xs font-semibold text-mint">Reached</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}
