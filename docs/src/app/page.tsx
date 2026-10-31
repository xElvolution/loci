import Link from "next/link";
import { Chrome } from "@/components/Chrome";
import { NAV, docMeta } from "@/lib/docs";

export default function Home() {
  return (
    <Chrome>
      <p className="label-mono text-ember">Documentation</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance md:text-5xl">
        How loci <span className="font-serif-i font-normal text-ember">works.</span>
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-haze text-pretty">
        Care teams write the recovery plan and track it. Patients and families follow it at home. These pages explain how it is built, what it stores, how it stays safe, and how it uses Qloo.
      </p>
      <div className="mt-10 space-y-10">
        {NAV.map((g) => (
          <section key={g.group}>
            <h2 className="label-mono text-haze">{g.group}</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map(([slug]) => (
                <Link key={slug} href={`/${slug}`} data-testid={`card-${slug}`} className="glass block rounded-2xl p-4 transition hover:border-ember/50">
                  <p className="font-semibold text-white">{docMeta(slug)?.label}</p>
                  <p className="mt-1 text-xs text-haze">/{slug}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Chrome>
  );
}
