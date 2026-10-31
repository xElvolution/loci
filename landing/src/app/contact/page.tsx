import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/site/LegalPage";
import { GITHUB_URL, SIGNIN_URL, docs } from "@/lib/urls";

export const metadata: Metadata = { title: "Contact", description: "How to reach the loci team about the product, a bug, an idea or a security issue.", alternates: { canonical: "/contact" } };

const ROUTES = [
  { title: "Questions about your care", body: "Your plan, medicines, symptoms or appointments: contact your care team, using the numbers in your plan. loci cannot answer clinical questions. In an emergency, call your local emergency number." },
  { title: "Help using loci", body: "Start with the documentation, which covers both sides of the app, the mobile app and the API.", href: docs(), cta: "Read the docs" },
  { title: "Report a bug or suggest an idea", body: "Open an issue on GitHub with the steps that led to it. Please leave out any real health information.", href: `${GITHUB_URL}/issues/new/choose`, cta: "Open an issue" },
  { title: "Report a security problem", body: "Report it privately through GitHub security advisories. Only the maintainers can see it.", href: `${GITHUB_URL}/security/advisories/new`, cta: "Report privately" },
  { title: "Care teams and organizations", body: "Clinicians can create a care team workspace from the app's sign-in page today. For pilots or organization pricing, open a GitHub issue with the feature request template.", href: SIGNIN_URL, cta: "Open the app" },
];

export default function Contact() {
  return (
    <LegalPage eyebrow="Contact" title="Talk to" accent="the team." intro="Pick the route that fits, so your message reaches the right place quickly.">
      <LegalSection n="01" title="Where to go">
        <ul className="!list-none !pl-0 !space-y-4" data-testid="contact-routes">
          {ROUTES.map((r) => (
            <li key={r.title} className="paper-card rounded-3xl p-6 !pl-6">
              <h3 className="text-lg font-bold text-ink">{r.title}</h3>
              <p className="mt-2">{r.body}</p>
              {r.href && <p className="mt-3"><a href={r.href}>{r.cta}</a></p>}
            </li>
          ))}
        </ul>
      </LegalSection>
    </LegalPage>
  );
}
