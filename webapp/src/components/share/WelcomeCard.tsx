import type { Ritual } from "@/lib/care/goodday";

export type CardTheme = "dusk" | "paper" | "sunrise";

const THEMES: Record<CardTheme, { bg: string; ink: string; sub: string; accent: string; line: string }> = {
  dusk: { bg: "linear-gradient(160deg,#2a1f55 0%,#1a1438 55%,#3b1f3a 100%)", ink: "#f4f1ff", sub: "#b8b0d9", accent: "#ffc15e", line: "rgba(255,255,255,0.12)" },
  paper: { bg: "linear-gradient(160deg,#f6efe1 0%,#efe4cf 100%)", ink: "#1d1836", sub: "#6b6280", accent: "#d9572f", line: "rgba(29,24,54,0.14)" },
  sunrise: { bg: "linear-gradient(170deg,#ffcf8a 0%,#ff8f73 55%,#b4528a 100%)", ink: "#2a1430", sub: "#5a2a45", accent: "#fff6e6", line: "rgba(42,20,48,0.18)" },
};

/** The welcome-home card. Rituals only; no health information ever appears here. */
export function WelcomeCard({ theme, personName, message, from, rituals }: { theme: CardTheme; personName: string; message: string; from: string; rituals: Ritual[] }) {
  const t = THEMES[theme];
  return (
    <article className="relative overflow-hidden rounded-[28px] p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] md:p-8" style={{ background: t.bg, color: t.ink }} data-testid="welcome-card">
      {/* the drawing sits in its own row so it can never cover the name or the headline */}
      <div className="flex items-start justify-between gap-4">
        <p className="pt-1 font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: t.sub }}>
          loci · welcome home
        </p>
        <svg viewBox="0 0 200 120" className="pointer-events-none -mt-3 -mr-3 h-20 w-32 shrink-0 opacity-70 md:h-24 md:w-40" data-testid="card-art" aria-hidden="true">
        <path d="M30 90 L100 40 L170 90 Z" fill="none" stroke={t.accent} strokeWidth="2" />
        <rect x="88" y="66" width="24" height="24" rx="2" fill={t.accent} fillOpacity="0.85" />
        <circle cx="160" cy="28" r="10" fill={t.accent} fillOpacity="0.7" />
        {Array.from({ length: 6 }, (_, k) => (
          <circle key={k} cx={20 + k * 14} cy={24 + (k % 2) * 10} r="1.6" fill={t.accent} />
        ))}
      </svg>
      </div>
      <h3 className="relative mt-2 text-4xl leading-none font-bold tracking-tight break-words md:text-5xl" data-testid="card-title">
        {personName}
        <span className="font-serif-i font-normal" style={{ color: t.accent }}>
          {" "}
          is home.
        </span>
      </h3>
      <p className="relative mt-4 max-w-md text-[15px] leading-relaxed">{message}</p>
      {rituals.length > 0 && (
        <ul className="relative mt-6 space-y-3 border-t pt-5" style={{ borderColor: t.line }}>
          {rituals.slice(0, 4).map((r) => (
            <li key={r.key} className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: t.accent }} />
              <span className="min-w-0">
                <span className="block font-mono text-[10px] tracking-[0.16em] uppercase" style={{ color: t.sub }}>
                  {r.title}
                </span>
                <span className="block text-[15px] font-medium break-words">{r.line}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {from && (
        <p className="relative mt-6 font-serif-i text-xl" style={{ color: t.accent }}>
          With love, {from}
        </p>
      )}
    </article>
  );
}
