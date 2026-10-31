"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ackFlagAction, orgInviteAction } from "@/app/actions";
import { Icon } from "@/components/ui/Icon";
import { Button, inputClass } from "@/components/ui/primitives";

function CopyRow({ url, testid }: { url: string; testid?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 flex gap-2">
      <input readOnly value={url} className={`${inputClass} font-mono text-xs`} aria-label="Invite link" onFocus={(e) => e.currentTarget.select()} data-testid={testid} />
      <Button
        type="button"
        className="h-12 shrink-0 px-4"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          } catch {
            setCopied(false);
          }
        }}
      >
        <Icon name={copied ? "check" : "copy"} className="h-4 w-4" /> {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

export function AckFlag({ journeyId, flagId }: { journeyId: string; flagId: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs hover:border-mint hover:text-mint" data-testid="ack-open">
        Mark reviewed
      </button>
    );
  return (
    <form
      className="flex w-full gap-2 sm:w-auto"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          await ackFlagAction(journeyId, flagId, note);
          router.refresh();
        });
      }}
    >
      <input className="h-9 min-w-0 flex-1 rounded-xl border border-haze/20 bg-night/60 px-3 text-xs outline-none focus:border-ember/80 sm:w-48" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Called back, advised visit" aria-label="Review note" autoFocus />
      <button type="submit" disabled={pending} className="h-9 shrink-0 rounded-xl bg-mint px-3 text-xs font-semibold text-night disabled:opacity-60">
        Save
      </button>
    </form>
  );
}

export function InviteClinician({ orgId }: { orgId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <section className="glass rounded-3xl p-5 md:p-6">
      <p className="label-mono text-haze">Your team</p>
      <h2 className="mt-1 text-lg font-bold">Invite a colleague</h2>
      {url ? (
        <CopyRow url={url} />
      ) : (
        <Button type="button" variant="outline" className="mt-3" disabled={pending} onClick={() => start(async () => { const r = await orgInviteAction(orgId); if (r.ok) setUrl(r.url); })}>
          <Icon name="link" className="h-4 w-4" /> Create clinician invite
        </Button>
      )}
    </section>
  );
}
