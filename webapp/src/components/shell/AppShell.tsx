"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Icon } from "@/components/ui/Icon";
import { signOut, switchDemoSide, switchJourney } from "@/app/actions";

export type ShellProps = {
  userName: string;
  isDemo: boolean;
  journeys: { id: string; name: string; specialty: string }[];
  currentId: string | null;
  hasTeam: boolean;
  safety: { emergency: string; phone: string; team: string } | null;
  /** Which side of loci this is: the patient app or the clinician workspace. */
  side?: "patient" | "clinic";
  /** Org name shown in the clinic header. */
  orgName?: string;
  /** Unread or open items, shown as a dot on Ask or Inbox. */
  badge?: number;
  children: React.ReactNode;
};

type NavItem = { href: string; label: string; icon: string; tour: string; team?: boolean; badge?: boolean; wideOnly?: boolean };

const MAIN: NavItem[] = [
  { href: "/app", label: "Today", icon: "home", tour: "nav-today" },
  { href: "/app/plan", label: "Plan", icon: "list", tour: "nav-plan" },
  { href: "/app/checkin", label: "Check in", icon: "heart", tour: "nav-checkin" },
  { href: "/app/ask", label: "Ask", icon: "chat", tour: "nav-ask", badge: true },
  { href: "/app/comfort", label: "Comfort", icon: "sun", tour: "nav-comfort" },
];
const MORE: NavItem[] = [
  { href: "/app/journey", label: "Journey", icon: "route", tour: "nav-journey" },
  { href: "/app/circle", label: "Circle", icon: "users", tour: "nav-circle" },
  { href: "/clinic", label: "Clinician workspace", icon: "chart", tour: "nav-team", team: true },
  { href: "/app/settings", label: "Settings", icon: "settings", tour: "nav-settings" },
];
const CLINIC: NavItem[] = [
  { href: "/clinic", label: "Patients", icon: "users", tour: "cnav-patients" },
  { href: "/clinic/new", label: "New plan", icon: "plus", tour: "cnav-new" },
  { href: "/clinic/templates", label: "Templates", icon: "list", tour: "cnav-templates", wideOnly: true },
  { href: "/clinic/research", label: "Research", icon: "trend", tour: "cnav-research", wideOnly: true },
  { href: "/clinic/inbox", label: "Inbox", icon: "chat", tour: "cnav-inbox", badge: true },
  { href: "/clinic/settings", label: "Team", icon: "settings", tour: "cnav-settings" },
];

function isActive(path: string, href: string) {
  if (href === "/app") return path === "/app";
  if (href === "/clinic") return path === "/clinic" || path.startsWith("/clinic/p/");
  return path === href || path.startsWith(`${href}/`);
}

