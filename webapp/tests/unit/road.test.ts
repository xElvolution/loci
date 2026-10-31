import { describe, expect, it } from "vitest";
import { layoutLabels } from "@/components/journey/Road";

const CHAR = 7.3;
const pt = (day: number, horizon: number) => {
  const t = day / horizon;
  return { x: 40 + t * 920, y: 132 + Math.sin(t * Math.PI * 2.6 + 0.4) * 58 };
};

describe("journey road labels", () => {
  it("never overlap each other and stay inside the drawing, even when marks are close together", () => {
    const marks = [
      [0, "First night in your own bed"],
      [3, "First walk to the corner"],
      [4, "Outpatient physio"],
      [5, "Wound check with the nurse"],
      [7, "Follow-up with the surgeon"],
      [14, "Drive again, if cleared"],
      [14, "Back to light work"],
      [42, "Six-week review"],
      [84, "Thriving"],
    ] as const;
    const placed = layoutLabels(marks.map(([d, title]) => ({ ...pt(d, 84), title })));
    const boxes = placed.flatMap((p) => (p ? [{ l: p.cx - (p.text.length * CHAR) / 2, r: p.cx + (p.text.length * CHAR) / 2, y: p.y }] : []));
    expect(boxes.length).toBeGreaterThanOrEqual(5);
    const s0 = pt(0, 84);
    const hospital = { l: s0.x - 18, r: s0.x + 18, t: s0.y - 46, b: s0.y - 12 };
    for (const b of boxes) {
      expect(b.l < hospital.r && b.r > hospital.l && b.y - 12 < hospital.b && b.y + 3 > hospital.t, "label over the hospital").toBe(false);
      expect(b.l).toBeGreaterThanOrEqual(4);
      expect(b.r).toBeLessThanOrEqual(996);
      expect(b.y).toBeGreaterThanOrEqual(16);
      expect(b.y).toBeLessThanOrEqual(234);
    }
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const overlap = a.l < b.r && a.r > b.l && Math.abs(a.y - b.y) < 16;
        expect(overlap, `${placed.filter(Boolean)[i]?.text} vs ${placed.filter(Boolean)[j]?.text}`).toBe(false);
      }
  });
  it("labels every mark when they are spread out", () => {
    const placed = layoutLabels([2, 12, 25, 40, 60, 80].map((d) => ({ ...pt(d, 84), title: `Fixture milestone on day ${d}` })));
    expect(placed.every(Boolean)).toBe(true);
  });
});
