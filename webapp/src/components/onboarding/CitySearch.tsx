"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { inputClass } from "@/components/ui/primitives";
import type { City } from "@/lib/qloo/types";

type Hit = { id: string; name: string; disambiguation: string | null; lat: number | null; lon: number | null };

export const SUGGESTED_CITIES = ["New York", "London", "Toronto", "Mexico City", "Tokyo", "Berlin", "Paris", "Sydney"];

/** City or neighborhood picker backed by Qloo localities. Typing anything still works. */
export function CitySearch({ value, onChange, label = "City or neighborhood" }: { value: City | null; onChange: (c: City | null) => void; label?: string }) {
  const id = useId();
  const [q, setQ] = useState(value?.name ?? "");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2 || (value && value.name === q)) return;
    timer.current = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await fetch(`/api/qloo/search?kind=city&q=${encodeURIComponent(q.trim())}`);
        const j = (await r.json()) as { results?: Hit[] };
        setHits(j.results ?? []);
        setOpen(true);
      } catch {
        setHits([]);
      } finally {
        setBusy(false);
      }
    }, 280);
  }, [q, value]);

  const pick = (h: Hit) => {
    onChange({ id: h.id, name: h.name, disambiguation: h.disambiguation, lat: h.lat, lon: h.lon, resolved: h.lat !== null && h.lon !== null });
    setQ(h.name);
    setOpen(false);
  };

  return (
    <div className="relative">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative mt-1.5">
        <Icon name="pin" className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-haze" />
        <input
          id={id}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            onChange(e.target.value.trim() ? { name: e.target.value.trim(), resolved: false } : null);
          }}
          onFocus={() => hits.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Start typing, for example New York"
          className={`${inputClass} pl-10`}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          autoComplete="off"
        />
        {busy && <span className="absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-haze/30 border-t-ember" />}
      </div>
      {open && hits.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-white/10 bg-dusk-950 p-1 shadow-2xl">
          {hits.map((h) => (
            <li key={h.id} role="option" aria-selected={value?.id === h.id}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(h)} className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-white/8">
                <span className="truncate">{h.name}</span>
                <span className="shrink-0 text-xs text-haze">{h.disambiguation}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SUGGESTED_CITIES.map((c) => (
          <button key={c} type="button" onClick={() => setQ(c)} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-haze transition hover:border-ember/60 hover:text-ember">
            {c}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-haze/80">
        {value?.resolved ? <>Comfort picks will be near {value.name}.</> : "Only the city or neighborhood is used, never a street address."}
      </p>
    </div>
  );
}
