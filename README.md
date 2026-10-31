<h1 align="center">loci</h1>

<p align="center"><strong>The way home after hospital, for both sides of care.</strong></p>

<p align="center">
  <a href="https://locicare.xyz">Website</a> &middot;
  <a href="https://app.locicare.xyz">Web app</a> &middot;
  <a href="https://docs.locicare.xyz">Documentation</a> &middot;
  <a href="https://locicare.xyz/download">Download</a>
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-black">
  <img alt="Expo SDK 58" src="https://img.shields.io/badge/Expo-SDK%2058-000020">
</p>

Going home after a hospital stay is where recovery plans fall apart: a discharge letter nobody rereads, medicines at confusing times, warning signs forgotten, and a care team that hears nothing until something goes wrong. **loci closes that loop.** Clinicians write the recovery plan in their own workspace and track it live. Patients and families receive it with a code and follow it at home, step by step, in the team's own words. Qloo's taste AI fills the days in between with comfort that actually fits the person.

**Plan, follow, track, adjust.**

> **Try it:** open [demo.locicare.xyz](https://demo.locicare.xyz) and choose **See it as a clinician** or **See it as a patient**. Both open the same demo patient and a banner switches sides, so what you do on one side shows up on the other. No sign-up needed.

## Two sides, one plan

| | Clinicians and care teams | Patients and family caregivers |
| --- | --- | --- |
| **Where** | Clinician workspace, [`/clinic`](https://app.locicare.xyz/clinic/signup) | Patient app, [`/app`](https://app.locicare.xyz/app/signup) on the web, or the [Android app](https://locicare.xyz/download) |
| **What they do** | Build a plan from a specialty template, write what, why and how for every step, set warning signs and thresholds, send it with a code, then track adherence, check-ins, flags and questions live | Redeem the code, follow numbered steps at the times the team set, tick them off, do a two-minute check-in, ask the team, invite family into a care circle |
| **What they get** | A live view of how each patient is really doing at home, and a way to adjust the plan the moment it is needed | One clear plan in their team's words, one-tap calls when a warning sign appears, and comfort picks for the hard days |

## Repository

loci is a monorepo of standalone parts. Each has its own `package.json`, lockfile, tests, README and deployment, and they talk to each other only over HTTP and links.

| Part | What it is | Live | Stack |
| --- | --- | --- | --- |
| [`webapp/`](webapp) | Clinician workspace, patient app, HTTP API (`/api`, `/api/v1`) and Postgres. The only part that holds secrets. | [app.locicare.xyz](https://app.locicare.xyz) | Next.js 16, React 19, PostgreSQL, zod, Argon2 |
| [`landing/`](landing) | Public marketing site, download page, terms, security, cookie and contact pages. Static, no database. | [locicare.xyz](https://locicare.xyz) | Next.js 16, Tailwind CSS 4, Motion |
| [`docs/`](docs) | Documentation site rendering [`docs/content`](docs/content). | [docs.locicare.xyz](https://docs.locicare.xyz) | Next.js 16 |
| [`mobile/`](mobile) | Patient and family app on the bearer-token API. | [Android test build](https://github.com/xElvolution/loci/releases/tag/mobile-v1.0.0) | Expo SDK 58, React Native |

Cross-links are configured per deployment with environment variables (`APP_URL`, `SIGNIN_URL`, `LANDING_URL`, `DOCS_URL`, `SITE_ORIGIN`, and `EXPO_PUBLIC_API_ORIGIN` for mobile), documented in each part's `.env.example`. The landing page's live Qloo sample comes from the webapp's public `GET /api/public/live-taste`, so only the webapp ever holds the Qloo key.

## Quickstart

Requirements: Node.js 24 (20.9 or later), npm, and PostgreSQL 16 or later for the webapp.

```bash
git clone https://github.com/xElvolution/loci.git && cd loci

# webapp: clinician workspace, patient app and API on http://localhost:3751
cd webapp
cp .env.example .env.local        # DATABASE_URL, APP_ORIGIN, QLOO_API_KEY
npm ci
npx tsx scripts/migrate.ts
npm run dev

# landing on :3761 and docs on :3771 (no database needed)
cd ../landing && cp .env.example .env.local && npm ci && npm run dev
cd ../docs && cp .env.example .env.local && npm ci && npm run dev

# mobile (Expo web preview, or a development build on a phone)
cd ../mobile && npm ci && EXPO_PUBLIC_API_ORIGIN=http://localhost:3751 npm run web
```

Every part runs the same three checks from a clean install:

```bash
npm run lint && npm run typecheck && npm test
```

The web parts also ship Playwright suites (`npm run test:e2e`) at 1440 and 390 wide, including the full two-sided loop in two browser contexts.

## Who it is for

Every kind of coming home, not just one: maternity and postpartum, general surgery, orthopedics and joint replacement, cardiac, stroke and neuro rehab, pediatrics (parent-led), mental health, oncology, respiratory, diabetes, elder care, and a general template for anything else. Clinics, wards, home care agencies and rehab teams use the clinician workspace; patients and family caregivers use the patient app for free.

## The loop

```
   clinician                      patient and family                 clinician
 +-----------+   code or link   +--------------------+   live     +-------------+
 |   PLAN    | ---------------> |       FOLLOW       | ---------> |    TRACK    |
 | template, |                  | step-by-step plan, |            | adherence,  |
 | what/why/ |                  | tick-offs, check-  |            | trends,     |
 | how,rules |                  | in, ask the team   |            | flags, Q&A  |
 +-----------+                  +--------------------+            +-------------+
                                         ^                               |
                                         |   "your care team updated     v
                                         |    your plan"           +-------------+
                                         +------------------------ |   ADJUST    |
                                                                   +-------------+
```

## What it does

1. **Clinician workspace (`/clinic`).** Separate sign-up and sign-in for clinicians, a care team (org) with colleagues, a patient list with status (draft, sent and waiting, following the plan), flags and open questions. Create a plan from a specialty template and write every medicine schedule, care task, exercise, appointment, plain-language general instructions, warning signs and check-in thresholds, plus a short "why" and a step-by-step "how" for each item. Preview exactly what the patient sees, then send it with an 8-character code and a link (single use, 30 days). A per-patient tracking page shows today's tick-offs, 7-day adherence per item, five check-in trends, flagged check-ins with "Mark reviewed", notes and questions, the care circle and a live activity feed. Edit the plan after sending and the patient gets "Your care team updated your plan" with what changed. A message thread per patient and an inbox of open questions. The clinician sets the rules; flags stay rule-based only.
2. **Patient app (`/app`).** Redeem the code, agree to share with the team (on by default, can be switched off later in Circle), and get the plan as numbered steps: what to do, why your team asked, how to do it, when, all in the clinician's words. Tabs: Today, Plan, Check in, Ask, Comfort, plus Journey, Circle and Settings. Everything the patient does is visible live to the clinician (both sides refresh on their own).
3. **Families without a clinic on loci** can still start a journey themselves and copy the plan word for word from the discharge letter. loci invents no medical content.
4. **Today, check-ins and the road home.** A daily list at the times the team set, a two-minute check-in (mood, pain, sleep, appetite, energy, warning signs), streaks and gentle badges for showing up, and an animated road from hospital to home with milestones and appointments.
5. **Rule-based escalation.** If a check-in ticks a warning sign or crosses a number the team wrote, loci repeats the team's own words and shows one-tap buttons to call the team or the local emergency number. No scoring, no prediction, no diagnosis.
6. **A care circle.** Invite family, carers and clinicians by private link with clear roles. Shared errands, claiming, activity feed.
7. **Comfort, by Qloo.** From a few favorites (an artist, a show, a book) loci builds a soundtrack, screen time, reading, meals near home within the filters the person ticked, cuisines, gentle places nearby, and a good-day plan that slots comfort around the plan steps. Every pick explains which favorite it came from, and the full list of Qloo calls is visible on the page.
8. **A welcome-home card.** A shareable, re-skinnable card (dusk, paper, sunrise) with arrival soundtrack, first meal, first night in. It never shows health information.
9. **Privacy first.** Minimal data, consent switches with a consent log, JSON export, one-step delete, demo accounts that erase themselves.

## How Qloo is used safely

- Qloo receives only favorite entity IDs, a city point and generic tags (like vegetarian, delivery, quiet). Never a name, email, specialty, plan, check-in or warning sign.
- Taste data never infers a health condition and never feeds flags, plans or any eligibility decision. The clinician workspace never shows the patient's taste or comfort data.
- Results are labeled as aggregate taste affinity.
- Qloo responses are cached privately in Postgres and never committed or published raw.

## Stack

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Motion, PostgreSQL, zod, Argon2, Expo SDK 58 and React Native, Vitest, Jest, Playwright. See [architecture](docs/content/architecture.md).

## Docs

Everything lives in [docs/content](docs/content) and is published at https://docs.locicare.xyz:

- [architecture](docs/content/architecture.md), [API](docs/content/api.md), [mobile app](docs/content/mobile.md), [repository layout](docs/content/monorepo.md), [deploy](docs/content/deploy.md)
- [safe use](docs/content/safe-use.md), [privacy](docs/content/privacy.md), [research layer](docs/content/research.md), [how loci uses Qloo](docs/content/qloo.md)
- Hackathon write-ups: [Problem](docs/content/Loci-Qloo-Problem.md), [Solution](docs/content/Loci-Qloo-Solution.md), [Architecture](docs/content/Loci-Qloo-Architecture.md), [UI](docs/content/Loci-Qloo-UI.md)

Running and testing each part is described in its own README: [webapp](webapp/README.md), [landing](landing/README.md), [docs](docs/README.md), [mobile](mobile/README.md). The mobile API contract is [mobile-api.md](mobile-api.md).

## Contributing and security

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [code of conduct](CODE_OF_CONDUCT.md) first. Report security problems privately as described in [SECURITY.md](SECURITY.md). Notable changes are listed in [CHANGELOG.md](CHANGELOG.md).

Built for the Qloo hackathon "Agents, but with taste".

## License

[MIT](LICENSE) © 2026 Elvolution
