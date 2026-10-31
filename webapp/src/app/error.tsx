"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="dusk-sky grid min-h-dvh place-items-center px-5 text-center">
      <div className="max-w-md">
        <p className="label-mono text-coral">Something went wrong</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">
          We hit a bump <span className="font-serif-i font-normal text-ember">on the road.</span>
        </h1>
        <p className="mt-3 text-haze">Try again. If you are worried about your health, call your care team or your local emergency number now.</p>
        <div className="mt-8 flex justify-center gap-3">
          <button type="button" onClick={reset} className="inline-flex h-11 items-center rounded-full bg-gradient-to-br from-ember to-coral px-5 font-semibold text-night">Try again</button>
          <Link href="/" className="inline-flex h-11 items-center rounded-full border border-white/15 px-5">Home</Link>
        </div>
      </div>
    </div>
  );
}
