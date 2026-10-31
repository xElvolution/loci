import { expect, test } from "@playwright/test";
import { noOverflow, skipTour, startDemo, uniqueEmail, watch } from "./helpers";

test("root hands signed-out visitors to the landing site; public live-taste API is aggregate only", async ({ request }) => {
  const root = await request.get("/", { maxRedirects: 0 });
  expect([303, 307, 308]).toContain(root.status());
  expect(root.headers()["location"]).toBe("http://landing.example.test");
  const lt = await request.get("/api/public/live-taste");
  expect(lt.ok()).toBe(true);
  const body = await lt.json();
  expect(Array.isArray(body.picks)).toBe(true);
  expect(Object.keys(body).sort()).toEqual(["favs", "picks"]);
});

test("public pages render without overflow", async ({ page }) => {
  const errors = watch(page);
  for (const p of ["/privacy", "/safety", "/app/demo", "/app/signin", "/app/signup", "/clinic/signin", "/clinic/signup", "/app/redeem"]) {
    await page.goto(p);
    await noOverflow(page, p);
  }
  expect(errors).toEqual([]);
});

test("demo journey: today, check-in, plan, circle, comfort, share card, settings", async ({ page }) => {
  const errors = watch(page);
  await startDemo(page, "patient");
  await skipTour(page);
  await expect(page.getByTestId("demo-banner")).toBeVisible();
  await noOverflow(page, "today");

  await page.goto("/app/checkin");
  for (const m of ["mood", "sleep", "appetite", "energy"]) await page.getByTestId(`${m}-4`).click();
  await page.getByTestId("pain").fill("2");
  await page.getByTestId("save-checkin").click();
  await expect(page.getByTestId("checkin-done").or(page.getByTestId("escalation"))).toBeVisible();
  await noOverflow(page, "checkin");

  await page.goto("/app/journey");
  await expect(page.locator('[data-tour="journey-road"]')).toBeVisible();
  await noOverflow(page, "journey");

  await page.goto("/app/plan");
  await expect(page.getByTestId("plan-steps")).toBeVisible();
  await expect(page.getByText("Why your team asked").first()).toBeVisible();
  await expect(page.getByTestId("when-to-call")).toBeVisible();
  await expect(page.getByTestId("add-care")).toHaveCount(0);
  await noOverflow(page, "plan");

  await page.goto("/app/ask");
  await expect(page.getByTestId("thread")).toBeVisible();
  await noOverflow(page, "ask");

  await page.goto("/app/circle");
  await page.getByTestId("task-title").fill("Fixture errand");
  await page.getByRole("button", { name: "Add errand" }).click();
  await expect(page.getByText("Fixture errand", { exact: true })).toBeVisible();
  await page.getByTestId("create-invite").click();
  await expect(page.getByTestId("invite-link")).toHaveValue(/\/app\/join\//);
  await noOverflow(page, "circle");

  await page.goto("/app/comfort");
  await expect(page.getByTestId("good-day")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/aggregate taste affinity/i).first()).toBeVisible();
  await page.getByTestId("share-on").click();
  const url = await page.getByTestId("share-url").inputValue();
  expect(url).toMatch(/\/w\//);
  await noOverflow(page, "comfort");

  await page.goto(new URL(url).pathname);
  await expect(page.getByTestId("welcome-card")).toBeVisible();
  await expect(page.getByTestId("welcome-card")).not.toContainText(/discharge|warning|pain|medicine|orthopedic/i);
  await noOverflow(page, "card");

  await page.goto("/app/settings");
  await expect(page.locator('[data-tour="replay-tour"]')).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByTestId("export").click();
  expect((await download).suggestedFilename()).toMatch(/loci-export/);
  await noOverflow(page, "settings");
  expect(errors).toEqual([]);
});

test("guided tour walks every step and can be replayed", async ({ page }) => {
  const errors = watch(page);
  await startDemo(page, "patient");
  const tour = page.getByTestId("product-tour");
  await tour.waitFor({ state: "attached" });
  const seen: string[] = [];
  for (let i = 0; i < 20; i++) {
    const id = await tour.getAttribute("data-step");
    if (id) seen.push(id);
    await page.waitForTimeout(500);
    await noOverflow(page, `tour step ${id}`);
    const finish = page.getByRole("button", { name: /Finish/ });
    if (await finish.count()) {
      await finish.click();
      break;
    }
    await page.getByRole("button", { name: /^Next/ }).click();
    await expect(tour).not.toHaveAttribute("data-step", id ?? "");
  }
  await expect(tour).toHaveCount(0);
  expect(seen.length).toBeGreaterThanOrEqual(6);
  await page.goto("/app/settings");
  await page.getByRole("button", { name: "Replay tour" }).click();
  await expect(page.getByTestId("product-tour")).toBeAttached();
  expect(errors).toEqual([]);
});

test("sign up, onboard a maternity journey, add a warning sign and see escalation", async ({ page }) => {
  const errors = watch(page);
  await page.goto("/app/signup");
  await page.locator("#name").fill("Ada");
  await page.locator("#email").fill(uniqueEmail("ada"));
  await page.locator("#password").fill("correct horse battery");
  await page.getByRole("button", { name: /create|sign up/i }).click();
  await page.waitForURL(/onboarding/);
  await page.getByTestId("role-caregiver").click();
  await page.getByTestId("onboarding-next").click();
  await page.getByTestId("spec-maternity").click();
  await page.getByTestId("onboarding-next").click();
  await page.getByTestId("person-name").fill("Zoe");
  await noOverflow(page, "onboarding basics");
  await page.getByTestId("onboarding-next").click();
  await page.getByTestId("onboarding-next").click();
  await page.getByTestId("onboarding-next").click();
  await page.waitForURL(/\/app\/plan\?welcome=1/);
  await skipTour(page).catch(() => undefined);
  await page.getByTestId("sign-text").fill("Fixture warning sign from the letter");
  await page.getByTestId("plan-signs").getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Fixture warning sign from the letter")).toBeVisible();

  await page.goto("/app/checkin");
  for (const m of ["mood", "sleep", "appetite", "energy"]) await page.getByTestId(`${m}-3`).click();
  await page.getByTestId("pain").fill("1");
  await page.getByRole("button", { name: /Fixture warning sign/ }).click();
  await page.getByTestId("save-checkin").click();
  await expect(page.getByTestId("escalation")).toBeVisible();
  await expect(page.getByTestId("escalation")).toContainText("Fixture warning sign from the letter");
  expect(errors).toEqual([]);
});

test("clinician tour walks every step", async ({ page }) => {
  const errors = watch(page);
  await startDemo(page, "clinic");
  const tour = page.getByTestId("product-tour");
  await tour.waitFor({ state: "attached" });
  const seen: string[] = [];
  for (let i = 0; i < 15; i++) {
    const id = await tour.getAttribute("data-step");
    if (id) seen.push(id);
    await page.waitForTimeout(500);
    await noOverflow(page, `clinic tour step ${id}`);
    const finish = page.getByRole("button", { name: /Finish/ });
    if (await finish.count()) {
      await finish.click();
      break;
    }
    await page.getByRole("button", { name: /^Next/ }).click();
    await expect(tour).not.toHaveAttribute("data-step", id ?? "");
  }
  await expect(tour).toHaveCount(0);
  expect(seen).toEqual(expect.arrayContaining(["c-list", "c-new", "c-send", "c-track", "c-inbox"]));
  expect(errors).toEqual([]);
});

test("clinic workspace: patient list, flag review, tracking and side switch", async ({ page }) => {
  const errors = watch(page);
  await startDemo(page, "clinic");
  await skipTour(page);
  await expect(page.getByTestId("demo-banner")).toContainText("clinician view");
  await expect(page.getByTestId("patient-row").locator("visible=true").first()).toBeVisible();
  await noOverflow(page, "clinic");
  const queue = page.getByTestId("flag-queue");
  if (await queue.count()) {
    const before = await queue.locator("li").count();
    await queue.getByTestId("ack-open").first().click();
    await queue.getByRole("button", { name: "Save" }).click();
    await expect(queue.locator("li")).toHaveCount(before - 1);
  }
  const daniel = page.getByTestId("patient-row").filter({ hasText: "Daniel" }).locator("visible=true").first();
  await (await daniel.evaluate((el) => el.tagName === "A") ? daniel : daniel.getByRole("link").first()).click();
  await page.waitForURL(/\/clinic\/p\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId("trends")).toBeVisible();
  await noOverflow(page, "clinic patient");
  await page.getByTestId("ptab-plan").click();
  await expect(page.getByTestId("send-plan")).toBeVisible();
  await page.getByTestId("view-preview").click();
  await expect(page.getByTestId("plan-preview")).toBeVisible();
  await noOverflow(page, "clinic plan preview");
  await page.goto("/app/team");
  await expect(page).toHaveURL(/\/clinic$/);
  await page.getByTestId("switch-side").click();
  await page.waitForURL(/\/app$/);
  expect(errors).toEqual([]);
});
