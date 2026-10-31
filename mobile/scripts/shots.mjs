// Screenshot sweep of the Expo web build at phone size against the live API with the demo account.
// Usage: npx expo export --platform web && node scripts/serve.mjs 8099 & node scripts/shots.mjs http://localhost:8099 shots
// Checks: console errors, horizontal overflow, overlapping text boxes. Never prints the token.
import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const base = process.argv[2] || "http://localhost:8099";
const out = process.argv[3] || "shots";
const SESSION = process.env.LOCI_SHOT_SESSION || "/tmp/loci-shot-session.json";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "en-US", timezoneId: "Africa/Lagos" });
const page = await ctx.newPage();
const problems = [];
// the invalid-code check answers 404 on purpose; every other failed API call counts
page.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && problems.push(`console: ${m.text().slice(0, 200)}`));
page.on("response", (r) => r.status() >= 400 && !(r.status() === 404 && r.url().includes("/api/v1/codes/")) && problems.push(`http ${r.status()}: ${r.url().replace(/^https?:\/\/[^/]+/, "")}`));
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));

const tid = (id) => page.locator(`[data-testid="${id}"]:visible`).first();
const wait = (ms) => page.waitForTimeout(ms);
/** Tap at an element's center, so the topmost screen's control gets it (tab headers stack on web). */
async function tap(id) {
  const b = await tid(id).boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
}
let n = 0;

async function audit(name) {
  const r = await page.evaluate(() => {
    const W = window.innerWidth;
    const vis = (el) => {
      const s = getComputedStyle(el);
      if (s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) return false;
      const b = el.getBoundingClientRect();
      return b.width > 0 && b.height > 0;
    };
    const inHScroll = (el) => {
      for (let p = el.parentElement; p; p = p.parentElement) {
        const s = getComputedStyle(p);
        if ((s.overflowX === "auto" || s.overflowX === "scroll") && p.scrollWidth > p.clientWidth) return true;
      }
      return false;
    };
    const leaves = [...document.querySelectorAll("body *")].filter((el) => [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()) && vis(el));
    const overflow = leaves.filter((el) => { const b = el.getBoundingClientRect(); return b.right > W + 1 && !inHScroll(el) && b.top < window.innerHeight && b.bottom > 0 && document.elementFromPoint(Math.max(0, Math.min(W - 1, b.left + 4)), b.top + b.height / 2) !== null && el.contains(document.elementFromPoint(Math.max(0, Math.min(W - 1, b.left + 4)), b.top + b.height / 2)); }).map((el) => el.textContent.trim().slice(0, 40));
    const overlaps = [];
    // only text that is actually on top at its own position (inactive tab screens stay mounted underneath on web)
    const onTop = (el, b) => {
      const x = Math.min(Math.max(b.left + Math.min(8, b.width / 2), 0), W - 1);
      const y = b.top + b.height / 2;
      if (y < 0 || y >= window.innerHeight) return false;
      const hit = document.elementFromPoint(x, y);
      return !!hit && (el === hit || el.contains(hit) || hit.contains(el));
    };
    const rects = leaves
      .filter((el) => !inHScroll(el))
      .map((el) => {
        // the text box itself, not the block: use a range
        const rg = document.createRange();
        rg.selectNodeContents(el);
        return { el, b: rg.getBoundingClientRect() };
      })
      .filter((r) => onTop(r.el, r.b));
    for (let i = 0; i < rects.length; i++)
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], c = rects[j];
        if (a.el.contains(c.el) || c.el.contains(a.el)) continue;
        const w = Math.min(a.b.right, c.b.right) - Math.max(a.b.left, c.b.left);
        const h = Math.min(a.b.bottom, c.b.bottom) - Math.max(a.b.top, c.b.top);
        if (w > 3 && h > 3) overlaps.push(`"${a.el.textContent.trim().slice(0, 30)}" x "${c.el.textContent.trim().slice(0, 30)}"`);
      }
    return { overflow: overflow.slice(0, 5), overlaps: overlaps.slice(0, 5) };
  });
  if (r.overflow.length) problems.push(`${name}: horizontal overflow ${JSON.stringify(r.overflow)}`);
  if (r.overlaps.length) problems.push(`${name}: overlapping text ${r.overlaps.join("; ")}`);
}

/** Screenshot the viewport, then scroll the main scroll view and capture more segments. */
async function shot(name, { segments = 3 } = {}) {
  await wait(400);
  n++;
  const prefix = `${out}/${String(n).padStart(2, "0")}-${name}`;
  await page.screenshot({ path: `${prefix}.png` });
  await audit(name);
  for (let s = 1; s < segments; s++) {
    const moved = await page.evaluate((s) => {
      const els = [...document.querySelectorAll("div")].filter((d) => {
        const st = getComputedStyle(d);
        if (!((st.overflowY === "auto" || st.overflowY === "scroll") && d.scrollHeight > d.clientHeight + 20 && d.getBoundingClientRect().width > 300)) return false;
        const b = d.getBoundingClientRect();
        const hit = document.elementFromPoint(b.left + b.width / 2, b.top + Math.min(b.height / 2, 200));
        return !!hit && d.contains(hit);
      });
      const el = els.sort((a, b) => b.clientHeight - a.clientHeight)[0];
      if (!el) return false;
      const before = el.scrollTop;
      el.scrollTop = s * (el.clientHeight - 120);
      return el.scrollTop !== before;
    }, s);
    if (!moved) break;
    await wait(300);
    await page.screenshot({ path: `${prefix}-${s + 1}.png` });
    await audit(`${name}-${s + 1}`);
  }
}

