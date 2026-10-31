import { expect, type Page } from "@playwright/test";

/** Collect console errors and page errors for the whole test. */
export function watch(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    // remote artwork that fails to load is handled by a fallback
    if (/Failed to load resource/.test(t) && /img|svg|png|jpe?g/i.test(t)) return;
    errors.push(t);
  });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

export async function noOverflow(page: Page, label: string) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(over, `horizontal overflow on ${label}`).toBeLessThanOrEqual(1);
}

export async function skipTour(page: Page) {
  const tour = page.getByTestId("product-tour");
  await tour.waitFor({ state: "attached", timeout: 15_000 });
  await page.getByRole("button", { name: "Skip tour" }).click();
  await expect(tour).toHaveCount(0);
}

/** Starts the shared demo world on one side: "patient" or "clinic". */
export async function startDemo(page: Page, side: "patient" | "clinic" = "patient") {
  await page.goto("/app/demo");
  await page.getByTestId(`demo-${side}`).click();
  await page.waitForURL(side === "clinic" ? /\/clinic$/ : /\/app$/, { timeout: 60_000 });
}

export const uniqueEmail = (who: string) => `${who}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
