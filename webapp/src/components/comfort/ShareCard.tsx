"use client";

import { useState, useTransition } from "react";
import { setShareAction } from "@/app/actions";
import { Icon } from "@/components/ui/Icon";
import { Button, inputClass } from "@/components/ui/primitives";
import { WelcomeCard, type CardTheme } from "@/components/share/WelcomeCard";
import type { Ritual } from "@/lib/care/goodday";

export function ShareCard(props: { journeyId: string; canShare: boolean; personName: string; rituals: Ritual[]; url: string | null; theme: CardTheme; message: string; from: string }) {
  const [theme, setTheme] = useState<CardTheme>(props.theme);
  const [message, setMessage] = useState(props.message || `Welcome home, ${props.personName}. We have missed you.`);
  const [from, setFrom] = useState(props.from);
  const [url, setUrl] = useState(props.url);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = (on: boolean) =>
    start(async () => {
      setErr(null);
      const r = await setShareAction({ journeyId: props.journeyId, on, theme, message, from });
      if (!r.ok) setErr(r.error);
      else setUrl(r.url);
    });

  return (
    <section className="grid gap-6 rounded-[32px] border border-white/8 bg-gradient-to-br from-dusk-800/60 to-night p-5 md:grid-cols-[1fr_1.1fr] md:p-8" data-testid="share-card">
      <div className="min-w-0">
        <p className="label-mono text-ember">Welcome-home card</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">A card for the people who care</h2>
        <p className="mt-2 text-sm text-haze">Rituals built from taste, never from health. The public link shows no plan, no check-ins and no condition.</p>
        {props.canShare ? (
          <div className="mt-5 space-y-4">
            <div>
              <span className="text-sm font-medium">Style</span>
              <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Card style">
                {(["dusk", "paper", "sunrise"] as const).map((t) => (
                  <button key={t} type="button" role="radio" aria-checked={theme === t} onClick={() => setTheme(t)} className={`h-10 rounded-full border px-4 text-sm capitalize transition ${theme === t ? "border-ember bg-ember/15 text-ember" : "border-white/15 text-haze"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="text-sm font-medium">Message</span>
              <textarea className="mt-1.5 w-full rounded-2xl border border-haze/20 bg-night/60 p-3 text-[15px] outline-none focus:border-ember/80" rows={2} maxLength={200} value={message} onChange={(e) => setMessage(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">From</span>
              <input className={`${inputClass} mt-1.5`} maxLength={60} value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Everyone at home" />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => save(true)} disabled={pending} data-testid="share-on">
                <Icon name="share" className="h-4 w-4" /> {url ? "Update the card" : "Create a share link"}
              </Button>
              {url && (
                <Button type="button" variant="ghost" onClick={() => save(false)} disabled={pending}>
                  Stop sharing
                </Button>
              )}
            </div>
            {url && (
              <div className="flex gap-2">
                <input readOnly value={url} className={`${inputClass} font-mono text-xs`} aria-label="Share link" onFocus={(e) => e.currentTarget.select()} data-testid="share-url" />
                <Button
                  type="button"
                  variant="outline"
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
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            )}
            {err && <p className="text-sm text-coral">{err}</p>}
          </div>
        ) : (
          <p className="mt-4 text-sm text-haze">Only {props.personName} or the main caregiver can share the card.</p>
        )}
      </div>
      <div className="min-w-0">
        <WelcomeCard theme={theme} personName={props.personName} message={message} from={from} rituals={props.rituals} />
      </div>
    </section>
  );
}
