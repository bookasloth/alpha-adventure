# Database

## There is no database.
No DB client, ORM, connection string, schema file, or migration exists in this
repo (verified: no `process.env` reads, no `prisma/`, no `drizzle`, no SQL).

**The "database" is a set of JavaScript modules in `src/data/`** that export
plain arrays/objects, imported directly at build time. Content is edited by
changing those files and rebuilding — there is no runtime data store.

See the actual content shapes and relationships in
[DATA_MODEL.md](DATA_MODEL.md).

## Decision guidance
- To add/edit content: edit `src/data/*.js` (Pattern A) or `orig-*.html`
  (Pattern B). Do **not** stand up a database for this.
- If a real DB/CMS is ever needed (e.g. the client's admin-backend requirement,
  see [KNOWN_ISSUES.md](KNOWN_ISSUES.md)), treat it as a new architectural
  decision and record it in [DECISIONS.md](DECISIONS.md). The natural seam is
  replacing the `src/data/*.js` exports with fetch/query functions of the same
  shape, so components stay unchanged.

## The live PHP origin
The site being mirrored (`alpha.thegreyhawks.com`) has its own backend and an
`/Admin/uploads/` path (proxied in `next.config.mjs`). That backend is **not
part of this repo** and is out of scope here. Status: NEEDS VERIFICATION for any
claim about it.
