import { Icon } from "@/components/ui/Icon";

const NODES = [
  { k: "plan", who: "Clinician", title: "Plan", body: "Start from a specialty template and write each medicine, task, exercise, appointment and warning sign: what, why and how.", icon: "edit", hue: "#b48cff" },
  { k: "follow", who: "Patient and family", title: "Follow", body: "Enter the code, then tick off today's steps, check in for two minutes and ask the team questions.", icon: "check", hue: "#ff9a5a" },
  { k: "track", who: "Clinician", title: "Track", body: "Adherence, check-in trends, flagged check-ins against your own rules, notes and questions, live.", icon: "trend", hue: "#7cf5d3" },
  { k: "adjust", who: "Clinician", title: "Adjust", body: "Change the plan in place. The patient sees \u201cyour care team updated your plan\u201d and what changed.", icon: "refresh", hue: "#ffc15e" },
] as const;

/** The care loop: plan, follow, track, adjust, and back to follow. */
export function LoopDiagram() {
  return (
    <div className="relative" data-testid="loop-diagram">
      <ol className="relative grid gap-4 md:grid-cols-4 md:gap-5">
        {NODES.map((n, i) => (
          <li key={n.k} className="relative min-w-0">
            <div className="relative h-full overflow-hidden rounded-3xl border border-white/10 bg-dusk-950/80 p-5">
              <span className="absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-25 blur-2xl" style={{ background: n.hue }} aria-hidden="true" />
              <div className="relative flex items-center justify-between gap-2">
                <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: `${n.hue}22`, color: n.hue }}>
                  <Icon name={n.icon} className="h-5 w-5" />
                </span>
                <span className="font-mono text-xs text-haze">0{i + 1}</span>
              </div>
              <p className="label-mono relative mt-4 text-[10px]" style={{ color: n.hue }}>{n.who}</p>
              <h3 className="relative mt-1 text-2xl font-bold">{n.title}</h3>
              <p className="relative mt-2 text-[14px] leading-relaxed text-haze text-pretty">{n.body}</p>
            </div>
            {i < NODES.length - 1 && (
              <span className="absolute -bottom-4 left-1/2 z-10 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full border border-white/15 bg-night text-haze md:top-1/2 md:-right-[1.15rem] md:bottom-auto md:left-auto md:translate-x-0 md:-translate-y-1/2" aria-hidden="true">
                <Icon name="arrowR" className="h-4 w-4 rotate-90 md:rotate-0" />
              </span>
            )}
          </li>
        ))}
      </ol>
      <div className="mt-5 flex items-center gap-3 rounded-full border border-dashed border-white/15 px-4 py-2.5 text-sm text-haze md:mx-[12.5%]">
        <Icon name="refresh" className="h-4 w-4 shrink-0 text-ember" />
        <span className="min-w-0">Adjust loops back to Follow: the patient always has the current plan, and the team always sees how it is going.</span>
      </div>
    </div>
  );
}
