# Architecture

loci is three deployed parts (see [repository layout](monorepo.md)): the static landing site, this webapp, and the docs site. Only the webapp has a database or secrets; the diagram below is the webapp. The landing page reads its live Qloo sample from the webapp's public `GET /api/public/live-taste`.

```
Browser (Next.js RSC + client islands, Motion)
   |  server actions (zod-validated, Result<T>)    route handlers (/api/qloo/search, /api/export, /api/health)
   v
Next.js 16 App Router on Node 24 (pm2 loci-care, 127.0.0.1:3750) behind nginx + Let's Encrypt
   |-- lib/server/auth.ts      Argon2 passwords, hashed session tokens, HttpOnly cookie
   |-- lib/server/repo.ts      every query, access checks (circle role or org + consent)
   |-- lib/server/demo.ts      ephemeral demo account seeded with 9 journeys
   |-- lib/care/*              pure logic: templates, schedule, rules, comfort, good-day plan
   |-- lib/qloo/*              Qloo client, normalization, trace
   v
PostgreSQL (DATABASE_URL, least-privilege app role)               Qloo Insights API
```

## Access model

- Circle roles: patient, caregiver, family, carer, clinician.
- Edit the plan: owner, patient, caregiver, clinician. Check in: everyone except family. Manage invites and sharing: owner, patient, caregiver.
- Org members (admin, clinician) see a journey only while `consent_org` is true, and can review flags and edit its plan.
- Team plans (`org_id` set and `plan_source = 'clinician'`): only the care team edits; the circle follows. Clinician pages use `requireClinician()` and `clinicPatient()` (journey must belong to one of the user's orgs and share with it).
- Every server action calls `guard()` which re-reads access from the database.

## Pure modules (unit tested)

- `schedule.ts`: which items are active on a date, dose slots, adherence, streaks, badges.
- `rules.ts`: thresholds and warning signs to flags.
- `comfort.ts`: Qloo orchestration with a transport interface so tests can use a mock.
- `goodday.ts`: merges plan slots and comfort picks into a day; rituals for the card.

## Data model

See `migrations/001_init.sql` and `migrations/002_two_sided.sql` (why/how per plan item, plan sent and updated times, general instructions, plan and ask seen times, demo pairing, messages). Main tables: users, sessions, orgs, org_members, journeys, circle_members, invites, plan_items, warning_signs, thresholds, task_logs, checkins, flags, circle_tasks, activity, taste, consent_log, qloo_cache, messages.

## Demo

`/app/demo` creates two paired accounts flagged `is_demo` (24 h), the patient and the clinician,, fake circle members, the org "Hudson Recovery Partners" and nine journeys (orthopedics in New York, postpartum in Brooklyn, pediatrics in London, elder care in Toronto, cardiac in Tokyo, neuro rehab in Mexico City, mental health in Berlin, diabetes in Paris, oncology in New York) with plans attributed to the fictional team and two weeks of check-in history. Expired demos are purged on the next demo start.

## Testing

- Vitest: rules, schedule, comfort with a mock transport, content checks (no em dashes in UI source, specialty coverage, demo cities).
- Playwright: desktop 1440 and mobile 390, mock Qloo, separate test DB; checks console errors and horizontal overflow on every page visited. `two-sided.spec.ts` runs the whole loop with a clinician and a patient in two browser contexts.

## Outcome tracking

The clinician workspace has an Outcomes tab per patient (`/clinic/p/[id]/outcomes`). Its data lives in `outcome_measures`, `outcome_values` and `readmissions` (migration 004). It is written by care-team-only server actions and shown as SVG charts of each measure, with the optional target as a dashed line. The same tab shows weekly plan adherence bars, milestone progress and readmission-free days. The list of instruments is `src/lib/care/instruments.ts`; it holds names, units and ranges only.

## Plan templates

- `/clinic/templates` lists the team's own templates and two loci structure templates: stroke rehabilitation at home (120 days, caregiver led, Barthel, mRS and TUG suggested) and orthopedic physiotherapy after joint replacement (84 days, exercise blocks for days 0 to 13, 14 to 41 and 42 on, TUG, knee range and pain suggested).
- Structure templates hold titles and prompts only. Items they create carry `plan_items.needs_review`; `sendPlanAction` refuses to send while any remain. Editing an item clears the flag.
- A structure template can be copied into the team library and edited at `/clinic/templates/[id]`: items, milestones, warning signs in the team's words, and measures.
- Any plan can be saved as a team template from its plan page. Only the plan content is copied (items, signs, rules, measures, instructions); the patient's name, dates and check-ins are not.
- New plans pick a template on `/clinic/new` (also `?template=<id>`). Team templates live in `plan_templates` (migration 005), scoped to the organization.
- Covered by `tests/unit/templates.test.ts` and `tests/e2e/templates.spec.ts`.

## Reminders

- Preferences per person and journey (`reminder_prefs`, migration 007): a daily check-in reminder time, plan step times, in-app, SMS and WhatsApp. Set in Settings, Reminders, or `/api/v1/journeys/:id/reminders`.
- In the app: once the reminder time has passed and today's check-in is missing, Today shows a reminder card; with step times on, it shows the next step and its time.
- SMS and WhatsApp go through a provider interface (`src/lib/server/reminders/provider.ts`). The Twilio provider uses the Messages REST API and counts as configured only when `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_SMS_FROM` (SMS) or `TWILIO_WHATSAPP_FROM` (WhatsApp) are set. Otherwise the UI shows "Not connected", the switches stay off, and nothing is sent or logged as sent.
- `reminder_deliveries` records only real provider results (sent with the provider message id, or failed with the provider error). A check-in reminder is sent at most once per channel per day.
- Delivery runs when a scheduler calls `POST /api/internal/reminders` with `Bearer $CRON_SECRET`. **On the live server Twilio is not connected and no scheduler is set up, so no SMS or WhatsApp is sent today.** In-app reminders work now.
- Message text says only that it is time for the daily check-in and links to loci. No condition, plan or check-in content.
