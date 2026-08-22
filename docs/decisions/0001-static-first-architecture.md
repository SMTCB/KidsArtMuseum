---
title: "ADR-0001: Static-first architecture, no backend until proven necessary"
status: accepted
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: none
related: [docs/decisions/0006-when-to-introduce-a-database.md, docs/engineering/ARCHITECTURE.md]
---

# ADR-0001: Static-first architecture, no backend until proven necessary

- **Status:** Accepted (recorded retroactively 2026-08-22; decided at project start, May 2026)
- **Decided:** May 2026, SMTCB

## Context

The museum needed to exist before it needed to scale. A single family, ~11 artworks, a
handful of viewers. The alternative — starting with Next.js, Postgres, auth, and storage —
would have cost weeks before the first painting hung on a wall.

## Decision

Ship a static site: React via CDN, JSX transpiled in the browser, artwork data in a plain
JS file (`art-data.js`), photos in the repo, GitHub as source of truth, Vercel serving the
repo root. No server, no database, no build step.

## Consequences

**Gained:** $0/month running cost, zero deploy complexity, the entire catalogue readable
and diffable as source, and a working museum in days rather than weeks.

**Paid:** No multi-user anything. No auth. Photos bloat the git history (25 MB and
climbing). In-browser Babel costs ~200 ms on every page load. Adding art requires a
developer environment and Claude Code.

This was correct for Phase 0 and remains correct while the user count is one family. It
becomes wrong the moment a second family needs their own museum — see ADR-0006.

## Revisit when

A second family needs an isolated museum, or the intake pipeline must run without a
developer present.
