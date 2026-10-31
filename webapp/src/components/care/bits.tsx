import { Icon } from "@/components/ui/Icon";
import type { PlanKind } from "@/lib/care/types";

export const KIND_META: Record<PlanKind, { label: string; plural: string; icon: string; tone: string }> = {
  medication: { label: "Medicine", plural: "Medicines", icon: "pill", tone: "text-lilac" },
  care: { label: "Care task", plural: "Care tasks", icon: "care", tone: "text-coral" },
  exercise: { label: "Exercise", plural: "Exercises", icon: "walk", tone: "text-mint" },
  appointment: { label: "Appointment", plural: "Appointments", icon: "calendar", tone: "text-ember" },
  milestone: { label: "Milestone", plural: "Milestones", icon: "flag", tone: "text-ember" },
};

export function ProgressRing({ value, size = 88, stroke = 9, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label ?? `${Math.round(v * 100)} percent`} className="shrink-0">
      <defs>
        <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7cf5d3" />
          <stop offset="0.6" stopColor="#ffc15e" />
          <stop offset="1" stopColor="#ff6b5a" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ring-g)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${c * v} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  );
}

export function Sparkline({ values, max, min = 0, color = "#7cf5d3", className = "h-8 w-24" }: { values: (number | null)[]; max: number; min?: number; color?: string; className?: string }) {
  const w = 100;
  const h = 30;
  const n = Math.max(1, values.length - 1);
  const pts = values.map((v, i) => (v === null ? null : `${((i / n) * w).toFixed(1)},${(h - 3 - ((v - min) / (max - min || 1)) * (h - 6)).toFixed(1)}`));
  const segs: string[][] = [[]];
  pts.forEach((p) => (p ? segs[segs.length - 1].push(p) : segs.push([])));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      {segs.filter((s) => s.length).map((s, k) => (
        <polyline key={k} points={s.join(" ")} fill="none" stroke={color} strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

export function CallButtons({ phone, team, emergency, compact = false }: { phone: string; team: string; emergency: string; compact?: boolean }) {
  const tel = (s: string) => `tel:${s.replace(/[^\d+]/g, "")}`;
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "mt-4"}`}>
      {phone && (
        <a href={tel(phone)} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#f4f1ff] px-4 text-sm font-semibold text-night transition hover:brightness-95">
          <Icon name="phone" className="h-4 w-4" /> Call {team ? team.split(",")[0] : "your care team"}
        </a>
      )}
      <a href={tel(emergency)} className="inline-flex h-11 items-center gap-2 rounded-full bg-coral px-4 text-sm font-semibold text-night transition hover:brightness-110">
        <Icon name="alert" className="h-4 w-4" /> Emergency {emergency}
      </a>
    </div>
  );
}

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`flex items-start gap-2 text-xs text-haze/80 ${className}`}>
      <Icon name="shield" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint" />
      loci shows the plan your care team gave you and never gives medical advice or a diagnosis. If you are worried, contact your care team. In an emergency, call your local emergency number.
    </p>
  );
}
