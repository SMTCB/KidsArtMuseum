---
title: Visual Identity
status: canonical
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: 90d
related:
  - docs/decisions/0010-visual-identity-direction.md
  - ART_GUIDE.md
  - docs/product/SCREENS.md
---

# Visual Identity

**Canonical owner of the design language.** [ADR-0010](../decisions/0010-visual-identity-direction.md)
records *why* the identity is split in two; this document records *what it is*. The raw
delivery from the redesign lives in `FMB_IDENTITY_REDESIGN_V1.0/` and is a comp, not a system —
251 hardcoded hex values and exactly one CSS variable. **DES-01 turns what is below into
tokens.** Until DES-01 lands, `ART_GUIDE.md` still describes the chrome that actually ships.

---

## 1. The split

Two registers, one product.

| Register | Direction | Where it applies |
|---|---|---|
| **Gallery** | **Direção A — Cubo Branco** | Hallway, exhibition view, discovery dots, Explore, visitor and shared view, print output, marketing hero |
| **Back office** | **Direção C — Corredor** | Signup, login, account, upload flow, room and gallery management, pricing, checkout, billing, settings, system states |

**The rule where they meet:** the artwork is always framed in **A**, inside **C** chrome. An
upload preview, a review-before-publish screen, or a gallery-management list shows real frames
in the museum register sitting in product furniture. The two never blend inside a single
component.

---

## 2. Direção A — Cubo Branco

The museum. A real wall, a real frame, real light. **Its defining rule is that there is no
accent colour anywhere** — the only saturated colour on screen belongs to the child's artwork.

### Colour

| Token role | Hex | Use |
|---|---|---|
| Parede | `#EEF0EA` | The wall the art hangs on |
| Fundo | `#FAF8F2` | Page ground, cards, plaques |
| Tinta | `#1A1A1A` | Titles and body text |
| Metadados | `#8A8578` | Artist, age, year, dimensions |
| Carvalho | `#B98A55` | Frame — oak |
| Latão | `#B3924F` | Frame — brass fillet, plaque edge |

> Contrast check outstanding: metadados `#8A8578` on fundo `#FAF8F2` is approximately 3:1 and
> may fail WCAG AA for body-size text. **QUA-07.**

### Type

| Role | Family | Treatment |
|---|---|---|
| Artwork and gallery titles | Cormorant Garamond | italic 600 |
| Body, descriptions, stories | EB Garamond | regular |
| Metadata, dimensions, dates | JetBrains Mono | small, tracked |

### Frame

Layered, physical, in this order from outside in: **7px carvalho · 4px preto · 5px latão ·
16px deep box.** The depth is the point — a flat border reads as a web page, not a wall.

### Principles

- No accent colour. Ever. The artwork supplies the colour.
- Generous wall space around a frame. Crowding reads as a feed.
- Metadata is quiet and monospaced — it is a museum label, not a caption.
- Motion is slow. The wall does not animate; the artwork does, and only in Explore.

### Print: the album

The printed album (POD-01, [ADR-0018](../decisions/0018-printed-album-manual-test.md)) is
Cubo Branco on paper. It uses the same tokens and the same three type families, and latão is the
only accent, used as the plaque edge is used on the wall. The approved comps are
`album/identidade.html`. The generator's styles are `scripts/album.css`, sized in units of 1/100 of
the trimmed page width so that the two stay comparable.

A gift album (POD-02) keeps the same pages with three additions:
- the dedication sits on the ex-libris page in place of the blank "belongs to" line;
- an opening paragraph sits on the title page;
- the child's words appear as the quote on the entry, in the comps' blockquote style.

A long title on the cover shrinks to stay on one line.

---

## 3. Direção C — Corredor

The product. Legible, fast, unfussy, and deliberately not competing with the art.

### Colour

| Token role | Hex | Use |
|---|---|---|
| Parede | `#F1F2EF` | App ground |
| Fundo | `#FFFFFF` | Panels, forms, cards |
| Texto | `#161616` | Body and labels |
| Metadados | `#9A9A94` | Secondary and helper text |
| Acento sistema | `#2A6FD8` | Focus rings, links, primary actions, selected states |

### Type

**Inter throughout.** Titles uppercase with wide tracking; body regular; no serif anywhere in
the back office.

### Frame and layout

1.5px hairline borders. Generous whitespace. Grid-aligned. No shadow theatre.

### Adopted with one exception

**Direção C's per-artwork accent bar is not adopted.** The delivered comp derives a colour from
each artwork (e.g. `#B9261C`) and paints chrome with it. It is dropped for two reasons: it
duplicates `art.palette`, which the effect library already derives from the same source, and a
chrome accent pulled from a child's drawing will sooner or later clash with the drawing beside
it. The system blue `#2A6FD8` is adopted for interactive states only, and only in the back
office.

---

## 4. What is not designed

Roughly a third of the platform has no drawing in either direction: the museum-level rooms
overview, room and gallery management, signup, login, account settings, pricing, checkout,
billing portal, export, delete, and the full error and empty-state set.

**DES-08** writes acceptance criteria for these in words; **STR-07** commissions the visuals
against Direção C. See [`PLAN.md`](../product/PLAN.md).

---

## 5. Dead weight to remove

`FMB_IDENTITY_REDESIGN_V1.0/` still carries **46 `.dir-b` selectors** from a third direction
that was dropped. They must not enter the rebuild — **DES-02**.
