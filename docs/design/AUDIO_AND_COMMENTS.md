---
title: Audio description and visitor comments (prototype)
status: canonical
owner: SMTCB
last_reviewed: 2026-10-13
review_cycle: 30d
related:
  - docs/decisions/0015-prototype-comments-backend.md
  - docs/decisions/0007-audio-discovery-dots.md
  - docs/decisions/0014-childrens-data.md
  - docs/product/PLAN.md
  - docs/design/IDENTITY.md
---

# Audio description and visitor comments (prototype)

Two features for the live prototype, built to **collect feedback from testers**, not to be the
final product. Planned as AUD-06 and SHR-09 in [`PLAN.md`](../product/PLAN.md). The platform
versions (AUD-01..05, SHR-02..03) supersede them after the rebuild.

Both live in the zoom view (`ZoomModal` in `gallery-core.jsx`). Neither changes the artwork
schema in `ART_GUIDE.md` §1.

---

## 1. Audio description

### Design decisions

| Question | Decision | Why |
|---|---|---|
| Where does the data live? | New file `audio-data.js` with `window.AUDIO = { "<art id>": { src, secs, text } }`. | Keeps the `ART` schema untouched (CLAUDE.md rule). One file the owner edits by hand. A piece without an entry shows no audio control. |
| Where are the files? | `assets/audio/<art-id>.mp3` (mono, 64 kbps, 15-60 s, about 100-500 KB). | Same convention as photos. ADR-0007 Option A, for the description only. |
| What is the control? | One text button in `.zm-label`, **"Ouvir a descrição"**, next to the Sala button. Becomes "Pausar" while playing. A thin progress bar and `0:12 / 0:40` sit under it. | Click-to-play. Never autoplay (children, shared spaces, browser policy). Text label, not an icon-only button, so it reads for a 6-year-old and a grandparent alike. |
| Transcript? | `text` field shown under the player on a "Ler" toggle. | Accessibility (deaf and hard-of-hearing visitors, quiet rooms). The voice stays the product; the text is the fallback. |
| What stops it? | Close, previous/next piece, opening the Sala, and the end of the file. | Audio must never outlive the piece it describes. |
| Conflict with animations? | None to resolve. `portrait` already uses the mic, not playback. | Verify during build. |

### Interaction states

`idle` → `loading` (spinner on the button, `preload="none"` until the first click) → `playing`
→ `paused` → `ended` (back to idle). `error` shows "Não foi possível ouvir. Tenta outra vez."
with a retry. Keyboard: the button is a native `<button>` with a visible focus ring; Space and
Enter work by default. No new global shortcuts (arrows already step pieces).

### Plan

1. `audio-data.js` plus `<script src>` in `index.html` before the gallery.
2. `AudioDescription({ art })` component in `gallery-core.jsx`; one `Audio` element in a ref;
   cleanup on unmount covers close and step.
3. CSS in `gallery.css`, section `/* === audio description === */`. Same pill language as
   `.zm-cta`. `prefers-reduced-motion`: no progress easing.
4. Tell the owner how to add one: file in `assets/audio/`, one line in `audio-data.js`. Add a
   row to the `README.md` file map and a note in `ART_GUIDE.md` §1.
5. Verify desktop and 375 px, including iOS Safari behaviour (needs a user gesture; ours is one).

**Size:** S-M. **Blocked by:** nothing. It is consistent with ADR-0007 Option A but does not
close that ADR (dots with voice are still undecided).

---

## 2. Visitor comments (Name + Comment)

### The unavoidable fact

A static site cannot store comments. **This needs a small server-side piece**, which is an
exception to [ADR-0001](../decisions/0001-static-first-architecture.md). The exception is
proposed in [ADR-0015](../decisions/0015-prototype-comments-backend.md), scoped to the
prototype, so that the rebuild (ADR-0011) is not pre-empted: the data is a single list per
piece and is trivially exportable.

### Design decisions

| Question | Decision | Why |
|---|---|---|
| Where in the UI? | A **"Comentários (n)"** button in `.zm-label`. Opens a panel: right-hand drawer on desktop, bottom sheet on 375 px. Closed by default. | The artwork is the hero and the frame must not shrink. Comments are secondary. |
| What does a visitor type? | **Nome** (max 40) and **Comentário** (max 280, with a live counter). Visible labels, not placeholders. | Matches the request. No account, no email. |
| Remember the name? | Yes, in `localStorage` (try/catch, optional). | Second comment is one field. |
| Validation | On blur and on submit. Inline message under the field, in PT-PT, plain. | "Escreve o teu nome", "Escreve um comentário". |
| Feedback on send | Button shows "A enviar…", then the comment appears at the top with a short fade and the form clears. On failure the text is kept and a retry message appears. | Never lose what someone typed. |
| Order | Newest first, name in Inter semibold, comment in Inter regular, date as "há 2 dias". | Short threads; no replies, no likes. |
| Abuse | Honeypot field, rate limit per hashed IP (5 per hour), URLs rejected, length caps, `COMMENTS_ENABLED` kill switch. | Open write endpoint on a children's site. |
| Moderation | **Open question, see below.** | Real trade-off. |
| Language | PT-PT only. No emoji in the UI copy. | ADR-0002, CLAUDE.md. |

