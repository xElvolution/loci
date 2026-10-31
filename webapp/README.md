# loci webapp

The clinician workspace (`/clinic`), the patient app (`/app`), the HTTP API (`/api`) and the Postgres database. This is the only part of loci that holds secrets (the database URL and the Qloo key). See the [root README](../README.md) for the product and the monorepo layout, and [docs/content/api.md](../docs/content/api.md) for the endpoints.

Signed-out visitors to `/` are redirected to the landing site (`LANDING_URL`); signed-in clinicians go to `/clinic` and patients to `/app`.

## Run it locally


```bash
cp .env.example .env.local      # set DATABASE_URL, APP_ORIGIN, QLOO_API_KEY
npm ci
npx tsx scripts/migrate.ts      # uses DATABASE_URL
npm run dev                     # http://localhost:3751
```

Tests:

```bash
npm test                        # unit tests (rules, schedule, comfort, content)
npm run test:e2e                # Playwright at 1440 and 390 against a local mock of Qloo
```

The e2e suite includes the full two-sided loop in two browser contexts at 1440 and 390: a clinician signs up, creates and sends a plan; the patient redeems the code, ticks an item, checks in with a warning sign and asks a question; the clinician sees the update, the flag and the question, reviews and replies, then edits the plan; the patient sees "Your care team updated your plan". It starts a mock Qloo server (every name is prefixed "Fixture") and a production build on a separate test database, and fails on any console error or horizontal overflow.

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `APP_ORIGIN` | Public origin of this app (invite links, metadata) |
| `QLOO_API_KEY` | Qloo key, server only, never printed or committed |
| `LANDING_URL`, `DOCS_URL` | Where the landing and docs sites live (defaults to production) |

## Deploy

pm2 `loci-care` on port 3750 behind nginx at https://app.locicare.xyz. See [docs/content/deploy.md](../docs/content/deploy.md).
