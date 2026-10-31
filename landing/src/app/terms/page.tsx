import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/site/LegalPage";
import { GITHUB_URL, app } from "@/lib/urls";

export const metadata: Metadata = { title: "Terms of use", description: "The terms for using loci: accounts, care plans, acceptable use, your data and the open-source code.", alternates: { canonical: "/terms" } };

export default function Terms() {
  return (
    <LegalPage eyebrow="Terms of use" title="Plain terms," accent="for a plain tool." intro="These terms cover the loci web app, the Android app, this site and the documentation. By creating an account or using loci you agree to them." updated="October 31, 2026">
      <LegalSection n="01" title="What loci is">
        <p>loci helps care teams write a recovery plan and send it to a patient, and helps patients and families follow that plan at home: daily steps, check-ins, questions to the team, a care circle and comfort picks.</p>
        <p>Every clinical instruction in loci is written by a clinician or copied from a discharge letter by the person using it. loci repeats those words and the warning signs and thresholds the care team set. It does not write medical content of its own, and it does not diagnose, score risk or decide treatment. For questions about your care, contact your care team. In an emergency, call your local emergency number.</p>
      </LegalSection>
      <LegalSection n="02" title="Accounts">
        <ul>
          <li>Use an email you control and keep your password private. You are responsible for what happens under your account.</li>
          <li>Clinicians confirm they are allowed to share recovery plans with the patients they invite, and that the plans they write are their own professional instructions.</li>
          <li>Patients and caregivers decide who joins the care circle and whether a care team can see check-ins. Both can be switched off at any time.</li>
          <li>Demo accounts are temporary and are deleted automatically, including everything typed into them.</li>
        </ul>
      </LegalSection>
      <LegalSection n="03" title="Acceptable use">
        <ul>
          <li>Do not enter information loci does not ask for, such as surnames, dates of birth, insurance numbers or medical record numbers.</li>
          <li>Do not use loci to harass anyone, to share another person&apos;s information without their permission, or to break the law.</li>
          <li>Do not try to access accounts or data that are not yours, overload the service or get around its limits. Security research is welcome under our <a href="/security">security policy</a>.</li>
        </ul>
      </LegalSection>
      <LegalSection n="04" title="Your data">
        <p>You own what you put into loci. You can export it as a file or delete your account from Settings at any time. What we store, who sees it and what goes to Qloo is set out in the <a href={app("/privacy")}>privacy page</a>. We do not sell data or show ads.</p>
      </LegalSection>
      <LegalSection n="05" title="Availability and changes">
        <p>loci is provided as it is. We work to keep it available and accurate, but we cannot promise it will always be online or free of errors, so keep your discharge letter and your care team&apos;s contact details at hand. We may change or end features, and we will update these terms when that matters; the date at the top shows the latest version.</p>
        <p>Prices on the landing page marked &ldquo;planned&rdquo; are not yet charged. Families use loci for free.</p>
      </LegalSection>
      <LegalSection n="06" title="Open source">
        <p>The loci source code is published at <a href={GITHUB_URL}>github.com/xElvolution/loci</a> under the MIT License. That license covers the code. These terms cover the hosted service at locicare.xyz.</p>
      </LegalSection>
      <LegalSection n="07" title="Questions">
        <p>See the <a href="/contact">contact page</a> for how to reach us.</p>
      </LegalSection>
    </LegalPage>
  );
}
