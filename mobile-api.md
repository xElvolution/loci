# loci mobile API contract (v1)

Status: live on production. It is covered by `webapp/tests/e2e/api-v1.spec.ts`.

For the Expo patient app in `mobile/`. Served by the webapp. Patient and family side only (no clinician endpoints).

- **Base URL:** `https://app.locicare.xyz/api/v1` (local dev: `http://localhost:3751/api/v1`)
- **Auth:** `Authorization: Bearer <token>`. Get a token from `POST /auth/signin`, `POST /auth/signup` or `POST /auth/demo`. Tokens last 90 days (demo tokens 24 hours) and are revoked by `POST /auth/signout`. Store the token in `expo-secure-store`, never in AsyncStorage or logs.
- **Format:** JSON in and out (`Content-Type: application/json`). Dates are `YYYY-MM-DD` in the journey's time zone. Timestamps are ISO 8601 UTC.
- **Errors:** `{ "error": { "code": "...", "message": "..." } }`. The message is plain language and safe to show.
  - `400 invalid`
  - `401 unauthorized` (no token, or an expired one: send the person to sign in)
  - `403 forbidden`
  - `404 not_found`
  - `409 conflict`
  - `429 rate_limited`
- **Journey id:** every `/journeys/:id/...` path accepts a journey UUID or the word `current`, meaning the person's current journey. `current` returns 404 `no_journey` if they have none yet: show "Enter the code from your care team".
- **CORS:** allowed from any origin (bearer tokens only, no cookies), so Expo web works too.

## Auth

| Method and path | Body | Returns |
| --- | --- | --- |
| `POST /auth/signup` | `{ email, password (10+ chars), name, timezone? }` | `201 { token, expires_at, user }` |
| `POST /auth/signin` | `{ email, password }` | `200 { token, expires_at, user }`. A clinician account returns 403 `clinician_account` (they use the web workspace). |
| `POST /auth/demo` | `{ timezone? }` | `201 { token, expires_at, user }`. A fresh 24-hour demo patient (Daniel, knee replacement) with a real team plan, messages and history. |
| `POST /auth/signout` | | `204` (revokes this token; a demo account is deleted) |
| `GET /me` | | `{ user, journeys: [{ id, person_name, specialty, role, is_current }], current_journey_id }` |

`user` = `{ id, display_name, email, timezone, role_pref, is_demo }`.

## Redeem a care team code

| Method and path | Body | Returns |
| --- | --- | --- |
| `GET /codes/:code` | | `{ valid: true, care_team_name, person_name, role }` or `404 invalid_code`. Accepts `ABCD-EFGH` or `abcdefgh`. Rate limited. |
| `POST /redeem` | `{ code, share_with_team: boolean (default true) }` | `201 { journey_id }`. Joins the plan, makes it current, and records the sharing choice in the consent log. |

## Today

`GET /journeys/:id/today`

```json
{
  "date": "2026-10-31", "day": 9, "person_name": "Daniel", "specialty": "orthopedics", "specialty_label": "Orthopedics and joint replacement",
  "items": [{ "item_id": "uuid", "slot": "08:00", "kind": "medication", "title": "...", "detail": "...", "why": "...", "how": ["step", "step"], "done": false }],
  "progress": { "done": 2, "total": 7 },
  "checkin_done": false, "streak": { "current": 4, "best": 6, "doneToday": false },
  "next_appointment": { "title": "...", "date": "2026-11-03", "time": "10:30", "location": "..." },
  "plan_update": { "at": "2026-10-31T00:12:00Z", "text": "Changed: ..." },
  "open_flags": 0,
  "contact": { "care_team_name": "...", "care_team_phone": "...", "emergency_number": "911" }
}
```

`streak` is an object: `current` is the run of consecutive check-in days up to today (or yesterday when today is not done yet), `best` is the longest run, `doneToday` is whether today's check-in exists. `slot` is `HH:MM` or `any`. `plan_update` is `null` when there is nothing new. `next_appointment` is `null` when none. `how` is the clinician's steps split into lines.

`POST /journeys/:id/ticks` with `{ item_id, slot, done, date? }` (date defaults to today; only today and the two days before) returns `{ ok: true, progress }`.

`POST /journeys/:id/plan-seen` marks the plan-update banner as read and returns `{ ok: true }`.

## Plan

`GET /journeys/:id/plan` returns `{ instructions, sent_at, updated_at, items: [{ id, kind, title, detail, why, how: [steps], times, weekdays, start_day, end_day, day, at_time, location }], warning_signs: [{ id, text, action }] }`.

- `kind` is one of `medication`, `care`, `exercise`, `appointment` or `milestone`.
- `day`, `start_day` and `end_day` count days from discharge (day 0).

`action` is `call_team` or `emergency`. Everything here is the care team's own words. Show it verbatim and never add medical content.

## Check-in

