# Security

## Primary risk surface: `dangerouslySetInnerHTML`
Pattern B pages inject raw HTML with `dangerouslySetInnerHTML`, and
`*Scripts.jsx` components append raw `<script>` text to the DOM. Locations:
- `SiteHeader.jsx`, `SiteFooter.jsx` (topbar/header/footer HTML)
- every Pattern B `page.jsx` (`about-us`, `contact`, `user-dashboard`, `gallery`,
  `gallery/[slug]`, `shop`, programmes, guides, policies, flagship detail pages)
- `AboutScripts.jsx` etc. run `initCode` via `document.createElement("script")`.

**This is safe today only because every input is static and author-controlled**
(local `orig-*.html` files and code-generated HTML from `galleryDetailHtml.js`).

### Hard rules
1. NEVER pass user input, query params, request headers, cookies, or
   fetched/remote content into `dangerouslySetInnerHTML` or into a `*Scripts`
   `initCode` string. That would be a direct XSS.
2. When editing `orig-*.html` or `galleryDetailHtml.js`, keep values literal.
   `galleryDetailHtml()` interpolates `page.*` fields (title, alt, src) into
   HTML **without escaping** — those fields must stay trusted/static.
3. Treat `src/data/*` as trusted code, not user data.

## Transport / assets
Assets and images come from `https://alpha.thegreyhawks.com` over HTTPS. Because
scripts are loaded from an external domain at runtime, the site's integrity
depends on that domain not being compromised. No Subresource Integrity (SRI) is
used. See [INTEGRATIONS.md](INTEGRATIONS.md).

## Secrets
None in the repo (no env vars, no keys). Keep it that way — see
[ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md).

## Forms
The contact form is legacy HTML (`orig-contact.html`); its submit target/handler
is NEEDS VERIFICATION. If it POSTs to the live PHP backend, validation/anti-spam
lives there, not here. The homepage search form does `preventDefault()` (no
network).

## Not present
No auth/session to protect, no CSRF surface in-repo, no file uploads handled
here, no rate limiting (nothing to rate-limit). See
[AUTHENTICATION.md](AUTHENTICATION.md).
