# loci docs

The documentation site for loci. A standalone Next.js app that renders the Markdown in [`content/`](content) at build time, with a sidebar, a per-page table of contents and links between pages.

To add a page, put a `.md` file in `content/` and list it in `NAV` in `src/lib/docs.ts` (a unit test fails if a file is missing from the sidebar).

```bash
cp .env.example .env.local   # APP_URL, LANDING_URL, SITE_ORIGIN
npm ci
npm run dev                  # http://localhost:3771
npm run lint && npm run typecheck && npm test
npm run build && npm run test:e2e   # Playwright at 1440 and 390
```

Production: pm2 `loci-care-docs` on port 3770 behind nginx at https://docs.locicare.xyz.
