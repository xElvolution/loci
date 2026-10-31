# loci and Qloo: UI and design

## Visual language

- **Night-city dusk** backgrounds (deep indigo to violet) with **warm amber and coral** accents for warmth and urgency, **mint** for done and safe, **lilac** for plan items.
- **Cream atlas-paper** sections on the landing and document pages for calm reading.
- Type: **Bricolage Grotesque** for headings and UI, **Instrument Serif italic** for the emotional half of each headline ("The way home, *together.*"), **JetBrains Mono** for labels and times.
- **Isometric SVG scenes**: an animated road from a hospital to a glowing home with milestones and a traveler; specialty glyphs for each recovery type.
- **Motion with purpose**: the road draws itself, the traveler pulses, sections rise into view, the check-in celebrates with a soft burst, optimistic ticks. Reduced motion is respected.

## Key screens

Two layouts with their own navigation: the **clinician workspace** (`/clinic`: Patients, New plan, Inbox, Team, with a care team badge in the header) and the **patient app** (`/app`: Today, Plan, Check in, Ask, Comfort as tabs, Journey, Circle and Settings in the menu).

1. **Landing** (`/`): the promise, two explicit audiences with their own CTAs ("I'm a clinician", "I'm a patient or caregiver"), the loop diagram (plan, follow, track, adjust), who it is for (twelve specialties), how it works, a live Qloo answer, safety and privacy, for clinicians, pricing with honest "planned" marks.
2. **Demo** (`/app/demo`): "Try the demo" with two buttons, "See it as a clinician" and "See it as a patient". Same demo patient on both sides; the banner switches sides.
3. **Clinician sign-up, sign-in and setup** (`/clinic/signup`, `/clinic/signin`, `/clinic/setup`).
4. **Patients** (`/clinic`): KPIs, flag queue with "Mark reviewed", questions waiting, patient table (cards on mobile) with status, day, mood and pain sparklines, 7-day plan completion and what needs you.
5. **New care plan** (`/clinic/new`) and **Care plan** (`/clinic/p/[id]/plan`): editor with why and how per item and general instructions, an Edit / "What the patient sees" switch, a send card with the code and link, a checklist.
6. **Tracking** (`/clinic/p/[id]`) and **Messages** (`/clinic/p/[id]/messages`), **Inbox** (`/clinic/inbox`), **Team** (`/clinic/settings`).
7. **Redeem** (`/app/redeem`) and the team-plan join screen ("Theo, your care plan is ready").
3. **Today** (`/app`): greeting, day N of the journey, streak and plan completion, the day's plan with one-tap ticks, check-in card, "When to call" with call buttons, circle and comfort teasers.
4. **Check-in** (`/app/checkin`): faces for mood, a 0 to 10 pain slider, 1 to 5 scales, the plan's warning signs in the team's words, then either a celebration or an escalation screen.
5. **Journey** (`/app/journey`): the road home, milestones to tick, upcoming appointments, showing-up rings and badges, five trend charts.
6. **Plan** (`/app/plan`): for a care team plan, numbered steps with "What to do", "Why your team asked", "How to do it" and when, the team's general instructions and the when-to-call panel; a "Your care team updated your plan" notice with "Got it". For a family-entered plan, the editors.
6b. **Ask** (`/app/ask`): the message thread with the care team, questions marked waiting or answered.
7. **Circle** (`/app/circle`): errands, people, invite links by role, care team sharing switch, activity.
8. **Comfort** (`/app/comfort`): favorites search, filters, outings switch, city; the good-day timeline; shelves of picks with "Because of"; meals with the team's food notes; the welcome card editor; the Qloo trace.
10. **Settings**: profile, replay tour, who sees what, export, delete.

## Guided tour

Each side has its own spotlight tour. The patient tour walks Today, tick-offs, When to call, the step-by-step Plan, Check-in, Ask, Journey, Circle, Comfort and Settings. The clinician tour walks the patient list, the KPIs, New plan, preview and send, live tracking, the inbox and Team settings. Both adapt to the viewport, can be skipped with a button or Esc, and replay from settings.

## Responsive and accessible

- Patient desktop navigation from 1280 px and clinician from 1024 px, bottom tab bars below that, safe-area padding.
- Tested at 1440 and 390 for overflow and console errors.
- Radio groups, pressed states and switches use proper roles; focus rings; live regions for status; tel: links for calls.
- UI copy is plain language with no em dashes.
