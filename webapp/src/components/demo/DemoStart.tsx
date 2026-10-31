"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "motion/react";
import { startDemoAction } from "@/app/actions";
import { Icon } from "@/components/ui/Icon";

function Go({ side, label, testid, primary }: { side: "patient" | "clinic"; label: string; testid: string; primary?: boolean }) {
  const { pending, data } = useFormStatus();
  const mine = pending && data?.get("side") === side;
  return (
    <button
      type="submit"
      name="side"
      value={side}
      disabled={pending}
      data-testid={testid}
      className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-base font-semibold transition disabled:opacity-70 sm:w-auto ${primary ? "bg-gradient-to-br from-ember to-coral text-night shadow-[0_10px_30px_-10px_rgba(255,107,90,0.7)] hover:brightness-110" : "bg-[#f4f1ff] text-night hover:brightness-95"}`}
    >
      {mine ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-night/30 border-t-night" /> Setting up
        </>
      ) : (
        <>
          {label} <Icon name="arrowR" className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

export function DemoStart({ patient, clinician, team }: { patient: { name: string; story: string; glyph: React.ReactNode }; clinician: string; team: string }) {
  const [tz, setTz] = useState("UTC");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  }, []);
  const cards = [
    {
      side: "clinic" as const,
      eyebrow: "See it as a clinician",
      title: `${clinician}, ${team}`,
      body: `Nine patients across specialties. Open ${patient.name}'s plan, edit it, see flags and answer a question.`,
      icon: <Icon name="chart" className="h-7 w-7 text-mint" />,
      hue: "#7cf5d3",
      testid: "demo-clinic",
      label: "See it as a clinician",
    },
    {
      side: "patient" as const,
      eyebrow: "See it as a patient",
      title: patient.name,
      body: `${patient.story} Tick off the plan, check in and ask the team.`,
      icon: patient.glyph,
      hue: "#ff9a5a",
      testid: "demo-patient",
      label: "See it as a patient",
    },
  ];
  return (
    <form action={startDemoAction} className="mt-10">
      <input type="hidden" name="timezone" value={tz} />
      <input type="hidden" name="choice" value="daniel" />
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((c, k) => (
          <motion.div
            key={c.side}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * k }}
            className="relative flex min-w-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-dusk-950/70 p-6 md:p-7"
          >
            <span className="absolute -top-12 -right-12 h-36 w-36 rounded-full opacity-25 blur-2xl" style={{ background: c.hue }} aria-hidden="true" />
            <span className="relative">{c.icon}</span>
            <p className="label-mono relative mt-4 text-[11px] text-haze">{c.eyebrow}</p>
            <p className="relative mt-1 text-xl font-bold leading-tight">{c.title}</p>
            <p className="relative mt-2 flex-1 text-sm text-haze text-pretty">{c.body}</p>
            <div className="relative mt-6">
              <Go side={c.side} label={c.label} testid={c.testid} primary={c.side === "patient"} />
            </div>
          </motion.div>
        ))}
      </div>
      <p className="mt-6 flex items-start gap-2 text-sm text-haze">
        <Icon name="shuffle" className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
        Same patient on both sides. Switch views any time from the banner at the top, and what you do on one side shows on the other.
      </p>
    </form>
  );
}
