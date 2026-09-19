# Documentation Index

Knowledge base for the Alpha Adventures site. Start with
[../CLAUDE.md](../CLAUDE.md) (operating manual), then dive into a topic.

## Read this first
- [../CLAUDE.md](../CLAUDE.md) — AI/dev operating manual, conventions, danger zones.
- [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) — what it is, who uses it, scope.
- [ARCHITECTURE.md](ARCHITECTURE.md) — the two rendering patterns + asset proxy.

## Structure & stack
- [TECH_STACK.md](TECH_STACK.md) — deps + legacy runtime libs.
- [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md) — where things live / where new
  things go.
- [UI_SYSTEM.md](UI_SYSTEM.md) — Tailwind tokens + legacy classes, reuse rules.

## Content & behaviour
- [DATA_MODEL.md](DATA_MODEL.md) — the `src/data/*` content model & relationships.
- [DATABASE.md](DATABASE.md) — (there is none; why, and the future seam).
- [BUSINESS_LOGIC.md](BUSINESS_LOGIC.md) — IF/THEN rules actually in code.
- [FEATURES.md](FEATURES.md) — features, flows, files.
- [ROUTES.md](ROUTES.md) — full route table + rewrites.

## Platform concerns
- [API_REFERENCE.md](API_REFERENCE.md) — (no app APIs; rewrites + data helpers).
- [INTEGRATIONS.md](INTEGRATIONS.md) — external asset domain, WhatsApp, socials.
- [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) — (none; hardcoded consts).
- [AUTHENTICATION.md](AUTHENTICATION.md) — (none; the dashboard is a mock).
- [AUTHORIZATION.md](AUTHORIZATION.md) — (not applicable).
- [SECURITY.md](SECURITY.md) — `dangerouslySetInnerHTML` rules, secrets, forms.
- [ERROR_HANDLING.md](ERROR_HANDLING.md) — 404s, `notFound()`, script failures.
- [PERFORMANCE.md](PERFORMANCE.md) — SSG + heavy legacy runtime.

## Working on it
- [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) — setup, commands, tasks.
- [TESTING.md](TESTING.md) — (none configured; where to start).
- [DEPLOYMENT.md](DEPLOYMENT.md) — build/run, Vercel assumption, checklist.
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — symptom → cause → fix.
- [KNOWN_ISSUES.md](KNOWN_ISSUES.md) — real issues + technical debt.
- [DECISIONS.md](DECISIONS.md) — why the project is the way it is.
- [CHANGELOG.md](CHANGELOG.md) — notable changes.

## Conventions for editing these docs
- One source of truth per concept; cross-link rather than duplicate.
- Anything not established from code is marked **NEEDS VERIFICATION**.
- Every doc should reduce a future decision — no textbook filler.

## Topics deliberately NOT given their own file (absent in this repo)
Payments, webhooks, cron/queues, notifications/email/SMS, file-storage service,
caching layer, rate limiting, analytics, admin system. Their absence and the
"if added" guidance are covered in [BUSINESS_LOGIC.md](BUSINESS_LOGIC.md),
[INTEGRATIONS.md](INTEGRATIONS.md), [KNOWN_ISSUES.md](KNOWN_ISSUES.md) and
[DECISIONS.md](DECISIONS.md).
