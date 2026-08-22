---
title: Platform Definition
status: canonical
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: 60d
supersedes:
  - docs/archive/BUSINESS_OVERVIEW-2026-08-22.md
related:
  - docs/product/PLAN.md
  - docs/decisions/0004-product-ambition.md
  - docs/decisions/0012-ai-cost-floor.md
---

# Platform Definition — FMB · ART

**What this document is for.** A complete, self-contained description of the product we intend
to build, written so it can be handed to a fresh session — or a person — with no other context
and used for competitive analysis, positioning, and pricing work. It describes the **target**
platform, not what runs today.

**What it deliberately is not.** It contains no schedule and no engineering sequencing. Those
live in [`PLAN.md`](PLAN.md) and are not repeated here.

> **One deliberate overlap.** §7 restates the AI cost ceiling because a reader with no other
> context cannot assess the margin without it. [ADR-0012](../decisions/0012-ai-cost-floor.md)
> remains the canonical owner of that number. **If the two ever differ, ADR-0012 is right and
> this document is stale.**

---

## 1. One paragraph

FMB · ART turns a child's drawing into an exhibit in that family's own private online museum.
A parent photographs a drawing with their phone; the platform frames it, writes a museum-style
plaque for it, lets the child record a fifteen-second explanation in their own voice, and makes
the artwork move — through a library of hand-built visual effects that render the drawing in
the language of Matisse, Miró, Klimt, Hokusai and thirty-odd others. The family arranges their
museum the way a real one is arranged: rooms, usually one per child, and curated galleries
inside them. A single link sends the whole thing to a grandparent. The parent pays an annual
licence.

---

## 2. The problem

Children produce an enormous volume of drawings. Roughly all of it meets one of three fates:
the bin, a plastic box in the garage, or a phone camera roll where it is functionally lost
among 14,000 other photos. Parents feel guilty about all three.

The existing responses are unsatisfying in a specific way:

- **Photograph and forget.** The drawing is preserved but never looked at again. There is no
  occasion to return to it.
- **Keep the physical originals.** Storage cost, decay, and an eventual decision nobody wants
  to make.
- **Scrapbook or photo-book apps.** Treat a drawing as a photo. The output is a photo album
  with drawings in it.
- **Print-on-demand novelty products.** A mug with a drawing on it. One-off, transactional,
  and it says nothing about the child.

None of them do the thing that would actually matter: **take the work seriously.** A child who
watches their own drawing hung, labelled, described, and animated is having a different
experience from a child whose drawing went in a box.

---

## 3. The product idea

**Museum logic, not photo-library logic.** This is the single organising principle and it
shapes every screen:

```
Account   ─ a family. The parent is the only account holder.
 └ Museum  ─ one per account, named by the family.
    └ Room     ─ typically one per child. The family decides.
       └ Gallery  ─ a curated set: by age, by year, by style, by theme.
          └ Artwork  ─ the photo, the plaque, the discovery dots, the effects.
```

Consequences of choosing this model:

- **Curation is the feature.** Deciding *which* twelve drawings from this year belong in
  "Manuel, 5 anos — Monstros" is the parent's creative act, and it is why the product is worth
  returning to.
- **The child is the artist, credited by name.** Their name is on the plaque.
- **Rooms grow with the family.** A second child is a second room, not a second account.
- **Scarcity is a feature.** A museum where everything hangs is a warehouse.

---

## 4. What the platform does

### 4.1 Capture — a photo becomes an exhibit
A parent photographs a drawing on a kitchen table with a phone. The platform handles what
follows: HEIC conversion, orientation, crop and deskew, compression, and a set of derivatives.
The parent supplies the artist, the age, and optionally what the child said about it.

**Hard rule: the painting is never altered.** No auto-enhance, no colour correction, no
filters, no model repainting it. Processing applies to the *photograph* — the frame, the
lighting, the crop — never to the drawing.

### 4.2 The plaque — the museum's own voice
The platform generates a title suggestion and a short curatorial description in the register of
a real museum wall label: what is depicted, what the artist did with colour and line, what it
reminds an eye of. Serious, never condescending, never "how cute."

The parent reviews and can edit before it is published. The museum's voice is generated; the
family's authority over it is not.

### 4.3 The child's voice
A fifteen-second recording, made in the browser, attached to a point on the artwork. Tapping
that point plays the child explaining their own drawing.

This is the most emotionally valuable object in the system and the hardest for a competitor to
copy, because it is not content — it is a moment that existed once. It is also the feature with
a clock on it: a child's voice at four does not exist at seven.

The audio is never translated and never edited. A transcript exists for accessibility, not as a
replacement.

