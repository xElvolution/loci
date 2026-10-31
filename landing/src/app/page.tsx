import Link from "next/link";
import { Suspense } from "react";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { RoadHome } from "@/components/art/RoadHome";
import { Glyph } from "@/components/art/Glyph";
import { HeroChips } from "@/components/landing/HeroChips";
import { DashboardPreview, TodayPreview } from "@/components/landing/Previews";
import { LiveTaste } from "@/components/landing/LiveTaste";
import { LoopDiagram } from "@/components/landing/LoopDiagram";
import { PricingPlans } from "@/components/landing/PricingPlans";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import { LinkButton } from "@/components/ui/primitives";
import { SPECIALTIES } from "@/lib/care/specialties";
import { SIGNIN_URL, app } from "@/lib/urls";

export const revalidate = 3600;

const STEPS = [
  { n: "01", icon: "edit", title: "The team writes the plan", body: "A clinician starts from a specialty template and writes each medicine and time, care task, exercise, appointment and warning sign, with a plain why and how. Then sends it with a code. No clinic on loci yet? Families can copy the discharge letter instead. loci never writes the medicine." },
  { n: "02", icon: "route", title: "Walk the road home", body: "Every day has a short list and a two-minute check-in: mood, pain, sleep, appetite and energy. Streaks and milestones turn a long recovery into steps you can see." },
  { n: "03", icon: "users", title: "Bring the circle", body: "Partners, kids, neighbors and paid carers join with a link. They see progress, tick off shared errands and cheer the small wins, with consent the person controls." },
  { n: "04", icon: "chart", title: "Keep the team in the loop", body: "Clinics see adherence and check-in trends across their patients, and a clear list of check-ins that crossed the thresholds they set. Rules they wrote, never a guess." },
];

const NEVER = ["A diagnosis or a risk score", "Medical advice or doses", "Your plan or check-ins sent to Qloo", "Names or emails sent to Qloo", "Ads, or data sold to anyone"];

