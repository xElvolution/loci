"use client";

import { useState, useTransition } from "react";
import { setResearchConsentAction } from "@/app/actions";

export function ResearchToggle({ journeyId, name, on, canChange, why }: { journeyId: string; name: string; on: boolean; canChange: boolean; why: string | null }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="py-3" data-testid="research-row">
      <label className={`flex items-center justify-between gap-4 ${canChange ? "cursor-pointer" : "opacity-70"}`}>
        <span className="min-w-0">
          <span className="font-semibold">{name}</span>
          <span className="block text-sm text-haze">{why ?? (on ? "Included in research counts" : "Not included in research")}</span>
        </span>
        <span className="relative shrink-0">
          <input
            type="checkbox"
            role="switch"
            className="peer sr-only"
            checked={on}
            disabled={!canChange || pending}
            aria-label={`Research consent for ${name}`}
            data-testid="research-toggle"
            onChange={(e) => {
              setErr(null);
              const v = e.target.checked;
              start(async () => {
                const r = await setResearchConsentAction(journeyId, v);
                if (!r.ok) setErr(r.error);
              });
            }}
          />
          <span className="block h-7 w-12 rounded-full bg-white/10 transition peer-checked:bg-mint/70 peer-focus-visible:ring-2 peer-focus-visible:ring-ember" />
          <span className="pointer-events-none absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
        </span>
      </label>
      {err && <p className="mt-2 text-sm text-coral" role="alert">{err}</p>}
    </div>
  );
}
