import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { app, docs } from "@/lib/urls";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-night py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 text-sm text-haze md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-3">
          <Wordmark className="h-6 w-auto text-[#f4f1ff]" animated={false} />
          <span>The way home after hospital.</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/download" className="hover:text-white" data-testid="footer-download">Download</Link>
          <Link href={app("/privacy")} className="hover:text-white">Privacy</Link>
          <Link href={app("/safety")} className="hover:text-white">Safety</Link>
          <Link href={app("/app/demo")} className="hover:text-white">Demo</Link>
          <Link href={app("/app/signin")} className="hover:text-white">Patient sign in</Link>
          <Link href={app("/clinic/signin")} className="hover:text-white">Clinician sign in</Link>
          <Link href={docs()} className="hover:text-white">Docs</Link>
        </div>
        <p className="max-w-sm text-xs text-haze/80">loci is not a medical device and does not give medical advice. Taste picks by Qloo are aggregate affinity.</p>
      </div>
    </footer>
  );
}
