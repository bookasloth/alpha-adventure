# Performance

## Current characteristics
- **SSG:** most routes are statically generated (`generateStaticParams`,
  `dynamicParams=false` for galleries), so pages serve fast from the edge/CDN.
- **Heavy legacy runtime:** `TemplateScripts.jsx` loads ~17 JS files (jQuery,
  jQuery-UI, Bootstrap, Swiper, Slick, GSAP+ScrollTrigger, Fancybox, moment,
  daterangepicker, etc.) sequentially at runtime from the external domain. This
  is the main performance cost and is a **third-party/off-domain** dependency.
- **Images hot-linked** from `alpha.thegreyhawks.com` — no local optimization;
  `next/image` optimization is limited to the allowed remote pattern and most
  images use plain `<img>`/CSS backgrounds, not `next/image`.

## Decision-reducing guidance
- The legacy bundle is loaded once, guarded by `window.__templateScriptsStarted`
  — do not duplicate loaders or import these libs via npm; reuse the globals.
- Prefer Tailwind/React (Pattern A) for new UI to avoid adding to the legacy
  runtime weight.
- If Core Web Vitals matter for launch, the highest-leverage wins are:
  self-host + minify the legacy JS/CSS, lazy-load Fancybox/Slick only where used,
  and move images to `next/image` or a real CDN with sizing.
- Fonts: Poppins is referenced via a CSS var (`--font-poppins` in
  `tailwind.config.js`); confirm it's actually loaded (NEEDS VERIFICATION —
  no `next/font` usage found).

## Not measured
No performance budget, Lighthouse config, or monitoring exists in-repo. Claims
above are structural, not benchmarked.