| Method and path | Body | Returns |
| --- | --- | --- |
| `GET /journeys/:id/checkins?days=30` | | `{ today_done, checkins: [{ for_date, mood, pain, sleep, appetite, energy, signs, note }] }` |
| `POST /journeys/:id/checkins` | `{ mood 1-5, pain 0-10, sleep 1-5, appetite 1-5, energy 1-5, signs: [warning_sign ids], note (up to 600 chars) }` | `201 { flags: [{ source, action, reason }], streak, escalation }` |

One check-in per day: posting again the same day replaces it. In this response `streak` is a plain number (consecutive days ending today, including the one just saved), unlike the `streak` object on `today` and `journey`.

`escalation` is `null` or `{ action: "call_team" | "emergency", message, care_team_phone, emergency_number }`. Show it prominently with one-tap call buttons (`tel:`). `emergency` beats `call_team`. Flags are rule-based on the team's thresholds and the warning signs the person ticks. No scoring.

## Journey

`GET /journeys/:id/journey` returns:

```
{
  day, horizon_days, discharge_date,
  streak: { current, best, doneToday },
  adherence_7d: 0..1 | null,
  milestones: [{ id, title, day, reached }],
  appointments: [{ title, date, time, location }],
  trends: [{ date, mood, pain, sleep, appetite, energy }]
}
```

`trends` covers the last 30 days.

## Comfort (Qloo)

`GET /journeys/:id/comfort` returns `{ status, label, sections, generated_at }`.

- `status` is one of `ok`, `no_favorites`, `no_city` or `unavailable`.
- `sections` holds `soundtrack`, `screen`, `reading`, `meals` and `outings`. Each is a list of `{ id, name, kind, image, subtitle, because }`, where `image` and `subtitle` may be `null` and `because` is a list of strings (short reasons such as the favorite it is linked to, possibly empty), not a single text. Join them for display. `cuisines` is a list of `{ id, name }`.
- `label` is the disclosure line to show under the picks: "Aggregate taste affinity from Qloo. Not advice." Taste is never linked to health.
- This call can take a few seconds. Show a skeleton while it loads.

## Contact the team and messages

| Method and path | Body | Returns |
| --- | --- | --- |
| `GET /journeys/:id/contact` | | `{ care_team_name, care_team_phone, emergency_number, team_on_loci, sharing_with_team }` |
| `GET /journeys/:id/messages` | | `{ messages: [{ id, side: "patient" \| "team", kind: "message" \| "question" \| "update", body, created_at, resolved_at, name }] }`, oldest first, and marks team replies as read |
| `POST /journeys/:id/messages` | `{ body (up to 2000 chars), kind: "message" \| "question" }` | `201 { message }`. Family members with the `family` role get 403 `forbidden` (the patient or main caregivers write to the team). A journey with no care team on loci (`team_on_loci: false`) gets 403 `no_team`: show the team phone number instead. |

Messages are not for emergencies. Keep the line "For anything urgent, call your care team or the emergency number" next to the composer.

## Rate limits

- Sign-in: 8 attempts per email and 20 per IP every 10 minutes.
- Codes: 20 checks per IP every 10 minutes.
- Messages: 60 per hour.
- Demo: 12 per IP per hour.

## Research consent

| Method and path | Body | Returns |
| --- | --- | --- |
| `GET /journeys/:id/research` | | `{ research_consent, can_change, reason, k }` |
| `PUT /journeys/:id/research` | `{ granted: boolean }` | same shape |

Separate from team sharing and off by default. `reason` is `null`, `no_team` (not a care-team plan), `not_owner` (only the person or main caregiver can change it) or `not_sharing` (share with the team first). Errors: `403 not_owner`, `409 no_team`, `409 not_sharing`. Show the plain explanation: only groups of at least `k` people are ever shown, never names, dates, notes, messages or favorites.

## Your data

| Method and path | Body | Returns |
| --- | --- | --- |
| `GET /me/export` | | the same JSON as the web export (account, circles, plans, check-ins, messages, outcomes, consent log). `429 rate_limited` after 10 an hour. |
| `DELETE /me` | `{ "confirm": "DELETE" }` | `204`. Deletes the account and every journey it owns and revokes all tokens. `400 confirm_required` without the confirm text. |

CORS allows `GET, POST, PUT, DELETE, OPTIONS`.

## Reminders

| Method and path | Body | Returns |
| --- | --- | --- |
| `GET /journeys/:id/reminders` | | `{ checkin_time, steps, in_app, sms, whatsapp, phone, channels: { sms, whatsapp } }` |
| `PUT /journeys/:id/reminders` | `{ checkin_time: "HH:MM" or null, steps, in_app, sms, whatsapp, phone }` | same shape |

Preferences belong to the signed-in person, per journey. `channels.sms` and `channels.whatsapp` are `connected` or `not_connected`; show "Not connected" and keep the switch off when not connected. Turning on a channel that is not connected returns `409 not_connected`. `phone` must include the country code and is stored only while SMS or WhatsApp is on. Server messages never contain health details. The app can schedule its own local notifications from `checkin_time`.
