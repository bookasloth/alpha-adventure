# Routes

All routes are **public** (no auth). Pattern **A** = React/data-driven,
**B** = verbatim legacy HTML injection (see [ARCHITECTURE.md](ARCHITECTURE.md)).
Source: `src/app/**/page.jsx`.

| Route | Pattern | Purpose | Data / source | Notes |
|---|---|---|---|---|
| `/` | A | Homepage | `treks.js`, `tours.js`, `stories/testimonials/reasons/gallery.js` | `src/app/page.jsx` composes `components/home/*` |
| `/about-us` | B | About / Why Us | `orig-about-us.html` + `about-us-init.js` | |
| `/contact` | B | Contact / enquiry | `orig-contact.html` | Contact form is legacy markup — submit target NEEDS VERIFICATION |
| `/shop` | B | Merch/shop | `orig-shop.html` + `shop-init.js` | Static; no cart |
| `/corporate-programmes` | B | Corporate offering | `orig-corporate-programmes.html` | |
| `/student-programmes` | B | Student offering | `orig-student-programmes.html` | |
| `/travel-calendar` | B | Trek calendar | `orig-travel-calendar.html` + `travel-calendar-init.js` | Note: nav/footer link `/trek-calendar` does NOT exist (→ placeholder) |
| `/beginner-trek-guide` | B | Guide | `orig-beginner-trek-guide.html` + init | |
| `/fitness-requirements` | B | Guide | `orig-fitness-requirements.html` + init | |
| `/packing-checklist` | B | Guide | `orig-packing-checklist.html` + init | |
| `/responsible-travel` | B | Policy | `orig-responsible-travel.html` + init | |
| `/safety-guidelines` | B | Policy | `orig-safety-guidelines.html` + init | |
| `/cancellation-policy` | B | Policy | `orig-cancellation-policy.html` | |
| `/terms-and-conditions` | B | Policy | `orig-terms-and-conditions.html` | |
| `/user-dashboard` | B | **Static mock** dashboard | `orig-dashboard.html` + `dashboard-init.js` | NOT authenticated; not a real account area |
| `/gallery` | B | Gallery landing | `orig-gallery.html` + `gallery-init.js` | |
| `/gallery/[slug]` | B | Per-destination seasonal gallery | `gallery-details.js` → `galleryDetailHtml()` | `dynamicParams=false`; only listed slugs build |
| `/tour-packages` | A | Tour list | `tours.js` | |
| `/tour-packages/[slug]` | A | Tour detail | `getTourBySlug` | `generateStaticParams` from `tourPackages` |
| `/treks/upcoming-treks` | A | Grouped trek sections | `treks.js`, `trekGroups` | Sections: sahyadri/himalayan/central |
| `/treks/upcoming-treks/[group]` | A | Treks by group | `treks.js` | Maps `sahyadri-treks/himalayan-treks/central-india-treks`; special `weekend-treks` filter |
| `/treks/backpacking-trips` | A | Backpacking list | `treks.js` (group=backpacking) | `BackpackingTripsClient` (client) |
| `/treks/trips-near-nagpur` | A | Near-Nagpur list | `treks.js` (group=near-nagpur) | |
| `/treks/[slug]` | A | Trek detail | `getTrekBySlug` | `generateStaticParams` from `treks` |
| `/trips-near-nagpur/detail/[slug]` | A | Near-Nagpur trip detail | `getTrekBySlug` | Excludes `seven-sisters-hill-trek` (has own route) |
| `/trips-near-nagpur/detail/seven-sisters-hill-trek` | B | Flagship trip detail | `orig-trek-detail-seven-sisters.html` + init | |
| `/backpacking-trips/detail/spiti-backpacking-trip` | B | Flagship backpacking detail | `orig-trek-detail-spiti.html` + init | |
| `/[...slug]` | A | **Catch-all placeholder** | none | Titles from slug; used by unmatched nav/footer links |
| `not-found` | A | 404 | none | `src/app/not-found.jsx` |

## Legacy rewrite (middleware)
`/gallery-detail.php?slug=<known>` → `/gallery/<slug>` (else `/gallery`).
Matcher is scoped to `/gallery-detail.php` only. See
[BUSINESS_LOGIC.md](BUSINESS_LOGIC.md).

## Asset rewrites (`next.config.mjs`)
`/assets/:path*` and `/Admin/uploads/:path*` → `alpha.thegreyhawks.com`. These
are not pages but they must resolve for the site to render. See
[INTEGRATIONS.md](INTEGRATIONS.md).

## Access requirements
None — every route is anonymous/public. See
[AUTHORIZATION.md](AUTHORIZATION.md).
