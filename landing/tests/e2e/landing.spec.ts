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

test("pricing: punched tags, three across on desktop, a swipeable stack on phones", async ({ page }) => {
  await page.goto("/#pricing");
  const desktop = page.viewportSize()!.width >= 1024;
  const cards = page.getByTestId("pricing-card");
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(0)).toContainText("Families");
  await expect(cards.nth(1)).toContainText("Care teams");
  await expect(cards.nth(2)).toContainText("Custom");
  if (desktop) {
    await expect(page.getByTestId("pricing-controls")).toBeHidden();
    for (let k = 0; k < 3; k++) await expect(cards.nth(k)).toBeVisible();
    const boxes = await cards.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()));
    expect(boxes[0].right).toBeLessThan(boxes[1].left + 8);
    expect(boxes[1].right).toBeLessThan(boxes[2].left + 8);
    return;
  }
  const track = page.getByTestId("pricing-track");
  const active = () => page.getByTestId("pricing-active").last();
  const dots = page.getByTestId("pricing-dot");
  await track.scrollIntoViewIfNeeded();
  await expect(dots.nth(0)).toHaveAttribute("aria-current", "true");
  await expect(active()).toHaveAttribute("data-plan", "Families");

  // auto-advance while untouched
  await expect(dots.nth(1)).toHaveAttribute("aria-current", "true", { timeout: 7000 });

  // tap: next, wraps around, dots
  await page.getByTestId("pricing-next").click();
  await expect(dots.nth(2)).toHaveAttribute("aria-current", "true");
  await page.getByTestId("pricing-next").click();
  await expect(dots.nth(0)).toHaveAttribute("aria-current", "true");
  await page.getByTestId("pricing-prev").click();
  await expect(dots.nth(2)).toHaveAttribute("aria-current", "true");
  await dots.nth(1).click();
  await expect(dots.nth(1)).toHaveAttribute("aria-current", "true");

  // keyboard
  await track.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(dots.nth(0)).toHaveAttribute("aria-current", "true");

  // swipe left on the front tag
  await page.waitForTimeout(700);
  const b = (await track.boundingBox())!;
  const y = b.y + b.height / 2;
  await page.mouse.move(b.x + b.width * 0.75, y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(b.x + b.width * 0.75 - i * 25, y);
  await page.mouse.up();
  await expect(dots.nth(1)).toHaveAttribute("aria-current", "true");
  await expect(active()).toHaveAttribute("data-plan", "Care teams");

  // once touched, auto-advance stays stopped
  await page.waitForTimeout(6000);
  await expect(dots.nth(1)).toHaveAttribute("aria-current", "true");

  // the front tag sits inside the stack, and the fixed back layers never move
  await page.waitForTimeout(600);
  const tb = (await track.boundingBox())!;
  const fb = (await active().boundingBox())!;
  expect(fb.x).toBeGreaterThanOrEqual(tb.x - 1);
  expect(fb.x + fb.width).toBeLessThanOrEqual(tb.x + tb.width + 1);
  const layers = await page.getByTestId("pricing-layer").evaluateAll((els) => els.map((e) => getComputedStyle(e).transform));
  await page.getByTestId("pricing-next").click();
  await page.waitForTimeout(150);
  expect(await page.getByTestId("pricing-layer").evaluateAll((els) => els.map((e) => getComputedStyle(e).transform))).toEqual(layers);
});

test("loop: plays plan, follow, track, adjust and back to follow; tap holds a step", async ({ page }) => {
  await page.goto("/#loop");
  const loop = page.getByTestId("loop-diagram");
  await loop.scrollIntoViewIfNeeded();
  await expect(loop).toHaveAttribute("data-mode", "animated");
  await expect(page.getByTestId("loop-ring")).toBeVisible();
  for (const k of ["follow", "track", "adjust"]) await expect(loop).toHaveAttribute("data-active", k, { timeout: 6000 });
  await expect(loop).toHaveAttribute("data-active", "follow", { timeout: 6000 });
  await page.getByTestId("loop-step-track").click();
  await expect(loop).toHaveAttribute("data-active", "track");
  await expect(page.getByTestId("loop-scene")).toContainText("Adherence");
  await page.waitForTimeout(5000);
  await expect(loop).toHaveAttribute("data-active", "track");
  const W = page.viewportSize()!.width;
  for (const id of ["loop-ring", "loop-scene", "loop-node-follow", "loop-node-adjust"]) {
    const b = (await page.getByTestId(id).boundingBox())!;
    expect(b.x, `${id} left`).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width, `${id} right`).toBeLessThanOrEqual(W);
  }
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("loop, homecomings and pricing are still and complete", async ({ page }) => {
    await page.goto("/");
    const loop = page.getByTestId("loop-diagram");
    await expect(loop).toHaveAttribute("data-mode", "static");
    for (const k of ["plan", "follow", "track", "adjust"]) await expect(page.getByTestId(`loop-step-${k}`)).toBeVisible();
    await expect(loop).toContainText("Your care team updated your plan");
    await expect(page.getByTestId("homecoming-rotator")).toContainText("a stroke");
    if (page.viewportSize()!.width < 1024) {
      await page.getByTestId("pricing-track").scrollIntoViewIfNeeded();
      await page.waitForTimeout(6000);
      await expect(page.getByTestId("pricing-dot").nth(0)).toHaveAttribute("aria-current", "true");
    }
    await scrollThrough(page);
    await expectNoOverflow(page);
  });
});

test("hero: every kind of coming home", async ({ page }) => {
  await page.goto("/");
  const r = page.getByTestId("homecoming-rotator");
  await expect(r).toContainText("For every kind of coming home");
  const first = await page.getByTestId("homecoming-phrase").last().innerText();
  await expect.poll(async () => page.getByTestId("homecoming-phrase").last().innerText(), { timeout: 5000 }).not.toBe(first);
  await expect(page.getByTestId("homecoming-marquee")).toBeAttached();
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
