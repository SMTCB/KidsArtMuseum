---
title: "ADR-0010: Visual identity — Direção A for the museum, Direção C for the product chrome"
status: accepted
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: none
related:
  - docs/decisions/0004-product-ambition.md
  - docs/design/IDENTITY.md
---

# ADR-0010: Visual identity — Direção A for the museum, Direção C for the product chrome

- **Status:** ✅ **ACCEPTED — the split**
- **Date raised:** 2026-08-22
- **Decided:** 2026-08-22 by SMTCB

## Context

`docs/design/FMB_IDENTITY_REDESIGN_V1.0/` (delivered 2026-08-22, produced in Claude Design)
defines two complete visual directions and draws every catalogued screen twice, once in each.
A third direction, B, was dropped before delivery; its CSS survives as 46 unused selectors.

**Direção A — Cubo Branco.** Warm off-white paper (`#FAF8F2`) on a soft grey wall (`#EEF0EA`).
Cormorant Garamond italic for titles, EB Garamond for body, JetBrains Mono for metadata.
Frames are physical: 7px oak, 4px black, 5px brass, 16px deep box. Stated principle: **no
accent colour anywhere** — colour belongs to the painting, never to the interface.

**Direção C — Corredor.** Cool wall (`#F1F2EF`), pure white artwork ground. One type family
(Inter), uppercase tracked titles. Frames reduced to a 1.5px hairline. Each artwork carries
its own accent colour as a small bar; a fixed system blue `#2A6FD8` handles links and buttons.

Two facts constrain the choice:

1. **The effect library is the product's differentiator.** 36 catalogued effects in
   `window.TEMPLATE_LIBRARY` — Kusama, Van Gogh, Rothko, Pollock — throw saturated colour
   across the whole viewport. Any chrome that also asserts colour will argue with them.
2. **The redesign covers 22 desktop / 20 mobile screens, all of them Live or Near-term.**
   There is not a single drawing for signup, account, pricing, billing, gallery management,
   or the museum-level view — which are exactly the surfaces ADR-0004 commits us to building.

## Options

### Option A — Direção A everywhere
Strongest identity, hardest to copy. But serif italic and brass frames on a VAT line or a
Stripe form read as costume, and there are no drawings for those screens in either direction.

### Option B — Direção C everywhere
Cheapest to build and already looks like a SaaS. But the per-artwork accent duplicates what
`art.palette` already derives from the painting, from the same source, and will occasionally
clash with a running effect. Loses the thing that made the prototype feel like a museum.

### Option C — Split by register *(chosen)*
Direção A is the identity for museum surfaces. Direção C's system is the chrome for product
surfaces. One brand, two registers — the gallery and the back office.

## Decision

**Direção A governs every surface where a child's artwork is present. Direção C's system
governs every surface where it is not.**

| Register | Direction | Surfaces |
|---|---|---|
| **Gallery** | Direção A — Cubo Branco | Hallway, exhibition view, discovery dots, Explore, visitor/shared view, print output, marketing hero |
| **Back office** | Direção C — Corredor | Signup, login, account, upload flow, gallery and room management, pricing, checkout, billing, settings, system states |

Where the two meet — an upload flow that ends by showing the finished piece, a management
list with thumbnails — **the artwork itself is always framed in A**, inside C chrome.

Direção C's **per-artwork accent bar is not adopted.** Its system blue `#2A6FD8` is adopted
for back-office interactive states only.

## Consequences

- The design tokens must be built as **two named themes over one token set**, not as two
  stylesheets. The delivered CSS is 251 hardcoded hex values under `.dir-a` / `.dir-c` /
  `.dir-b` with exactly one CSS variable — it is a comp, not a system, and cannot be shipped
  as-is. Tokenising it is real work: backlog **DES-01**.
- Rejecting the per-artwork accent keeps `art.palette` single-purpose (it feeds effects) and
  removes a clash risk with the effect library.
- Dropping direction B means its 46 selectors are dead code and must not be carried into the
  rebuild (**DES-02**).
- Roughly a third of the screens the platform needs have **no design at all**. The plan specs
  them as written acceptance criteria (**DES-08**); visual design for them is a separate
  commission against Direção C.
- Two type registers means two font loading budgets. Cormorant Garamond + EB Garamond +
  JetBrains Mono + Inter is four families. Subsetting is not optional (**QUA-08**).
- `ART_GUIDE.md` describes the *current* frame chrome and becomes wrong the moment DES-01
  lands. It must be rewritten against the tokens, not patched.

## Revisit when

A usability test shows visitors cannot tell the two registers belong to the same product, or
when a third register appears (a native app, an in-school display) that fits neither.
