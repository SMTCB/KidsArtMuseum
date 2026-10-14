---
title: Documentation Index
status: canonical
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: 90d
related: [docs/DOCUMENTATION_GUIDE.md]
---

# Documentation Index

Everything written down about FMB · ART. **A document not listed here does not exist** —
see [`DOCUMENTATION_GUIDE.md`](DOCUMENTATION_GUIDE.md) §6.

Run `node scripts/docs-lint.js` to verify this index and every document's front-matter.

---

## Start here

| Doc | What it answers |
|---|---|
| [`product/PLAN.md`](product/PLAN.md) | **Where are we, what's the full backlog, and what's in this sprint?** |
| [`product/PLATFORM_DEFINITION.md`](product/PLATFORM_DEFINITION.md) | What is the product we're building, and for whom? |
| [`decisions/README.md`](decisions/README.md) | What's blocked on a decision? |
| [`design/IDENTITY.md`](design/IDENTITY.md) | What does it look like, and why two registers? |
| [`engineering/ARCHITECTURE.md`](engineering/ARCHITECTURE.md) | How does it actually work today? |

**Coming back after a break?** Read `product/PLAN.md` §1–3, then `decisions/README.md`.

As of 2026-08-22 the shape of the project changed. [ADR-0004](decisions/0004-product-ambition.md)
decided that FMB · ART is going after a SaaS, and the live site is reclassified as a validated
prototype rather than a v1. Five new ADRs followed the same day
([0010](decisions/0010-visual-identity-direction.md)–[0014](decisions/0014-childrens-data.md)),
covering the visual identity, a platform rebuild, the AI cost floor, language, and children's
data. **Three of them are proposed and unconfirmed, and `PLAN.md` assumes their recommended
options** — see PLAN §3. The three planning documents (ROADMAP, BACKLOG, SPRINTS) were merged
into `PLAN.md` and archived.

The largest gap is still not a decision: the strategy behind the SaaS choice is not written
down anywhere (**STR-05**).

---

## Product

| Doc | Status | Purpose |
|---|---|---|
| [PLAN.md](product/PLAN.md) | `canonical` | **The single planning document.** Horizons, every work item with a stable ID, and the sprint schedule. Replaces ROADMAP + BACKLOG + SPRINTS. |
| [PLATFORM_DEFINITION.md](product/PLATFORM_DEFINITION.md) | `canonical` | What the platform is, who it's for, the business model, and what's unknown. Self-contained — written to be read cold. |
| [SCREENS.md](product/SCREENS.md) | `reference` | All 56 screens the product has (8) or might have (48). |

## Decisions

| Doc | Status | Purpose |
|---|---|---|
| [decisions/README.md](decisions/README.md) | `canonical` | The decision log. **6 open, 7 accepted, 2 superseded.** |
| [ADR-TEMPLATE.md](decisions/ADR-TEMPLATE.md) | — | Copy this to start a new one. |

## Design

| Doc | Status | Purpose |
|---|---|---|
| [IDENTITY.md](design/IDENTITY.md) | `canonical` | **The design language.** Direção A for the museum, Direção C for the product, and where they meet. |
| [TEMPLATE_COMPOSITION_STRATEGY.md](design/TEMPLATE_COMPOSITION_STRATEGY.md) | `reference` | Scaling animation variety without a templated feel. |
| [AUDIO_AND_COMMENTS.md](design/AUDIO_AND_COMMENTS.md) | `draft` | Design and plan for the prototype's audio description and visitor comments (AUD-06, SHR-09). |
| [ARTWORK_ANIMATION.md](design/ARTWORK_ANIMATION.md) | `draft` | Principles and technical contract for animations that belong to one drawing, not a filter (MUS-16, MUS-17). |

The raw redesign delivery lives in `design/FMB_IDENTITY_REDESIGN_V1.0/` — HTML comps and CSS,
not a system. `IDENTITY.md` is what it means; **DES-01** is what turns it into tokens.

## Engineering

| Doc | Status | Purpose |
|---|---|---|
| [ARCHITECTURE.md](engineering/ARCHITECTURE.md) | `canonical` | **What runs today.** Verified, not inferred. |
| [TARGET_ARCHITECTURE.md](engineering/TARGET_ARCHITECTURE.md) | `reference` | A *proposed* Supabase + self-hosted-model future. Not built. Predates ADR-0011 and ADR-0012. |
| [UPLOAD_FLOW_AND_STORAGE.md](engineering/UPLOAD_FLOW_AND_STORAGE.md) | `reference` | Audio dots (§1) and upload flow (§2). Most actionable of the three. |
| [API_COSTS_AND_DATA_FLOW.md](engineering/API_COSTS_AND_DATA_FLOW.md) | `reference` | Costing and data flow for the proposed backend. Its numbers are subject to [ADR-0012](decisions/0012-ai-cost-floor.md). |
| [FINE_TUNING_STRATEGY.md](engineering/FINE_TUNING_STRATEGY.md) | `reference` | LLaVA + LoRA plan. Written for ADR-0005, which is superseded; survives as one candidate adapter under ADR-0012. |

## Archive

Superseded, kept with tombstones. **Do not plan from these.**

| Doc | Replaced by |
|---|---|
| [ROADMAP-2026-08-22.md](archive/ROADMAP-2026-08-22.md) | `product/PLAN.md` |
| [BACKLOG-2026-08-22.md](archive/BACKLOG-2026-08-22.md) | `product/PLAN.md` |
| [SPRINTS-2026-08-22.md](archive/SPRINTS-2026-08-22.md) | `product/PLAN.md` |
| [BUSINESS_OVERVIEW-2026-08-22.md](archive/BUSINESS_OVERVIEW-2026-08-22.md) | `product/PLATFORM_DEFINITION.md` |
| [ROADMAP-static-phase.md](archive/ROADMAP-static-phase.md) | `product/PLAN.md` |
| [product_roadmap-2026-05-29.txt](archive/product_roadmap-2026-05-29.txt) | `product/PLAN.md` |
| [proj_eval-2026-05-29.txt](archive/proj_eval-2026-05-29.txt) | Reference only — external opinion |
| [Platform_High_Level_Overview-2026-07-08.txt](archive/Platform_High_Level_Overview-2026-07-08.txt) | `product/SCREENS.md` |

---

## Lives at the repo root, not here

Operating instructions rather than documentation — they are what a newcomer hits first, and
`CLAUDE.md` must be at the root to load automatically.

| Doc | Purpose |
|---|---|
| [`../CLAUDE.md`](../CLAUDE.md) | Operating procedure for Claude Code. **Binding.** |
| [`../ART_GUIDE.md`](../ART_GUIDE.md) | Visual identity and artwork schema for the *prototype*. **Binding until DES-01 and DES-07.** |
| [`../README.md`](../README.md) | Repo orientation, local preview, deploy. |
| [`../intake/README.md`](../intake/README.md) | How a parent submits a new piece (PT-PT). |

---

## Maintaining this

The rules are in [`DOCUMENTATION_GUIDE.md`](DOCUMENTATION_GUIDE.md). The short version:

- One canonical doc per topic; everything else links rather than restates.
- Every doc carries front-matter with a status and a review date.
- Decisions become ADRs. Changing your mind means a *new* ADR, not an edit.
- Archive with a tombstone; never delete.
- `node scripts/docs-lint.js` enforces all of the above.