export function AppShell({ userName, isDemo, journeys, currentId, hasTeam, safety, side = "patient", orgName, badge = 0, children }: ShellProps) {
  const clinic = side === "clinic";
  const path = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [pending, start] = useTransition();
  const hasJourney = Boolean(currentId);
  const main = clinic ? CLINIC : hasJourney ? MAIN : [];
  const more = clinic ? [] : MORE.filter((m) => (!m.team || hasTeam) && (hasJourney || m.href === "/app/settings" || m.team));
  const home = clinic ? "/clinic" : "/app";
  const tabs = clinic || hasJourney;
  const current = journeys.find((j) => j.id === currentId);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menu]);

  const onSwitch = (id: string) =>
    start(async () => {
      await switchJourney(id);
      setMenu(false);
      router.push("/app");
      router.refresh();
    });

  return (
    <div className="min-h-dvh bg-night">
      <header data-tour-header className="sticky top-0 z-40 border-b border-white/6 bg-night/85 backdrop-blur-xl">
        {isDemo && (
          <div className="border-b border-ember/20 bg-gradient-to-r from-ember/15 via-coral/10 to-lilac/15 px-4 py-1.5 text-center text-[12px] text-[#f4f1ff]" data-testid="demo-banner">
            <span className="font-semibold text-ember">{clinic ? "Demo, clinician view." : "Demo, patient view."}</span> <span className="hidden sm:inline">Same patient on both sides. Resets within 24 hours. </span>
            <form action={switchDemoSide} className="inline">
              <button className="font-semibold underline underline-offset-2 hover:text-ember" data-testid="switch-side">
                {clinic ? "See it as the patient" : "See it as the clinician"}
              </button>
            </form>
            <span className="mx-1.5 text-haze/60">·</span>
            <Link href="/app/demo" className="underline underline-offset-2 hover:text-ember">Restart</Link>
          </div>
        )}
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 md:h-16 md:px-6">
          <Link href={home} className="shrink-0 text-[#f4f1ff]" aria-label={clinic ? "loci for care teams, patients" : "loci, today"}>
            <Wordmark className="h-6 w-auto md:h-7" animated={false} />
          </Link>
          {clinic && (
            <span className="hidden min-w-0 items-center gap-1.5 rounded-full border border-lilac/25 bg-lilac/10 px-3 py-1 text-xs text-[#e3dcff] sm:inline-flex lg:max-w-[16rem]" data-testid="clinic-badge">
              <Icon name="chart" className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{orgName ?? "Care team"}</span>
            </span>
          )}
          {!clinic && current && (
            <span className="hidden min-w-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-haze sm:inline-flex xl:max-w-[11rem]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />
              <span className="truncate">{current.name}&apos;s journey</span>
            </span>
          )}
          <nav className={`ml-auto hidden items-center gap-0.5 ${clinic ? "lg:flex" : "xl:flex"}`} aria-label={clinic ? "Clinician workspace" : "App"}>
            {[...main, ...more].map((n) => (
              <Link
                key={n.href}
                href={n.href}
                data-tour={n.tour}
                aria-current={isActive(path, n.href) ? "page" : undefined}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm transition ${isActive(path, n.href) ? "bg-white/10 text-white" : "text-haze hover:text-white"}`}
              >
                <Icon name={n.icon} className="h-4 w-4" /> {n.label}
                {n.badge && badge > 0 && <span className="ml-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-ember px-1 text-[10px] font-bold text-night">{badge}</span>}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setMenu(true)}
            className={`ml-auto inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-white/10 px-3 text-sm text-haze transition hover:text-white ${clinic ? "lg:ml-2" : "xl:ml-2"}`}
            aria-haspopup="dialog"
            aria-expanded={menu}
            data-tour="nav-menu"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-ember to-coral text-[11px] font-bold text-night">{userName.slice(0, 1).toUpperCase()}</span>
            <Icon name="menu" className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-8 md:px-6 md:pt-10">{children}</main>

      {safety && (
        <p className={`mx-auto max-w-6xl px-4 pb-32 text-xs text-haze/70 md:px-6 ${clinic ? "lg:pb-10" : "xl:pb-10"}`}>
          loci is not for emergencies and does not give medical advice. In an emergency call {safety.emergency}. For questions about the plan, contact {safety.team || "your care team"}
          {safety.phone ? ` on ${safety.phone}` : ""}.
        </p>
      )}

      {clinic && <div className="h-24 lg:hidden" aria-hidden />}
      {tabs && (
        <nav data-tour-tabbar className={`safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-night/92 backdrop-blur-xl ${clinic ? "lg:hidden" : "xl:hidden"}`} aria-label="App tabs">
          <div className={`mx-auto grid max-w-lg ${clinic ? "grid-cols-4" : "grid-cols-5"}`}>
            {main.filter((n) => !n.wideOnly).map((n) => {
              const on = isActive(path, n.href);
              const center = n.href === "/app/checkin" || n.href === "/clinic/new";
              return (
                <Link key={n.href} href={n.href} data-tour={`${n.tour}-m`} aria-current={on ? "page" : undefined} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${on ? "text-white" : "text-haze"}`}>
                  <span className={`relative grid place-items-center rounded-2xl transition ${center ? "-mt-5 h-12 w-12 bg-gradient-to-br from-ember to-coral text-night shadow-[0_10px_30px_-8px_rgba(255,107,90,0.8)]" : `h-7 w-10 ${on ? "bg-white/10" : ""}`}`}>
                    <Icon name={n.icon} className={center ? "h-5 w-5" : "h-[18px] w-[18px]"} />
                    {n.badge && badge > 0 && <span className="absolute top-0.5 right-1 h-2 w-2 rounded-full bg-ember" />}
                  </span>
                  {n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="Close menu" className="absolute inset-0 bg-night/70 backdrop-blur-sm" onClick={() => setMenu(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="absolute top-0 right-0 flex h-full w-[min(360px,88vw)] flex-col gap-1 overflow-y-auto border-l border-white/10 bg-dusk-950 p-5"
              initial={{ x: 40 }}
              animate={{ x: 0 }}
              exit={{ x: 40 }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold">{userName}</p>
                <button type="button" onClick={() => setMenu(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10" aria-label="Close">
                  <Icon name="x" className="h-4 w-4" />
                </button>
              </div>
              {journeys.length > 1 && (
                <div className="mb-3">
                  <p className="label-mono mb-2 text-[10px] text-haze">Journeys you follow</p>
                  {journeys.map((j) => (
                    <button key={j.id} type="button" disabled={pending} onClick={() => onSwitch(j.id)} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-white/8 ${j.id === currentId ? "text-ember" : ""}`}>
                      <span className={`h-2 w-2 rounded-full ${j.id === currentId ? "bg-ember" : "bg-haze/40"}`} /> {j.name}
                    </button>
                  ))}
                </div>
              )}
              {[...main, ...more].map((n) => (
                <Link key={n.href} href={n.href} onClick={() => setMenu(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition hover:bg-white/8 ${isActive(path, n.href) ? "bg-white/8 text-white" : "text-[#ece8ff]"}`}>
                  <Icon name={n.icon} className="h-[18px] w-[18px] text-haze" /> {n.label}
                </Link>
              ))}
              {!clinic && (
                <>
                  <Link href="/app/redeem" onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-[#ece8ff] transition hover:bg-white/8">
                    <Icon name="key" className="h-[18px] w-[18px] text-haze" /> Enter a care team code
                  </Link>
                  <Link href="/app/onboarding?another=1" onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-[#ece8ff] transition hover:bg-white/8">
                    <Icon name="plus" className="h-[18px] w-[18px] text-haze" /> Start another journey
                  </Link>
                </>
              )}
              <form action={signOut} className="mt-auto pt-4">
                <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-haze transition hover:bg-white/8 hover:text-white">
                  <Icon name="logout" className="h-[18px] w-[18px]" /> {isDemo ? "Leave the demo" : "Sign out"}
                </button>
              </form>
              {safety && <p className="mt-3 rounded-2xl bg-coral/10 p-3 text-xs text-[#f4dcd6]">Not for emergencies. In an emergency call {safety.emergency}.</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
