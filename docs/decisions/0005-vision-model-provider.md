---
title: "ADR-0005: Vision model provider — Claude API vs self-hosted fine-tuned LLaVA"
status: superseded
superseded_by: docs/decisions/0012-ai-cost-floor.md
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: none
related:
  - docs/decisions/0004-product-ambition.md
  - docs/engineering/TARGET_ARCHITECTURE.md
  - docs/engineering/FINE_TUNING_STRATEGY.md
  - docs/design/TEMPLATE_COMPOSITION_STRATEGY.md
---

# ADR-0005: Vision model provider — Claude API vs self-hosted fine-tuned LLaVA

- **Status:** ⛔ **SUPERSEDED by [ADR-0012](0012-ai-cost-floor.md) on 2026-08-22.**
  The question was reframed: not *which provider*, but *what per-artwork budget the
  business can sustain forever*. Self-hosting is not rejected — it becomes one adapter
  behind a provider port. The context and cost analysis below remain valid input.
- **Date raised:** 2026-08-22
- **Decided:** —

## Context

Phase 2 automates what Claude Code does by hand today: look at a photo, produce a title,
palette, animation choice, and discovery dots as structured JSON. Two strategies are
documented in this repo, and they disagree by two orders of magnitude.

**The cost figures across our own docs do not reconcile:**

| Source | Per-artwork cost | Monthly infra |
|---|---|---|
| `ROADMAP-static-phase.md`, `BUSINESS_OVERVIEW.md` | $0.01–0.03 (Claude Sonnet) | $0 |
| `TEMPLATE_COMPOSITION_STRATEGY.md` | $0.40–0.45 ("LJM inference") | not stated |
| `TARGET_ARCHITECTURE.md` | $0 marginal | $450–700 (RunPod A40 + Supabase + Vercel) |

The $0.02 and $0.40 figures describe the same pipeline step and cannot both be right.
Reconciling them is a prerequisite to deciding, not a detail — **BACKLOG STR-03.**

The self-hosting case rests entirely on scale. `TARGET_ARCHITECTURE.md` §5 puts break-even
against the Claude API somewhere near 10K users. At the current rate — one family, roughly
50 artworks a year — the Claude API costs about **$1–3 per year** while the self-hosted
stack costs about **$5,400–8,400 per year** plus $84 of fine-tuning and several weeks of
engineering.

There is a real argument on the other side, and it is not about cost: a fine-tuned model
learns the *FMB voice* — the specific register of the titles and dot captions — in a way
prompting approximates but does not guarantee. `FINE_TUNING_STRATEGY.md` §7 correctly notes
the existing 11 artworks are already training data.

## Options

### Option A — Claude API (vision), prompt-engineered
- ~$0.02/artwork, no infrastructure, no GPU, no ops.
- Ships in days. Quality is known — it is literally what produces the current catalogue.
- Vendor dependency; cost scales linearly with volume.

### Option B — Self-hosted LLaVA-NeXT-13B + LoRA on RunPod
- $450–700/month floor regardless of usage; $84 one-time training.
- 4–5 weeks of setup per `TARGET_ARCHITECTURE.md` §8.
- Owns the model and the voice. Costs flatten with scale.
- Quality is projected at 90–98% of Claude, unvalidated on our actual artwork.

### Option C — Claude API now, revisit at a measured threshold
- Ship Option A. Log every request with its cost.
- Keep collecting labelled examples as artworks accumulate — training data accrues for free.
- Trigger a re-evaluation at a stated monthly spend rather than at a guess.

## Decision

—

## Consequences

To be written when decided.

## Revisit when

Monthly vision-API spend exceeds ~$150 for three consecutive months — the point at which
`TARGET_ARCHITECTURE.md`'s self-hosted floor stops being obviously worse. Until then this
question is not close, and treating it as open costs more attention than it deserves.
