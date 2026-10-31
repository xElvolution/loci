import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/site/LegalPage";
import { app } from "@/lib/urls";

export const metadata: Metadata = { title: "Cookie policy", description: "loci uses one essential sign-in cookie and no tracking or advertising cookies.", alternates: { canonical: "/cookies" } };

export default function Cookies() {
  return (
    <LegalPage eyebrow="Cookie policy" title="One cookie," accent="no tracking." intro="loci uses only what it needs to keep you signed in. There are no advertising, analytics or third-party tracking cookies on any loci site." updated="October 31, 2026">
      <LegalSection n="01" title="The sign-in cookie">
        <p>When you sign in to the web app at app.locicare.xyz, loci sets one cookie:</p>
        <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white/50">
          <table className="w-full min-w-[480px] text-left text-[15px]">
            <thead className="text-ink"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Purpose</th><th className="px-4 py-3">Lasts</th></tr></thead>
            <tbody>
              <tr className="border-t border-ink/10"><td className="px-4 py-3 font-mono text-[13px] text-ink">loci_care_session</td><td className="px-4 py-3">Keeps you signed in. A random token; only its hash is stored on our server. HttpOnly, Secure, SameSite=Lax.</td><td className="px-4 py-3">Until you sign out or the session expires</td></tr>
            </tbody>
          </table>
        </div>
        <p>This cookie is strictly necessary for signing in, so it does not need consent. If you block it, you can still read this site and the docs, but you cannot sign in to the app.</p>
      </LegalSection>
      <LegalSection n="02" title="Other storage on your device">
        <ul>
          <li>The web app remembers in your browser&apos;s session storage whether you finished or skipped the guided tour. It is cleared when you close the tab.</li>
          <li>The Android app keeps its sign-in token in the phone&apos;s secure storage, and your reminder preferences on the phone.</li>
          <li>This site, locicare.xyz, and the docs at docs.locicare.xyz set no cookies. Fonts are served from our own servers.</li>
        </ul>
      </LegalSection>
      <LegalSection n="03" title="More about your data">
        <p>What loci stores and who can see it is described on the <a href={app("/privacy")}>privacy page</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}
