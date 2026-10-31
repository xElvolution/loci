import { trendOf } from "@/lib/care/instruments";

type Point = { date: string; value: number };

/** One clinician-entered measure over the recovery, on a time axis from discharge to today. No interpretation. */
export function OutcomeChart({ label, unit, min, max, higherIsBetter, target, points, start, end, color = "#7cf5d3" }: { label: string; unit: string; min: number; max: number; higherIsBetter: boolean; target: number | null; points: Point[]; start: string; end: string; color?: string }) {
  const w = 320;
  const h = 120;
  const t0 = Date.parse(`${start}T00:00:00Z`);
  const span = Math.max(1, Date.parse(`${end}T00:00:00Z`) - t0);
  const x = (d: string) => 10 + ((Date.parse(`${d}T00:00:00Z`) - t0) / span) * (w - 20);
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
  const pts = [...points].sort((a, b) => a.date.localeCompare(b.date));
  // zoom to the values (and target) so change is visible, never beyond the instrument's own range
  const seen = [...pts.map((p) => p.value), ...(target !== null ? [target] : [])];
  const pad = seen.length ? Math.max((Math.max(...seen) - Math.min(...seen)) * 0.25, (max - min) * 0.05) : 0;
  const lo = seen.length ? Math.max(min, Math.min(...seen) - pad) : min;
  const hi = seen.length ? Math.min(max, Math.max(...seen) + pad) : max;
  const y = (v: number) => h - 12 - ((v - lo) / (hi - lo || 1)) * (h - 24);
  const t = trendOf(pts.map((p) => p.value), higherIsBetter);
  const last = pts.at(-1);
  return (
    <figure className="glass min-w-0 rounded-3xl p-4" data-testid="outcome-chart">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-semibold">{label}</span>
        <span className="text-xs text-haze tabular-nums">
          {last ? `latest ${fmt(last.value)} ${unit}` : "no values yet"}
          {t.delta !== null && (
            <span className={t.direction === "better" ? "text-mint" : t.direction === "worse" ? "text-coral" : ""}>
              {" "}· {t.delta > 0 ? "+" : ""}
              {fmt(t.delta)} since first
            </span>
          )}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-32 w-full" role="img" aria-label={`${label}: ${pts.length} values from ${min} to ${max} ${unit}. ${higherIsBetter ? "Higher" : "Lower"} counts as better on this measure.`}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1="10" x2={w - 10} y1={12 + f * (h - 24)} y2={12 + f * (h - 24)} stroke="rgba(255,255,255,0.07)" />
            <text x="12" y={10 + f * (h - 24)} fontSize="8" fill="rgba(185,176,230,0.6)">{fmt(hi - f * (hi - lo))}</text>
          </g>
        ))}
        {target !== null && (
          <g>
            <line x1="10" x2={w - 10} y1={y(target)} y2={y(target)} stroke="#ffc15e" strokeDasharray="4 4" strokeOpacity="0.7" />
            <text x={w - 12} y={y(target) - 4} textAnchor="end" fontSize="9" fill="#ffc15e">target {fmt(target)}</text>
          </g>
        )}
        {pts.length > 1 && <polyline points={pts.map((p) => `${x(p.date)},${y(p.value)}`).join(" ")} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />}
        {pts.map((p, i) => (
          <circle key={i} cx={x(p.date)} cy={y(p.value)} r="3.5" fill={color}>
            <title>{`${p.date}: ${fmt(p.value)} ${unit}`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-haze/70">
        <span>{start.slice(5)} discharge</span>
        <span>
          {min} to {max} {unit} · {higherIsBetter ? "higher" : "lower"} is better
        </span>
        <span>{end.slice(5)}</span>
      </div>
    </figure>
  );
}

/** Weekly share of scheduled plan items ticked off, as bars. */
export function AdherenceBars({ weeks }: { weeks: { label: string; rate: number | null }[] }) {
  return (
    <figure className="glass min-w-0 rounded-3xl p-4" data-testid="adherence-trend">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="font-semibold">Plan followed, by week</span>
        <span className="text-xs text-haze">share of scheduled items ticked off</span>
      </figcaption>
      <div className="mt-4 flex h-28 items-end gap-2">
        {weeks.map((w) => (
          <div key={w.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className="text-[10px] text-haze tabular-nums">{w.rate === null ? "none" : `${Math.round(w.rate * 100)}%`}</span>
            <div className="flex h-20 w-full items-end rounded-lg bg-white/5">
              <div className="w-full rounded-lg bg-gradient-to-t from-mint/50 to-mint" style={{ height: `${Math.max(w.rate === null ? 0 : 4, (w.rate ?? 0) * 100)}%` }} />
            </div>
            <span className="truncate text-[10px] text-haze/80">{w.label}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}
