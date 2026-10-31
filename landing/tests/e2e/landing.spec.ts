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
      if (el.closest("svg, [aria-hidden='true'], [data-testid='pricing-track'], [data-testid='deck-stage']")) continue;
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

const DECK = ["Maternity and postpartum", "General surgery", "Orthopedic and joint", "Stroke and neuro rehab", "Cardiac", "Pediatrics", "Mental health", "Oncology", "Respiratory", "Diabetes and metabolic", "Elder care and falls", "Any other hospital stay"];

async function deckAtRest(page: Page) {
  const deck = page.getByTestId("specialty-deck");
  await deck.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.mouse.move(2, 2);
  await page.waitForTimeout(400);
  return deck;
}

async function swipe(page: Page, dx: number) {
  await expect(page.getByTestId("deck-front")).toHaveCount(1);
  const b = (await page.getByTestId("deck-front").boundingBox())!;
  const x = b.x + b.width / 2, y = b.y + b.height * 0.4;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(x + (dx * i) / 10, y + i);
  await page.mouse.up();
}

test("specialty deck: auto-deals left, swipes both ways, keyboard, stays inside the screen", async ({ page }) => {
  await page.goto("/");
  const deck = await deckAtRest(page);
  await expect(deck).toHaveAttribute("data-mode", "animated");
  await expect(deck).toHaveAttribute("data-front", DECK[0]);
  const front = page.getByTestId("deck-front");
  await expect(front.getByRole("link", { name: "Open the app" })).toHaveAttribute("href", SIGNIN);
  await expect(front).toContainText("Template: 6 weeks");

  // three cards stacked, alternating dark and light, all inside the viewport, no clipped content
  const W = page.viewportSize()!.width;
  const cards = await page.locator("[data-testid='deck-stage'] [data-pos]").evaluateAll((els) =>
    els.map((e) => { const r = e.getBoundingClientRect(); const a = e.querySelector("article")!; return { pos: Number((e as HTMLElement).dataset.pos), l: r.left, r: r.right, bg: getComputedStyle(a).backgroundColor, fits: a.scrollHeight <= a.clientHeight + 1 }; }));
  const visible = cards.filter((c) => c.pos < 3).sort((a, b) => a.pos - b.pos);
  expect(visible.length).toBe(3);
  for (const c of visible) { expect(c.l).toBeGreaterThanOrEqual(0); expect(c.r).toBeLessThanOrEqual(W); expect(c.fits).toBe(true); }
  expect(visible[0].bg).not.toBe(visible[1].bg);
  expect(visible[0].bg).toBe(visible[2].bg);

  // auto-advance when idle
  await expect(deck).toHaveAttribute("data-front", DECK[1], { timeout: 4000 });

  // hold still while touched: swipe left then right, each moves the next card forward
  const before = await deck.getAttribute("data-front");
  const i0 = DECK.indexOf(before!);
  await swipe(page, -160);
  await expect(deck).toHaveAttribute("data-front", DECK[(i0 + 1) % 12]);
  await swipe(page, 160);
  await expect(deck).toHaveAttribute("data-front", DECK[(i0 + 2) % 12]);
  // a short drag snaps back
  await page.waitForTimeout(400);
  await swipe(page, -30);
  await page.waitForTimeout(400);
  await expect(deck).toHaveAttribute("data-front", DECK[(i0 + 2) % 12]);

  // keyboard: right deals the next card, left brings the last one back
  await page.mouse.move(2, 2);
  await deck.focus();
  await page.keyboard.press("ArrowRight");
  await expect(deck).toHaveAttribute("data-front", DECK[(i0 + 3) % 12]);
  await page.waitForTimeout(300);
  await page.keyboard.press("ArrowLeft");
  await expect(deck).toHaveAttribute("data-front", DECK[(i0 + 2) % 12]);
  await expect(page.getByTestId("deck-live")).toContainText(DECK[(i0 + 2) % 12]);
  // focus pauses the deal
  await page.waitForTimeout(3200);
  await expect(deck).toHaveAttribute("data-front", DECK[(i0 + 2) % 12]);

  await expect(page.getByTestId(W >= 1024 ? "see-how" : "see-how-mobile")).toHaveAttribute("href", "#how");
  await expectNoOverflow(page);
});

test("specialty deck: touch swipe deals a card, vertical touch still scrolls the page", async ({ page }) => {
  test.skip(!page.viewportSize() || page.viewportSize()!.width >= 1024, "touch on phones");
  await page.goto("/");
  const deck = await deckAtRest(page);
  const cdp = await page.context().newCDPSession(page);
  const touch = async (pts: [number, number][]) => {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: pts[0][0], y: pts[0][1] }] });
    for (const [x, y] of pts.slice(1)) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] }); await page.waitForTimeout(16); }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  await expect(page.getByTestId("deck-front")).toHaveCount(1);
  const b = (await page.getByTestId("deck-front").boundingBox())!;
  const x = b.x + b.width / 2, y = b.y + b.height * 0.4;
  const start = await deck.getAttribute("data-front");
  await touch(Array.from({ length: 12 }, (_, i) => [x - i * 16, y + i] as [number, number]));
  await expect(deck).not.toHaveAttribute("data-front", start!, { timeout: 900 });
  await page.waitForTimeout(500);
  const y0 = await page.evaluate(() => window.scrollY);
  await touch(Array.from({ length: 12 }, (_, i) => [x, y - i * 20] as [number, number]));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(y0 + 40);
});

test("specialty deck: loops through all twelve and back to the first", async ({ page }) => {
  await page.goto("/");
  const deck = await deckAtRest(page);
  await deck.focus();
  for (let i = 1; i <= 12; i++) {
    await page.keyboard.press("ArrowRight");
    await expect(deck).toHaveAttribute("data-front", DECK[i % 12]);
    await page.waitForTimeout(260);
  }
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
    const deck = page.getByTestId("specialty-deck");
    await expect(deck).toHaveAttribute("data-mode", "static");
    await expect(deck.getByTestId("deck-card")).toHaveCount(12);
    for (const t of DECK) await expect(deck.getByRole("heading", { name: t })).toBeVisible();
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
