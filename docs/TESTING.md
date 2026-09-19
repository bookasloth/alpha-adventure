# Testing

## No test framework is configured.
`package.json` has no `test` script and no test runner (Jest/Vitest/Playwright/
Cypress) in dependencies. There are no `*.test.*` or `__tests__` files.

The only automated check available is:
```bash
npm run lint   # next lint (ESLint via Next.js)
```
> Note: `eslint` / `eslint-config-next` are not in `package.json` devDeps —
> `next lint` may prompt to install them on first run. NEEDS VERIFICATION.

## How changes are currently verified
Manually, in the browser (`npm run dev`), plus `npm run build` to catch build-
time errors (e.g. a missing `orig-*.html`, bad `generateStaticParams`).

## If you add tests
- Unit-test the pure data helpers first — they are the highest-value, lowest-
  effort targets: `getTrekBySlug`, `getTourBySlug`, `getGalleryPage`, `img()`,
  and the group/tag filtering logic in `upcoming-treks/[group]`.
- E2E (Playwright) is the right tool for the legacy jQuery behaviours (gallery
  lightbox, mega-menu, search widget) since they run in the browser.
- Record the choice in [DECISIONS.md](DECISIONS.md).
