"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveComfort } from "@/app/actions";
import { CitySearch } from "@/components/onboarding/CitySearch";
import { Icon } from "@/components/ui/Icon";
import { Button, inputClass } from "@/components/ui/primitives";
import { PickArt } from "./PickArt";
import { COMFORT_FILTERS, FILTER_GROUP_LABEL, type FilterGroup } from "@/lib/care/filters";
import { TYPE_LABEL, type City, type Favorite, type FavoriteType } from "@/lib/qloo/types";

type Hit = { id: string; name: string; type: FavoriteType; image: string | null; disambiguation: string | null };
const TYPES: FavoriteType[] = ["artist", "tv_show", "movie", "book", "podcast", "video_game"];

export function ComfortSettings(props: { journeyId: string; canEdit: boolean; favorites: Favorite[]; filters: string[]; outingsOk: boolean; city: City | null; personName: string }) {
  const router = useRouter();
  const [favs, setFavs] = useState(props.favorites);
  const [filters, setFilters] = useState(props.filters);
  const [outings, setOutings] = useState(props.outingsOk);
  const [city, setCity] = useState(props.city);
  const [type, setType] = useState<FavoriteType>("artist");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = JSON.stringify([favs.map((f) => f.id), [...filters].sort(), outings, city?.name ?? null]) !== JSON.stringify([props.favorites.map((f) => f.id), [...props.filters].sort(), props.outingsOk, props.city?.name ?? null]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) return;
    timer.current = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await fetch(`/api/qloo/search?types=${type}&q=${encodeURIComponent(q.trim())}`);
        const j = (await r.json()) as { results?: Hit[] };
        setHits(j.results ?? []);
      } catch {
        setHits([]);
      } finally {
        setBusy(false);
      }
    }, 280);
  }, [q, type]);

  const add = (h: Hit) => {
    if (!favs.some((f) => f.id === h.id) && favs.length < 16) setFavs([...favs, { id: h.id, name: h.name, type: h.type, image: h.image, disambiguation: h.disambiguation, resolved: true }]);
    setQ("");
    setHits([]);
  };

  const save = () =>
    start(async () => {
      setMsg(null);
      const r = await saveComfort({ journeyId: props.journeyId, favorites: favs, filters, outingsOk: outings, city });
      if (!r.ok) setMsg(r.error);
      else {
        setMsg("Saved. Refreshing picks");
        router.refresh();
      }
    });

  const groups = Object.keys(FILTER_GROUP_LABEL) as FilterGroup[];

  return (
    <aside className="glass min-w-0 space-y-6 rounded-3xl p-5 md:p-6" aria-label="Comfort settings">
      <div>
        <h2 className="text-lg font-bold">What {props.personName === "you" ? "you love" : `${props.personName} loves`}</h2>
        <p className="mt-1 text-xs text-haze">Only these names and the city go to Qloo. Never health details.</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {favs.map((f) => (
            <li key={f.id} className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/8 py-1 pr-2 pl-1 text-sm">
              <PickArt name={f.name} image={f.image} kind={f.type} className="h-7 w-7 rounded-full" />
              <span className="min-w-0 truncate">{f.name}</span>
              <span className="text-[10px] text-haze uppercase">{TYPE_LABEL[f.type]}</span>
              {props.canEdit && (
                <button type="button" onClick={() => setFavs(favs.filter((x) => x.id !== f.id))} className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-haze hover:text-coral" aria-label={`Remove ${f.name}`}>
                  <Icon name="x" className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
          {!favs.length && <li className="text-sm text-haze">Add a few favorites to start.</li>}
        </ul>
        {props.canEdit && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Kind of favorite">
              {TYPES.map((t) => (
                <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => setType(t)} className={`rounded-full border px-3 py-1 text-xs transition ${type === t ? "border-ember bg-ember/15 text-ember" : "border-white/12 text-haze hover:text-white"}`}>
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
            <div className="relative mt-2">
              <Icon name="search" className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-haze" />
              <input className={`${inputClass} pl-10`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${TYPE_LABEL[type].toLowerCase()}`} aria-label="Search favorites" data-testid="fav-search" />
              {busy && <span className="absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-ember border-t-transparent" />}
            </div>
            {hits.length > 0 && q.trim().length >= 2 && (
              <ul className="mt-2 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-dusk-950 p-1" role="listbox" aria-label="Results">
                {hits.map((h) => (
                  <li key={h.id}>
                    <button type="button" onClick={() => add(h)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-white/5" role="option" aria-selected="false">
                      <PickArt name={h.name} image={h.image} kind={h.type} className="h-9 w-9 rounded-lg" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{h.name}</span>
                        {h.disambiguation && <span className="block truncate text-xs text-haze">{h.disambiguation}</span>}
                      </span>
                      <Icon name="plus" className="h-4 w-4 shrink-0 text-ember" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-bold">Filters</h2>
        <p className="mt-1 text-xs text-haze">Ticked by the person or their clinician. loci never guesses these from a diagnosis.</p>
        {groups.map((g) => (
          <fieldset key={g} className="mt-3">
            <legend className="label-mono text-haze/80">{FILTER_GROUP_LABEL[g]}</legend>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {COMFORT_FILTERS.filter((f) => f.group === g).map((f) => {
                const on = filters.includes(f.id);
                return (
                  <button key={f.id} type="button" disabled={!props.canEdit} aria-pressed={on} onClick={() => setFilters(on ? filters.filter((x) => x !== f.id) : [...filters, f.id])} className={`rounded-full border px-3 py-1.5 text-xs transition ${on ? "border-mint bg-mint/15 text-mint" : "border-white/12 text-haze hover:text-white"}`}>
                    {on && "✓ "}
                    {f.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <label className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 px-4 py-3">
        <span className="text-sm">
          <span className="block font-medium">Suggest gentle outings</span>
          <span className="block text-xs text-haze">Only if the plan allows getting out</span>
        </span>
        <input type="checkbox" role="switch" className="peer sr-only" checked={outings} disabled={!props.canEdit} onChange={(e) => setOutings(e.target.checked)} />
        <span aria-hidden="true" className="relative h-7 w-12 shrink-0 rounded-full bg-white/15 transition peer-checked:bg-mint peer-focus-visible:ring-2 peer-focus-visible:ring-ember after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
      </label>

      {props.canEdit && <CitySearch value={city} onChange={setCity} label="Home city or neighborhood" />}

      {props.canEdit && (
        <div className="flex items-center gap-3">
          <Button type="button" onClick={save} disabled={pending || !dirty} data-testid="save-comfort">
            {pending ? "Saving" : "Save and refresh picks"}
          </Button>
          {msg && <span className="text-xs text-haze" role="status">{msg}</span>}
        </div>
      )}
    </aside>
  );
}