### 4.4 Discovery dots
Three or four points placed on the artwork. Tapping one reveals a detail — a note about a
choice the child made, or the child's own recording. It turns looking at a drawing into
exploring it, which is what makes a six-year-old willing to look at their own work a second
time.

### 4.5 Explore — the artwork does something
The surface where the drawing stops being a static image:

- **Effects.** A library of hand-written visual routines that re-render the drawing — in
  Matisse's cut-outs, Miró's constellations, Klimt's gold, Hokusai's wave, Mondrian's grid, and
  thirty-odd more, grouped as *mestres*, *magia*, *gestos*, and *matéria*. The child's drawing
  is the source; the master supplies the grammar.
- **A bedtime story.** A short story generated from the artwork, for reading aloud tonight.
- **Colouring page.** The drawing converted to clean line art, printable, so the child can
  paint their own work again — a different way, a year later.
- **Print.** A gallery-standard layout with the title card, sized for A4 or A3 on a home
  printer.

### 4.6 Sharing
A link. It opens read-only, on any phone, and unfurls in a messaging app as a framed artwork
rather than a bare URL. Galleries are **private by default**; publishing is an explicit
per-gallery action producing an unguessable link the parent can revoke.

### 4.7 Physical output — later
Prints, a bound annual museum book, framed masterpiece editions. The highest-margin line and
the easiest one to be distracted by before there are subscribers.

---

## 5. What already exists — and why it matters commercially

This is not a concept. A working version has been live for months for one family, and it
produced the asset the business is built on:

**Thirty-six hand-written visual effects, plus eleven bespoke routines.** They were written by
hand over months. Each one takes an artwork and reads only its image, its extracted colour
palette, and its background colour — which means **every effect works on every drawing anyone
ever uploads**, with no per-artwork authoring.

Three commercial properties follow:

1. **Zero marginal cost.** They are code. They run in the browser. Rendering an artwork through
   all thirty-six costs nothing per use, forever.
2. **Not model output.** No provider can withdraw them, reprice them, or change them under us.
   No model produces them today.
3. **The moat is taste, not technology.** Any competent engineer could write a Matisse filter.
   Writing thirty-six that are individually beautiful took months of judgment. That is a slow
   thing to copy and it does not fall out of a foundation-model release.

Also validated: the museum framing genuinely changes how a child regards their own work, and
the curatorial description register — serious, never cute — is the right one.

---

## 6. Who it is for

**Primary buyer.** A parent of a child aged roughly three to ten who already photographs
drawings and already feels the guilt about the box in the garage. Comfortable paying for
software. Values the child's creative development as a thing worth documenting rather than
tidying.

**Primary user.** The same parent. Uploading, curating, and naming galleries are adult acts.

**Primary audience.** The child, and the extended family — grandparents in particular, who are
the most reliable recipients of the share link and a plausible gift purchaser.

**Launch geography.** Portugal, in Portuguese. The architecture is multilingual from the first
commit; only the shipped locale is singular. See
[ADR-0013](../decisions/0013-language-strategy.md).

**Adjacent, unscoped.** Schools and nurseries — an end-of-year museum for a class is an obvious
product and a completely different lawful basis for children's data, a different buyer, and a
different sales motion. Not before consumer works.

---

## 7. Business model and unit economics

**The hypothesis:** a **€70/year** family licence, bought by a parent, covering the museum,
the rooms, the effects, the curatorial descriptions, the audio, Explore, and sharing.

Why annual and not monthly: the usage pattern is seasonal and bursty. A parent uploads a batch
after a school term, then nothing for two months. Monthly billing invites churn during exactly
the quiet periods the product's value depends on surviving.

**What survives €70 of gross revenue in Portugal:**

| | |
|---|---|
| List price | ~€70 |
| Less EU VAT (PT, 23%, OSS) | ~€57 |
| Less payment processing (~1.5% + €0.25, EU cards) | ~€56 |

**The constraint that shapes the entire product.** A subscription's cost of goods must stay a
small fraction of that — call it €7/year, 12.5% — across an unbounded number of years of
storage and an unbounded number of uploads. At a realistic 40 artworks per year that leaves
roughly **€0.17 of AI plus infrastructure per artwork.**

This is not a target to grow into. It is the launch constraint, and the reason is credibility,
in the owner's own words:

> If I start with a really nice feature that provides incredible results and then move to a
> "cheap" solution, I automatically lose all credibility.

Nothing ships that we could not afford at ten thousand subscribers. See
[ADR-0012](../decisions/0012-ai-cost-floor.md), which owns this rule and the number.

**Cost structure:**

