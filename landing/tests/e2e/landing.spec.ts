import { expect, test } from "@playwright/test";

test("landing: two audiences, loop diagram, links to the webapp, no overflow or errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("response", (r) => r.status() >= 400 && r.url().startsWith("http://127.0.0.1") && errors.push(`${r.status()} ${r.url()}`));
  await page.goto("/");
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
  });
  await page.waitForTimeout(800);
  await expect(page.getByTestId("one-liner")).toBeVisible();
  await expect(page.getByTestId("loop-diagram")).toBeAttached();
  await expect(page.getByTestId("cta-clinic")).toHaveAttribute("href", "http://app.example.test/clinic/signup");
  await expect(page.getByTestId("cta-patient")).toHaveAttribute("href", "http://app.example.test/app/redeem");
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(over).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
