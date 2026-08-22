---
title: "ADR-0011: Rebuild the platform rather than extend the static prototype"
status: proposed
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: none
related:
  - docs/decisions/0001-static-first-architecture.md
  - docs/decisions/0004-product-ambition.md
  - docs/decisions/0006-when-to-introduce-a-database.md
  - docs/decisions/0008-build-step.md
  - docs/engineering/TARGET_ARCHITECTURE.md
---

# ADR-0011: Rebuild the platform rather than extend the static prototype

- **Status:** ⚠️ **PROPOSED — recommended Option B. `docs/product/PLAN.md` assumes it.**
- **Date raised:** 2026-08-22
- **Decided:** —

## Context

ADR-0004 committed to a multi-family SaaS. ADR-0010 committed to a two-register visual
identity that the current CSS cannot express. The product model the owner described on
2026-08-22 is museum logic, not a flat list:

```
Account (a family)
  └── Museum (one per account)
        └── Room (one per child)
              └── Gallery (a curated set — by age, by style, by year)
                    └── Artwork
```

A family may dump everything in one room, give each child a room, or run several galleries
for the same child. **Rooms and galleries are user-created and user-named.** Nothing in the
current codebase models any of this: `art-data.js` is a flat `window.ART` array plus a
`window.HALLWAY_ORDER` list of ids, edited by hand and committed to git (ADR-0003).

What exists today, verified:

| | |
|---|---|
| Runtime | React 18 + ReactDOM from unpkg, `@babel/standalone` transpiling 9 JSX files in the browser on every page load |
| State | Four global objects mutated in `index.html` script order; `gallery-core.jsx` must load last or it fails silently |
| Data | `art-data.js`, 11 artworks, hand-edited |
| Auth | None |
| Assets | 25 MB of full-resolution JPEGs served as thumbnails |
| **The asset worth keeping** | **36 effects in `window.TEMPLATE_LIBRARY`**, every one written to the same contract: a React component taking `{ art }` and reading only `art.src`, `art.palette`, `art.bg` |

That last row is the decisive fact. The effects were deliberately written to work on *any*
uploaded artwork, not on the eleven that exist. They are portable to any React runtime
essentially unchanged.

## Options

### Option A — Extend the prototype in place
Add a backend behind the existing static site: serverless functions, Supabase, auth bolted
on, `art-data.js` replaced by a fetch.

- **Pro:** no rewrite; the museum keeps running throughout.
- **Con:** in-browser Babel and global-mutation load order are not survivable in a product —
  no type checking, no tests, no code splitting, silent failure on a bad script order. Auth,
  row-level security, and per-account routing all have to be retrofitted onto a page that
  assumes one hardcoded catalogue. ADR-0008 (build step) has to be answered first anyway, and
  answering it *is* the rewrite of the load path.
- **Effort:** feels smaller, is not.

### Option B — Rebuild on Next.js + Supabase, harvest the effect library *(recommended)*
A new application. Next.js App Router + React 19, TypeScript, Tailwind with the ADR-0010
tokens, Supabase for Postgres + Auth + Storage + row-level security. The 36 effects are
ported as-is behind their existing `{ art }` contract. The 11 artworks are migrated as seed
data. `fmb.art` keeps serving the prototype until the rebuild replaces it.

- **Pro:** auth, RLS, and multi-tenancy are properties of the framework rather than
  retrofits. Type checking and tests become possible. Image derivatives, caching, and SEO for
  shared museum links come from the framework. The differentiator ports intact.
- **Con:** a build step and a real deployment pipeline to maintain. Supabase is a vendor
  dependency and a monthly bill from day one. Weeks of work before any visible new feature.
- **Effort:** Sprints 1–4 of `docs/product/PLAN.md` before feature parity with today.

### Option C — Rebuild on a different stack
Remix, SvelteKit, Rails, a Django monolith. All viable. None is better *here*: the effects
are React, the identity work is CSS-token-shaped, and the owner's own blueprint already
specifies Next.js + Supabase. Switching stacks would discard the one asset worth keeping.

## Decision

*Blank while proposed.* Recommended: **Option B.**

## Consequences (if Option B is accepted)

- **Answers ADR-0006.** The database arrives now, not at "the second family" — accounts are
  the product, and accounts need Postgres. ADR-0006 should be closed by this ADR.
- **Answers ADR-0008.** A build step exists. QUA-03 (remove in-browser Babel) stops being a
  task and becomes a property of the new app.
- **Puts ADR-0001 on a supersede path.** Static-first remains correct *for the prototype* and
  false for the platform. It is superseded by this ADR only for the new application; the
  prototype at `fmb.art` continues under ADR-0001 until it is retired.
- **Puts ADR-0003 on a supersede path.** GitHub stops being the artwork catalogue. It remains
  the source of truth for code.
- **The prototype must keep running.** It is the only place the family's eleven artworks live.
  It is not decommissioned until MUS-11 (data migration) is verified.
- A monthly bill appears before any revenue. Supabase free tier covers development; the paid
  tier (~$25/mo) arrives around the first real user, and storage egress is the variable line.
- Roughly 60% of the effort in Sprints 1–4 produces nothing a visitor can see. That is the
  honest cost of the decision and the reason this ADR exists rather than a silent migration.

## Revisit when

Sprint 4 closes without feature parity, or Supabase's pricing or data-residency terms change
in a way that matters for children's data (see ADR-0014).
