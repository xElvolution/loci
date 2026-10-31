"use client";

import { useActionState, useEffect, useState } from "react";
import { deleteAccount, updateProfile, type FormState } from "@/app/actions";
import { Button, inputClass } from "@/components/ui/primitives";

export function ProfileForm({ name, timezone }: { name: string; timezone: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, undefined);
  const [tz, setTz] = useState(timezone);
  const [zones, setZones] = useState<string[]>([timezone]);
  useEffect(() => {
    const list = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only list
    setZones(list.includes(timezone) ? list : [timezone, ...list]);
  }, [timezone]);
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <label className="block">
        <span className="text-sm font-medium">Your name</span>
        <input name="name" defaultValue={name} maxLength={60} className={`${inputClass} mt-1.5`} required />
        {state?.fieldErrors?.name && <span className="mt-1 block text-xs text-coral">{state.fieldErrors.name}</span>}
      </label>
      <label className="block">
        <span className="text-sm font-medium">Time zone</span>
        <select name="timezone" value={tz} onChange={(e) => setTz(e.target.value)} className={`${inputClass} mt-1.5`}>
          {zones.map((z) => (
            <option key={z} value={z}>{z.replace(/_/g, " ")}</option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-3 md:col-span-2">
        <Button type="submit" disabled={pending}>Save</Button>
        {state?.ok && <span className="text-sm text-mint" role="status">{state.ok}</span>}
      </div>
    </form>
  );
}

export function DeleteForm({ isDemo }: { isDemo: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteAccount, undefined);
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <label className="block min-w-0 flex-1">
        <span className="sr-only">Type DELETE to confirm</span>
        <input name="confirm" placeholder="Type DELETE to confirm" className={inputClass} autoComplete="off" data-testid="delete-confirm" />
        {state?.fieldErrors?.confirm && <span className="mt-1 block text-xs text-coral">{state.fieldErrors.confirm}</span>}
      </label>
      <button type="submit" disabled={pending} className="h-12 shrink-0 rounded-full bg-coral px-5 font-semibold text-night transition hover:brightness-110 disabled:opacity-60">
        {isDemo ? "End the demo and erase it" : "Delete my account"}
      </button>
    </form>
  );
}
