# Repository layout

loci is a monorepo of separate, standalone parts. Each has its own `package.json`, build, tests, README and deployment.

| Part | What it is | Production |
| --- | --- | --- |
| `landing/` | Public marketing site (Next.js). Static, no database, no Qloo key. Its calls to action open the webapp's clinician and patient sign-up and sign-in. | https://locicare.xyz |
| `webapp/` | The clinician workspace (`/clinic`), the patient app (`/app`), the HTTP API and the Postgres database. The only part that holds secrets. | https://app.locicare.xyz |
| `docs/` | This documentation site (Next.js rendering Markdown from `docs/content`). | https://docs.locicare.xyz |
| `mobile/` | Expo React Native patient app against `/api/v1` (see the Mobile app page and mobile-api.md). | Android test APK in GitHub Releases (mobile-v1.0.0), not on stores |

The parts link to each other through environment variables: `APP_URL` and `DOCS_URL` in landing, `LANDING_URL` and `DOCS_URL` in the webapp, `APP_URL` and `LANDING_URL` in docs.
