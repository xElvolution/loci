# API

The webapp (`webapp/`) is the only part of loci with a database and the only part that holds the Qloo key. Everything else (landing, docs, the mobile app) talks to it over HTTP.

There are three kinds of interface: server actions for the web app, a few public and session route handlers, and the bearer-token mobile API under `/api/v1`.

Base URL in production: `https://app.locicare.xyz`

## Web interfaces

- **Server actions** power the web clinician workspace (`/clinic`) and the patient app (`/app`). They are zod-validated, return a `Result<T>`, and check the session and the caller's access to the journey on every call. They are not a public API.
- **Route handlers** under `/api` are plain HTTP endpoints, listed below.

## Endpoints

| Method and path | Auth | What it returns |
| --- | --- | --- |
| `GET /api/health` | none | `{ ok, db, qloo }`. `qloo` is only whether a key is configured, never the key. 503 when the database is down. |
| `GET /api/public/live-taste` | none | A cached, aggregate Qloo sample for the landing page: two fixed public favorites (a musician and a TV show) and the picks Qloo returns for New York. No user data goes in or comes out. Cached for an hour. |
| `GET /api/qloo/search?q=&types=` | session | Entity search used by the comfort editor. Rate limited to 90 per minute per user. Only the typed title goes to Qloo, never a name or a health detail. |
| `GET /api/qloo/search?kind=city&q=` | session | City lookup for the journey settings. |
| `GET /api/export` | session | A JSON export of everything the signed-in person can see. Rate limited to 10 per hour. |
| `POST /api/internal/reminders` | `Bearer $CRON_SECRET` | Sends due SMS and WhatsApp check-in reminders once a day each. Returns 404 when `CRON_SECRET` is not set. |
| `GET /api/research/export?org=` | session, team admin | Aggregate-only research CSV with groups under k = 10 suppressed. Each download is logged. |

## Errors

Errors are JSON `{ "error": "..." }` with a matching status: 401 when not signed in, 403 when the journey is not yours, 429 when rate limited, 503 when a dependency is down.

## Sessions

The web app uses an HTTP-only, `SameSite=Lax`, secure session cookie (a random token, stored hashed). Passwords are hashed with argon2id.

## Mobile API (`/api/v1`)

The Expo patient app uses a versioned JSON API with bearer tokens. It covers the patient and family side only. Clinicians use the web workspace.

- **Auth:** `Authorization: Bearer <token>`.
  - Tokens come from `POST /api/v1/auth/signin`, `/auth/signup` or `/auth/demo`.
  - They last 90 days (a demo token lasts 24 hours) and are revoked by `/auth/signout`.
  - Only a SHA-256 hash of each token is stored (table `api_tokens`).
  - Clinician accounts get 403 `clinician_account`.
- **Errors:** `{ "error": { "code", "message" } }`. Codes include `invalid`, `unauthorized`, `not_owner`, `not_sharing`, `confirm_required`, `forbidden`, `not_found`, `no_journey`, `invalid_code`, `email_taken`, `no_team` and `rate_limited`.
- **CORS:** open to any origin, methods GET, POST, PUT and DELETE. There are no cookies on this API.
- **Journey paths:** every `/journeys/:id` path takes a journey id or `current`. Only members of that person's care circle can use it. Clinic access does not count here.

| Method and path | What it does |
| --- | --- |
| `POST /auth/signup`, `POST /auth/signin`, `POST /auth/demo`, `POST /auth/signout` | Get or revoke a token. Signing out of a demo deletes it. |
| `GET /me` | The person, their journeys and the current one. |
| `GET /codes/:code`, `POST /redeem` | Preview and redeem the code a care team sent, with the sharing choice. |
| `GET /journeys/:id/today` | Today's steps (what, why, how), progress, check-in done, streak, next appointment, plan-update notice, contact numbers. |
| `POST /journeys/:id/ticks`, `POST /journeys/:id/plan-seen` | Tick a step for today or the two days before. Dismiss the plan-update notice. |
| `GET /journeys/:id/plan` | The full plan, general instructions and warning signs, in the team's words. |
| `GET`, `POST /journeys/:id/checkins` | History. Today's check-in returns rule-based flags and an `escalation` with the team's phone and the emergency number. |
| `GET /journeys/:id/journey` | Day, milestones, appointments, 7-day adherence, 30-day trends. |
| `GET /journeys/:id/comfort` | Qloo comfort picks, labeled as aggregate taste affinity. |
| `GET /journeys/:id/contact`, `GET`, `POST /journeys/:id/messages` | Care team contact and the message thread with the team. |
| `GET`, `PUT /journeys/:id/research` | The separate research consent (owner only, needs team sharing). |
| `GET`, `PUT /journeys/:id/reminders` | Reminder preferences, with SMS and WhatsApp reported as `connected` or `not_connected`. |
| `GET /me/export`, `DELETE /me` | Download all your data as JSON. Delete the account with `{ confirm: "DELETE" }`. |

The full contract with request and response shapes is [`mobile-api.md`](https://github.com/xElvolution/loci/blob/main/mobile-api.md) in the repository root. Writes from the app show up live in the web clinician workspace, exactly like writes from the web patient app, because both go through the same service functions.

## Rules every endpoint follows

- No personal data is sent to Qloo. Qloo receives titles of things a person likes and a city.
- Health is never inferred from taste, and taste results are labeled as aggregate affinity.
- Qloo responses are cached in Postgres for up to 24 hours and are never committed to the repository.
