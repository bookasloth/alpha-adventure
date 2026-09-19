# Changelog

Format: reverse-chronological. Only records established from the repository.

## [Unreleased]
- Added `/docs` knowledge base and root `CLAUDE.md` (documentation-only; no
  application behaviour changed).

## 1.0.0 — Initial commit
- Alpha Adventures marketing site on Next.js 14 (App Router), React 18, Tailwind.
- Static rebuild of the live PHP site `alpha.thegreyhawks.com`, reusing its
  assets via proxy/hot-link.
- Two rendering patterns: React data-driven (treks/tours/gallery) and verbatim
  legacy HTML injection (content/policy pages).
- Legacy `.php` URL rewrite via middleware.
- Single git commit: `609666b Initial commit: Alpha Adventures Next.js site`.

> Keep this file updated on notable changes. Detailed rationale goes in
> [DECISIONS.md](DECISIONS.md).
