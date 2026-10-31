import "server-only";

export type Channel = "sms" | "whatsapp";
export type SendResult = { ok: true; id: string } | { ok: false; error: string };

/** A delivery provider for one channel. `configured()` must be false unless real credentials exist. */
export interface MessageProvider {
  readonly name: string;
  readonly channel: Channel;
  configured(): boolean;
  send(to: string, body: string): Promise<SendResult>;
}

type Env = Record<string, string | undefined>;

/** Twilio Programmable Messaging over its REST API. SMS needs TWILIO_SMS_FROM; WhatsApp needs TWILIO_WHATSAPP_FROM. */
export class TwilioProvider implements MessageProvider {
  readonly name = "twilio";
  constructor(readonly channel: Channel, private env: Env = process.env, private doFetch: typeof fetch = fetch) {}

  private from() {
    return this.channel === "sms" ? this.env.TWILIO_SMS_FROM : this.env.TWILIO_WHATSAPP_FROM;
  }
  configured(): boolean {
    return Boolean(this.env.TWILIO_ACCOUNT_SID && this.env.TWILIO_AUTH_TOKEN && this.from());
  }
  async send(to: string, body: string): Promise<SendResult> {
    if (!this.configured()) return { ok: false, error: "not_connected" };
    const sid = this.env.TWILIO_ACCOUNT_SID!;
    const prefix = this.channel === "whatsapp" ? "whatsapp:" : "";
    const form = new URLSearchParams({ To: prefix + to, From: prefix + this.from()!, Body: body });
    try {
      const res = await this.doFetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
        method: "POST",
        headers: { Authorization: `Basic ${Buffer.from(`${sid}:${this.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
        signal: AbortSignal.timeout(10_000),
      });
      const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string; code?: number };
      if (!res.ok || !data.sid) return { ok: false, error: `twilio ${res.status}${data.code ? ` ${data.code}` : ""}: ${data.message ?? "request failed"}`.slice(0, 300) };
      return { ok: true, id: data.sid };
    } catch (e) {
      return { ok: false, error: `twilio unreachable: ${e instanceof Error ? e.message : "error"}`.slice(0, 300) };
    }
  }
}

export function providerFor(channel: Channel, env: Env = process.env): MessageProvider {
  return new TwilioProvider(channel, env);
}

export function connectedChannels(env: Env = process.env): Record<Channel, boolean> {
  return { sms: providerFor("sms", env).configured(), whatsapp: providerFor("whatsapp", env).configured() };
}
