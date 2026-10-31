import { expect, test, type Page } from "@playwright/test";
import { noOverflow, skipTour, uniqueEmail, watch } from "./helpers";

/**
 * The full loop across two real accounts in two browser contexts:
 * the clinician writes and sends a plan, the patient redeems and follows it,
 * the clinician sees the update and the flag, edits the plan, the patient sees the change.
 */
test("two-sided loop: plan, send, redeem, follow, check in, track, flag, update", async ({ browser }, info) => {
  test.setTimeout(240_000);
  const shot = (p: Page, name: string) => p.screenshot({ path: `shots/e2e/${info.project.name}-${name}.png`, fullPage: true });
  const vp = info.project.use.viewport ?? { width: 1440, height: 900 };
  const mobile = vp.width < 768;
  const ctxOpts = { baseURL: info.project.use.baseURL, viewport: vp, isMobile: info.project.use.isMobile, hasTouch: info.project.use.hasTouch, deviceScaleFactor: info.project.use.deviceScaleFactor };

  // ---------- clinician ----------
  const cctx = await browser.newContext(ctxOpts);
  const doc = await cctx.newPage();
  const docErrors = watch(doc);
  await doc.goto("/clinic/signup");
  await doc.locator("#name").fill("Dr. Ines Park");
  await doc.locator("#email").fill(uniqueEmail("ines"));
  await doc.locator("#password").fill("correct horse battery");
  await doc.getByRole("button", { name: "Create clinician account" }).click();
  await doc.waitForURL(/\/clinic\/setup/);
  await doc.getByTestId("org-name").fill("Riverside Stroke Team");
  await doc.getByRole("button", { name: "Open the workspace" }).click();
  await doc.waitForURL(/\/clinic$/);
  await skipTour(doc);
  await noOverflow(doc, "clinic empty");

  await doc.getByTestId("new-plan-link").click();
  await doc.waitForURL(/\/clinic\/new/);
  await doc.getByTestId("np-name").fill("Theo");
  await doc.getByTestId("np-specialty").selectOption("neuro");
  await noOverflow(doc, "new plan");
  await doc.getByTestId("np-create").click();
  await doc.waitForURL(/\/clinic\/p\/[0-9a-f-]{36}\/plan\?new=1/);
  const planUrl = new URL(doc.url()).pathname;
  const patientId = planUrl.split("/")[3];

  await doc.getByTestId("add-medication").click();
  await doc.getByTestId("item-title").fill("Fixture tablet from the stroke team");
  await doc.getByTestId("item-why").fill("Fixture reason the team gave.");
  await doc.getByTestId("item-how").fill("Fixture step one.\nFixture step two.");
  await doc.getByTestId("save-item").click();
  await expect(doc.getByText("Fixture tablet from the stroke team", { exact: true })).toBeVisible();
  await doc.getByTestId("sign-text").fill("Fixture sudden weakness on one side");
  await doc.getByTestId("plan-signs").getByRole("button", { name: "Add" }).click();
  await expect(doc.getByText("Fixture sudden weakness on one side")).toBeVisible();
  await noOverflow(doc, "plan editor");
  await shot(doc, "clinic-plan-editor");

  await doc.getByTestId("view-preview").click();
  await expect(doc.getByTestId("plan-preview")).toContainText("Fixture step two.");
  await noOverflow(doc, "plan preview");
  await shot(doc, "clinic-plan-preview");

  await doc.getByTestId("send-plan-btn").click();
  const code = (await doc.getByTestId("plan-code").textContent())?.trim() ?? "";
  expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  await expect(doc.getByTestId("plan-link")).toHaveValue(/\/app\/join\/[A-Z0-9]{8}$/);
  await shot(doc, "clinic-sent");

  // ---------- patient ----------
  const pctx = await browser.newContext(ctxOpts);
  const pat = await pctx.newPage();
  const patErrors = watch(pat);
  await pat.goto("/app/redeem");
  await noOverflow(pat, "redeem");
  await pat.getByTestId("redeem-code").fill(code.toLowerCase());
  await pat.getByTestId("redeem-go").click();
  await pat.waitForURL(/\/app\/join\/[A-Z0-9]{8}$/);
  await pat.getByTestId("join-signup").click();
  await pat.locator("#name").fill("Theo");
  await pat.locator("#email").fill(uniqueEmail("theo"));
  await pat.locator("#password").fill("correct horse battery");
  await pat.getByRole("button", { name: "Create account" }).click();
  await pat.waitForURL(/\/app\/join\//);
  await expect(pat.getByTestId("join-consent")).toBeChecked();
  await pat.getByTestId("join-agree").check();
  await pat.getByTestId("join-accept").click();
  await pat.waitForURL(/\/app\?joined=1/);
  await skipTour(pat);
  await expect(pat.getByTestId("joined-welcome")).toBeVisible();
  await noOverflow(pat, "patient today");

  await pat.goto("/app/plan");
  await expect(pat.getByTestId("plan-step").first()).toContainText("Fixture reason the team gave.");
  await expect(pat.getByTestId("plan-step").first()).toContainText("Fixture step two.");
  await expect(pat.getByTestId("when-to-call")).toContainText("Fixture sudden weakness on one side");
  await noOverflow(pat, "patient plan");
  await shot(pat, "patient-plan");

  await pat.goto("/app");
  await pat.getByRole("button", { pressed: false }).filter({ hasText: "Fixture tablet from the stroke team" }).first().click();
  await expect(pat.getByRole("button", { pressed: true }).filter({ hasText: "Fixture tablet from the stroke team" }).first()).toBeVisible();
  await shot(pat, "patient-today");

  await pat.goto("/app/checkin");
  for (const m of ["mood", "sleep", "appetite", "energy"]) await pat.getByTestId(`${m}-3`).click();
  await pat.getByTestId("pain").fill("2");
  await pat.getByRole("button", { name: /Fixture sudden weakness/ }).click();
  await pat.getByTestId("save-checkin").click();
  await expect(pat.getByTestId("escalation")).toContainText("Fixture sudden weakness on one side");
  await noOverflow(pat, "escalation");

  await pat.goto("/app/ask");
  await pat.getByTestId("msg-body").fill("Fixture question: can I walk to the shop?");
  await pat.getByTestId("msg-send").click();
  await expect(pat.getByTestId("thread")).toContainText("Fixture question: can I walk to the shop?");
  await noOverflow(pat, "ask");
  await shot(pat, "patient-ask");

  // ---------- clinician sees it live ----------
  await doc.goto("/clinic");
  await expect(doc.getByTestId("flag-queue")).toContainText("Theo");
  await expect(doc.getByTestId("question-queue")).toContainText("Fixture question");
  const row = doc.getByTestId("patient-row").filter({ hasText: "Theo" }).locator("visible=true").first();
  await expect(row).toContainText("Following the plan");
  await shot(doc, "clinic-list");
  await doc.goto(`/clinic/p/${patientId}`);
  await expect(doc.getByTestId("patient-flags")).toContainText("Fixture sudden weakness");
  await expect(doc.getByTestId("today-items")).toContainText("Fixture tablet from the stroke team");
  await expect(doc.getByTestId("patient-notes")).toContainText("Fixture question");
  await expect(doc.getByTestId("circle-status")).toContainText("Theo");
  await noOverflow(doc, "tracking");
  await shot(doc, "clinic-tracking");
  await doc.getByTestId("patient-flags").getByTestId("ack-open").first().click();
  await doc.getByTestId("patient-flags").getByRole("button", { name: "Save" }).click();
  await expect(doc.getByTestId("patient-flags")).toHaveCount(0);

  await doc.goto(`/clinic/p/${patientId}/messages`);
  await doc.getByTestId("msg-body").fill("Fixture reply from the team.");
  await doc.getByTestId("msg-send").click();
  await expect(doc.getByTestId("thread")).toContainText("Fixture reply from the team.");
  await expect(doc.getByTestId("resolve-q")).toHaveCount(0);
  await noOverflow(doc, "messages");

  // ---------- clinician edits the sent plan ----------
  await doc.goto(planUrl.replace(/\?.*$/, ""));
  await doc.getByTestId("add-exercise").click();
  await doc.getByTestId("item-title").fill("Fixture arm exercise added later");
  await doc.getByTestId("item-how").fill("Fixture lift the arm slowly.");
  await doc.getByTestId("save-item").click();
  await expect(doc.getByText("Fixture arm exercise added later", { exact: true })).toBeVisible();

  // ---------- patient sees the change ----------
  await pat.goto("/app");
  await expect(pat.getByTestId("plan-updated")).toContainText("Fixture arm exercise added later");
  await shot(pat, "patient-updated");
  await pat.goto("/app/plan");
  await expect(pat.getByTestId("plan-steps")).toContainText("Fixture lift the arm slowly.");
  await pat.getByTestId("plan-seen").click();
  await expect(pat.getByTestId("plan-updated")).toHaveCount(0);
  await pat.goto("/app/ask");
  await expect(pat.getByTestId("thread")).toContainText("Fixture reply from the team.");
  if (mobile) await noOverflow(pat, "mobile ask");

  expect(docErrors).toEqual([]);
  expect(patErrors).toEqual([]);
  await cctx.close();
  await pctx.close();
});
