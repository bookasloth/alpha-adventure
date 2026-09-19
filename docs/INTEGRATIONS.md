# Integrations

## 1. Live asset/source domain — `alpha.thegreyhawks.com` (CRITICAL)
The single most important external dependency. The rebuilt site does not bundle
its own template assets; it pulls them from the live PHP site.

- **CSS/JS/video** proxied via `next.config.mjs` rewrite: `/assets/:path*` →
  `https://alpha.thegreyhawks.com/assets/:path*`. Loaded by `layout.jsx`
  (`<link>`s) and `TemplateScripts.jsx` (`<script>`s).
- **Images** hot-linked directly through `img()` (`src/lib/assets.js`,
  `IMG_BASE = https://alpha.thegreyhawks.com/assets/img`). Also allowed in
  `next.config.mjs` `images.remotePatterns`.
- **Uploads** proxied: `/Admin/uploads/:path*` → live domain.
- **Hero video** hardcoded to the live domain in `components/home/Hero.jsx:12`.

**Impact:** if that domain is down, moved, or its asset paths change, this site
loses styling, scripts and images. See [KNOWN_ISSUES.md](KNOWN_ISSUES.md).
**To self-host:** download assets into `public/`, switch `IMG_BASE` to
`/assets/img`, drop the rewrites, and update the Hero video URL.

## 2. WhatsApp / phone (enquiry channel)
Not an API — plain links from `src/data/site.js`: `whatsapp: wa.me/918180001597`,
`phone: +91 8180001597`, `email: info@alphaadventures.in`. CTAs across the site
point here (e.g. tour detail "Book / Enquire"). This is the de-facto "booking"
integration.

## 3. Social links
Placeholder URLs in `site.social` (facebook/youtube/instagram point to root
domains) — NEEDS VERIFICATION / real handles before launch.

## Absent integrations
No payment gateway, no email/SMS/WhatsApp Business API, no analytics, no CMS, no
maps API, no webhooks, no cron/queue services. Do not assume any exist.

## Failure handling
Asset/script load failures are swallowed by the loader (`s.onerror = load` in
`TemplateScripts.jsx`) so the page still renders, but degraded. See
[ERROR_HANDLING.md](ERROR_HANDLING.md).