| Line | Behaviour |
|---|---|
| Effects, colour extraction, line art, print layout, derivatives | **€0 marginal.** Deterministic code. |
| Description, story, transcription | Per-artwork inference. The only variable AI cost, capped. |
| Storage | Grows monotonically and forever. Originals are kept because "download everything" is a promise. |
| Bandwidth | Spiky. Sharing is the growth mechanism and also the bandwidth bill. |
| Payments, VAT compliance | ~20% of gross before anything else. |

**The structural risk in the model:** a customer pays once per year and accumulates storage
forever. A family in year six costs more and pays the same. Retention is therefore *not*
straightforwardly good, and the model needs either a tier ceiling, an archival storage class,
or a higher price for large museums. This is unresolved.

**Possible additional lines** — all speculative, none validated: gift subscriptions
(grandparents are the obvious buyer), physical prints and the annual book (high margin, real
operations), an Escola tier.

---

## 8. Positioning

**What it competes with, honestly:** the camera roll, and the bin. Not another app. The
realistic failure mode is not losing to a competitor — it is a parent thinking "nice" and
continuing to do nothing.

**Adjacent categories a competitive assessment should examine:**

- **Kids'-art archiving apps** — capture-and-store, sometimes with print upsell. Closest
  direct comparison; typically weak on presentation and on the child's experience.
- **Photo book and print services** — physical output from digital images. Strong operations,
  no museum framing, no child voice.
- **Family photo-sharing apps** — the sharing mechanic and the grandparent audience, applied to
  photos rather than art.
- **AI art-transformation toys** — turn a photo into a style. Novelty, single-use, and the
  output is model output, which is exactly what makes it commoditised.
- **General cloud storage** — the incumbent that wins by default because it costs nothing extra.

**The three claims that differentiate:**

1. **It is a museum, not an album.** Rooms, galleries, plaques, and curation — the framing that
   makes a child take their own work seriously.
2. **The art moves, and it costs us nothing.** Thirty-six hand-built effects, permanently ours,
   with no per-use price and no provider dependency.
3. **The child's own voice is part of the exhibit.** Not a caption a parent typed. The thing
   that becomes irreplaceable in about four years.

**What we will not claim:** that AI made the art better. The painting is the painting.

---

## 9. Trust, privacy, and the data posture

The product holds strangers' children's artwork, first names, and voice recordings. That is a
high-trust category and the posture is a sales asset, not a compliance chore. Proposed in
[ADR-0014](../decisions/0014-childrens-data.md):

- **Children are never accounts.** The parent is the only credentialed data subject. A child row
  holds a display name and a birth year — no surname, no exact date of birth, no school, and no
  photographs of the child. The artwork is the portrait.
- **Private by default.** Publishing is per-gallery, explicit, unguessable, and revocable.
- **No training on a child's art or voice**, contractually, from every inference provider — a
  gate on provider selection rather than a preference.
- **EU data residency** for the database and storage.
- **Export and delete are self-serve features.** A parent can take everything and leave.

---

## 10. What is unknown

An honest list, for the assessment to attack:

1. **Willingness to pay.** €70/year is a hypothesis with zero evidence. Not one person outside
   the family has been asked.
2. **Who actually buys.** The parent is assumed. The grandparent may be the real purchaser, and
   that would change the entire product surface.
3. **Whether curation is delight or friction.** The museum model asks the parent to *choose*.
   That may be the magic, or it may be the reason the second session never happens.
4. **Retention past the first burst.** The uploading peak is week one. Nothing in the product
   yet reliably brings a parent back in month four.
5. **Whether the effects sell or merely delight.** They are the strongest asset and there is no
   evidence they convert.
6. **Market size in Portugal.** Roughly 1.2 million households with a child under twelve. Several
   thousand paying families is a plausible share and a small business — enough to matter, not
   obviously enough to be a venture outcome. Whether that ceiling is acceptable is undecided.
7. **The storage-forever economics** described in §7.
8. **Whether a foundation-model release commoditises the plaque.** Probably yes, eventually.
   The effects and the child's voice are the parts that do not commoditise.

---

## 11. Glossary

| Term | Meaning |
|---|---|
| **Museum** | One per account. The family's whole collection. |
| **Room** | A division within a museum, usually one child. |
| **Gallery** | A curated set of artworks inside a room. |
| **Artwork** | One photographed drawing plus its plaque, dots, audio, and effects. |
| **Plaque** | The museum wall label — title, artist, age, year, description. |
| **Discovery dot** | A tappable point on an artwork revealing a detail or the child's recording. |
| **Effect** | A visual routine that re-renders an artwork. Code, not model output. |
| **Explore** | The surface where an artwork becomes something else — effects, story, colouring page, print. |
| **Sala de Experimentação** | The gallery of all effects applied to one artwork. |
