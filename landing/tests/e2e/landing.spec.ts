import { expect, test, type Page } from "@playwright/test";

const SIGNIN = "http://app.example.test/app/signin";

async function sweep(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("response", (r) => r.status() >= 400 && r.url().startsWith("http://127.0.0.1") && errors.push(`${r.status()} ${r.url()}`));
  return errors;
}

async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await page.waitForTimeout(600);
}

/** Nothing may stick out past the viewport, even where an ancestor clips it. */
async function expectNoOverflow(page: Page) {
  const res = await page.evaluate(() => {
    const W = window.innerWidth;
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      if (el.closest("svg, [aria-hidden='true'], [data-testid='pricing-track']")) continue;
      let a = el.parentElement, scroller = false;
      while (a) { if (/(auto|scroll)/.test(getComputedStyle(a).overflowX)) { scroller = true; break; } a = a.parentElement; }
      if (scroller) continue;
      const r = el.getBoundingClientRect();
      if (r.width && r.height && (r.right > W + 1 || r.left < -1)) out.push(`${el.tagName}.${String((el as HTMLElement).className).slice(0, 50)} ${Math.round(r.left)}..${Math.round(r.right)}`);
    }
    return { scroll: document.documentElement.scrollWidth - W, out: out.slice(0, 5) };
  });
  expect(res.scroll).toBeLessThanOrEqual(1);
  expect(res.out).toEqual([]);
}

test("landing: sign-in calls to action only, loop, pricing, footer, no overflow or errors", async ({ page }) => {
  const errors = await sweep(page);
  await page.goto("/");
  await scrollThrough(page);
  await expect(page.getByTestId("one-liner")).toBeVisible();
  await expect(page.getByTestId("loop-diagram")).toBeAttached();
  for (const id of ["nav-open-app", "nav-signin", "hero-open-app", "clinics-open-app", "final-open-app"]) await expect(page.getByTestId(id)).toHaveAttribute("href", SIGNIN);
  await expect(page.getByTestId("nav-open-app")).toBeVisible();
  await expect(page.getByTestId("nav-signin")).toBeVisible();
  for (const id of ["nav-open-app", "nav-signin"]) {
    const box = await page.getByTestId(id).boundingBox();
    expect(box && box.x + box.width, `${id} fits the viewport`).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/try the demo|medical device|see it as a/i);
  expect(await page.locator('a[href*="/app/demo"], a[href*="demo."]').count()).toBe(0);
  await expect(page.getByTestId("pricing-card")).toHaveCount(3);
  await expect(page.getByTestId("site-footer").getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
  await expectNoOverflow(page);
  expect(errors).toEqual([]);
});

test("pricing: swipe carousel on phones, grid on desktop", async ({ page }) => {
  await page.goto("/#pricing");
  const desktop = page.viewportSize()!.width >= 1024;
  const cards = page.getByTestId("pricing-card");
  await expect(cards.nth(0)).toContainText("Families");
  await expect(cards.nth(1)).toContainText("Care teams");
  await expect(cards.nth(2)).toContainText("Custom");
  if (desktop) {
    await expect(page.getByTestId("pricing-controls")).toBeHidden();
    const tops = await cards.evaluateAll((els) => els.map((e) => (e as HTMLElement).getBoundingClientRect().top));
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(2);
    return;
  }
  await page.getByTestId("pricing-track").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("pricing-prev")).toBeDisabled();
  const dots = page.getByTestId("pricing-dot");
  await expect(dots.nth(0)).toHaveAttribute("aria-current", "true");
  await page.getByTestId("pricing-next").click();
  await expect(dots.nth(1)).toHaveAttribute("aria-current", "true");
  const W = page.viewportSize()!.width;
  await expect.poll(async () => { const b = await cards.nth(1).boundingBox(); return Math.abs(b!.x + b!.width / 2 - W / 2); }, { timeout: 3000 }).toBeLessThan(6);
  await page.getByTestId("pricing-track").focus();
  await page.keyboard.press("ArrowRight");
  await expect(dots.nth(2)).toHaveAttribute("aria-current", "true");
  await expect(page.getByTestId("pricing-next")).toBeDisabled();
  await dots.nth(0).click();
  await expect(dots.nth(0)).toHaveAttribute("aria-current", "true");
});

for (const path of ["/terms", "/security", "/cookies", "/contact"]) {
  test(`page ${path}: renders with header and footer, no overflow or errors`, async ({ page }) => {
    const errors = await sweep(page);
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByTestId("site-footer")).toBeVisible();
    await expect(page.getByTestId("nav-open-app")).toHaveAttribute("href", SIGNIN);
    await scrollThrough(page);
    await expectNoOverflow(page);
    expect(errors).toEqual([]);
  });
}
