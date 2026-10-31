import { DocPage, DocSection } from "@/components/landing/PublicChrome";

export const metadata = { title: "Privacy", description: "What loci stores, who sees it, and how to take it with you or delete it." };

export default function Privacy() {
  return (
    <DocPage eyebrow="Privacy, in plain language" title="Your recovery," accent="your data." intro="loci keeps the least it can, shows it only to the people you invite, and lets you take it with you or erase it at any time.">
      <DocSection n="01" title="What we store">
        <ul>
          <li><strong>Your account:</strong> email, a name you choose, time zone and a securely hashed password.</li>
          <li><strong>The journey:</strong> a first name or nickname, the specialty template, discharge date, city, and the plan that you or the care team typed in.</li>
          <li><strong>Daily check-ins:</strong> five answers on simple scales, any ticked warning signs, and an optional note.</li>
          <li><strong>Outcomes your care team records:</strong> if your team tracks measures such as a walking test or a pain score, the totals they enter and any return to hospital. loci never scores or interprets them.</li>
          <li><strong>The circle:</strong> who joined, their role, shared errands and a short activity log.</li>
          <li><strong>Taste:</strong> favorites you added, filters you ticked, and whether outings are welcome.</li>
          <li><strong>Reminders:</strong> the time you chose and your channels. A mobile number only while SMS or WhatsApp reminders are on, and those messages never mention your health.</li>
        </ul>
        <p>We do not ask for surnames, dates of birth, insurance numbers or medical record numbers. Please do not type them in.</p>
      </DocSection>
      <DocSection n="02" title="Who sees it">
        <ul>
          <li><strong>The care circle:</strong> only people who joined with an invite link you created.</li>
          <li><strong>A care team:</strong> only if the person or main caregiver switches sharing on. Switching it off removes their access straight away.</li>
          <li><strong>A welcome card link:</strong> only the first name, a message and taste rituals. Never the plan, a condition or a check-in.</li>
          <li><strong>Nobody else.</strong> No advertising, no data sales, no sharing with employers or insurers without the switch above.</li>
        </ul>
      </DocSection>
      <DocSection n="03" title="What goes to Qloo">
        <p>Qloo powers the comfort picks. It receives only the favorite names you added, a city point, and generic tags like &ldquo;vegetarian&rdquo; or &ldquo;quiet&rdquo; that you ticked.</p>
        <p><strong>It never receives a name, an email, the specialty, the plan, any check-in or any warning sign.</strong> Taste data is never used to infer a health condition, and it never affects flags, plans or any eligibility decision. Picks are labeled as aggregate taste affinity.</p>
        <p>Qloo answers are cached on our server for up to a day so we make fewer calls. They are never published.</p>
      </DocSection>
      <DocSection n="04" title="Consent you can see">
        <p>Every change to care-team sharing and to research consent is written to a consent log with the time and the person who made it. You can read it in your data export.</p>
      </DocSection>
      <DocSection n="05" title="Research, only if you say yes" id="research">
        <p>Research consent is a separate switch in Settings. It is off unless the person or main caregiver switches it on, and sharing with a care team never switches it on.</p>
        <ul>
          <li><strong>What counts:</strong> check-in scores, whether a check-in raised a flag, outcome measures the team chose from standard instruments, and whether there was a return to hospital, grouped by specialty and week of recovery.</li>
          <li><strong>What never counts:</strong> names, emails, phone numbers, invite codes, dates, notes, messages, custom measures, comfort favorites and anything from Qloo.</li>
          <li><strong>Groups only:</strong> the care team sees counts and averages, never one person. Any group with fewer than 10 people is hidden, not rounded.</li>
          <li><strong>Logged:</strong> every view and export of the research numbers is logged with who did it.</li>
          <li><strong>Switch it off any time:</strong> you leave the numbers straight away. Stopping sharing with the team also stops research.</li>
        </ul>
      </DocSection>
      <DocSection n="06" title="Take it with you, or delete it">
        <ul>
          <li><strong>Export:</strong> Settings, Export your data. One JSON file with everything we hold about you and your circles.</li>
          <li><strong>Delete:</strong> Settings, Delete everything. Your account and every journey you own are erased at once, including other members&apos; entries on them.</li>
          <li><strong>Demo accounts</strong> erase themselves within 24 hours, or the moment you sign out.</li>
        </ul>
      </DocSection>
      <DocSection n="07" title="Security">
        <p>Passwords are hashed with Argon2. Sessions are random tokens stored as hashes in an HttpOnly cookie. All traffic uses HTTPS. Access to every journey is checked on the server for every request.</p>
      </DocSection>
    </DocPage>
  );
}