// reuse a demo session within its 24 hours so reruns don't burn the demo rate limit
if (existsSync(SESSION)) {
  const saved = JSON.parse(readFileSync(SESSION, "utf8"));
  if (saved.expires_at && new Date(saved.expires_at) > new Date(Date.now() + 3600_000) && !process.env.FRESH) {
    await ctx.addInitScript((s) => {
      if (!sessionStorage.getItem("loci.token")) for (const [k, v] of Object.entries(s.storage)) sessionStorage.setItem(k, v);
    }, saved);
  }
}

await page.goto(base, { waitUntil: "networkidle" });
await wait(2600);
if (await tid("welcome").isVisible().catch(() => false)) {
  await shot("welcome", { segments: 2 });
  await tid("start-signin").click();
  await shot("signin", { segments: 1 });
  await page.getByRole("button", { name: "Back" }).first().click();
  await tid("start-demo").click();
  await tid("today").waitFor({ timeout: 30000 });
  const storage = await page.evaluate(() => ({ "loci.token": sessionStorage.getItem("loci.token"), "loci.user": sessionStorage.getItem("loci.user") }));
  writeFileSync(SESSION, JSON.stringify({ storage, expires_at: new Date(Date.now() + 23 * 3600_000).toISOString() }), { mode: 0o600 });
}
await tid("today").waitFor({ timeout: 30000 });
await page.locator('[data-testid="step-0"]').waitFor({ timeout: 20000 });
await wait(1500);
await shot("today", { segments: 4 });

// open the first step for what, why, how; tick it off
await tid("step-0").getByRole("button").first().click();
await wait(300);
await tid("step-0").scrollIntoViewIfNeeded();
await shot("today-step-open", { segments: 1 });
const before = await tid("tick-0").getAttribute("aria-checked");
await tid("tick-0").click();
await wait(1500);
const after = await tid("tick-0").getAttribute("aria-checked");
if (before === after) problems.push(`tick did not toggle (${before} -> ${after})`);
await shot("today-ticked", { segments: 1 });
await tid("tick-0").click(); // put it back
await wait(800);

// full plan
await tid("open-plan").click();
await tid("plan").waitFor();
await wait(1200);
await shot("plan", { segments: 3 });
await tap("back");

// check-in with the when-to-call panel and escalation
await page.getByRole("tab", { name: /Check in/ }).click();
await tid("checkin").waitFor();
await tid("when-to-call").waitFor({ timeout: 20000 });
await tid("when-to-call").click();
await shot("checkin", { segments: 4 });
await tid("mood-4").click();
await tid("pain-7").click();
await tid("sleep-3").click();
await tid("appetite-3").click();
await tid("energy-2").click();
if (await tid("sign-0").count()) await tid("sign-0").click();
await tid("note").fill("Knee a bit warmer tonight.");
await tid("save-checkin").click();
await tid("checkin-result").waitFor({ timeout: 20000 });
await wait(600);
await shot("checkin-result", { segments: 2 });
if (!(await tid("call-emergency").count())) problems.push("check-in result has no emergency call button");

// journey
await page.getByRole("tab", { name: /Journey/ }).click();
await tid("journey").waitFor();
await wait(1500);
await shot("journey", { segments: 4 });

// comfort (Qloo can take a few seconds)
await page.getByRole("tab", { name: /Comfort/ }).click();
await tid("comfort").waitFor();
await page.locator('[data-testid="goodday-0"]').waitFor({ timeout: 40000 });
await wait(2500);
await shot("comfort", { segments: 4 });

// ask my care team
await page.getByRole("tab", { name: /Ask/ }).click();
await tid("ask").waitFor();
await tid("message-body").waitFor({ timeout: 20000 });
await wait(800);
await shot("ask", { segments: 3 });
await tid("message-body").fill("Is it fine to use the stairs once a day now?");
await tid("send").click();
await wait(2000);
await shot("ask-sent", { segments: 1 });

// circle and settings
await tap("open-circle");
await tid("circle").waitFor();
await wait(1500);
await shot("circle", { segments: 2 });
await tap("back");
await tap("open-settings");
await tid("settings").waitFor();
await wait(800);
await shot("settings", { segments: 3 });

// redeem (with an invalid code: shows the friendly error)
await page.goto(`${base}/redeem`, { waitUntil: "networkidle" });
await tid("redeem").waitFor({ timeout: 20000 });
await shot("redeem", { segments: 1 });
await tid("code").fill("zzzz9999");
await tid("check-code").click();
await wait(1800);
await shot("redeem-invalid", { segments: 1 });

await browser.close();
writeFileSync(`${out}/report.json`, JSON.stringify({ base, shots: n, problems }, null, 2));
console.log(`${n} screens captured in ${out}/`);
console.log(problems.length ? `PROBLEMS:\n- ${problems.join("\n- ")}` : "no console errors, overflow or text overlaps");
