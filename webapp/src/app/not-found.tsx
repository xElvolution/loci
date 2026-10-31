import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";

export default function NotFound() {
  return (
    <div className="dusk-sky grid min-h-dvh place-items-center px-5 text-center">
      <div className="max-w-md">
        <Link href="/" aria-label="loci home" className="inline-block text-[#f4f1ff]">
          <Wordmark className="h-8 w-auto" />
        </Link>
        <p className="label-mono mt-10 text-ember">404</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">
          This road <span className="font-serif-i font-normal text-ember">leads nowhere.</span>
        </h1>
        <p className="mt-3 text-haze">The page may have moved, or a share link was switched off.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="inline-flex h-11 items-center rounded-full bg-gradient-to-br from-ember to-coral px-5 font-semibold text-night">Back home</Link>
          <Link href="/app" className="inline-flex h-11 items-center rounded-full border border-white/15 px-5">Open loci</Link>
        </div>
      </div>
    </div>
  );
}
