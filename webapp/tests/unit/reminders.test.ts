import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { checkinDue, normalisePhone, reminderText } from "@/lib/care/reminders";
import { TwilioProvider, connectedChannels } from "@/lib/server/reminders/provider";

describe("reminder rules", () => {
  it("normalises phone numbers to E.164", () => {
    expect(normalisePhone("+1 (212) 555-0100")).toBe("+12125550100");
    expect(normalisePhone("0044 20 7946 0958")).toBe("+442079460958");
    expect(normalisePhone("212 555 0100")).toBeNull();
    expect(normalisePhone("+12")).toBeNull();
  });
  it("is due after the time and only while today's check-in is missing", () => {
    expect(checkinDue({ checkinTime: "19:00", nowMinutes: 19 * 60, checkedInToday: false })).toBe(true);
    expect(checkinDue({ checkinTime: "19:00", nowMinutes: 18 * 60 + 59, checkedInToday: false })).toBe(false);
    expect(checkinDue({ checkinTime: "19:00", nowMinutes: 20 * 60, checkedInToday: true })).toBe(false);
    expect(checkinDue({ checkinTime: null, nowMinutes: 20 * 60, checkedInToday: false })).toBe(false);
  });
  it("message text carries no health details", () => {
    const t = reminderText("checkin", "Daniel", "https://x.test/app/checkin");
    expect(t).toContain("Daniel");
    expect(t).not.toMatch(/pain|surgery|stroke|medic|plan/i);
  });
});

describe("twilio provider", () => {
  const env = { TWILIO_ACCOUNT_SID: "AC_test", TWILIO_AUTH_TOKEN: "secret", TWILIO_SMS_FROM: "+15550001111" };
  it("is not configured without credentials and never calls out", async () => {
    const f = vi.fn();
    const p = new TwilioProvider("sms", {}, f as unknown as typeof fetch);
    expect(p.configured()).toBe(false);
    expect(await p.send("+12125550100", "hi")).toEqual({ ok: false, error: "not_connected" });
    expect(f).not.toHaveBeenCalled();
    expect(connectedChannels({})).toEqual({ sms: false, whatsapp: false });
  });
  it("needs a WhatsApp sender for WhatsApp", () => {
    expect(new TwilioProvider("whatsapp", env).configured()).toBe(false);
    expect(connectedChannels(env)).toEqual({ sms: true, whatsapp: false });
  });
  it("posts to the Twilio Messages API and reports the real result", async () => {
    const f = vi.fn().mockResolvedValue(new Response(JSON.stringify({ sid: "SM123" }), { status: 201 }));
    const r = await new TwilioProvider("sms", env, f as unknown as typeof fetch).send("+12125550100", "hello");
    expect(r).toEqual({ ok: true, id: "SM123" });
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://api.twilio.com/2010-04-01/Accounts/AC_test/Messages.json");
    expect(String(init.body)).toContain("To=%2B12125550100");
    expect(init.headers.Authorization).toMatch(/^Basic /);
  });
  it("prefixes WhatsApp numbers and surfaces provider errors", async () => {
    const f = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 21211, message: "Invalid To" }), { status: 400 }));
    const r = await new TwilioProvider("whatsapp", { ...env, TWILIO_WHATSAPP_FROM: "+15550002222" }, f as unknown as typeof fetch).send("+12125550100", "hello");
    expect(r.ok).toBe(false);
    expect(String(f.mock.calls[0][1].body)).toContain("From=whatsapp%3A%2B15550002222");
  });
});
