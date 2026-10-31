"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { completeOnboarding } from "@/app/actions";
import { Glyph } from "@/components/art/Glyph";
import { Icon } from "@/components/ui/Icon";
import { Button, inputClass } from "@/components/ui/primitives";
import { CitySearch } from "./CitySearch";
import { SPECIALTIES, specialtyOf, type SpecialtyId } from "@/lib/care/specialties";
import { todayIn } from "@/lib/care/dates";
import type { City } from "@/lib/qloo/types";

type Role = "patient" | "caregiver" | "clinician";
const EMERGENCY = [
  { n: "911", where: "US, Canada, Mexico" },
  { n: "112", where: "EU and many countries" },
  { n: "999", where: "UK" },
  { n: "000", where: "Australia" },
  { n: "119", where: "Japan" },
];

export function Onboarding({ userName, another }: { userName: string; another: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role | null>(null);
  const [specialty, setSpecialty] = useState<SpecialtyId | null>(null);
  const [personName, setPersonName] = useState("");
  const [discharge, setDischarge] = useState("");
  const [tz, setTz] = useState("UTC");
  const [city, setCity] = useState<City | null>(null);
  const [horizon, setHorizon] = useState(30);
  const [planSource, setPlanSource] = useState<"clinician" | "family" | "patient">("family");
  const [team, setTeam] = useState("");
  const [phone, setPhone] = useState("");
  const [emergency, setEmergency] = useState("911");
  const [milestones, setMilestones] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgKind, setOrgKind] = useState<"clinic" | "home_care" | "hospital" | "employer" | "other">("clinic");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only values
    setTz(zone);
    setDischarge(todayIn(zone));
    if (/^Europe\//.test(zone)) setEmergency(zone === "Europe/London" ? "999" : "112");
    else if (/^Australia\//.test(zone)) setEmergency("000");
    else if (zone === "Asia/Tokyo") setEmergency("119");
  }, []);

  const s = specialty ? specialtyOf(specialty) : null;
  const steps = role === "clinician" ? ["You", "Your team"] : ["You", "Recovery", "Basics", "The plan", "Milestones"];
  const last = step === steps.length - 1;

  const pickSpecialty = (id: SpecialtyId) => {
    const sp = specialtyOf(id);
    setSpecialty(id);
    setHorizon(sp.horizonDays);
    setMilestones(sp.milestones);
  };

  const canNext = useMemo(() => {
    if (step === 0) return Boolean(role);
    if (role === "clinician") return orgName.trim().length > 0;
    if (step === 1) return Boolean(specialty);
    if (step === 2) return personName.trim().length > 0 && Boolean(discharge);
    if (step === 3) return emergency.trim().length >= 2;
    return true;
  }, [step, role, specialty, personName, discharge, emergency, orgName]);

  const next = () => {
    setError(null);
    if (step === 0 && role === "patient" && !personName) setPersonName(userName.split(" ")[0]);
    if (step === 0 && role !== "clinician") setPlanSource(role === "patient" ? "patient" : "family");
    if (!last) return setStep(step + 1);
    start(async () => {
      const r = await completeOnboarding({
        role,
        specialty: specialty ?? "general",
        personName: personName.trim(),
        dischargeDate: discharge,
        horizonDays: horizon,
        city: city && city.name ? city : null,
        milestones,
        planSource,
        careTeamName: team.trim(),
        careTeamPhone: phone.trim(),
        emergencyNumber: emergency.trim(),
        timezone: tz,
        orgName: orgName.trim(),
        orgKind,
      });
      if (!r.ok) setError(r.error);
      else router.push(r.redirectTo);
    });
  };

  const choice = (on: boolean) => `rounded-3xl border p-5 text-left transition ${on ? "border-ember bg-ember/10" : "border-white/10 bg-dusk-950/70 hover:border-white/25"}`;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <ol className="mb-8 flex items-center gap-2" aria-label="Progress">
        {steps.map((label, k) => (
          <li key={label} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className={`h-1.5 rounded-full transition ${k <= step ? "bg-gradient-to-r from-ember to-coral" : "bg-white/10"}`} />
            <span className={`truncate text-[11px] ${k === step ? "text-white" : "text-haze"}`}>{label}</span>
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div key={`${role}-${step}`} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
          {step === 0 && (
            <section>
              <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
                {another ? "Start another journey." : `Welcome, ${userName.split(" ")[0]}.`} <span className="font-serif-i font-normal text-ember">Who are you here as?</span>
              </h1>
              <div className="mt-8 grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Your role">
                {[
                  { id: "patient" as const, icon: "heart", t: "I am recovering", d: "I came home from hospital, or I am about to." },
                  { id: "caregiver" as const, icon: "users", t: "I am caring for someone", d: "A child, partner, parent, friend or client." },
                ].map((o) => (
                  <button key={o.id} type="button" role="radio" aria-checked={role === o.id} data-testid={`role-${o.id}`} onClick={() => setRole(o.id)} className={choice(role === o.id)}>
                    <Icon name={o.icon} className="h-6 w-6 text-ember" />
                    <span className="mt-3 block text-lg font-bold">{o.t}</span>
                    <span className="mt-1 block text-sm text-haze">{o.d}</span>
                  </button>
                ))}
                <Link href="/app/redeem" className="rounded-3xl border border-lilac/30 bg-lilac/[0.07] p-5 text-left transition hover:border-lilac/60" data-testid="have-code">
                  <Icon name="key" className="h-6 w-6 text-lilac" />
                  <span className="mt-3 block text-lg font-bold">I have a code from my care team</span>
                  <span className="mt-1 block text-sm text-haze">Your plan is ready. Type the code to get it.</span>
                </Link>
              </div>
              <p className="mt-6 text-sm text-haze">
                On a care team? <Link href="/clinic/setup" className="text-ember underline-offset-4 hover:underline">Open the clinician workspace</Link> to write and send plans.
              </p>
            </section>
          )}

          {role === "clinician" && step === 1 && (
            <section>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Set up your care team</h1>
              <p className="mt-2 text-haze">You can start patient journeys from templates and invite colleagues next.</p>
              <div className="mt-6 grid gap-5">
                <label className="block">
                  <span className="text-sm font-medium">Team name</span>
                  <input className={`${inputClass} mt-1.5`} value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="For example, Riverside Home Care" maxLength={80} data-testid="org-name" />
                </label>
                <div>
                  <span className="text-sm font-medium">Kind of team</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["clinic", "home_care", "hospital", "employer", "other"] as const).map((k) => (
                      <button key={k} type="button" aria-pressed={orgKind === k} onClick={() => setOrgKind(k)} className={`rounded-full border px-4 py-2 text-sm transition ${orgKind === k ? "border-ember bg-ember/15 text-ember" : "border-white/15 text-haze hover:text-white"}`}>
                        {{ clinic: "Clinic", home_care: "Home care agency", hospital: "Hospital", employer: "Employer or insurer", other: "Other" }[k]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {role !== "clinician" && step === 1 && (
            <section>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">What kind of recovery?</h1>
              <p className="mt-2 text-haze">This picks a template for the shape of the plan. It adds no medical content.</p>
              <div className="mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-3" role="radiogroup" aria-label="Specialty">
                {SPECIALTIES.map((sp) => (
                  <button key={sp.id} type="button" role="radio" aria-checked={specialty === sp.id} data-testid={`spec-${sp.id}`} onClick={() => pickSpecialty(sp.id)} className={`${choice(specialty === sp.id)} min-w-0 p-4`}>
                    <Glyph name={sp.glyph} className="h-7 w-7" color={sp.hue} />
                    <span className="mt-2 block font-semibold leading-tight">{sp.label}</span>
                  </button>
                ))}
              </div>
              {s && <p className="mt-4 text-sm text-haze">{s.blurb}</p>}
            </section>
          )}

          {role !== "clinician" && step === 2 && (
            <section>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">The basics</h1>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">{role === "patient" ? "What should we call you?" : "Their first name or nickname"}</span>
                  <input className={`${inputClass} mt-1.5`} value={personName} onChange={(e) => setPersonName(e.target.value)} maxLength={40} placeholder={role === "patient" ? "Your first name" : "For example, Mum or Leo"} data-testid="person-name" />
                  <span className="mt-1.5 block text-xs text-haze/80">A nickname is enough. No surnames, birthdays or record numbers.</span>
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Discharge date</span>
                  <input type="date" className={`${inputClass} mt-1.5`} value={discharge} onChange={(e) => setDischarge(e.target.value)} data-testid="discharge" />
                  <span className="mt-1.5 block text-xs text-haze/80">Day 0 of the journey. It can be in the future.</span>
                </label>
                <div className="md:col-span-2">
                  <CitySearch value={city} onChange={setCity} />
                </div>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium">
                    Journey length: <span className="text-ember tabular-nums">{horizon} days</span>
                  </span>
                  <input type="range" min={7} max={180} value={horizon} onChange={(e) => setHorizon(Number(e.target.value))} className="scale mt-1.5" aria-label="Journey length in days" />
                  <span className="mt-1 block text-xs text-haze/80">How long to show the timeline. Use what your care team expects, and change it any time.</span>
                </label>
              </div>
            </section>
          )}

          {role !== "clinician" && step === 3 && (
            <section>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Who writes the plan?</h1>
              <p className="mt-2 text-haze">loci only shows what a clinician gives you. It never writes medicines, doses or warning signs itself.</p>
              <div className="mt-6 grid gap-3 md:grid-cols-2" role="radiogroup" aria-label="Plan source">
                <button type="button" role="radio" aria-checked={planSource === "clinician"} onClick={() => setPlanSource("clinician")} className={choice(planSource === "clinician")}>
                  <Icon name="building" className="h-6 w-6 text-mint" />
                  <span className="mt-3 block font-bold">A clinician will enter it</span>
                  <span className="mt-1 block text-sm text-haze">Invite them from the care circle once you are set up.</span>
                </button>
                <button type="button" role="radio" aria-checked={planSource !== "clinician"} onClick={() => setPlanSource(role === "patient" ? "patient" : "family")} className={choice(planSource !== "clinician")}>
                  <Icon name="edit" className="h-6 w-6 text-ember" />
                  <span className="mt-3 block font-bold">I will copy it from the discharge letter</span>
                  <span className="mt-1 block text-sm text-haze">Type each line exactly as written. Ask the team if anything is unclear.</span>
                </button>
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">Care team name</span>
                  <input className={`${inputClass} mt-1.5`} value={team} onChange={(e) => setTeam(e.target.value)} placeholder="For example, Ward 7 discharge team" maxLength={120} />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Care team phone</span>
                  <input className={`${inputClass} mt-1.5`} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="From the discharge letter" maxLength={40} />
                </label>
                <div className="md:col-span-2">
                  <span className="text-sm font-medium">Emergency number where {role === "patient" ? "you live" : "they live"}</span>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {EMERGENCY.map((e) => (
                      <button key={e.n} type="button" aria-pressed={emergency === e.n} onClick={() => setEmergency(e.n)} title={e.where} className={`rounded-full border px-4 py-2 text-sm tabular-nums transition ${emergency === e.n ? "border-coral bg-coral/15 text-coral" : "border-white/15 text-haze hover:text-white"}`}>
                        {e.n}
                      </button>
                    ))}
                    <input className={`${inputClass} h-10 w-28`} value={emergency} onChange={(e) => setEmergency(e.target.value.replace(/[^\d+]/g, "").slice(0, 12))} aria-label="Other emergency number" inputMode="tel" />
                  </div>
                </div>
              </div>
            </section>
          )}

          {role !== "clinician" && step === 4 && s && (
            <section>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Moments worth celebrating</h1>
              <p className="mt-2 text-haze">Everyday milestones for {s.short.toLowerCase()} recoveries. Untick any, add your own, and set the days with your care team later.</p>
              <ul className="mt-6 grid gap-2">
                {[...new Set([...s.milestones, ...milestones])].map((m) => {
                  const on = milestones.includes(m);
                  return (
                    <li key={m}>
                      <button type="button" aria-pressed={on} onClick={() => setMilestones(on ? milestones.filter((x) => x !== m) : [...milestones, m])} className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${on ? "border-mint/40 bg-mint/[0.07]" : "border-white/10"}`}>
                        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${on ? "border-mint bg-mint text-night" : "border-haze/40"}`}>{on && <Icon name="check" className="h-3.5 w-3.5" />}</span>
                        <span className="text-[15px]">{m}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = custom.trim();
                  if (v && !milestones.includes(v) && milestones.length < 12) setMilestones([...milestones, v]);
                  setCustom("");
                }}
              >
                <input className={inputClass} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add your own, like First trip to the beach" maxLength={120} />
                <Button type="submit" variant="outline" className="h-12 shrink-0">Add</Button>
              </form>
            </section>
          )}
        </motion.div>
      </AnimatePresence>

      {error && (
        <p className="mt-6 rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral" role="alert">
          {error}
        </p>
      )}
      <div className="mt-10 flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || pending}>
          <Icon name="arrowL" className="h-4 w-4" /> Back
        </Button>
        <Button type="button" onClick={next} disabled={!canNext || pending} data-testid="onboarding-next">
          {pending ? "Setting up" : last ? (role === "clinician" ? "Open the dashboard" : "Build the journey") : "Continue"} <Icon name="arrowR" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
