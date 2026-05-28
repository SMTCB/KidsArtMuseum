# FMB · ART — Business Overview

> Prepared: May 2026  
> Purpose: Structured briefing for evaluating FMB · ART as a commercial product.
> Written to be used as context for LLM-assisted business validation.

---

## 1. The problem

Children make art constantly. Most of it ends up:
- Stacked in a folder, unseen
- Photographed once, buried in a camera roll between 4,000 other photos
- Thrown away when storage runs out

Parents know the art matters. They feel guilty about what happens to it. And the child — the artist — rarely gets the experience of seeing their work treated as *worth looking at*.

There is no good digital home for a child's body of work.

---

## 2. The product

**FMB · ART** is a virtual art museum for children's artwork.

Each piece hangs on a digital gallery wall with:
- A **custom animation** that brings it to life (dancing figures, colour-shift panels, a spotlight that moves)
- A **colour palette** sampled directly from the painting
- **Discovery hotspots** — tap a dot on the painting to hear what the child said about that detail
- A **title card** and signature in the style of a real museum

The museum has multiple "wall themes" — from a grand classical salon with gilded frames to a minimal white cube gallery. Parents and children can switch between them.

**It looks and feels like a real museum. The subject is a 6-year-old's crayon drawing. That contrast is the product.**

---

## 3. Current state

A working product exists. It is a static web application:
- Live at a Vercel URL (custom domain pending)
- 11 artworks by 3 child artists (one family, ages 4–7)
- Built with React (browser-side), plain CSS, no backend, no database
- Deployed automatically from a GitHub repository on every update
- Costs: ~$0/month to run (within Vercel and GitHub free tiers)

