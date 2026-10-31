# Safe use

loci organizes the plan a care team gave and keeps the people around a patient in step. It is designed so that it cannot add clinical content of its own.

## Guarantees built into the product

- **No invented medical content.** Specialty templates (`src/lib/care/specialties.ts`) contain prompts, field hints and everyday milestones only. A unit test checks that templates hold no doses or warning signs. The richer structure templates for stroke rehabilitation and orthopedic physiotherapy (`src/lib/care/templates.ts`) add sections, phased exercise blocks and suggested outcome measures, still with no doses, warning signs or rules. Every item they add is marked "Needs your words", and the plan cannot be sent until a clinician has rewritten or removed each one, so a prompt never reaches a patient.
- **Plan lines are verbatim.** Medicines, doses, tasks, exercises, appointments and warning signs are typed by a clinician or copied word for word by the family. The plan page reminds people to ask the team rather than guess.
- **Escalation is a simple rule.** `src/lib/care/rules.ts` fires only on a ticked warning sign or a threshold the team wrote (metric at or above / at or below a value, optionally for N days in a row; a missing day breaks the run). Emergency actions sort first. The message repeats the team's words.
- **Call buttons everywhere it matters.** Today, the check-in result and the escalation screen show tel: links for the care team and the local emergency number.
- **Taste never touches health.** Comfort picks are computed separately and never read check-ins, flags or the plan. Meal ideas sit next to the team's food notes, shown verbatim.
- **Disclaimers in context.** Every patient-facing screen carries a short note: loci gives no medical advice; contact the care team; in an emergency call the local number.

## What people should do

- In an emergency, call the local emergency number. Do not wait for the app.
- If no flag appears, that does not mean everything is fine. If worried, call.
- Follow the care team's instructions over any suggestion in the app.

## For care teams

- Keep existing escalation and follow-up protocols. Treat flags as a prompt to reach out, not triage.
- Write warning signs as you would in a discharge letter.
- Patients choose whether to share with your team and can stop at any time.

## Outcome tracking

- Clinicians choose which instruments to track for each patient. The choices include the Barthel Index, Timed Up and Go, a numeric pain rating, the modified Rankin Scale, six-minute walk distance, knee flexion range, PHQ-9, GAD-7, EPDS, body weight, or a measure of their own.
- loci stores only the totals they enter. It does not show or score any questionnaire, and it does not interpret a value.
- Charts show a value going up or down in the direction the instrument counts as better. The direction is never a judgement about the person.
- Readmission-free days count from discharge, or from the last return home that the team recorded.
