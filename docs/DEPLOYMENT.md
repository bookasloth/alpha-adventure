# Deployment

## Target
No CI/CD or platform config is committed (no `vercel.json`, no GitHub Actions,
no Dockerfile). `.gitignore` lists `.vercel` and `/out/`, indicating a
**Vercel-style Next.js deployment** is the intended path. Status: the exact host
is NEEDS VERIFICATION — treat Vercel as the assumed default.

## Build & run
```bash
npm ci          # install (uses package-lock.json)
npm run build   # next build
npm run start   # next start (production)
```
Standard Next.js 14 output. Middleware and `next.config.mjs` rewrites are
supported on Vercel/Node hosts. A pure static export (`output: 'export'`) is
**not** configured and would break the middleware rewrite.

## Hard runtime dependency
The deployed site depends on `https://alpha.thegreyhawks.com` for CSS, JS,
images and video at **runtime** (proxied/hot-linked). Deployment succeeds even
if that domain is down, but the live site renders unstyled/broken. See
[INTEGRATIONS.md](INTEGRATIONS.md) and [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

## Pre-deploy checklist
1. `npm run build` passes (catches missing `orig-*.html`, bad static params).
2. Confirm `alpha.thegreyhawks.com` asset paths still resolve.
3. Verify real contact/social URLs in `src/data/site.js` (currently placeholder
   social links).
4. Confirm legacy `.php` inbound links still route (middleware).

## Environment
No environment variables to configure — see
[ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md).
