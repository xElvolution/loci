# loci landing

The public marketing site for loci: the two audiences (clinicians and patients), the plan, follow, track, adjust loop, specialties, safety and pricing, plus a `/download` page for the web app, the Android test build and iOS status. A standalone Next.js app with no database and no secrets.

Every call to action opens the webapp (`APP_URL`): clinician sign-up and sign-in, patient sign-up, sign-in and redeem-a-code, and the demo. The "Live from Qloo" card is fetched at build and revalidation time from the webapp's public `GET /api/public/live-taste`; if the webapp is unreachable the card is simply left out.

```bash
cp .env.example .env.local   # APP_URL, DOCS_URL, SITE_ORIGIN
npm ci
npm run dev                  # http://localhost:3761
npm run lint && npm run typecheck && npm test
npm run build && npm run test:e2e   # Playwright at 1440 and 390
```

`APP_URL` and `DOCS_URL` are read when the page is rendered, so set them before `npm run build`.

The Android release shown on `/download` (version, file, size and SHA-256) lives in `src/lib/downloads.ts`. Update it whenever a new APK is published; unit tests check its shape.

Production: pm2 `loci-care-landing` on port 3760 behind nginx at https://locicare.xyz.
