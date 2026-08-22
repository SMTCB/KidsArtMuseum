---
title: Template Composition Strategy
status: reference
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: 90d
related: [ART_GUIDE.md, docs/decisions/0012-ai-cost-floor.md]
---

> **Status: reference.** How to scale animation variety without every piece feeling
> templated. Marked "Approved approach" by its author, but it depends on the fine-tuned-model
> path of [ADR-0005](../decisions/0005-vision-model-provider.md) and proposes an `animConfig`
> schema extension that `ART_GUIDE.md` §1 does not allow. Its $0.40–0.45/artwork figure
> conflicts with the $0.02 used elsewhere. That gap is closed by
> [ADR-0012](../decisions/0012-ai-cost-floor.md), which sets a hard per-artwork budget and makes
> **AIS-01** the source of the one real number. Neither figure here survives it unmeasured.
>
> The §"Why This Avoids Instagram Filter" reasoning is worth keeping regardless of ADR-0005.

# FMB·ART Template Composition Strategy

**Status:** Approved approach for scaling animations without breaking unit economics or feeling formulaic.

---

## Problem Statement

We need to scale from manual animation curation (60 min per artwork) to 500+ artworks/year without:
1. Exploding costs (unit economics collapse if we generate code per artwork)
2. Creating an "Instagram filter" feeling (all art looks like it went through the same template)
3. Sacrificing quality (fine-tuned LJM cannot reliably generate high-quality animation code)

---

## Three Approaches Evaluated

### Option 1: Full Code Generation ❌
- LJM generates novel React components by combining template characteristics
- **Cost:** $2–5 per artwork (breaks unit economics)
- **Quality:** 70–80% (code validation adds cost without saving time)
- **Verdict:** Rejected. Reintroduces the problem we already solved.

### Option 2: Intelligent Routing (Single Template) ⚠️
- LJM selects the best single template for each artwork
- **Cost:** $0.40 per artwork ✓
- **Quality:** 95%+ (safe, bounded by hand-built code) ✓
- **Problem:** 20 identical animation patterns feel templated and formulaic

### Option 3: Template Composition ✅ CHOSEN
- LJM selects a **primary template** + outputs lightweight JSON **config** with optional feature suggestions
- Pre-built React code layers these features **without generating new code**
- **Cost:** $0.40 per artwork ✓
- **Quality:** 90–95% ✓
- **Freshness:** Combinations feel curated, not algorithmic ✓

---

## How It Works

### 1. Extended Schema (art-data.js)

```javascript
{
  id: "example-painting",
  title: "...",
  artist: "...",
  src: "assets/art/example.jpeg",
  anim: "matisse",  // Primary template
  animConfig: {     // NEW: Feature composition config
    trackCursor: true,
    trackingStyle: "portrait_eyes",
    interactionMode: "swinging",
    secondaryFeature: "pulse"
  },
  dots: [...]
}
```

### 2. LJM Fine-Tuning

Train LLaVA-NeXT-13B to output:
- `anim` field: primary template name (e.g., "matisse", "portrait", "story")
- `animConfig` object: optional feature flags that are compatible with the primary template

Example LJM output:
```json
{
  "title": "The Fearless Leap",
  "description": "Miguel's abstraction in motion...",
  "palette": ["#ff6b35", "#004e89", "#f7b801"],
  "anim": "matisse",
  "animConfig": {
    "trackCursor": true,
    "trackingStyle": "portrait_eyes",
    "addPulse": true
  },
  "discovery_points": [...]
}
```

### 3. Pre-Built Composition Logic (React)

```javascript
// Pseudo-code in animation wrapper
const AnimationWrapper = ({ template, config }) => {
  let Component = getTemplate(template);
  
  if (config.trackCursor) {
    Component = withCursorTracking(Component, config.trackingStyle);
  }
  if (config.addPulse) {
    Component = withPulseEffect(Component);
  }
  
  return <Component />;
};
```

### 4. Feature Compatibility Matrix (ART_GUIDE § 5c)

Document which feature combinations work well:
- ✓ Swinging + cursor tracking = good (kinetic + responsive)
- ✓ Story beats + comparison slider = risky (two narrative modes clash)
- ✓ Disco narrative + eye tracking = interesting (dance + interaction)
- ✓ Portrait + swinging = works (eyes move with body)

---

## Why This Avoids "Instagram Filter"

Your existing 5 hand-built templates already have distinct personalities:

| Template | Concept | Interaction |
|----------|---------|-------------|
| **Miró** | Disco narrative | Music + lights + movement |
| **Sunflowers** | Comparison | Drag to reveal (vs. original) |
| **Portrait** | Responsive | Eyes follow, talks |
| **Matisse** | Kinetic energy | Swinging, wind lines |
| **Story** | Structured narrative | Beats, progression |

When LJM suggests: *"This painting needs Matisse's swinging + Portrait's eye-tracking,"* that combination is **novel and unexpected**—not formulaic—because it's pairing two intentional design choices that share a conceptual thread (kinetic + responsive = playful).

The difference:
- ❌ Instagram filter: "Apply effect A to all photos"
- ✅ Template composition: "This artwork calls for swinging energy *with* attentiveness"

---

## Unit Economics

| Metric | Cost | Impact |
|--------|------|--------|
| **LJM inference** | $0.40 | Per artwork |
| **Code generation** | $0 | Not needed |
| **Validation cost** | ~$0.05 | JSON schema (simple) |
| **Total COGS** | **$0.45** | Per artwork |
| **Revenue (free tier)** | $2.50+ | Per artwork (watermark → subscription) |
| **Gross margin** | **~6x** | Sustainable at scale |

---

## Implementation Roadmap

1. **Design phase** (Claude Design skill)
   - Create 8–10 new templates (distinct from existing 5)
   - Each template documents: name, interaction pattern, composable features
   - Output: React code sketches + feature flag documentation

2. **Fine-tuning phase**
   - Collect 50–80 training examples with intended (anim, animConfig) pairs
   - Train LLaVA-NeXT-13B with LoRA (45 min on H100)
   - Quality target: 85–90% alignment with FMB voice + correct feature suggestions

3. **Composition layer** (React)
   - Build `withFeature()` HOCs for common features (cursor tracking, pulse, swinging, etc.)
   - Create feature compatibility matrix in ART_GUIDE § 5c
   - Test layering: ensure composed animations don't break or look jarring

4. **Validation**
   - LJM output includes JSON schema validation (title, description, palette, anim, animConfig, discovery_points)
   - Fail gracefully: if animConfig is invalid, fall back to single-template rendering

---

## Success Metrics

✓ **Quality:** 90–95% of artworks need zero manual tweaks (vs. 60% with base LLM)  
✓ **Freshness:** No two artworks feel identical (feature configs + routing creates variety)  
✓ **Speed:** 4.8s end-to-end per artwork (LJM inference + Supabase writes)  
✓ **Cost:** $0.45 COGS / $2.50 revenue = 6x margin  
✓ **Feeling:** Curated and intentional, not algorithmic or formulaic  

---

## Next Steps

1. Create animation templates with Claude Design (use concise prompt provided)
2. Document feature compatibility matrix (which combinations work)
3. Fine-tune LLaVA-NeXT-13B on 50–80 examples with (anim, animConfig) labels
4. Build React composition layer (HOCs for each feature)
5. Deploy as part of Vercel `/api/analyze` pipeline
