# Error Handling

## Patterns actually in the code
- **Unknown dynamic slug → 404:** dynamic routes call `notFound()` when a
  lookup fails (`treks/[slug]`, `tour-packages/[slug]`,
  `trips-near-nagpur/detail/[slug]`, `gallery/[slug]`, `upcoming-treks/[group]`).
- **404 UI:** `src/app/not-found.jsx` renders a branded 404 with a Home link.
- **Catch-all placeholder:** `src/app/[...slug]/page.jsx` renders a generic
  "page ready for content" screen for any unmatched path instead of erroring.
  This means broken nav links appear as placeholders, not 404s — see
  [KNOWN_ISSUES.md](KNOWN_ISSUES.md).
- **Legacy script/asset load failure:** `TemplateScripts.jsx` uses
  `s.onerror = load` — a failed script is skipped and the next one loads, so the
  page renders degraded rather than blank. Per-page `*Scripts.jsx` have no
  error handling (fire-and-forget).
- **Static galleries:** `gallery/[slug]` sets `dynamicParams=false`; requests
  for unlisted gallery slugs 404 at build/runtime.

## Not present
No `error.jsx`/`global-error.jsx` error boundaries, no logging/monitoring
(Sentry etc.), no try/catch around `fs.readFileSync` of `orig-*.html` (a missing
file would throw at build time — which is the desired fail-fast for a missing
content file).

## Guidance
- To add a runtime error boundary, use Next's `error.jsx` convention per segment.
- Keep `fs.readFileSync` un-caught: a missing `orig-*.html` SHOULD break the
  build so the omission is caught before deploy.
