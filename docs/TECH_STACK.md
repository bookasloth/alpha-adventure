# Tech Stack

Source of truth: `package.json`, `package-lock.json`, `jsconfig.json`,
`tailwind.config.js`, `postcss.config.js`.

## Runtime / framework
| Package | Version | Role |
|---|---|---|
| next | ^14.2.35 | App Router framework, SSG, middleware, rewrites |
| react | 18.3.1 | UI |
| react-dom | 18.3.1 | UI |

## Build / styling (devDependencies)
| Package | Version | Role |
|---|---|---|
| tailwindcss | 3.4.14 | Utility CSS for Pattern A components |
| postcss | 8.4.47 | CSS pipeline (`postcss.config.js`) |
| autoprefixer | 10.4.20 | Vendor prefixes |

## Language & config
- **JavaScript only** — `.js` / `.jsx`, no TypeScript. `jsconfig.json` sets
  `strict: false`, `allowJs`, `@/*` → `./src/*`.
- Tailwind theme tokens defined in `tailwind.config.js` (see [UI_SYSTEM.md](UI_SYSTEM.md)).
- Global CSS: `src/app/globals.css` (Tailwind layers) + legacy stylesheets under
  `public/css/` and (mostly) the proxied live domain.

## Legacy client runtime (NOT npm deps)
Loaded at runtime from `/assets/js/*` (proxied to live domain) by
`src/components/TemplateScripts.jsx`, in this order:
jQuery 3.7.1, jQuery-UI, moment, daterangepicker, Bootstrap, Popper, Swiper,
Slick, Waypoints, CounterUp, WOW, GSAP + ScrollTrigger, Fancybox,
select-dropdown, custom.js, search-bar.js.

These are **not** in `package.json` and are **not** version-pinned in this repo —
they are whatever the live domain currently serves. See
[KNOWN_ISSUES.md](KNOWN_ISSUES.md).

## Decision-reducing notes
- Need animation? GSAP/ScrollTrigger and WOW are already loaded globally — reuse
  them via legacy patterns rather than adding an npm animation lib.
- Need a carousel/lightbox? Swiper, Slick and Fancybox are already present.
- Need date UI? moment + daterangepicker already present.
- Don't add TypeScript, a DB client, or a data-fetching lib without an explicit
  decision — the project is deliberately dependency-light (see
  [DECISIONS.md](DECISIONS.md)).
