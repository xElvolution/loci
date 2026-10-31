# Deploy

loci runs as three separate processes on one VPS, each behind its own nginx site and Let's Encrypt certificate.

| Part | URL | Code | pm2 | Port |
| --- | --- | --- | --- | --- |
| webapp | https://app.locicare.xyz | `/opt/loci-care` | `loci-care` | 3750 |
| landing | https://locicare.xyz | `/opt/loci-care-landing` | `loci-care-landing` | 3760 |
| docs | https://docs.locicare.xyz | `/opt/loci-care-docs` | `loci-care-docs` | 3770 |

All three listen on 127.0.0.1 only. nginx terminates TLS and redirects HTTP to HTTPS.

## webapp

- Env: `/opt/loci-care/.env.production`, owner root, mode 600: `NODE_ENV`, `PORT`, `DATABASE_URL`, `APP_ORIGIN`, `QLOO_API_KEY`, `LANDING_URL`, `DOCS_URL`. Never commit or print it.
- Database: PostgreSQL 16 or later, reached through `DATABASE_URL` with a dedicated least-privilege role. Migrations run with `npx tsx scripts/migrate.ts`.
- nginx: `/etc/nginx/sites-available/loci-care`.

## landing and docs

- No database and no secrets. Env files hold only the public URLs of the other parts (`APP_URL`, `DOCS_URL`, `LANDING_URL`, `SITE_ORIGIN`).
- nginx: `/etc/nginx/sites-available/loci-care-landing` and `loci-care-docs`.

## Redeploy one part (staged, with a rollback copy)

```bash
PART=webapp                     # or landing, docs
git archive --format=tar.gz -o /tmp/$PART.tgz HEAD:$PART
scp /tmp/$PART.tgz deploy@your-server:/tmp/
# on the host: build in a staging folder, keep the previous release, then swap
rm -rf /tmp/$PART-build && mkdir /tmp/$PART-build && tar xzf /tmp/$PART.tgz -C /tmp/$PART-build
cd /tmp/$PART-build && npm ci && set -a && . /opt/<dir>/.env.production && set +a && npm run build
#   webapp only: npx tsx scripts/migrate.ts
rm -rf /root/<dir>-prev && cp -a /opt/<dir> /root/<dir>-prev
rsync -a --delete --exclude .env.production /tmp/$PART-build/ /opt/<dir>/ && pm2 restart <pm2 name> --update-env
```

Health: `GET /api/health` on the webapp returns `{ ok, db, qloo }`. Landing and docs return 200 on `/`.
