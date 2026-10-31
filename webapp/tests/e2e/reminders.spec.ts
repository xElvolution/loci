import { expect, test } from "@playwright/test";
import { noOverflow, skipTour, startDemo, watch } from "./helpers";

test("reminders: in-app preferences, SMS and WhatsApp shown as not connected, nothing fake-sent", async ({ page }, info) => {
  const errors = watch(page);
  await startDemo(page, "patient");
  await skipTour(page);
  await page.goto("/app/settings");
  const r = page.getByTestId("reminders");
  await expect(r.getByTestId("not-connected")).toHaveCount(2);
  await expect(r.getByTestId("remind-sms")).toBeDisabled();
  await expect(r.getByTestId("remind-whatsapp")).toBeDisabled();
  await expect(r.getByTestId("remind-phone")).toHaveCount(0);
  await r.getByTestId("remind-checkin").check();
  await r.getByTestId("remind-time").fill("00:00");
  await r.getByTestId("remind-steps").check();
  await r.getByTestId("remind-save").click();
  await expect(r.getByRole("status")).toHaveText("Reminders saved.");
  await expect(page.getByText(/Send a test/)).toHaveCount(0);
  await noOverflow(page, "settings reminders");
  await r.screenshot({ path: `shots/e2e/${info.project.name}-reminders.png` });
  await page.reload();
  await expect(page.getByTestId("remind-time")).toHaveValue("00:00");

  await page.goto("/app");
  const checkedIn = await page.getByTestId("today-checkin-done").count();
  if (!checkedIn) await expect(page.getByTestId("reminder-checkin")).toContainText("Time for");
  else await expect(page.getByTestId("reminder-checkin")).toHaveCount(0);
  await noOverflow(page, "today with reminders");
  expect(errors).toEqual([]);
});
