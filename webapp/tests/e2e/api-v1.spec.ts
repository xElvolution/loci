import { expect, test, type APIRequestContext } from "@playwright/test";
import { skipTour, uniqueEmail } from "./helpers";

/** The mobile API contract (mobile-api.md), end to end against a real build and database. */
test.describe("api v1", () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== "desktop", "API behaviour does not depend on the viewport");
  });

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const get = async (r: APIRequestContext, token: string, path: string) => {
    const res = await r.get(`/api/v1${path}`, { headers: auth(token) });
    expect(res.status(), path).toBe(200);
    expect(res.headers()["access-control-allow-origin"]).toBe("*");
    return res.json();
  };

  test("demo token: today, tick, plan, check-in escalation, journey, comfort, messages, sign out", async ({ request }) => {
    expect((await request.get("/api/v1/me")).status()).toBe(401);
    const unauth = await (await request.get("/api/v1/me", { headers: auth("loci_nope") })).json();
    expect(unauth.error.code).toBe("unauthorized");
    expect((await request.fetch("/api/v1/me", { method: "OPTIONS" })).status()).toBe(204);

    const demo = await request.post("/api/v1/auth/demo", { data: { timezone: "America/New_York" } });
    expect(demo.status()).toBe(201);
    const { token, user } = await demo.json();
    expect(token).toMatch(/^loci_/);
    expect(user.is_demo).toBe(true);

    const me = await get(request, token, "/me");
    expect(me.current_journey_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(me.journeys.find((j: { is_current: boolean }) => j.is_current).person_name).toBe("Daniel");

    const today = await get(request, token, "/journeys/current/today");
    expect(today.person_name).toBe("Daniel");
    expect(today.items.length).toBeGreaterThan(0);
    expect(today.contact.emergency_number).toBeTruthy();
    expect(today.plan_update).not.toBeNull();
    const item = today.items.find((i: { done: boolean }) => !i.done);
    const tick = await request.post("/api/v1/journeys/current/ticks", { headers: auth(token), data: { item_id: item.item_id, slot: item.slot, done: true } });
    expect(tick.status()).toBe(200);
    expect((await tick.json()).progress.done).toBe(today.progress.done + 1);
    expect((await request.post("/api/v1/journeys/current/ticks", { headers: auth(token), data: { item_id: item.item_id, slot: item.slot, done: true, date: "2020-01-01" } })).status()).toBe(400);

    expect((await request.post("/api/v1/journeys/current/plan-seen", { headers: auth(token) })).status()).toBe(200);
    expect((await get(request, token, "/journeys/current/today")).plan_update).toBeNull();

    const plan = await get(request, token, "/journeys/current/plan");
    expect(plan.items.length).toBeGreaterThan(0);
    expect(Array.isArray(plan.items[0].how)).toBe(true);
    const sign = plan.warning_signs[0];
    expect(sign.id).toBeTruthy();

    expect((await request.post("/api/v1/journeys/current/checkins", { headers: auth(token), data: { mood: 9 } })).status()).toBe(400);
    const ci = await request.post("/api/v1/journeys/current/checkins", { headers: auth(token), data: { mood: 3, pain: 3, sleep: 3, appetite: 3, energy: 3, signs: [sign.id], note: "" } });
    expect(ci.status()).toBe(201);
    const cij = await ci.json();
    expect(cij.flags.length).toBeGreaterThan(0);
    expect(cij.escalation.action).toBe(sign.action);
    expect((await get(request, token, "/journeys/current/checkins?days=14")).today_done).toBe(true);

    const journey = await get(request, token, "/journeys/current/journey");
    expect(journey.milestones.length).toBeGreaterThan(0);
    expect(journey.trends.length).toBeGreaterThan(0);

    const comfort = await get(request, token, "/journeys/current/comfort");
    expect(comfort.label).toContain("Aggregate taste affinity");
    expect(comfort.sections.soundtrack.length).toBeGreaterThan(0);

    const contact = await get(request, token, "/journeys/current/contact");
    expect(contact.team_on_loci).toBe(true);

    const before = (await get(request, token, "/journeys/current/messages")).messages.length;
    const sent = await request.post("/api/v1/journeys/current/messages", { headers: auth(token), data: { body: "Fixture question from the app", kind: "question" } });
    expect(sent.status()).toBe(201);
    expect((await sent.json()).message.kind).toBe("question");
    const after = (await get(request, token, "/journeys/current/messages")).messages;
    expect(after.length).toBe(before + 1);
    expect(after.at(-1).body).toBe("Fixture question from the app");

    expect((await request.get(`/api/v1/journeys/${"0".repeat(8)}-0000-0000-0000-${"0".repeat(12)}/today`, { headers: auth(token) })).status()).toBe(404);

    expect((await request.post("/api/v1/auth/signout", { headers: auth(token) })).status()).toBe(204);
    expect((await request.get("/api/v1/me", { headers: auth(token) })).status()).toBe(401);
  });

  test("sign up, redeem a clinician's code, follow the plan; the clinician sees the app's check-in", async ({ page, request }) => {
    test.setTimeout(120_000);
    // clinician writes and sends a plan on the web
    await page.goto("/clinic/signup");
    await page.locator("#name").fill("Dr. Api Test");
    await page.locator("#email").fill(uniqueEmail("apidoc"));
    await page.locator("#password").fill("correct horse battery");
    await page.getByRole("button", { name: "Create clinician account" }).click();
    await page.waitForURL(/\/clinic\/setup/);
    await page.getByTestId("org-name").fill("Fixture Ortho Team");
    await page.getByRole("button", { name: "Open the workspace" }).click();
    await page.waitForURL(/\/clinic$/);
    await skipTour(page);
    await page.getByTestId("new-plan-link").click();
    await page.getByTestId("np-name").fill("Rosa");
    await page.getByTestId("np-specialty").selectOption("orthopedics");
    await page.getByTestId("np-create").click();
    await page.waitForURL(/\/clinic\/p\/[0-9a-f-]{36}\/plan\?new=1/);
    const patientId = new URL(page.url()).pathname.split("/")[3];
    await page.getByTestId("add-medication").click();
    await page.getByTestId("item-title").fill("Fixture app tablet");
    await page.getByTestId("item-how").fill("Fixture step one.\nFixture step two.");
    await page.getByTestId("save-item").click();
    await expect(page.getByText("Fixture app tablet", { exact: true })).toBeVisible();
    await page.getByTestId("send-plan-btn").click();
    const code = (await page.getByTestId("plan-code").textContent())?.trim() ?? "";
    expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);

    // clinician accounts cannot use the mobile API
    const email = uniqueEmail("apipatient");
    const su = await request.post("/api/v1/auth/signup", { data: { email, password: "short", name: "Rosa" } });
    expect(su.status()).toBe(400);
    const ok = await request.post("/api/v1/auth/signup", { data: { email, password: "correct horse battery", name: "Rosa", timezone: "America/New_York" } });
    expect(ok.status()).toBe(201);
    expect((await request.post("/api/v1/auth/signup", { data: { email, password: "correct horse battery", name: "Rosa" } })).status()).toBe(409);
    expect((await request.post("/api/v1/auth/signin", { data: { email, password: "wrong password here" } })).status()).toBe(401);
    const si = await request.post("/api/v1/auth/signin", { data: { email, password: "correct horse battery" } });
    expect(si.status()).toBe(200);
    const { token } = await si.json();

    expect((await request.get("/api/v1/journeys/current/today", { headers: auth(token) })).status()).toBe(404);
    expect((await request.get("/api/v1/codes/ZZZZ-ZZZZ", { headers: auth(token) })).status()).toBe(404);
    const preview = await get(request, token, `/codes/${code}`);
    expect(preview).toMatchObject({ valid: true, care_team_name: "Fixture Ortho Team", person_name: "Rosa" });
    const red = await request.post("/api/v1/redeem", { headers: auth(token), data: { code: code.toLowerCase().replace("-", ""), share_with_team: true } });
    expect(red.status()).toBe(201);
    const { journey_id } = await red.json();
    expect(journey_id).toBe(patientId);
    expect((await request.post("/api/v1/redeem", { headers: auth(token), data: { code } })).status()).toBe(404);

    const today = await get(request, token, `/journeys/${journey_id}/today`);
    const tablet = today.items.find((i: { title: string }) => i.title === "Fixture app tablet");
    expect(tablet.how).toEqual(["Fixture step one.", "Fixture step two."]);
    await request.post(`/api/v1/journeys/${journey_id}/ticks`, { headers: auth(token), data: { item_id: tablet.item_id, slot: tablet.slot, done: true } });
    const ci = await request.post(`/api/v1/journeys/${journey_id}/checkins`, { headers: auth(token), data: { mood: 4, pain: 2, sleep: 4, appetite: 4, energy: 4, signs: [], note: "" } });
    expect(ci.status()).toBe(201);
    expect((await ci.json()).escalation).toBeNull();
    await request.post(`/api/v1/journeys/${journey_id}/messages`, { headers: auth(token), data: { body: "Fixture hello from the phone" } });

    // the clinician's tracking page shows what the app did
    await page.goto(`/clinic/p/${patientId}`);
    await expect(page.getByText("Fixture hello from the phone").first()).toBeVisible();
    await expect(page.getByText(/Checked in/).first()).toBeVisible();
  });

  test("research consent, data export and account deletion", async ({ request }) => {
    const { token } = await (await request.post("/api/v1/auth/demo", { data: { timezone: "America/New_York" } })).json();
    const r0 = await get(request, token, "/journeys/current/research");
    expect(r0).toMatchObject({ research_consent: false, can_change: true, reason: null, k: 10 });
    const put = await request.put("/api/v1/journeys/current/research", { headers: auth(token), data: { granted: true } });
    expect(put.status()).toBe(200);
    expect((await put.json()).research_consent).toBe(true);
    expect((await get(request, token, "/journeys/current/research")).research_consent).toBe(true);
    const bad = await request.put("/api/v1/journeys/current/research", { headers: auth(token), data: { granted: "yes" } });
    expect(bad.status()).toBe(400);

    const exp = await get(request, token, "/me/export");
    expect(JSON.stringify(exp)).toContain("research");

    const pre = await request.fetch("/api/v1/me", { method: "OPTIONS" });
    expect(pre.headers()["access-control-allow-methods"]).toContain("DELETE");
    const noConfirm = await request.delete("/api/v1/me", { headers: auth(token), data: { confirm: "no" } });
    expect(noConfirm.status()).toBe(400);
    const del = await request.delete("/api/v1/me", { headers: auth(token), data: { confirm: "DELETE" } });
    expect(del.status()).toBe(204);
    expect((await request.get("/api/v1/me", { headers: auth(token) })).status()).toBe(401);
  });

  test("reminder preferences: channels not connected without Twilio, cron hook disabled without a secret", async ({ request }) => {
    const { token } = await (await request.post("/api/v1/auth/demo", { data: { timezone: "America/New_York" } })).json();
    const r0 = await get(request, token, "/journeys/current/reminders");
    expect(r0).toMatchObject({ checkin_time: null, in_app: true, sms: false, whatsapp: false, channels: { sms: "not_connected", whatsapp: "not_connected" } });
    const sms = await request.put("/api/v1/journeys/current/reminders", { headers: auth(token), data: { checkin_time: "19:30", sms: true, phone: "+1 212 555 0100" } });
    expect(sms.status()).toBe(409);
    expect((await sms.json()).error.code).toBe("not_connected");
    const ok = await request.put("/api/v1/journeys/current/reminders", { headers: auth(token), data: { checkin_time: "19:30", steps: true } });
    expect(ok.status()).toBe(200);
    expect(await ok.json()).toMatchObject({ checkin_time: "19:30", steps: true, in_app: true, sms: false, phone: null });
    const badTime = await request.put("/api/v1/journeys/current/reminders", { headers: auth(token), data: { checkin_time: "25:00" } });
    expect(badTime.status()).toBe(400);
    expect((await request.post("/api/internal/reminders")).status()).toBe(404);
  });
});
