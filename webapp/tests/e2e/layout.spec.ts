import { expect, test, type Locator } from "@playwright/test";
import { skipTour, startDemo, watch } from "./helpers";

type Box = { x: number; y: number; width: number; height: number };
const intersects = (a: Box, b: Box) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
const boxes = async (l: Locator) => (await l.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()))) as Box[];

test("journey road labels never overlap or leave the road; welcome card art never covers the headline", async ({ page }, info) => {
  const errors = watch(page);
  await startDemo(page, "patient");
  await skipTour(page);
  await page.goto("/app/journey");
  const road = page.locator('[data-tour="journey-road"] svg').first();
  await expect(road).toBeVisible();
  await page.waitForTimeout(1200); // labels fade in
  const labels = page.getByTestId("road-label");
  if (info.project.name === "desktop") {
    const svg = (await road.boundingBox())!;
    const b = await boxes(labels);
    expect(b.length).toBeGreaterThan(2);
    for (const l of b) {
      expect(l.x).toBeGreaterThanOrEqual(svg.x - 0.5);
      expect(l.x + l.width).toBeLessThanOrEqual(svg.x + svg.width + 0.5);
    }
    for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) expect(intersects(b[i], b[j]), `labels ${i} and ${j}`).toBe(false);
  }
  await page.screenshot({ path: `shots/e2e/${info.project.name}-journey-road.png` });

  await page.goto("/app/comfort");
  const card = page.getByTestId("welcome-card").first();
  await card.scrollIntoViewIfNeeded();
  const art = (await card.getByTestId("card-art").boundingBox())!;
  const title = (await card.getByTestId("card-title").boundingBox())!;
  expect(intersects(art, title)).toBe(false);
  await card.screenshot({ path: `shots/e2e/${info.project.name}-welcome-card.png` });
  expect(errors).toEqual([]);
});
