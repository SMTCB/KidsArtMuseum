---
title: "ADR-0002: Portuguese (PT-PT) is the product, not a localisation"
status: accepted
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: none
related: [ART_GUIDE.md]
---

# ADR-0002: Portuguese (PT-PT) is the product, not a localisation

- **Status:** Accepted (recorded retroactively 2026-08-22)
- **Decided:** May 2026, SMTCB

## Context

The museum is for three Portuguese children. The child's own words appear in the discovery
dots and the signature line. Translating that is not localisation — it is replacing the
artist's voice.

## Decision

All UI copy is PT-PT. There is no i18n layer and no English fallback. If the product ever
internationalises, PT-PT remains the default rather than becoming a translation target.

## Consequences

Copy stays direct and unwrapped — no string tables, no interpolation gymnastics. The cost
arrives at Phase 3: a multi-family or school product outside Portugal needs i18n retrofitted
into a codebase with hardcoded strings everywhere. That is a known, accepted debt.

## Revisit when

A non-Portuguese-speaking family or school is a real prospect, not a hypothesis.
