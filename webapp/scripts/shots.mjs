// Screenshot sweep: node scripts/shots.mjs [baseUrl] [outDir]
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3751";
const out = process.argv[3] ?? "shots";
const widths = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const pages = ["/app", "/app/plan", "/app/checkin", "/app/ask", "/app/journey", "/app/circle", "/app/comfort", "/app/settings"];
const clinicPages = ["/clinic", "/clinic/new", "/clinic/templates", "/clinic/research", "/clinic/inbox", "/clinic/settings"];

const browser = await chromium.launch();
const problems = [];
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w.width, height: w.height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && problems.push(`[${w.name}] console ${page.url()}: ${m.text().slice(0, 200)}`));
  page.on("pageerror", (e) => problems.push(`[${w.name}] pageerror ${page.url()}: ${e.message.slice(0, 200)}`));
  const skipTour = async () => {
    const tour = page.getByTestId("product-tour");
    try {
      await tour.waitFor({ state: "attached", timeout: 8000 });
      await page.getByRole("button", { name: "Skip tour" }).click();
      await tour.waitFor({ state: "detached", timeout: 5000 });
      await page.waitForTimeout(1200);
      console.log(`[${w.name}] tour skipped on ${page.url()}`);
    } catch (e) {
      console.log(`[${w.name}] no tour on ${page.url()}: ${String(e).slice(0, 80)}`);
    }
  };
  const shot = async (name) => {
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 1) problems.push(`[${w.name}] overflow ${over}px on ${name}`);
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 220));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/${w.name}-${name}.png`, fullPage: true });
  };
  for (const p of ["/privacy", "/safety", "/app/demo", "/app/redeem", "/clinic/signup"]) {
    await page.goto(base + p, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await shot(p.slice(1).replace(/\//g, "_"));
  }
  // patient side of the shared demo
  await page.goto(base + "/app/demo", { waitUntil: "networkidle" });
  await page.getByTestId("demo-patient").click();
  await page.waitForURL(/\/app$/, { timeout: 60000 });
  await page.waitForTimeout(800);
  await shot("patient_tour");
  await skipTour();
  for (const p of pages) {
    await page.goto(base + p, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    await shot(p === "/app" ? "patient_today" : `patient_${p.slice(5).replace(/\//g, "_")}`);
  }
  // same world, clinician side
  await page.getByTestId("switch-side").click();
  await page.waitForURL(/\/clinic$/, { timeout: 60000 });
  await page.waitForTimeout(800);
  await shot("clinic_tour");
  await skipTour();
  for (const p of clinicPages) {
    await page.goto(base + p, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    await shot(p === "/clinic" ? "clinic_patients" : `clinic_${p.slice(8).replace(/\//g, "_")}`);
  }
  await page.goto(base + "/clinic", { waitUntil: "networkidle" });
  const row = page.getByTestId("patient-row").filter({ hasText: "Daniel" }).locator("visible=true").first();
  const link = (await row.evaluate((el) => el.tagName === "A")) ? row : row.getByRole("link").first();
  const href = await link.getAttribute("href");
  for (const [suffix, name] of [["", "clinic_tracking"], ["/plan", "clinic_plan"], ["/plan?view=preview", "clinic_preview"], ["/messages", "clinic_messages"]]) {
    await page.goto(base + href + suffix, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    await shot(name);
  }
  await ctx.close();
}
await browser.close();
console.log(problems.length ? problems.join("\n") : "no problems");
