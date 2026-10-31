import Link from "next/link";
import { requireUser } from "@/lib/server/auth";
import { currentJourney, listJourneys, orgsOf } from "@/lib/server/repo";
import { prefsOf, recentDeliveries } from "@/lib/server/reminders/service";
import { connectedChannels } from "@/lib/server/reminders/provider";
import { RemindersForm } from "@/components/settings/RemindersForm";
import { prettyDate, toIso } from "@/lib/care/dates";
import { specialtyOf } from "@/lib/care/specialties";
import { ReplayTourButton } from "@/components/tour/ProductTour";
import { DeleteForm, ProfileForm } from "@/components/settings/SettingsForms";
import { Icon } from "@/components/ui/Icon";
import { ResearchToggle } from "@/components/settings/ResearchToggle";
import { PageTitle } from "@/components/ui/primitives";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser("/app/settings");
  const [journeys, orgs, cur] = await Promise.all([listJourneys(user.id), orgsOf(user.id), currentJourney(user)]);
  const [prefs, deliveries] = cur ? await Promise.all([prefsOf(user.id, cur.journey.id), recentDeliveries(user.id, cur.journey.id)]) : [null, []];
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageTitle eyebrow={user.is_demo ? "Demo account" : user.email ?? ""} title="Settings" accent="and privacy" />

      <section className="glass rounded-3xl p-5 md:p-6">
        <h2 className="mb-4 text-lg font-bold">Profile</h2>
        <ProfileForm name={user.display_name} timezone={user.timezone} />
      </section>

      <section className="glass flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div>
          <h2 className="text-lg font-bold">Guided tour</h2>
          <p className="text-sm text-haze">A short walk through every screen. Skip it any time.</p>
        </div>
        <div data-tour="replay-tour" className="shrink-0">
          <ReplayTourButton />
        </div>
      </section>

      {cur && prefs && (
        <section className="glass rounded-3xl p-5 md:p-6" id="reminders">
          <h2 className="text-lg font-bold">Reminders</h2>
          <p className="mt-1 mb-2 text-sm text-haze">Just for you, on this device and any channel you choose.</p>
          <RemindersForm
            journeyId={cur.journey.id}
            personName={cur.journey.person_name}
            prefs={prefs}
            connected={connectedChannels()}
            deliveries={deliveries.map((d) => ({ channel: d.channel, kind: d.kind, status: d.status, error: d.error, when: prettyDate(toIso(d.created_at)) }))}
          />
        </section>
      )}

      <section className="glass rounded-3xl p-5 md:p-6">
        <h2 className="text-lg font-bold">Who can see what</h2>
        <ul className="mt-3 divide-y divide-white/5">
          {journeys.map((j) => (
            <li key={j.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                <span className="font-semibold">{j.person_name}</span> <span className="text-sm text-haze">· {specialtyOf(j.specialty).short} · you are {j.role === "caregiver" ? "the main caregiver" : j.role === "patient" ? "the patient" : `a ${j.role}`}</span>
              </span>
              <span className="text-sm text-haze">
                {j.org_id ? (j.consent_org ? "Shared with the care team" : "Not shared with the care team") : "Care circle only"}
                {j.share_slug ? " · welcome card is public" : ""}
              </span>
            </li>
          ))}
          {!journeys.length && <li className="py-3 text-sm text-haze">You are not in any care circle.</li>}
        </ul>
        {orgs.length > 0 && <p className="mt-3 text-sm text-haze">Care teams: {orgs.map((o) => `${o.name} (${o.role})`).join(", ")}</p>}
        <p className="mt-3 text-xs text-haze/80">
          Change sharing from each <Link href="/app/circle" className="underline">care circle</Link>. Read the <Link href="/privacy" className="underline">privacy page</Link> for the full picture.
        </p>
      </section>

      <section className="glass rounded-3xl p-5 md:p-6" id="research" data-testid="research-consent">
        <h2 className="text-lg font-bold">Research</h2>
        <p className="mt-1 text-sm text-[#e9e4ff]/90">Separate from sharing with your care team, and off unless you switch it on. When on, your check-in scores, whether a check-in raised a flag, the team&apos;s outcome measures and any return to hospital can count towards anonymous group numbers your care team uses to improve recovery care.</p>
        <ul className="mt-3 space-y-1 text-sm text-haze">
          <li>Only groups of at least 10 people are ever shown. Smaller groups are hidden.</li>
          <li>Never your name, contact details, dates, notes, messages or comfort favorites.</li>
          <li>You can switch it off any time. Stopping sharing with the team also stops research.</li>
        </ul>
        <div className="mt-3 divide-y divide-white/5">
          {journeys.map((j) => {
            const why = !j.org_id ? "Only for plans from a care team on loci" : !j.is_owner ? "Only the person or their main caregiver can change this" : !j.consent_org ? "Share with the care team first to choose this" : null;
            return <ResearchToggle key={j.id} journeyId={j.id} name={j.person_name} on={j.research_consent} canChange={!!j.org_id && j.is_owner && (j.consent_org || j.research_consent)} why={why} />;
          })}
          {!journeys.length && <p className="py-3 text-sm text-haze">You are not in any care circle.</p>}
        </div>
        <p className="mt-3 text-xs text-haze/80">How it works: <Link href="/privacy#research" className="underline">privacy page, research section</Link>.</p>
      </section>

      <section className="glass flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div>
          <h2 className="text-lg font-bold">Export your data</h2>
          <p className="text-sm text-haze">Everything loci holds about you and your circles, as one JSON file.</p>
        </div>
        <a href="/api/export" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-haze/30 px-5 text-sm transition hover:border-ember/70 hover:text-ember" data-testid="export">
          <Icon name="download" className="h-4 w-4" /> Download
        </a>
      </section>

      <section className="rounded-3xl border border-coral/30 bg-coral/[0.05] p-5 md:p-6">
        <h2 className="text-lg font-bold">Delete everything</h2>
        <p className="mt-1 mb-4 text-sm text-haze">Removes your account and every journey you own, including other people&apos;s entries on them. This cannot be undone.</p>
        <DeleteForm isDemo={user.is_demo} />
      </section>
    </div>
  );
}
