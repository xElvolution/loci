import { app } from "@/lib/urls";
import { Icon } from "@/components/ui/Icon";

type Pick = { id: string; name: string };
type Data = { favs: { name: string }[]; picks: { label: string; icon: string; items: Pick[] }[] };

async function load(): Promise<Data | null> {
  try {
    const r = await fetch(app("/api/public/live-taste"), { next: { revalidate: 3600 }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const d = (await r.json()) as Data;
    return d.picks?.length ? d : null;
  } catch {
    return null;
  }
}

/** A real, live Qloo answer, served by the webapp's public endpoint (two fixed public favorites, no user data). */
export async function LiveTaste() {
  const data = await load();
  if (!data) return null;
  return (
    <div className="glass rounded-3xl p-5 md:p-6" data-testid="live-taste">
      <p className="label-mono text-mint">Live from Qloo, right now</p>
      <p className="mt-2 text-[15px] text-haze text-pretty">
        Someone in New York who loves <span className="text-white">{data.favs.map((f) => f.name).join(" and ")}</span> might enjoy:
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {data.picks.map((p) => (
          <div key={p.label} className="rounded-2xl border border-white/8 bg-night/40 p-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-ember">
              <Icon name={p.icon} className="h-4 w-4" /> {p.label}
            </p>
            <ul className="mt-2 space-y-1 text-[13px] text-[#ece8ff]">
              {p.items.map((i) => (
                <li key={i.id} className="truncate">{i.name}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-haze/80">Aggregate taste affinity from Qloo. Not advice, and never used for anything about health.</p>
    </div>
  );
}