The workflow to add a new artwork today:
1. Parent drops the photo in a folder
2. Fills a short text form (artist name, age, context, kid's description)
3. Prompts Claude Code → AI analyzes the image, writes the museum entry, commits and deploys

The technical groundwork for a web-based upload UI (no Claude Code required) is designed and estimated at ~4 days of work.

---

## 4. Target market

### Primary: Parents of young children (ages 3–10)
- Children in this range produce high volumes of art
- Parents are emotionally invested but practically overwhelmed
- Strong sharing motivation: grandparents, relatives, teachers

### Secondary: Early childhood educators / art teachers
- A class museum. Each student has a piece on the wall.
- Institutional purchase decision, higher price point acceptable

### Tertiary: Art therapy practitioners
- Children's art as therapeutic output, displayed with dignity
- Niche but high willingness to pay for the right framing

### Geography
- No inherent geographic constraint — the product is digital
- Current implementation is in Portuguese (PT-PT); internationalisation is straightforward
- Portuguese-speaking markets (Portugal, Brazil) as natural first markets given the language

---

## 5. Value proposition

| For the parent | For the child |
|---|---|
| A beautiful home for artwork that would otherwise be lost | Seeing their work treated like it belongs in a museum |
| Easy to share with family (one URL) | Discovery dots let them narrate their own art |
| Passive — set up once, add pieces when inspired | The animation makes their painting feel alive |
| Archive and memory, not just storage | Their name on a title card |

**The key insight:** this is not a photo storage product. It is a *celebration* product. The emotional job-to-be-done is "my child should feel like a real artist." That is a different and higher-value proposition than "store children's art."

---

## 6. Business model

### Recommended: Freemium SaaS, annual billing

| Tier | Price | Includes |
|---|---|---|
| **Free** | $0 | 1 museum, up to 10 artworks, 2 wall themes |
| **Família** | $49/year | Unlimited artworks, all themes, custom subdomain, print exports |
| **Escola** | $149/year per classroom | Multi-artist, teacher admin, class wall, bulk upload |

**Why annual:** aligns with the school year and gift occasion rhythm. "Give a museum" as a Christmas or birthday gift is a natural entry point.

**Alternative: one-time gift product**
- A "museum kit" purchased as a gift — code redeemed, museum set up in 10 minutes
- $29–49 one-time. Simpler to sell, harder to retain.

### Unit economics (illustrative, Família tier)
| Item | Cost/year |
|---|---|
| Anthropic API (est. 50 artworks/year × $0.02) | ~$1.00 |
| Vercel Pro (shared across N families) | ~$0.50–2.00 at scale |
| Storage (photos, ~500 MB/family/year) | ~$0.05 |
| **Total COGS per family** | **~$2–3/year** |
| **Revenue per family** | **$49/year** |
| **Gross margin** | **~94%** |

The unit economics are excellent. The challenge is acquisition.

---

## 7. Acquisition

### Natural channels
- **Word of mouth in parent communities** — a parent shares their child's museum URL with grandparents. Grandparents want the same for their grandchildren. Loop.
- **School art shows** — a teacher uses the class museum for a digital art show. Parents sign up.
- **Social sharing** — a parent posts a screenshot or video of their child's animated artwork. The museum URL in the caption drives signups.

### Paid channels (later stage)
- Pinterest / Instagram (visual product, high affinity)
- Parenting newsletters and communities
- Teacher/educator networks (TPT, etc.)

### Referral mechanic
The shared museum URL *is* the referral loop. Every grandparent who visits is a potential customer.

---

## 8. Technical architecture (current + roadmap)

### Today (Phase 0)
```
GitHub repo (source of truth)
  └── Vercel (static hosting, auto-deploys on push)
        └── Browser (React, no backend)
```
Zero running costs. No database. No backend. Artworks added via Claude Code + GitHub commit.

### Near-term (Phase 2, ~4 days of work)
```
GitHub repo (source of truth)
  └── Vercel
        ├── Static site (browser)
        └── Serverless function /api/add-artwork
              ├── Receives photo upload + form data
              ├── Calls Claude API (vision) → artwork JSON
              └── Commits photo + updated data to GitHub via GitHub API
                    └── Triggers Vercel auto-deploy (~30s)
```
No database still. Anthropic API is the only new cost (~$0.02/artwork).

### Multi-family SaaS (Phase 3, 4–8 weeks of work)
```
Supabase
  ├── Postgres (artwork metadata, families, users)
  └── Storage (photos)
Vercel
  ├── Next.js app (replaces static site)
  └── API routes (auth, upload, LLM orchestration)
Anthropic API (Claude, vision)
Custom domains per family
```

---

## 9. Risks and open questions

| Risk | Severity | Mitigation |
|---|---|---|
| **Acquisition is hard** — parents are busy, conversion funnels for emotional products are long | High | Lean into the sharing URL as the primary growth loop. Make the museum beautiful enough to share. |
| **Anthropic API cost at scale** — if a family adds 200 artworks/year, cost per family rises | Low | Still < $5/year at $0.02/call. Price the product well above this. |
| **HEIC / photo format friction** — iPhone users shoot HEIC by default | Medium | Server-side conversion (heic-convert library). One engineering day. |
| **Competition from Big Tech** — Google Photos or Apple could build this | Medium | They won't. The AI-curated, one-piece-at-a-time museum experience is opposite to their "everything everywhere" philosophy. |
| **Retention** — families add art in bursts, then go quiet | Medium | Email digests ("Miguel added 3 pieces this month"), year-end retrospective, print book upsell |
| **IP / privacy of children's images** — photos of children uploaded to a service | High | No image is used for training. Museum URLs can be private (access by link only). GDPR compliance required for EU market. |

---

## 10. What makes this defensible

1. **The AI artistic treatment** is not trivial to replicate. The combination of palette sampling, animation selection, and child-appropriate narration requires careful prompt engineering and a well-designed data schema. A competitor can copy the concept; the execution quality is the moat.

2. **The emotional positioning** — "your child is a real artist" — is not where photo storage products compete. This is a different category.

3. **The accumulated catalogue.** A family with 3 years of artwork in the museum has a deeply personal artifact. Switching cost is high.

4. **First-mover in the niche.** No product currently does this. The closest alternatives (custom art books, photo albums, NFT platforms) solve adjacent but different problems.

---

## 11. The one-line pitch

> FMB · ART turns children's drawings into a proper museum — each piece animated, curated, and celebrated — so the art (and the feeling of making it) is never lost.

---

## Appendix: Questions for LLM business validation

Use these when prompting an LLM to pressure-test this concept:

1. Is the problem real and widespread, or is it a niche parent anxiety?
2. Is $49/year the right price point, or should it be lower (volume play) or higher (premium positioning)?
3. What is the realistic CAC for this type of product, and does the LTV justify it?
4. Which of the three target segments (parents / educators / therapists) has the shortest sales cycle and highest willingness to pay?
5. Is the "no database" architecture a strength (simplicity, cost) or a liability (scalability, features)?
6. What would a v1 landing page need to communicate to convert a parent who has never heard of this?
7. Who is the actual decision-maker in a school purchase, and how long is that cycle?
8. Is there a physical product extension (printed museum book, framed print with QR code) that could meaningfully expand revenue?
