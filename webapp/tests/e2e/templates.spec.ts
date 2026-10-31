import { expect, test } from "@playwright/test";
import { noOverflow, skipTour, startDemo, watch } from "./helpers";

test("templates: structure template blocks sending until written, save and reuse a team template", async ({ page }, info) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  page.on("dialog", (d) => d.accept());
  await startDemo(page, "clinic");
  await skipTour(page);
  await page.goto("/clinic/templates");
  await expect(page.getByTestId("builtin-template")).toHaveCount(2);
  await noOverflow(page, "templates");
  await page.screenshot({ path: `shots/e2e/${info.project.name}-clinic-templates.png`, fullPage: true });
  await page.getByTestId("builtin-template").filter({ hasText: "Orthopedics and joints" }).getByTestId("use-builtin").click();
  await page.waitForURL(/\/clinic\/new\?template=/);
  await expect(page.getByTestId("np-template")).toHaveValue("builtin:ortho-physio");
  await expect(page.getByTestId("np-specialty")).toHaveValue("orthopedics");
  await page.getByTestId("np-name").fill("Mara");
  await page.getByTestId("np-create").click();
  await page.waitForURL(/\/clinic\/p\/[0-9a-f-]{36}\/plan\?new=1/);

  const chips = page.getByTestId("needs-words");
  const n = await chips.count();
  expect(n).toBeGreaterThan(4);
  await page.getByTestId("send-plan-btn").click();
  await expect(page.getByTestId("send-plan").getByRole("alert")).toContainText("your own words");

  // Write one item in the clinician's own words.
  const first = page.locator("li", { has: chips }).first();
  await first.getByRole("button", { name: /^Edit / }).click();
  await page.getByTestId("item-title").fill("Fixture knee bends");
  await page.getByTestId("item-why").fill("Fixture reason from the physio.");
  await page.getByTestId("item-how").fill("Fixture step one.");
  await page.getByTestId("save-item").click();
  await expect(page.getByText("Fixture knee bends", { exact: true })).toBeVisible();
  await expect(chips).toHaveCount(n - 1);
  // Remove the rest.
  for (let left = n - 1; left > 0; left--) {
    await page.locator("li", { has: chips }).first().getByRole("button", { name: /^Remove / }).click();
    await expect(chips).toHaveCount(left - 1);
  }
  await noOverflow(page, "plan from template");
  await page.getByTestId("send-plan-btn").click();
  await expect(page.getByTestId("plan-code")).toHaveText(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);

  await page.getByTestId("template-name").fill("Fixture knee pathway");
  await page.getByTestId("template-save").click();
  await expect(page.getByTestId("save-as-template")).toContainText("Saved to your team templates");

  await page.goto("/clinic/templates");
  const mine = page.getByTestId("team-template").filter({ hasText: "Fixture knee pathway" });
  await expect(mine).toBeVisible();
  await mine.getByTestId("edit-template").click();
  await page.waitForURL(/\/clinic\/templates\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId("tpl-item-title").first()).toHaveValue("Fixture knee bends");
  await page.getByTestId("tpl-add-sign").click();
  await page.getByTestId("tpl-sign").last().fill("Fixture calf swelling");
  await page.getByTestId("tpl-save").click();
  await expect(page.getByRole("status")).toContainText("Template saved");
  await noOverflow(page, "template editor");
  await page.screenshot({ path: `shots/e2e/${info.project.name}-clinic-template-editor.png`, fullPage: true });

  await page.goto("/clinic/templates");
  await page.getByTestId("team-template").filter({ hasText: "Fixture knee pathway" }).getByTestId("use-template").click();
  await page.getByTestId("np-name").fill("Omar");
  await page.getByTestId("np-create").click();
  await page.waitForURL(/\/plan\?new=1/);
  await expect(page.getByText("Fixture knee bends", { exact: true })).toBeVisible();
  await expect(page.getByText("Fixture calf swelling")).toBeVisible();
  await expect(chips).toHaveCount(0);
  expect(errors).toEqual([]);
});
