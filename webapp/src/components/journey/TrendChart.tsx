import { METRIC_META, type Metric } from "@/lib/care/types";

/** A small, honest line chart of one check-in answer over time. Missing days are gaps. */
export function TrendChart({ metric, values, dates, color }: { metric: Metric; values: (number | null)[]; dates: string[]; color: string }) {
  const meta = METRIC_META[metric];
  const w = 300;
  const h = 90;
  const n = Math.max(1, values.length - 1);
  const x = (i: number) => (i / n) * w;
  const y = (v: number) => h - 8 - ((v - meta.min) / (meta.max - meta.min)) * (h - 16);
  const segs: { i: number; v: number }[][] = [[]];
  values.forEach((v, i) => (v === null ? segs.push([]) : segs[segs.length - 1].push({ i, v })));
  const known = values.filter((v): v is number => v !== null);
  const last = known.at(-1);
  const avg = known.length ? known.reduce((a, b) => a + b, 0) / known.length : null;
  return (
    <figure className="glass min-w-0 rounded-3xl p-4">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="font-semibold">{meta.label}</span>
        <span className="text-xs text-haze tabular-nums">
          {last !== undefined ? `latest ${last}` : "no answers"}
          {avg !== null && ` · avg ${avg.toFixed(1)}`}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-2 h-24 w-full" role="img" aria-label={`${meta.label} over the last ${values.length} days, scale ${meta.min} to ${meta.max}`}>
        {[0, 0.5, 1].map((f) => (
          <line key={f} x1="0" x2={w} y1={8 + f * (h - 16)} y2={8 + f * (h - 16)} stroke="rgba(255,255,255,0.07)" vectorEffect="non-scaling-stroke" />
        ))}
        {segs.filter((s) => s.length).map((s, k) => (
          <g key={k}>
            <path d={`M${x(s[0].i)} ${h} ${s.map((p) => `L${x(p.i)} ${y(p.v)}`).join(" ")} L${x(s.at(-1)!.i)} ${h}Z`} fill={color} fillOpacity="0.12" />
            <polyline points={s.map((p) => `${x(p.i)},${y(p.v)}`).join(" ")} fill="none" stroke={color} strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-haze/70">
        <span>{dates[0]?.slice(5)}</span>
        <span>
          {meta.min} {meta.low.toLowerCase()} to {meta.max} {meta.high.toLowerCase()}
        </span>
        <span>{dates.at(-1)?.slice(5)}</span>
      </div>
    </figure>
  );
}