export default async function Landing() {
  return (
    <div className="overflow-x-clip">
      <SiteHeader />

      {/* hero */}
      <section className="dusk-sky relative pt-24 pb-14 md:pt-32 md:pb-20">
        <div className="map-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative mx-auto grid grid-cols-1 max-w-7xl items-center gap-10 px-5 md:px-8 lg:grid-cols-[1.02fr_1fr]">
          <div className="min-w-0">
            <p className="label-mono text-ember">Recovery after hospital, for everyone</p>
            <h1 className="mt-4 text-[44px] leading-[0.98] font-bold tracking-tight text-balance sm:text-6xl lg:text-[76px]">
              The way home, <span className="font-serif-i font-normal text-ember">together.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-haze text-pretty md:text-xl" data-testid="one-liner">
              Care teams write the recovery plan and track it. Patients and families follow it at home, step by step. loci is the loop between them, from the first night home to thriving.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton href={SIGNIN_URL} className="h-12 px-6 text-base" data-testid="hero-open-app">
                Open the app <Icon name="arrowR" className="h-4 w-4" />
              </LinkButton>
            </div>
          </div>
          <div className="relative min-w-0">
            <RoadHome className="h-auto w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.45)]" />
            <HeroChips />
          </div>
        </div>
      </section>

      {/* the loop */}
      <section id="loop" className="relative bg-night py-24 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal className="max-w-3xl">
            <p className="label-mono text-lilac">Two sides, one loop</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-balance md:text-5xl">
              Plan, follow, track, <span className="font-serif-i font-normal text-lilac">adjust.</span>
            </h2>
            <p className="mt-4 text-lg text-haze text-pretty">
              The care team sets the plan and the rules. The patient follows clear steps in the team&apos;s own words. Everything the patient does reaches the team live, and every change the team makes reaches the patient.
            </p>
          </Reveal>
          <Reveal delay={0.08} className="mt-12">
            <LoopDiagram />
          </Reveal>
        </div>
      </section>

      {/* who it's for */}
      <section id="specialties" className="relative bg-night py-24 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal className="max-w-3xl">
            <p className="label-mono text-ember">Who it is for</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-balance md:text-5xl">
              Every kind of coming home, <span className="font-serif-i font-normal text-ember">not just one.</span>
            </h2>
            <p className="mt-4 text-lg text-haze text-pretty">
              A new parent after birth. A teenager after surgery. A grandfather after a fall. Someone leaving mental health care. loci gives each specialty its own shape, and the people around them a place to help.
            </p>
          </Reveal>
          <ul className="mt-12 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {SPECIALTIES.map((s, k) => (
              <Reveal as="li" key={s.id} delay={(k % 4) * 0.06}>
                <div className="group relative h-full overflow-hidden rounded-3xl border border-white/8 bg-dusk-950/80 p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20">
                  <span className="absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-20 blur-2xl transition group-hover:opacity-40" style={{ background: s.hue }} aria-hidden="true" />
                  <Glyph name={s.glyph} className="h-8 w-8" color={s.hue} />
                  <p className="mt-3 font-semibold leading-tight">{s.label}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-haze text-pretty md:text-[14px] md:leading-snug">{s.blurb}</p>
                  <p className="label-mono mt-3 text-[10px] text-haze/70">{s.ledBy === "caregiver" ? "Often family-led" : "Patient-led"}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="paper relative py-24 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal className="max-w-3xl">
            <p className="label-mono text-coral">How it works</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-balance md:text-5xl">
              From discharge letter to <span className="font-serif-i font-normal text-coral">home and thriving.</span>
            </h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <ol className="relative grid grid-cols-1 gap-5 sm:grid-cols-2">
              {STEPS.map((s, k) => (
                <Reveal as="li" key={s.n} delay={k * 0.08}>
                  <div className="paper-card h-full rounded-3xl p-6">
                    <div className="flex items-center justify-between">
                      <span className="grid grid-cols-1 h-10 w-10 place-items-center rounded-2xl bg-ink text-paper">
                        <Icon name={s.icon} className="h-5 w-5" />
                      </span>
                      <span className="font-mono text-sm text-ink-soft">{s.n}</span>
                    </div>
                    <h3 className="mt-4 text-xl font-bold">{s.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-ink-soft text-pretty">{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
            <Reveal delay={0.1} className="mx-auto w-full max-w-sm">
              <TodayPreview />
            </Reveal>
          </div>
        </div>
      </section>

      {/* taste */}
      <section id="taste" className="dusk-sky relative py-24 md:py-28">
        <div className="mx-auto grid grid-cols-1 max-w-7xl items-center gap-12 px-5 md:px-8 lg:grid-cols-2">
          <Reveal>
            <p className="label-mono text-mint">Taste, powered by Qloo</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-balance md:text-5xl">
              Recovery goes better when the days <span className="font-serif-i font-normal text-ember">feel like yours.</span>
            </h2>
            <p className="mt-4 text-lg text-haze text-pretty">
              Long days at home are where people lose heart. loci uses Qloo taste intelligence to fill them with things the person will actually enjoy: a soundtrack, shows, books and podcasts, meals near home within the food filters they tick, gentle places to visit when their team says it is time, a good-day plan and a welcome-home ritual the family can share.
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-2 text-[15px] text-[#ece8ff] sm:grid-cols-2">
              {["Only favorite titles and a city point go to Qloo", "Food and access filters are ticked by people, never inferred", "Every pick says which favorite it came from", "Results are aggregate affinity, never health logic"].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-mint" /> {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <Suspense fallback={<div className="glass h-72 animate-pulse rounded-3xl" />}>
              <LiveTaste />
            </Suspense>
          </Reveal>
        </div>
      </section>

      {/* safety and privacy */}
      <section id="safety" className="paper py-24 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal className="max-w-3xl">
            <p className="label-mono text-coral">Safety and privacy</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-balance md:text-5xl">
              Clear about what we are, <span className="font-serif-i font-normal text-coral">and what we are not.</span>
            </h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Reveal className="paper-card rounded-3xl p-6">
              <Icon name="alert" className="h-6 w-6 text-coral" />
              <h3 className="mt-3 text-xl font-bold">Warning signs are the care team&apos;s words</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">If a check-in ticks a warning sign or crosses a threshold the clinician set, loci shows the clinician&apos;s instruction and one-tap buttons to call the team or the local emergency number. It is a simple rule, shown in full.</p>
            </Reveal>
            <Reveal delay={0.06} className="paper-card rounded-3xl p-6">
              <Icon name="lock" className="h-6 w-6 text-ink" />
              <h3 className="mt-3 text-xl font-bold">Minimal data, your keys</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">A first name or nickname is enough. Sharing with the circle or a clinic is opt-in and logged. Export everything as a file, or delete your account and every journey you own, in two clicks.</p>
            </Reveal>
            <Reveal delay={0.12} className="paper-card rounded-3xl p-6">
              <p className="label-mono text-ink-soft">loci never provides</p>
              <ul className="mt-3 space-y-2">
                {NEVER.map((t) => (
                  <li key={t} className="flex items-center gap-2 text-[15px] font-medium">
                    <Icon name="x" className="h-4 w-4 shrink-0 text-coral" /> {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal className="paper-card mt-4 rounded-3xl p-6 md:p-8">
            <p className="label-mono text-ink-soft">Research, only if you say yes</p>
            <h3 className="mt-2 text-xl font-bold">Helping recovery care improve, without anyone being identifiable</h3>
            <div className="mt-3 grid grid-cols-1 gap-4 text-[15px] leading-relaxed text-ink-soft md:grid-cols-3">
              <p><strong className="text-ink">A separate switch.</strong> Research consent is its own setting, off unless you turn it on. Sharing with your care team never turns it on, and you can turn it off any time.</p>
              <p><strong className="text-ink">Groups, never people.</strong> Your care team sees only counts and averages by specialty and week of recovery. Any group with fewer than 10 people is hidden.</p>
              <p><strong className="text-ink">Nothing that names you.</strong> No names, contact details, dates, notes, messages or taste favorites. Every view and export is logged.</p>
            </div>
          </Reveal>
          <p className="mt-8 text-sm text-ink-soft">
            Read the plain-language <Link className="font-semibold text-ink underline underline-offset-4" href={app("/privacy")}>privacy page</Link> and the <Link className="font-semibold text-ink underline underline-offset-4" href={app("/safety")}>safety notes</Link>.
          </p>
        </div>
      </section>

      {/* clinics */}
      <section id="clinics" className="bg-night py-24 md:py-28">
        <div className="mx-auto grid grid-cols-1 max-w-7xl items-center gap-12 px-5 md:px-8 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal>
            <p className="label-mono text-ember">For clinicians and care teams</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-balance md:text-5xl">
              See who is drifting <span className="font-serif-i font-normal text-ember">before the readmission.</span>
            </h2>
            <p className="mt-4 text-lg text-haze text-pretty">
              Clinics, wards, home-care agencies and rehab teams get their own workspace. Write a plan from a specialty template, preview exactly what the patient sees, send it with a code, then follow adherence, check-ins, flags and questions for every patient who shares with you. Update the plan any time.
            </p>
            <ul className="mt-6 space-y-3 text-[15px]">
              {[
                ["Specialty templates, your words for every step", "edit"],
                ["Send with a code, preview the patient view first", "send"],
                ["Thresholds and warning signs per patient", "flag"],
                ["Questions inbox and a message thread per patient", "chat"],
                ["Flag review with notes and an audit trail", "check"],
                ["Consent the patient grants and can revoke", "shield"],
              ].map(([t, i]) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="grid grid-cols-1 h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/6 text-ember">
                    <Icon name={i} className="h-4 w-4" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href={SIGNIN_URL} className="h-11 px-5 text-[15px]" data-testid="clinics-open-app">
                Open the app <Icon name="arrowR" className="h-4 w-4" />
              </LinkButton>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <DashboardPreview />
          </Reveal>
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="paper py-24 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal className="max-w-3xl">
            <p className="label-mono text-coral">Pricing</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-balance md:text-5xl">
              Free for families. <span className="font-serif-i font-normal text-coral">Teams pay.</span>
            </h2>
            <p className="mt-4 text-lg text-ink-soft text-pretty">Patients and caregivers never pay to recover. Organizations that want the dashboard fund it.</p>
          </Reveal>
          <PricingPlans
            plans={[
              { name: "Families", price: "Free", note: "Available now", items: ["Unlimited journeys and care circle", "Daily check-ins, streaks, milestones", "Comfort picks and good-day plans", "Export and delete any time"], cta: { href: SIGNIN_URL, label: "Open the app" }, live: true },
              { name: "Care teams", price: "$4", unit: "per active patient a month", note: "Planned pricing", items: ["Clinic dashboard and flag review", "Your own specialty templates", "Clinician seats and invites", "Patient-granted sharing"], cta: { href: SIGNIN_URL, label: "Open the app" }, live: true, featured: true },
              { name: "Health systems and employers", price: "Custom", note: "Planned", items: ["SSO and data residency", "EHR discharge import", "Population reporting", "Support and onboarding"], cta: null, live: false },
            ]}
          />
        </div>
      </section>

      {/* cta */}
      <section className="dusk-sky relative overflow-hidden py-20 text-center md:py-28">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="text-4xl font-bold tracking-tight text-balance md:text-6xl">
            Walk a recovery <span className="font-serif-i font-normal text-ember">in two minutes.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-haze">Step into a new parent&apos;s first weeks, a knee replacement, a child after surgery or an older parent after a fall.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href={SIGNIN_URL} className="h-12 px-6 text-base" data-testid="final-open-app">
              Open the app <Icon name="arrowR" className="h-4 w-4" />
            </LinkButton>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
