import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { SPECIALTIES } from "@/lib/care/specialties";
import { GITHUB_URL, SIGNIN_URL, app, docs } from "@/lib/urls";

type Item = { label: string; href: string; external?: boolean };

const COLUMNS: { title: string; items: Item[] }[] = [
  {
    title: "Product",
    items: [
      { label: "How it works", href: "/#loop" },
      { label: "Features", href: "/#how" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Download", href: "/download" },
      { label: "Open the app", href: SIGNIN_URL },
      { label: "Sign in", href: SIGNIN_URL },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Docs", href: docs() },
      { label: "API", href: docs("/api") },
      { label: "Mobile", href: docs("/mobile") },
      { label: "Research", href: docs("/research") },
      { label: "GitHub", href: GITHUB_URL, external: true },
      { label: "Changelog", href: `${GITHUB_URL}/blob/main/CHANGELOG.md`, external: true },
    ],
  },
  {
    title: "Company",
    items: [{ label: "Contact", href: "/contact" }],
  },
  {
    title: "Legal",
    items: [
      { label: "Privacy", href: app("/privacy") },
      { label: "Terms", href: "/terms" },
      { label: "Security", href: "/security" },
      { label: "Cookie policy", href: "/cookies" },
    ],
  },
];

function FooterLink({ item }: { item: Item }) {
  const testId = `footer-${item.label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  const cls = "inline-flex min-h-8 items-center text-[15px] text-haze transition hover:text-white md:text-sm";
  return item.external ? (
    <a href={item.href} className={cls} rel="noopener noreferrer" data-testid={testId}>{item.label}</a>
  ) : (
    <Link href={item.href} className={cls} data-testid={testId}>{item.label}</Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-night pt-14 pb-10 md:pt-16" data-testid="site-footer">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_2.9fr]">
          <div className="min-w-0">
            <Link href="/" aria-label="loci home" className="inline-flex text-[#f4f1ff]">
              <Wordmark className="h-7 w-auto" animated={false} />
            </Link>
            <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-haze">The way home after hospital. Care teams write the plan, patients and families follow it, and both sides stay in the loop.</p>
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            {COLUMNS.slice(0, 2).map((c) => (
              <nav key={c.title} aria-label={c.title} className="min-w-0">
                <h2 className="label-mono text-[11px] text-[#f4f1ff]">{c.title}</h2>
                <ul className="mt-4 space-y-1.5">{c.items.map((i) => <li key={i.label}><FooterLink item={i} /></li>)}</ul>
              </nav>
            ))}
            <nav aria-label="Specialties" className="col-span-2 min-w-0 sm:col-span-1">
              <h2 className="label-mono text-[11px] text-[#f4f1ff]">Specialties</h2>
              <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-1" data-testid="footer-specialties">
                {SPECIALTIES.map((s) => (
                  <li key={s.id} className="min-w-0"><Link href="/#specialties" className="inline-flex min-h-8 items-center text-[15px] text-haze transition hover:text-white md:text-sm">{s.label}</Link></li>
                ))}
              </ul>
            </nav>
            {COLUMNS.slice(2).map((c) => (
              <nav key={c.title} aria-label={c.title} className="min-w-0">
                <h2 className="label-mono text-[11px] text-[#f4f1ff]">{c.title}</h2>
                <ul className="mt-4 space-y-1.5">{c.items.map((i) => <li key={i.label}><FooterLink item={i} /></li>)}</ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-white/8 pt-6 text-sm text-haze/80 md:flex-row md:items-center md:justify-between">
          <p>&copy; 2026 Elvolution. loci is open source under the MIT License.</p>
          <p>Taste picks by Qloo are aggregate affinity.</p>
        </div>
      </div>
    </footer>
  );
}
