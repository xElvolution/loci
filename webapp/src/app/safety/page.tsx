import { DocPage, DocSection } from "@/components/landing/PublicChrome";

export const metadata = { title: "Safe use", description: "loci is an organizer and companion, not a medical device." };

export default function Safety() {
  return (
    <DocPage eyebrow="Safe use" title="A companion," accent="not a clinician." intro="loci organizes the plan your care team gave you and keeps the people around you in step. It does not diagnose, predict or advise.">
      <DocSection n="01" title="In an emergency">
        <p><strong>Call your local emergency number straight away.</strong> Do not wait for a check-in, a flag or a reply from anyone in the app. Every journey shows the emergency number and the care team&apos;s phone on the today screen.</p>
      </DocSection>
      <DocSection n="02" title="loci invents no medical content">
        <ul>
          <li>Specialty templates only give the plan a shape: section headings, prompts and everyday milestones such as &ldquo;first walk around the block&rdquo;.</li>
          <li>Every medicine, dose, care task, exercise, appointment and warning sign is typed in by a clinician, or copied word for word by the family from the discharge letter.</li>
          <li>loci never suggests a dose, a change to a medicine or a symptom to watch for.</li>
        </ul>
      </DocSection>
      <DocSection n="03" title="How flags work">
        <p>A flag appears only when a check-in matches a rule the care team wrote: a warning sign that was ticked, or an answer at or past a number they set, optionally for several days in a row. The flag repeats the care team&apos;s own words and shows the call buttons.</p>
        <p>There is no risk score, no model and no prediction. No flag does not mean everything is fine. If you are worried, call.</p>
      </DocSection>
      <DocSection n="04" title="Comfort picks are for comfort">
        <p>Music, shows, books, meals and places come from Qloo&apos;s aggregate taste data. They are suggestions for a better day, not health advice. Meal ideas are shown next to the care team&apos;s food notes; always follow those notes. Outings are only suggested if someone switches them on, and only as far as the plan allows.</p>
      </DocSection>
      <DocSection n="05" title="Not a medical device">
        <p>loci is a general wellness and care coordination tool. It is not intended to diagnose, treat, cure, mitigate or prevent any disease, and it has not been evaluated or cleared by any medical regulator. It does not replace the care team&apos;s instructions or your usual escalation process.</p>
      </DocSection>
      <DocSection n="06" title="For care teams">
        <ul>
          <li>Keep your existing protocols for follow-up and escalation. Treat loci flags as a prompt to reach out, not as triage.</li>
          <li>Patients choose whether to share with your team, and can stop sharing at any time.</li>
          <li>Write warning signs exactly as you would in a discharge letter, in plain words.</li>
        </ul>
      </DocSection>
    </DocPage>
  );
}
