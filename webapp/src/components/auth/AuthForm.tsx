"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { signIn, signUp, type FormState } from "@/app/actions";
import { Button, Field, Input } from "@/components/ui/primitives";

export function AuthForm({ mode, next, side = "patient" }: { mode: "signin" | "signup"; next?: string; side?: "patient" | "clinic" }) {
  const base = side === "clinic" ? "/clinic" : "/app";
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "signin" ? signIn : signUp, undefined);
  const [tz, setTz] = useState("UTC");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  }, []);
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="timezone" value={tz} />
      {next && <input type="hidden" name="next" value={next} />}
      <input type="hidden" name="side" value={side} />
      {mode === "signup" && (
        <Field label="Your name" htmlFor="name" error={fe.name}>
          <Input id="name" name="name" autoComplete="given-name" required maxLength={60} placeholder={side === "clinic" ? "Dr. Maya Chen" : "What should we call you?"} />
        </Field>
      )}
      <Field label="Email" htmlFor="email" error={fe.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder={side === "clinic" ? "you@clinic.org" : "you@example.com"} />
      </Field>
      <Field label="Password" htmlFor="password" error={fe.password} hint={mode === "signup" ? "At least 10 characters. Stored with argon2id, never in plain text." : undefined}>
        <Input id="password" name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={mode === "signup" ? 10 : 1} />
      </Field>
      {state?.error && (
        <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-12 text-base">
        {pending ? "One moment" : mode === "signin" ? "Sign in" : side === "clinic" ? "Create clinician account" : "Create account"}
      </Button>
      <p className="text-center text-sm text-haze">
        {mode === "signin" ? (
          <>
            New to loci?{" "}
            <Link className="text-ember underline-offset-4 hover:underline" href={`${base}/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`}>
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link className="text-ember underline-offset-4 hover:underline" href={`${base}/signin${next ? `?next=${encodeURIComponent(next)}` : ""}`}>
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
