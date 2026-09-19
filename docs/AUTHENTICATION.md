# Authentication & Authorization

## No authentication exists.
There is no login, session, cookie, token, middleware auth, or user store in
this repo (verified: no `process.env`, no auth libs, middleware only rewrites
`.php`). Every route is public and anonymous.

## `/user-dashboard` is a mock
`src/app/user-dashboard/page.jsx` injects `orig-dashboard.html` verbatim. It
**looks** like a logged-in dashboard but has no auth, no data binding, and no
protection. Do not treat it as a real account area or link real user data into
it without designing auth first.

## Authorization
No roles, permissions, or gated content. Nothing to check. If asked "what
happens when a user is unauthorized?" — the concept does not apply; there is no
protected resource.

## If auth is ever added
Record it as a decision in [DECISIONS.md](DECISIONS.md). Next.js middleware
(`src/middleware.js`) is the natural enforcement point, but note its current
`matcher` is scoped to `/gallery-detail.php` — broadening it affects the legacy
rewrite. See [ARCHITECTURE.md](ARCHITECTURE.md).
