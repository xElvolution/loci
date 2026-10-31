import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { noOverflow, skipTour, startDemo, watch } from "./helpers";

test("research: separate consent toggle, aggregate-only view hides small groups, CSV export is aggregate and logged", async ({ page }, info) => {
  test.setTimeout(90_000);
  const errors = watch(page);
  await startDemo(page, "patient");
  await skipTour(page);
  await page.goto("/app/settings");
  const row = page.getByTestId("research-row").filter({ hasText: "Daniel" });
  const toggle = row.getByTestId("research-toggle");
  await expect(toggle).not.toBeChecked();
  await row.locator("label").click();
  await expect(toggle).toBeChecked();
  await page.reload();
  await expect(page.getByTestId("research-row").filter({ hasText: "Daniel" }).getByTestId("research-toggle")).toBeChecked();
  await noOverflow(page, "settings research");
  await page.getByTestId("research-consent").screenshot({ path: `shots/e2e/${info.project.name}-research-consent.png` });

  // Same demo world, clinician side.
  await page.getByTestId("switch-side").click();
  await page.waitForURL(/\/clinic/);
  await page.goto("/clinic/research");
  await expect(page.getByTestId("research-cohort")).toHaveText("fewer than 10");
  await expect(page.getByTestId("research-empty")).toBeVisible();
  expect(Number(await page.getByTestId("research-suppressed").textContent())).toBeGreaterThan(0);
  await expect(page.getByTestId("research-log")).toContainText("viewed");
  await noOverflow(page, "clinic research");
  await page.screenshot({ path: `shots/e2e/${info.project.name}-clinic-research.png`, fullPage: true });

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByTestId("research-export").click()]);
  expect(download.suggestedFilename()).toBe("loci-research-aggregate.csv");
  const csv = readFileSync((await download.path())!, "utf8");
  expect(csv.split("\n")[0]).toContain("table,specialty,measure,week_of_recovery,journeys");
  expect(csv).toContain("consenting cohort: fewer than 10");
  expect(csv).not.toContain("Daniel");
  await page.reload();
  await expect(page.getByTestId("research-log")).toContainText("exported CSV");
  expect(errors).toEqual([]);
});
