import { expect, test } from "@playwright/test";

test("docs: index, every page, sidebar navigation, no overflow or errors", async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/");
  const cards = page.locator('[data-testid^="card-"]');
  const slugs = await cards.evaluateAll((els) => els.map((e) => e.getAttribute("href")!));
  expect(slugs.length).toBeGreaterThanOrEqual(13);
  for (const s of slugs) {
    await page.goto(s);
    await expect(page.getByTestId("doc-title")).toBeVisible();
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over, s).toBeLessThanOrEqual(1);
  }
  await page.goto("/api");
  if (isMobile) await page.getByTestId("mobile-nav").locator("summary").click();
  await page.getByRole("link", { name: "Research layer" }).locator("visible=true").first().click();
  await expect(page).toHaveURL(/\/research$/);
  await expect(page.getByText("Status: live in the webapp")).toBeVisible();
  await page.screenshot({ path: `shots/${isMobile ? "mobile" : "desktop"}-docs-research.png` });
  expect(errors).toEqual([]);
});
