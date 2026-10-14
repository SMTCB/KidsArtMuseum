---
title: Decision Log (ADR Index)
status: canonical
owner: SMTCB
last_reviewed: 2026-10-14
review_cycle: 90d
related: [docs/DOCUMENTATION_GUIDE.md, docs/product/PLAN.md]
---

# Decision Log

Every choice that is expensive to reverse. Numbered, dated, immutable — see
`DOCUMENTATION_GUIDE.md` §1 Rule 3 for the rules.

**2026-08-22 was a decision day.** ADR-0004 chose the destination (venture-scale SaaS) and five
ADRs followed from it. Three of those five are still proposed, and
[`product/PLAN.md`](../product/PLAN.md) §3 assumes their recommended options — so closing them
is Sprint 1 work, not paperwork.

## Open — need a call

| # | Decision | Blocks | Note |
|---|---|---|---|
| [0011](0011-platform-rebuild.md) | Rebuild on Next.js + Supabase, or extend the prototype? | **All of Sprints 2–4** | **Deferred by [0017](0017-stay-static-for-now.md) on 2026-10-14**: reopen when a second real family asks, or the museum goes public. Until then no Sprint 2-4 work. (Original: recommends Option B, rebuild and port the 36-effect library.) |
| [0014](0014-childrens-data.md) | What may the platform store about a child? | **The schema (MUS-01)** | **The one that matters most.** A schema is a privacy decision whether or not you make it deliberately. Recommends Option B: children are attributes of the family account. |
| [0013](0013-language-strategy.md) | PT-PT only, or multilingual architecture? | The schema, and every UI string | Must be settled before the schema is fixed. Recommends Option B: build multilingual, launch Portuguese. |
| [0006](0006-when-to-introduce-a-database.md) | When does GitHub stop being the catalogue? | Multi-family | **Effectively answered by 0011** — a rebuild brings Postgres with it. Close this formally when 0011 is decided. |
| [0007](0007-audio-discovery-dots.md) | Record the child's actual voice? | Sprint 6 scope | **Has a clock.** The children are 4, 7, 7 — value decays with delay, whether or not the platform ships. |
| [0008](0008-build-step.md) | Introduce a build step, or keep in-browser Babel? | Page-load performance | **Effectively answered by 0011** — Next.js *is* a build step. Close it formally when 0011 is decided; it stays live only while the prototype does. |
| [0009](0009-approval-step-in-automated-upload.md) | Does auto-generated content go live without review? | UPL-08 | Sprint 5. |

## Accepted

| # | Decision | Date |
|---|---|---|
| [0001](0001-static-first-architecture.md) | Static-first architecture, no backend until proven necessary | May 2026 |
| [0002](0002-portuguese-only-ui.md) | Portuguese (PT-PT) is the product, not a localisation | May 2026 |
| [0003](0003-github-as-source-of-truth.md) | GitHub is the source of truth for artwork data | May 2026 |
| [0004](0004-product-ambition.md) | **Venture-scale SaaS** (Option B). fmb.art is reclassified as a validated prototype, not v1. | 2026-08-22 |
| [0010](0010-visual-identity-direction.md) | **Direção A for the museum, Direção C for the product.** Artwork is always framed in A, inside C chrome. | 2026-08-22 |
| [0012](0012-ai-cost-floor.md) | **Nothing ships that we could not afford at 10,000 subscribers.** Deterministic first; all inference behind one port; Claude API for internal tooling only. | 2026-08-22 |
| [0017](0017-stay-static-for-now.md) | **Stay static for now; improve in layers; defer the rebuild.** ADR-0011 stays proposed, reopened on a trigger (second real family, or public launch). | 2026-10-14 |
| [0016](0016-asset-layout.md) | **One folder per artwork** (`assets/art/<id>/`: photo, audio, reference, parts). | 2026-10-14 |
| [0015](0015-prototype-comments-backend.md) | **A minimal comments backend for the prototype** (Vercel Function + Upstash). Exception to 0001, scoped to the prototype. | 2026-10-13 |

## Superseded

| # | Decision | Superseded by |
|---|---|---|
| [0005](0005-vision-model-provider.md) | Claude API or self-hosted fine-tuned LLaVA? | [0012](0012-ai-cost-floor.md) — the question was reframed from *which provider* to *what per-artwork budget the business can sustain forever*. Self-hosting is not rejected; it becomes one adapter behind a port. |

ADR-0011, if accepted, puts two more on a supersede path: [0001](0001-static-first-architecture.md)
(static-first — still correct *for the prototype*) and [0003](0003-github-as-source-of-truth.md)
(GitHub as the catalogue). [0002](0002-portuguese-only-ui.md) is **scoped rather than
superseded** by [0013](0013-language-strategy.md): Portuguese remains the product; only the
architecture stops assuming it. When any of these change, it happens in a new ADR, not an edit.

## Not a decision — a gap

ADR-0004 chose the destination, not the route. **Target market, wedge, pricing rationale, and
go-to-market are not written down anywhere in this repo.** That is **STR-05** in
[`PLAN.md`](../product/PLAN.md), scheduled in Sprint 1, and Horizon 5 cannot be sequenced
without it. [`PLATFORM_DEFINITION.md`](../product/PLATFORM_DEFINITION.md) exists so the
competitive half of that work (**STR-08**) can be run cold, in a fresh session.

---

## Adding one

```bash
cp docs/decisions/ADR-TEMPLATE.md docs/decisions/0015-your-decision.md
```

Number sequentially, never reuse. Add a row above. Start as `proposed`; move to `accepted`
when the call is made, recording who made it and when.

To change a decided ADR: **write a new one that supersedes it.** Do not edit the original.