### Panel layout (desktop)

```
┌──────────── zoom modal ────────────────────┐
│  ←   [ frame ]   label        ┌ Comentários┐│
│                  Ouvir        │ Nome ____  ││
│                  Sala         │ Comentário ││
│                  Comentários  │ [Enviar]   ││
│                               │ ─────────  ││
│                               │ Ana · 2 d  ││
│                               └────────────┘│
└─────────────────────────────────────────────┘
```

### Pitfalls to build around

- **Arrow keys.** `ZoomModal` steps to the next piece on ArrowLeft/Right. Typing in the
  textarea must not do that: ignore the key handler when the target is an input or textarea.
  Escape inside the panel closes the panel first, the modal second.
- **Back button.** The panel does not push history. Only the modal does (`fmbOpen`).
- **Mobile keyboard.** The sheet scrolls and the form stays above the keyboard
  (`100dvh`, not `100vh`).
- **Local development.** `python -m http.server` has no `/api`. The panel shows "Comentários só
  funcionam no site publicado" instead of an error. Use `vercel dev` to test the real thing.
- **Escaping.** Render as text only, never as HTML.

### Architecture

- `api/comments.js`, a Vercel Function (zero config, no build step). `GET ?art=<id>` returns the
  list; `POST` validates and appends.
- Storage: **Upstash Redis** from the Vercel Marketplace, free tier, one list per artwork id,
  called through its REST API with `fetch` (no npm dependency). Environment variables set in
  Vercel, never in the repo.
- Stored per comment: `{ id, name, text, ts }`. **No IP, no email.** The rate-limit key is a
  salted hash with a one-hour expiry.
- `scripts/comments.js` for the owner: `list`, `delete <id>`, `export` (JSON). The admin token
  lives in the owner's environment.
- Front end: `Comments({ art })` component, `fetch` with a loading skeleton and a clear error
  state. Count is fetched lazily on open, not for every piece on the wall.

### Plan

1. Moderation decided (publish immediately); ADR-0015 accepted.
2. Create the Upstash store and Vercel env vars (owner action, about 5 minutes).
3. `api/comments.js` with validation, rate limit, honeypot, kill switch.
4. `Comments` component and CSS (drawer and bottom sheet).
5. `scripts/comments.js` for list, delete, export.
6. Verify at 375 px and desktop, with keyboard only, with the API down, with a long word and
   with `<script>` in the text.
7. Update `ARCHITECTURE.md` (a function now runs), `README.md`, `decisions/README.md`.

**Size:** M. **Blocked by:** ADR-0015 (new) and the moderation answer.

### Open question: moderation

The site shows children's art and the endpoint is public. Two honest options:

| | Publish immediately | Hold until approved |
|---|---|---|
| Tester experience | Instant, conversation feels alive | "Aparece depois de aprovado", slower, fewer comments |
| Owner effort | Delete after the fact | Approve every comment |
| Risk | A bad comment is visible until deleted | None visible |
| Extra code | None | A pending list and an approve command |

**Recommendation: publish immediately** while the link is shared only with testers, with the
kill switch and delete command ready. Switch to hold-until-approved before the link is public.
The answer is the owner's.

---

## 3. Feedback loop (why we are building these)

The comments are the feedback channel. Prompt testers with one question, written in the panel
header: "O que sentiste ao ver esta obra?". Count which pieces get audio plays and comments by
reading the stored data; no third-party analytics are added.

## 4. Status and set-up

Both features are built (2026-10-13). Owner set-up for comments, once:

1. In Vercel: Storage → Marketplace → **Upstash Redis** (free) → connect to the project. This
   injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
2. Add `COMMENTS_ADMIN_TOKEN` (any long random string) and optionally `COMMENTS_SALT`.
3. Redeploy. Until then the panel shows "Os comentários só funcionam no site publicado."

Owner commands (need `FMB_SITE` and `COMMENTS_ADMIN_TOKEN` in the environment):
`node scripts/comments.js list | export | delete <obra> <id>`. Kill switch: set
`COMMENTS_ENABLED=false` in Vercel.

Moderation was decided as **publish immediately** while the link is shared only with testers.

## 5. Sequence (as planned)

1. Audio first. No backend, no decision needed, shippable in one session.
2. Comments after ADR-0015 and the moderation answer.
