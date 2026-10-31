import type { Metadata } from "next";
import { CopyHash } from "@/components/download/CopyHash";
import { TodayPreview } from "@/components/landing/Previews";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/primitives";
import { ANDROID_RELEASE, formatMegabytes, type PlatformStatus } from "@/lib/downloads";
import { SIGNIN_URL } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Download",
  description: "Use loci in any browser today, or install the Android test build. The iPhone app is coming to TestFlight.",
  alternates: { canonical: "/download" },
};

const STATUS: Record<PlatformStatus, { label: string; className: string; dot: string; ping: boolean }> = {
  available: { label: "Available", className: "border-mint/40 bg-mint/10 text-mint", dot: "bg-mint", ping: true },
  "test-build": { label: "Test build", className: "border-ember/40 bg-ember/10 text-ember", dot: "bg-ember", ping: true },
  soon: { label: "TestFlight soon", className: "border-haze/30 bg-white/5 text-haze", dot: "bg-haze/70", ping: false },
};

function StatusChip({ status, testId }: { status: PlatformStatus; testId: string }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${s.className}`} data-testid={testId}>
      <span className="relative flex h-2 w-2" aria-hidden="true">
        {s.ping && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none ${s.dot}`} />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${s.dot}`} />
      </span>
      {s.label}
    </span>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
      <span>{children}</span>
    </li>
  );
}

const STEPS = [
  { icon: "download", title: "Download on your phone", body: `Open this page on the Android phone and tap Download APK. The file is ${formatMegabytes(ANDROID_RELEASE.bytes)}.` },
  { icon: "shield", title: "Allow the install", body: "Android asks before it installs an app from outside the Play Store. Allow Install unknown apps for your browser or file manager, just for this install." },
  { icon: "key", title: "Open loci", body: "Sign in with your loci account, or redeem the code your care team gave you to open your plan." },
];

const VERIFY = [
  { os: "macOS", cmd: `shasum -a 256 ${ANDROID_RELEASE.file}` },
  { os: "Linux", cmd: `sha256sum ${ANDROID_RELEASE.file}` },
  { os: "Windows", cmd: `certutil -hashfile ${ANDROID_RELEASE.file} SHA256` },
];

export default function DownloadPage() {
  return (
    <div className="overflow-x-clip">
      <SiteHeader current="download" />

      {/* hero */}
      <section className="dusk-sky relative pt-24 pb-12 md:pt-32 md:pb-16">
        <div className="map-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative mx-auto grid grid-cols-1 max-w-7xl items-center gap-10 px-5 md:px-8 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal className="min-w-0">
            <p className="label-mono text-ember">Download</p>
            <h1 className="mt-4 text-[44px] leading-[0.98] font-bold tracking-tight text-balance sm:text-6xl lg:text-[72px]" data-testid="download-title">
              loci, wherever you <span className="font-serif-i font-normal text-ember">recover.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-haze text-pretty md:text-xl">
              Use loci in any browser today, or install the Android test build. Your plan, ticks, check-ins and messages stay in sync with your care team on every device.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href={SIGNIN_URL} className="h-12 px-6 text-base" data-testid="hero-open-app">
                Open the app <Icon name="arrowR" className="h-4 w-4" />
              </LinkButton>
            </div>
          </Reveal>
          <div className="relative mx-auto w-full max-w-[340px] min-w-0" aria-hidden="true">
            <div className="anim-glow absolute -inset-4 rounded-full sm:-inset-10 bg-[radial-gradient(closest-side,rgba(138,108,255,0.35),transparent)]" />
            <div className="anim-float relative rounded-[44px] border border-white/15 bg-dusk-900 p-3 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]">
              <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-white/15" />
              <TodayPreview />
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2.5 text-[12px] text-haze">
                <span className="flex items-center gap-2"><Icon name="phone" className="h-3.5 w-3.5 text-coral" /> When to call</span>
                <span className="font-mono text-[11px] text-ember">Check in</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* platforms */}
      <section className="relative bg-night py-20 md:py-24" aria-labelledby="platforms-title">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal className="max-w-3xl">
            <p className="label-mono text-lilac">Platforms</p>
            <h2 id="platforms-title" className="mt-3 text-4xl font-bold tracking-tight text-balance md:text-5xl">
              Pick your <span className="font-serif-i font-normal text-lilac">screen.</span>
            </h2>
            <p className="mt-4 text-lg text-haze text-pretty">One account works everywhere. We only mark a platform available when it is really live.</p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* web */}
            <Reveal delay={0} className="glass flex min-w-0 flex-col rounded-3xl p-6" >
              <div data-testid="platform-web" className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid grid-cols-1 h-12 w-12 place-items-center rounded-2xl bg-mint/15 text-mint"><Icon name="home" className="h-6 w-6" /></span>
                  <StatusChip status="available" testId="status-web" />
                </div>
                <h3 className="mt-5 text-2xl font-bold">Web app</h3>
                <p className="mt-2 text-[15px] text-haze text-pretty">Works on any phone, tablet or computer with a modern browser. Nothing to install.</p>
                <ul className="mt-5 space-y-2 text-[15px]">
                  <Feature>Patient and family app, free</Feature>
                  <Feature>Clinician workspace for care teams</Feature>
                  <Feature>Add it to your Home Screen from the browser menu</Feature>
                </ul>
                <div className="mt-auto flex flex-wrap gap-2 pt-6">
                  <LinkButton href={SIGNIN_URL} className="h-11" data-testid="web-open">Open the app <Icon name="arrowR" className="h-4 w-4" /></LinkButton>
                </div>
              </div>
            </Reveal>

            {/* android */}
            <Reveal delay={0.08} className="relative flex min-w-0 flex-col rounded-3xl border border-ember/30 bg-gradient-to-b from-ember/[0.08] to-transparent p-6">
              <div id="android" data-testid="platform-android" className="flex h-full scroll-mt-24 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid grid-cols-1 h-12 w-12 place-items-center rounded-2xl bg-ember/15 text-ember"><Icon name="download" className="h-6 w-6" /></span>
                  <StatusChip status="test-build" testId="status-android" />
                </div>
                <h3 className="mt-5 text-2xl font-bold">Android</h3>
                <p className="mt-2 text-[15px] text-haze text-pretty">The loci patient app: today&apos;s steps, check-ins with when to call, your journey, comfort and your care team.</p>
                <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
                  {[
                    { k: "Version", v: ANDROID_RELEASE.version },
                    { k: "Size", v: formatMegabytes(ANDROID_RELEASE.bytes) },
                    { k: "Android", v: "7.0+" },
                  ].map((d) => (
                    <div key={d.k} className="min-w-0 rounded-2xl bg-white/5 px-2 py-2.5">
                      <dt className="label-mono text-[9px] text-haze">{d.k}</dt>
                      <dd className="mt-0.5 truncate text-[15px] font-semibold tabular-nums">{d.v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 rounded-2xl border border-ember/25 bg-ember/[0.06] p-3 text-[13px] leading-relaxed text-[#ece8ff]" data-testid="android-note">
                  <p className="flex items-start gap-2">
                    <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
                    <span>This is a test build signed with a debug key, not a Play Store release. Android will ask you to allow <strong>Install unknown apps</strong> before it installs.</span>
                  </p>
                </div>
                <div className="mt-4">
                  <CopyHash value={ANDROID_RELEASE.sha256} />
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
                  <a href={ANDROID_RELEASE.url} className="group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-ember to-coral px-5 text-[15px] font-semibold whitespace-nowrap text-night shadow-[0_10px_30px_-10px_rgba(255,107,90,0.7)] transition hover:brightness-110" data-testid="android-download" download>
                    <Icon name="download" className="h-4 w-4 transition-transform group-hover:translate-y-0.5" /> Download APK
                  </a>
                  <a href={ANDROID_RELEASE.releasePage} className="inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm text-haze transition hover:text-white" data-testid="android-release">
                    Release notes <Icon name="arrowR" className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </Reveal>

            {/* ios */}
            <Reveal delay={0.16} className="flex min-w-0 flex-col rounded-3xl border border-dashed border-haze/25 p-6">
              <div data-testid="platform-ios" className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid grid-cols-1 h-12 w-12 place-items-center rounded-2xl bg-white/5 text-haze"><Icon name="phone" className="h-6 w-6" /></span>
                  <StatusChip status="soon" testId="status-ios" />
                </div>
                <h3 className="mt-5 text-2xl font-bold">iPhone</h3>
                <p className="mt-2 text-[15px] text-haze text-pretty">The iPhone app is being prepared for TestFlight. No iOS build is available yet.</p>
                <ul className="mt-5 space-y-2 text-[15px] text-haze">
                  <li className="flex items-start gap-2"><Icon name="calendar" className="mt-0.5 h-4 w-4 shrink-0" /> Same screens as Android, on TestFlight first</li>
                  <li className="flex items-start gap-2"><Icon name="sun" className="mt-0.5 h-4 w-4 shrink-0" /> Until then, the web app works well in Safari</li>
                </ul>
                <div className="mt-auto pt-6">
                  <span className="inline-flex h-11 cursor-not-allowed items-center gap-2 rounded-full border border-haze/20 px-5 text-[15px] text-haze/70" aria-disabled="true" data-testid="ios-unavailable">
                    <Icon name="lock" className="h-4 w-4" /> Not available yet
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* install steps */}
      <section className="paper py-20 md:py-24" aria-labelledby="install-title">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal className="max-w-3xl">
            <p className="label-mono text-coral">Android, step by step</p>
            <h2 id="install-title" className="mt-3 text-4xl font-bold tracking-tight text-balance md:text-5xl">
              Installed in <span className="font-serif-i font-normal text-coral">a minute.</span>
            </h2>
          </Reveal>
          <ol className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {STEPS.map((s, k) => (
              <Reveal key={s.title} as="li" delay={k * 0.08} className="paper-card relative min-w-0 rounded-3xl p-6">
                <span className="font-mono text-sm text-coral">0{k + 1}</span>
                <span className="mt-3 grid grid-cols-1 h-11 w-11 place-items-center rounded-2xl bg-ink text-paper"><Icon name={s.icon} className="h-5 w-5" /></span>
                <h3 className="mt-4 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-[15px] text-ink-soft text-pretty">{s.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* verify */}
      <section className="bg-night py-20 md:py-24" aria-labelledby="verify-title">
        <div className="mx-auto grid grid-cols-1 max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal className="min-w-0">
            <p className="label-mono text-mint">Verify your download</p>
            <h2 id="verify-title" className="mt-3 text-4xl font-bold tracking-tight text-balance md:text-5xl">
              Check it is <span className="font-serif-i font-normal text-mint">the real file.</span>
            </h2>
            <p className="mt-4 text-lg text-haze text-pretty">
              Every build is published on the project&apos;s GitHub releases with its checksum. Run one command on a computer and compare the result with the SHA-256 above. If they differ, do not install it.
            </p>
          </Reveal>
          <Reveal delay={0.08} className="min-w-0">
            <div className="glass rounded-3xl p-4 md:p-5">
              <ul className="space-y-3">
                {VERIFY.map((v) => (
                  <li key={v.os} className="min-w-0">
                    <p className="label-mono text-[10px] text-haze">{v.os}</p>
                    <code className="mt-1 block overflow-x-auto rounded-xl bg-night/80 px-3 py-2.5 font-mono text-[12.5px] whitespace-nowrap text-[#ece8ff] scroll-thin">{v.cmd}</code>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <CopyHash value={ANDROID_RELEASE.sha256} label={`Expected SHA-256 for ${ANDROID_RELEASE.file}`} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* sync + safety */}
      <section className="dusk-sky relative overflow-hidden py-16 text-center md:py-24">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="text-4xl font-bold tracking-tight text-balance md:text-5xl">
            One plan, <span className="font-serif-i font-normal text-ember">every device.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-haze text-pretty">
            Tick a step on the bus across Brooklyn and your care team in Manhattan sees it live. Your daughter in London can follow along from the care circle.
          </p>
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
