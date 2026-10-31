import Link from "next/link";
import { Glyph } from "@/components/art/Glyph";
import { Icon } from "@/components/ui/Icon";
import { specialtyOf } from "@/lib/care/specialties";
import type { Journey } from "@/lib/server/repo";

/** Title and tabs shared by every page about one patient in the clinician workspace. */
export function PatientHeader({ journey, tab, day, questions = 0 }: { journey: Journey; tab: "overview" | "plan" | "outcomes" | "messages"; day: number; questions?: number }) {
  const s = specialtyOf(journey.specialty);
  const status = !journey.plan_sent_at ? "Draft, not sent" : `Day ${day} of ${journey.horizon_days}`;
  const tabs = [
    { id: "overview", href: `/clinic/p/${journey.id}`, label: "Tracking", icon: "chart" },
    { id: "plan", href: `/clinic/p/${journey.id}/plan`, label: "Care plan", icon: "list" },
    { id: "outcomes", href: `/clinic/p/${journey.id}/outcomes`, label: "Outcomes", icon: "trend" },
    { id: "messages", href: `/clinic/p/${journey.id}/messages`, label: "Messages", icon: "chat" },
  ] as const;
  return (
    <div className="mb-6">
      <Link href="/clinic" className="inline-flex items-center gap-1.5 text-sm text-haze hover:text-white">
        <Icon name="arrowL" className="h-4 w-4" /> All patients
      </Link>
      <div className="mt-4 flex min-w-0 items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/5"><Glyph name={s.glyph} className="h-7 w-7" color={s.hue} /></span>
        <div className="min-w-0">
          <p className="label-mono text-[11px] break-words text-haze">{s.label} · {status}</p>
          <h1 className="truncate text-3xl font-bold tracking-tight md:text-4xl" data-testid="patient-name">{journey.person_name}</h1>
        </div>
      </div>
      <nav className="mt-5 flex gap-1 overflow-x-auto rounded-full border border-white/8 bg-white/[0.03] p-1" aria-label="Patient sections">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            aria-current={tab === t.id ? "page" : undefined}
            className={`inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm whitespace-nowrap transition ${tab === t.id ? "bg-white/10 text-white" : "text-haze hover:text-white"}`}
            data-testid={`ptab-${t.id}`}
          >
            <Icon name={t.icon} className="h-4 w-4" /> {t.label}
            {t.id === "messages" && questions > 0 && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-ember px-1 text-[10px] font-bold text-night">{questions}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}
