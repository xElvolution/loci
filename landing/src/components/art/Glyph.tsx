import type { GlyphName } from "@/lib/care/specialties";

/** Specialty glyphs: small line drawings on a 32px grid, drawn for loci. */
const G: Record<GlyphName, string> = {
  cradle: "M6 18c0 5 4.5 8 10 8s10-3 10-8H6zM9 18a7 7 0 0 1 14 0M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 26l-2 3M24 26l2 3",
  stitch: "M5 22 27 10M9 16l3 5M13 14l3 5M17 12l3 5M21 10l3 5",
  knee: "M12 3v10a4 4 0 0 0 4 4h0a4 4 0 0 1 4 4v8M8 13h8M16 21h8M14 17a2 2 0 1 0 4 0",
  heart: "M16 27S5 20.5 5 12a6 6 0 0 1 11-3.3A6 6 0 0 1 27 12c0 8.5-11 15-11 15zM8 15h5l2-4 3 8 2-4h4",
  spark: "M16 4c-6 0-10 4.5-10 10 0 3.5 2 6 4 7.5V27h12v-5.5c2-1.5 4-4 4-7.5 0-5.5-4-10-10-10zM16 10v6l3 3M12 27v2h8v-2",
  kite: "M16 3 25 12l-9 11-9-11zM16 3v20M7 12h18M16 23c-2 2-1 4 1 5s1 3-1 4",
  sun: "M16 22a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM16 3v3m0 20v3M3 16h3m20 0h3M6.8 6.8l2.1 2.1m14.2 14.2 2.1 2.1M6.8 25.2l2.1-2.1M23.1 8.9l2.1-2.1",
  ribbon: "M16 4a5 5 0 0 0-5 5c0 4 5 9 5 9s5-5 5-9a5 5 0 0 0-5-5zM13 16l-6 12 4-1 2 3 4-10M19 16l6 12-4-1-2 3-4-10",
  breath: "M16 4v12M16 12c-3 0-5 2-6 5l-3 8c-.5 1.5.5 3 2 3h1c3 0 5-2.5 5-5.5V12M16 12c3 0 5 2 6 5l3 8c.5 1.5-.5 3-2 3h-1c-3 0-5-2.5-5-5.5",
  drop: "M16 3s-9 10-9 16a9 9 0 0 0 18 0c0-6-9-16-9-16zM12 20a4 4 0 0 0 4 4",
  tea: "M5 12h17v6a7 7 0 0 1-7 7h-3a7 7 0 0 1-7-7zM22 14h2a3 3 0 0 1 0 6h-2.5M10 4c-1 1.5 1 2.5 0 4M15 4c-1 1.5 1 2.5 0 4M4 28h20",
  house: "M4 15 16 5l12 10M7 13v14h18V13M13 27v-7h6v7",
};

export function Glyph({ name, className = "h-7 w-7", color }: { name: GlyphName; className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke={color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={G[name]} />
    </svg>
  );
}
