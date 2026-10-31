# Contributing to loci

Thanks for helping people get home from hospital with less confusion and more care. This guide covers how the repository is organized, how to run each part and what a good pull request looks like.

## Ground rules

- **loci is not a medical device.** It never diagnoses, scores risk or gives medical advice. Every clinical word a patient sees comes from their care team's plan. Contributions that generate clinical content, infer health conditions or change escalation beyond the team's own rules will not be merged.
- **Privacy by default.** Collect the minimum, keep consent explicit and logged, and keep export and deletion working. Qloo receives only favorite entity IDs, a city point and generic tags, never health data.
- **No secrets or real data.** Never commit credentials, API keys, server addresses, Qloo responses or real patient information, including in tests, fixtures and screenshots. Configuration comes from environment variables documented in each part's `.env.example`.
- Be kind. This project follows the [code of conduct](CODE_OF_CONDUCT.md).

## Repository layout

| Part | What it is | Stack |
| --- | --- | --- |
| [`webapp/`](webapp) | Clinician workspace (`/clinic`), patient app (`/app`), HTTP API and Postgres | Next.js 16, React 19, PostgreSQL |
| [`landing/`](landing) | Public marketing site, static, no database or secrets | Next.js 16 |
| [`docs/`](docs) | Documentation site rendering [`docs/content`](docs/content) | Next.js 16 |
| [`mobile/`](mobile) | Patient and family app on the `/api/v1` API | Expo SDK 58, React Native |

Each part is standalone, with its own `package.json`, lockfile, tests and README. There is no root workspace, so run commands inside the part you are changing.

## Getting started

Requirements: Node.js 24 (20.9 or later works), npm, and PostgreSQL 16 or later for the webapp.

```bash
git clone https://github.com/xElvolution/loci.git
cd loci/webapp            # or landing, docs, mobile
cp .env.example .env.local
npm ci
npm run dev
```

See each part's README for its port, environment variables and end-to-end tests.

## Checks

Every part has the same three checks. Run them in each part you change before opening a pull request:

```bash
npm run lint
npm run typecheck
npm test
```

The web parts also have Playwright suites (`npm run test:e2e`) at 1440 and 390 wide that fail on console errors and horizontal overflow. Run them when you change UI.

## Commits and pull requests

- Branch from `main` and keep each pull request focused on one change.
- Use [Conventional Commits](https://www.conventionalcommits.org) scoped by part, for example `feat(webapp): outcome charts on the patient page`, `fix(mobile): keep the check-in draft after a 401`, `docs: explain the research export`, `ci: cache npm per part`.
- Fill in the pull request template, including screenshots at desktop and phone size for UI changes.
- Update the docs, the part's README, `.env.example` and [CHANGELOG.md](CHANGELOG.md) when behavior or configuration changes.
- Accessibility matters: keyboard reachable, labeled controls, visible focus, and reduced motion respected.

## Reporting bugs and ideas

Use the issue templates. For security problems, follow [SECURITY.md](SECURITY.md) and report privately.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
