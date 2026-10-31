/** Tiny isometric toolkit for loci scenes. Pure and deterministic, so SSR and client match. */
export type Pt = { x: number; y: number };
export const TW = 28; // half tile width
export const TH = 14; // half tile height
export const ZH = 26; // one height unit

export type Proj = (i: number, j: number, z?: number) => Pt;

export function makeProj(ox: number, oy: number): Proj {
  return (i: number, j: number, z = 0): Pt => ({ x: ox + (i - j) * TW, y: oy + (i + j) * TH - z * ZH });
}

export const pts = (arr: Pt[]) => arr.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

export type Box = { i: number; j: number; w: number; d: number; h: number; tone: number };

export function boxFaces(P: Proj, b: Box) {
  const { i, j, w, d, h } = b;
  return {
    top: [P(i, j, h), P(i + w, j, h), P(i + w, j + d, h), P(i, j + d, h)],
    left: [P(i, j + d, 0), P(i + w, j + d, 0), P(i + w, j + d, h), P(i, j + d, h)],
    right: [P(i + w, j, 0), P(i + w, j + d, 0), P(i + w, j + d, h), P(i + w, j, h)],
  };
}

/** Window quads on the two visible faces. */
export function windows(P: Proj, b: Box): { q: Pt[]; k: number }[] {
  const out: { q: Pt[]; k: number }[] = [];
  let k = 0;
  for (let z = 0.3; z < b.h - 0.25; z += 0.42) {
    for (let u = b.i + 0.18; u < b.i + b.w - 0.2; u += 0.36) {
      out.push({ q: [P(u, b.j + b.d, z), P(u + 0.18, b.j + b.d, z), P(u + 0.18, b.j + b.d, z + 0.22), P(u, b.j + b.d, z + 0.22)], k: k++ });
    }
    for (let v = b.j + 0.18; v < b.j + b.d - 0.2; v += 0.36) {
      out.push({ q: [P(b.i + b.w, v, z), P(b.i + b.w, v + 0.18, z), P(b.i + b.w, v + 0.18, z + 0.22), P(b.i + b.w, v, z + 0.22)], k: k++ });
    }
  }
  return out;
}

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Polyline through tile points, as an SVG path with softly rounded corners. */
export function routePath(P: Proj, way: [number, number][], r = 10): string {
  const p = way.map(([i, j]) => P(i, j));
  let d = `M${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`;
  for (let k = 1; k < p.length - 1; k++) {
    const a = p[k - 1];
    const b = p[k];
    const c = p[k + 1];
    const l1 = Math.hypot(b.x - a.x, b.y - a.y);
    const l2 = Math.hypot(c.x - b.x, c.y - b.y);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const s = { x: b.x - ((b.x - a.x) / l1) * rr, y: b.y - ((b.y - a.y) / l1) * rr };
    const e = { x: b.x + ((c.x - b.x) / l2) * rr, y: b.y + ((c.y - b.y) / l2) * rr };
    d += ` L${s.x.toFixed(1)} ${s.y.toFixed(1)} Q${b.x.toFixed(1)} ${b.y.toFixed(1)} ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
  }
  const last = p[p.length - 1];
  return `${d} L${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
}
