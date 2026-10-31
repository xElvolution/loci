import Link from "next/link";
import { NAV, docMeta } from "@/lib/docs";

export function Sidebar({ current }: { current?: string }) {
  return (
    <nav aria-label="Documentation" className="space-y-6 text-sm">
      {NAV.map((g) => (
        <div key={g.group}>
          <p className="label-mono text-ember">{g.group}</p>
          <ul className="mt-2 space-y-0.5">
            {g.items.map(([slug]) => {
              const active = slug === current;
              return (
                <li key={slug}>
                  <Link
                    href={`/${slug}`}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-lg px-3 py-1.5 transition ${active ? "bg-white/10 text-white" : "text-haze hover:bg-white/5 hover:text-white"}`}
                  >
                    {docMeta(slug)?.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
