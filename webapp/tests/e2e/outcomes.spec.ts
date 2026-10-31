import { expect, test } from "@playwright/test";
import { noOverflow, skipTour, startDemo, watch } from "./helpers";

test("outcomes: seeded charts, add a measure, record a value, readmission changes readmission-free days", async ({ page }, info) => {
  const errors = watch(page);
  await startDemo(page, "clinic");
  await skipTour(page);
  const daniel = page.getByTestId("patient-row").filter({ hasText: "Daniel" }).locator("visible=true").first();
  await (await daniel.evaluate((el) => el.tagName === "A") ? daniel : daniel.getByRole("link").first()).click();
  await page.waitForURL(/\/clinic\/p\/[0-9a-f-]{36}$/);
  await page.getByTestId("ptab-outcomes").click();
  await page.waitForURL(/\/outcomes$/);

  await expect(page.getByTestId("outcome-chart")).toHaveCount(2);
  await expect(page.getByTestId("outcome-chart").first()).toContainText("Timed Up and Go");
  await expect(page.getByTestId("outcome-chart").first()).toContainText("since first");
  await expect(page.getByTestId("readmission-free")).toHaveText("9 days");
  await expect(page.getByTestId("adherence-trend")).toBeVisible();
  await noOverflow(page, "outcomes");

  await page.getByTestId("measure-instrument").selectOption("barthel");
  await page.getByTestId("measure-target").fill("90");
  await page.getByTestId("measure-add").click();
  await expect(page.getByTestId("outcome-chart")).toHaveCount(3);
  const barthel = page.getByTestId("measure").filter({ hasText: "Barthel Index" });
  await barthel.getByTestId("value-input").fill("150");
  await barthel.getByTestId("value-save").click();
  await expect(barthel.getByRole("alert")).toContainText("0 to 100");
  await barthel.getByTestId("value-input").fill("75");
  await barthel.getByTestId("value-save").click();
  await expect(barthel.getByTestId("outcome-chart")).toContainText("latest 75 points");

  await page.getByTestId("readmit-save").click();
  await expect(page.getByTestId("outcome-kpis")).toContainText("In hospital");
  await page.getByRole("button", { name: "Home again" }).click();
  await expect(page.getByTestId("readmission-free")).toHaveText("0 days");
  await noOverflow(page, "outcomes after entries");
  await page.screenshot({ path: `shots/e2e/${info.project.name}-clinic-outcomes.png`, fullPage: true });
  expect(errors).toEqual([]);
});
