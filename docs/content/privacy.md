# Privacy and data inventory

The public, plain-language version is at `/privacy` in the app.

## Data inventory

| Table | Contents | Visible to |
| --- | --- | --- |
| users | email, display name, time zone, Argon2 hash, role preference | the user |
| sessions | SHA-256 of the random session token, expiry | nobody (server only) |
| journeys | first name or nickname, specialty, discharge date, horizon, city, care team name and phone, emergency number, diet notes, consent flag, share slug, card | circle; org only with consent |
| plan_items, warning_signs, thresholds | the plan, as entered | circle; org only with consent |
| checkins, task_logs, flags | self-reported answers, ticks, rule matches and reviews | circle; org only with consent |
| circle_members, invites, circle_tasks, activity | membership and coordination | circle |
| taste | favorites, ticked filters, outings switch | circle only, never the care team |
| messages | patient and care team messages and questions | circle (patient side) and the care team while sharing is on |
| outcome_measures, outcome_values, readmissions | the instruments a care team chose to track, the totals they entered, and any readmission dates | the care team while sharing is on, and the owner via export |
| api_tokens | SHA-256 of mobile app tokens, expiry, last use | nobody (server only) |
| consent_log | every consent change (circle, team, share, research) with time and actor | owner via export |
| journeys.research_consent | the separate research opt-in and when it was granted | owner; team admins see only groups of 10 or more |
| reminder_prefs | your reminder time and channels, and a mobile number only while SMS or WhatsApp is on | you |
| reminder_deliveries | real SMS and WhatsApp send results (provider id or error) | you |
| research_access_log | who viewed or exported the research aggregate, when, cells shown and hidden | team admins |
| qloo_cache | cached Qloo responses keyed by request hash, 24 h | nobody (server only) |

No surnames, dates of birth or record numbers are requested.

## Consent

- For a journey the family starts, care team sharing is off until the patient or main caregiver switches it on. For a plan a care team sends, the redeem screen asks the patient to let the team see progress, ticked by default and explained in plain language; it can be turned off at join or later in Circle. Switching it off removes org access immediately because every request re-checks `consent_org`.
- The welcome card is public only after "Create a share link". Stopping sharing clears the slug.

## Rights

- Export: `GET /api/export` returns everything as JSON.
- Delete: Settings removes the user and every journey they own in one transaction.
- Demo accounts expire after 24 hours and are purged; signing out of a demo erases it.

## Qloo

Only favorite entity IDs, a city point and generic tags are sent. See [qloo.md](qloo.md).
