import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/site/LegalPage";
import { GITHUB_URL } from "@/lib/urls";

export const metadata: Metadata = { title: "Security", description: "How loci protects accounts and recovery data, and how to report a vulnerability privately.", alternates: { canonical: "/security" } };

const ADVISORY = `${GITHUB_URL}/security/advisories/new`;

export default function Security() {
  return (
    <LegalPage eyebrow="Security" title="Protecting the way" accent="home." intro="loci holds recovery plans, check-ins and messages between care teams and families. Here is how we protect them, and how to tell us if you find a problem." updated="October 31, 2026">
      <LegalSection n="01" title="How loci protects your account">
        <ul>
          <li>Passwords are hashed with Argon2id. We never store or see them in plain text.</li>
          <li>Web sessions use a random token in an HttpOnly, Secure, SameSite=Lax cookie, and only a SHA-256 hash of the token is stored.</li>
          <li>The mobile app uses a bearer token kept in the phone&apos;s secure storage (Keychain or Keystore). Signing out revokes it on the server.</li>
          <li>Every site is served over HTTPS only.</li>
        </ul>
      </LegalSection>
      <LegalSection n="02" title="Who can see what">
        <ul>
          <li>A care team sees a patient&apos;s check-ins only while the patient or main caregiver has sharing switched on. Switching it off removes access straight away.</li>
          <li>Care circle members join only through an invite link the person created, with a clear role.</li>
          <li>Plan codes are single use and expire after 30 days.</li>
          <li>The research view shows only counts and averages, hides any group smaller than 10 people, and logs every view and export.</li>
          <li>Qloo receives only favorite titles, a city point and generic tags. Never a name, email, plan, check-in or warning sign.</li>
        </ul>
      </LegalSection>
      <LegalSection n="03" title="How we build it">
        <ul>
          <li>The code is open source, so anyone can review it at <a href={GITHUB_URL}>github.com/xElvolution/loci</a>.</li>
          <li>Inputs are validated on the server, and every change goes through linting, type checks and automated tests.</li>
          <li>No credentials, keys or server details are kept in the repository. Each deployment reads its configuration from environment variables.</li>
          <li>You can export or delete your data at any time from Settings.</li>
        </ul>
      </LegalSection>
      <LegalSection n="04" title="Report a vulnerability" id="report">
        <p>Please do not report security problems in public issues. Use GitHub&apos;s private reporting instead: <a href={ADVISORY}>report a vulnerability</a>. Only the maintainers can see it.</p>
        <p>Tell us what you found, where, the steps to reproduce it and the impact you expect. We aim to acknowledge reports within 3 business days and to share a plan to fix them within 10 business days, and we credit researchers unless they ask us not to.</p>
        <p>Good-faith research is welcome. Use only the demo or accounts you created, never access or keep someone else&apos;s data, stop as soon as you reach personal information, and give us reasonable time to fix the issue before you disclose it. The full policy is in <a href={`${GITHUB_URL}/blob/main/SECURITY.md`}>SECURITY.md</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}
