"use client";

import { useState, useTransition } from "react";
import { saveReminderPrefsAction, sendTestReminderAction } from "@/app/actions";
import { Button, inputClass } from "@/components/ui/primitives";

type Prefs = { checkin_time: string | null; steps: boolean; in_app: boolean; sms: boolean; whatsapp: boolean; phone: string | null };
type Delivery = { channel: string; kind: string; status: string; error: string | null; when: string };

export function RemindersForm({ journeyId, personName, prefs, connected, deliveries }: { journeyId: string; personName: string; prefs: Prefs; connected: { sms: boolean; whatsapp: boolean }; deliveries: Delivery[] }) {
  const [f, setF] = useState({ on: prefs.checkin_time !== null, time: prefs.checkin_time ?? "19:00", steps: prefs.steps, inApp: prefs.in_app, sms: prefs.sms && connected.sms, whatsapp: prefs.whatsapp && connected.whatsapp, phone: prefs.phone ?? "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const save = () =>
    start(async () => {
      const r = await saveReminderPrefsAction({ journeyId, checkinTime: f.on ? f.time : null, steps: f.steps, inApp: f.inApp, sms: f.sms, whatsapp: f.whatsapp, phone: f.phone });
      setMsg(r.ok ? { ok: true, text: "Reminders saved." } : { ok: false, text: r.error });
    });
  const test = (channel: "sms" | "whatsapp") =>
    start(async () => {
      const r = await sendTestReminderAction(journeyId, channel);
      setMsg(r.ok ? { ok: true, text: `Test sent by ${channel === "sms" ? "SMS" : "WhatsApp"}.` } : { ok: false, text: r.error });
    });
  const notConnected = <span className="rounded-full border border-haze/30 px-2 py-0.5 text-[11px] font-semibold text-haze" data-testid="not-connected">Not connected</span>;
  return (
    <div data-testid="reminders">
      <label className="flex flex-wrap items-center gap-3 py-2.5">
        <input type="checkbox" className="h-5 w-5 accent-[#7cf5d3]" checked={f.on} onChange={(e) => setF({ ...f, on: e.target.checked })} data-testid="remind-checkin" />
        <span className="font-medium">Remind me about {personName}&apos;s check-in at</span>
        <input type="time" className={`${inputClass.replace("w-full ", "")} h-10 w-32`} value={f.time} disabled={!f.on} onChange={(e) => setF({ ...f, time: e.target.value })} aria-label="Check-in reminder time" data-testid="remind-time" />
      </label>
      <div className="divide-y divide-white/5">
        <Row label="In the app" hint="A reminder card on Today once the time has passed and the check-in is not done." checked={f.inApp} onChange={(v) => setF({ ...f, inApp: v })} testid="remind-inapp" />
        <Row label="Plan step times" hint="Show the next step and its time at the top of Today." checked={f.steps} onChange={(v) => setF({ ...f, steps: v })} testid="remind-steps" />
        <Row label="SMS" hint={connected.sms ? "A short text with no health details." : "Text reminders need a messaging provider on this server. Nothing is sent until it is connected."} checked={f.sms} disabled={!connected.sms} onChange={(v) => setF({ ...f, sms: v })} testid="remind-sms" badge={!connected.sms && notConnected} />
        <Row label="WhatsApp" hint={connected.whatsapp ? "A short message with no health details." : "WhatsApp reminders need a messaging provider on this server. Nothing is sent until it is connected."} checked={f.whatsapp} disabled={!connected.whatsapp} onChange={(v) => setF({ ...f, whatsapp: v })} testid="remind-whatsapp" badge={!connected.whatsapp && notConnected} />
      </div>
      {(f.sms || f.whatsapp) && (
        <label className="mt-2 block">
          <span className="text-sm font-medium">Mobile number with country code</span>
          <input className={`${inputClass} mt-1.5`} inputMode="tel" placeholder="+1 212 555 0100" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} data-testid="remind-phone" />
          <span className="mt-1 block text-xs text-haze">Kept only while SMS or WhatsApp is on. Messages say only that it is time to check in.</span>
        </label>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="button" onClick={save} disabled={pending} className="h-11 px-5" data-testid="remind-save">Save reminders</Button>
        {connected.sms && prefs.sms && <Button type="button" variant="outline" onClick={() => test("sms")} disabled={pending} className="h-11 px-4 text-sm">Send a test SMS</Button>}
        {connected.whatsapp && prefs.whatsapp && <Button type="button" variant="outline" onClick={() => test("whatsapp")} disabled={pending} className="h-11 px-4 text-sm">Send a test WhatsApp</Button>}
        {msg && <span className={`text-sm ${msg.ok ? "text-mint" : "text-coral"}`} role="status">{msg.text}</span>}
      </div>
      {deliveries.length > 0 && (
        <ul className="mt-4 space-y-1 text-xs text-haze" data-testid="remind-log">
          {deliveries.map((d, i) => (
            <li key={i}>{d.when} · {d.channel === "sms" ? "SMS" : "WhatsApp"} {d.kind === "test" ? "test" : "check-in reminder"} · {d.status === "sent" ? "sent" : `failed (${d.error ?? "error"})`}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({ label, hint, checked, onChange, disabled, testid, badge }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; testid: string; badge?: React.ReactNode }) {
  return (
    <label className={`flex items-start gap-3 py-2.5 ${disabled ? "opacity-70" : "cursor-pointer"}`}>
      <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#7cf5d3]" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} data-testid={testid} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 font-medium">{label} {badge}</span>
        <span className="block text-sm text-haze">{hint}</span>
      </span>
    </label>
  );
}
