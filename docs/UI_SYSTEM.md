# UI System

Two visual layers coexist. Know which you're in.

## Layer 1 — Tailwind (Pattern A / new React UI)
Tokens in `tailwind.config.js` (`content` scans `src/**`):

| Token | Value | Use |
|---|---|---|
| `primary` | `#fe5100` (light `#ff7a33`, dark `#d85d0b`) | brand orange, buttons |
| `accent` | `#FFB52A` | highlights/badges |
| `dark` / `ink` | `#110F0F` | text, dark sections |
| `page` | `#f6f8fc` | page background |
| `line` | `#E8E8E8` | borders |
| font `sans`/`heading` | `var(--font-poppins)` → system fallback | all text |
| shadow `card`,`soft` · radius `xl2` (1.25rem) | | cards |
| bg `hero-pattern`, `btn-gradient` | gradients | hero overlays, buttons |

Global styles + custom classes: `src/app/globals.css`.

## Layer 2 — Legacy template CSS (Pattern B + shared classes)
Class names like `btn-primary`, `btn-dark`, `card`, `section`, `section-title`,
`container-px`, `filter-wrapper`, `tt-magic-cursor`, `gd-*` (gallery-detail)
come from the legacy stylesheets — mostly served from the live domain
(`style.css`, `search.css`, `card-custom.css`, etc., listed in `layout.jsx`),
with a few local copies in `public/css/`. React components in Pattern A **reuse
these legacy classes** alongside Tailwind (e.g. `btn-primary`, `card`,
`section-title` used in `tour-packages/[slug]/page.jsx` and `not-found.jsx`).

## Reusable React components
- `ui/SectionHeading.jsx`, `ui/TourCard.jsx`, `ui/TrekCard.jsx` — atoms; reuse
  before making new ones.
- `layout/PageHero.jsx` — standard page header (`title`, `crumb`, `subtitle`).
- `home/*` — full-width homepage sections.

## Decision-reducing rules
- New button? Use `btn-primary` / `btn-dark` (existing classes) before styling a
  new one.
- New card? Use the `card` class + `ui/TrekCard`/`ui/TourCard` patterns.
- New listing? Reuse `TrekGrid` / `TrekGroupSections`.
- New colors? Add to `tailwind.config.js` tokens, don't inline hex.
- Interactive legacy widgets (carousels, lightbox, counters, scroll anims) are
  driven by the already-loaded libs (Swiper/Slick/Fancybox/GSAP/WOW/CounterUp) —
  reuse their markup conventions rather than adding new libraries. See
  [TECH_STACK.md](TECH_STACK.md), [PERFORMANCE.md](PERFORMANCE.md).
