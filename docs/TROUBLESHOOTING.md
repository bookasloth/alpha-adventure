# Troubleshooting

Problems supported by repo evidence, with fixes.

## Site loads unstyled / no images / broken carousels
- **Cause:** `alpha.thegreyhawks.com` unreachable or asset paths changed — CSS,
  JS and images all come from there ([INTEGRATIONS.md](INTEGRATIONS.md)).
- **Check:** open a failing `/assets/...` or `assets/img/...` URL directly;
  check the Network tab for 4xx/5xx on the proxied host.
- **Fix:** restore the domain, or self-host assets and repoint `IMG_BASE` +
  rewrites.

## Interactive widgets dead (mega-menu, lightbox, counters, animations)
- **Cause:** legacy JS failed to load or loaded out of order. `TemplateScripts`
  loads jQuery first, then the rest; a network failure is skipped silently.
- **Check:** console for "$ is not defined" / missing plugin errors; confirm
  each file in `TemplateScripts.jsx`'s list returned 200.
- **Fix:** ensure the asset host serves them; don't reorder the load list
  (jQuery must precede jQuery-dependent plugins).

## `npm run build` fails: `ENOENT ... orig-*.html`
- **Cause:** a Pattern B page references an `orig-*.html` or `*-init.js` that was
  moved/renamed/deleted. `fs.readFileSync` runs at build (module scope).
- **Fix:** restore the file in `src/data/` with the exact name used in the page.

## A new trek/tour 404s on its detail page
- **Cause:** it isn't in the data array, or its `slug` is wrong, or (for
  near-Nagpur) `group !== "near-nagpur"`, or it's in `STATIC_SLUGS`.
- **Fix:** confirm the object exists in `treks.js`/`tours.js` with a unique
  `slug`; rebuild (static params are generated at build). See
  [BUSINESS_LOGIC.md](BUSINESS_LOGIC.md).

## A gallery slug 404s
- **Cause:** `gallery/[slug]` has `dynamicParams=false`; only slugs in
  `gallery-details.js` build. **Fix:** add the page object there.

## A nav link shows a generic "page ready for content" screen
- **Cause:** the href has no real route and hit `[...slug]`. See
  [KNOWN_ISSUES.md](KNOWN_ISSUES.md) #3. **Fix:** correct the href in
  `src/data/site.js` or create the route.

## Editing legacy HTML broke behaviour (or vice-versa)
- **Cause:** markup and its `*-init.js` are coupled by CSS classes/IDs.
- **Fix:** keep selectors in sync; see [ARCHITECTURE.md](ARCHITECTURE.md) and
  [SECURITY.md](SECURITY.md).

## `npm run lint` asks to install ESLint
- **Cause:** ESLint config/deps not committed. Accept the install prompt or add
  `eslint` + `eslint-config-next`. See [TESTING.md](TESTING.md).

## Local dev port conflict
- `.claude/launch.json` uses `autoPort` from 3000; if 3000 is busy Next picks
  another port — read the dev output for the actual URL.
