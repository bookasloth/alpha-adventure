# Environment Variables

## None are used.
No `process.env` reads exist anywhere in `src/` or config files (verified by
grep). The project builds and runs with **zero environment configuration**.

`.gitignore` ignores `.env`, `.env*.local` and `.vercel` as a precaution, but no
`.env.example` exists and none is required today.

## Values that are hardcoded (would be env vars in a bigger app)
If you later externalise configuration, these are the constants to move:

| Constant | Current location | Purpose |
|---|---|---|
| Asset/source host | `src/lib/assets.js` (`IMG_BASE`), `next.config.mjs` (rewrites, remotePatterns), `components/home/Hero.jsx` | live CDN/proxy domain |
| Duplicate asset host | `components/treks/BackpackingTripsClient.jsx:38` | should reuse `assets.js` — see [KNOWN_ISSUES.md](KNOWN_ISSUES.md) |
| Contact details | `src/data/site.js` | email/phone/WhatsApp/social |

## Rule
Do not introduce env vars for values that never change per-environment. If you
add one, document its NAME, purpose, required/optional and an example format
here, and add it to `.env.example`. Never commit secrets.
