import { KIND_META, CallButtons } from "@/components/care/bits";
import { Icon } from "@/components/ui/Icon";
import { describeThreshold } from "@/lib/care/rules";
import { howSteps, whenText } from "@/lib/care/describe";
import type { PlanItem, PlanKind, Threshold, WarningSign } from "@/lib/care/types";

const ORDER: PlanKind[] = ["medication", "care", "exercise", "appointment"];

type Props = {
  items: PlanItem[];
  signs: WarningSign[];
  thresholds: Threshold[];
  discharge: string;
  instructions: string;
  team: string;
  author: string;
  phone: string;
  emergency: string;
  /** Preview mode for the clinician: hides call buttons. */
  preview?: boolean;
};

/**
 * The patient's plan as numbered, step-by-step instructions. Every word on
 * this screen comes from the care team; loci only lays it out.
 */
export function PlanSteps({ items, signs, thresholds, discharge, instructions, team, author, phone, emergency, preview }: Props) {
  const sorted = ORDER.map((k) => ({ kind: k, items: items.filter((i) => i.kind === k) })).filter((g) => g.items.length);
  const starts = sorted.map((_, i) => sorted.slice(0, i).reduce((s, g) => s + g.items.length, 0));
  const groups = sorted.map((g, i) => ({ ...g, start: starts[i] }));
  return (
    <div className="space-y-6" data-testid="plan-steps">
      {instructions.trim() && (
        <section className="rounded-3xl border border-lilac/25 bg-lilac/[0.07] p-5 md:p-6">
          <p className="label-mono text-lilac">From {author || team || "your care team"}</p>
          <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-[#efeaff]">{instructions}</p>
        </section>
      )}
      {groups.map((g) => {
        const meta = KIND_META[g.kind];
        return (
          <section key={g.kind} aria-label={meta.plural}>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <Icon name={meta.icon} className={`h-5 w-5 ${meta.tone}`} /> {meta.plural}
            </h2>
            <ol className="space-y-3">
              {g.items.map((it, idx) => {
                const n = g.start + idx + 1;
                const steps = howSteps(it.how);
                return (
                  <li key={it.id} id={`item-${it.id}`} className="glass min-w-0 scroll-mt-24 rounded-3xl p-5 md:p-6" data-testid="plan-step">
                    <div className="flex items-start gap-4">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/8 text-sm font-bold tabular-nums">{n}</span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[17px] font-semibold break-words">{it.title}</h3>
                        <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-haze">
                          <Icon name="calendar" className="h-3.5 w-3.5" /> {whenText(it, discharge)}
                        </p>
                        {it.detail && (
                          <div className="mt-4">
                            <p className="label-mono text-[10px] text-ember">What to do</p>
                            <p className="mt-1 text-[15px] break-words text-[#efeaff]">{it.detail}</p>
                          </div>
                        )}
                        {it.why && (
                          <div className="mt-4">
                            <p className="label-mono text-[10px] text-lilac">Why your team asked</p>
                            <p className="mt-1 text-[15px] break-words text-[#e3dcff]">{it.why}</p>
                          </div>
                        )}
                        {steps.length > 0 && (
                          <div className="mt-4">
                            <p className="label-mono text-[10px] text-mint">How to do it</p>
                            <ol className="mt-2 space-y-2">
                              {steps.map((s, i) => (
                                <li key={i} className="flex gap-3 text-[15px]">
                                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-mint/40 text-[11px] text-mint tabular-nums">{i + 1}</span>
                                  <span className="min-w-0 break-words">{s}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {!it.detail && !it.why && !steps.length && it.kind !== "appointment" && <p className="mt-3 text-sm text-haze">Your team did not add more detail. Ask them if anything is unclear.</p>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
      {!groups.length && <p className="glass rounded-3xl p-6 text-haze">Your care team has not added anything to the plan yet.</p>}
      <section className="rounded-3xl border border-coral/30 bg-coral/[0.06] p-5 md:p-6" data-testid="when-to-call">
        <p className="label-mono text-coral">When to call</p>
        <h2 className="mt-1 text-lg font-bold">Your team asked you to call if</h2>
        <ul className="mt-3 space-y-2 text-[15px]">
          {signs.map((w) => (
            <li key={w.id} className="flex gap-3">
              <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${w.action === "emergency" ? "bg-coral" : "bg-ember"}`} />
              <span className="min-w-0 break-words">
                {w.text} <span className="text-xs text-haze">· {w.action === "emergency" ? `call ${emergency} now` : `call ${team || "your care team"}`}</span>
              </span>
            </li>
          ))}
          {thresholds.map((t) => (
            <li key={t.id} className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-lilac" />
              <span className="min-w-0 break-words">Your check-in shows {describeThreshold(t).replace(/^./, (c) => c.toLowerCase())} <span className="text-xs text-haze">· {t.action === "emergency" ? `call ${emergency} now` : `your team is told and you are asked to call`}</span></span>
            </li>
          ))}
          {!signs.length && !thresholds.length && <li className="text-haze">Your team has not listed warning signs yet. If you are worried, call them.</li>}
        </ul>
        {!preview && <CallButtons phone={phone} team={team} emergency={emergency} />}
      </section>
    </div>
  );
}
