# loci landing

The public marketing site for loci: the two audiences (clinicians and patients), the plan, follow, track, adjust loop, specialties, safety and pricing, plus `/download` (web app, Android test build, iOS status), `/terms`, `/security`, `/cookies` and `/contact`. A standalone Next.js app with no database and no secrets.

Every call to action ("Open the app" and "Sign in") opens the webapp's sign-in page (`SIGNIN_URL`, default `APP_URL` + `/app/signin`), which links to sign-up, redeeming a code and the clinician workspace. The "Live from Qloo" card is fetched at build and revalidation time from the webapp's public `GET /api/public/live-taste`; if the webapp is unreachable the card is simply left out.

```bash
cp .env.example .env.local   # APP_URL, SIGNIN_URL, DOCS_URL, SITE_ORIGIN
npm ci
npm run dev                  # http://localhost:3761
npm run lint && npm run typecheck && npm test
npm run build && npm run test:e2e   # Playwright at 1440, 390 and 360 (no horizontal overflow)
```

`APP_URL` and `DOCS_URL` are read when the page is rendered, so set them before `npm run build`.

The Android release shown on `/download` (version, file, size and SHA-256) lives in `src/lib/downloads.ts`. Update it whenever a new APK is published; unit tests check its shape.

Production: pm2 `loci-care-landing` on port 3760 behind nginx at https://locicare.xyz.
