import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { Icon } from "@/components/ui/Icon";
import { LinkButton } from "@/components/ui/primitives";
import { SIGNIN_URL } from "@/lib/urls";

const SECTIONS = [
  { id: "loop", label: "How it works" },
  { id: "specialties", label: "Who it is for" },
  { id: "taste", label: "Taste" },
  { id: "safety", label: "Safety" },
  { id: "clinics", label: "For clinicians" },
  { id: "pricing", label: "Pricing" },
];

/** Main navigation. On the home page the section links scroll in place; elsewhere they lead back home. */
export function SiteHeader({ current = "home" }: { current?: "home" | "download" | "page" }) {
  const base = current === "home" ? "" : "/";
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-5 md:h-20 md:px-8" aria-label="Main">
        <Link href="/" className="flex items-center gap-2 text-[#f4f1ff]" aria-label="loci home">
          <Wordmark className="h-6 w-auto sm:h-7 md:h-8" />
        </Link>
        <div className="hidden items-center gap-7 text-sm text-haze lg:flex">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`${base}#${s.id}`} className="transition hover:text-white">
              {s.label}
            </a>
          ))}
          <Link href="/download" className={`transition hover:text-white ${current === "download" ? "text-white" : ""}`} aria-current={current === "download" ? "page" : undefined} data-testid="nav-download">
            Download
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/download"
            className={`inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm sm:px-2.5 transition hover:text-white lg:hidden ${current === "download" ? "text-white" : "text-haze"}`}
            aria-current={current === "download" ? "page" : undefined}
            aria-label="Download"
            data-testid="nav-download-compact"
          >
            <Icon name="download" className="h-4 w-4" /> <span className="hidden sm:inline">Download</span>
          </Link>
          <Link href={SIGNIN_URL} className="inline-flex h-10 items-center rounded-full px-2 text-[13px] text-haze transition hover:text-white min-[360px]:px-2.5 min-[360px]:text-sm sm:px-3" data-testid="nav-signin">
            Sign in
          </Link>
          <LinkButton href={SIGNIN_URL} className="h-10 px-3.5 text-[13px] min-[360px]:px-4 min-[360px]:text-sm" data-testid="nav-open-app">
            Open the app
          </LinkButton>
        </div>
      </nav>
    </header>
  );
}
