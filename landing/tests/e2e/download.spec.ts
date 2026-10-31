import { expect, test } from "@playwright/test";
import { ANDROID_RELEASE } from "../../src/lib/downloads";

test("download: platforms, honest statuses, checksum, nav and footer links, no overflow or errors", async ({ page, context }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("response", (r) => r.status() >= 400 && r.url().startsWith("http://127.0.0.1") && errors.push(`${r.status()} ${r.url()}`));

  await page.goto("/");
  const desktop = (page.viewportSize()?.width ?? 0) >= 1024;
  await page.getByTestId(desktop ? "nav-download" : "nav-download-compact").click();
  await expect(page).toHaveURL(/\/download$/);
  await expect(page.getByTestId("download-title")).toBeVisible();

  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
  });
  await page.waitForTimeout(800);

  await expect(page.getByTestId("status-web")).toHaveText("Available");
  await expect(page.getByTestId("status-android")).toHaveText("Test build");
  await expect(page.getByTestId("status-ios")).toHaveText("TestFlight soon");
  await expect(page.locator('[data-testid^="platform-"]')).toHaveCount(3);
  await expect(page.getByTestId("web-open")).toHaveAttribute("href", "http://app.example.test/app/signin");
  await expect(page.getByTestId("android-download")).toHaveAttribute("href", ANDROID_RELEASE.url);
  await expect(page.getByTestId("android-note")).toContainText("debug key");
  await expect(page.getByTestId("android-note")).toContainText("Install unknown apps");
  await expect(page.getByTestId("apk-sha256").first()).toHaveText(ANDROID_RELEASE.sha256);
  await expect(page.getByTestId("ios-unavailable")).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByTestId("footer-download")).toHaveAttribute("href", "/download");

  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByTestId("copy-sha").first().click();
  await expect(page.getByTestId("copy-sha").first()).toContainText("Copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(ANDROID_RELEASE.sha256);

  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(over).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
