---
description: Guided assistant for the two things the owner does with FMB·ART, asked in Portuguese one step at a time - add a new artwork to the museum, or make an album of works (the turning-page livro.html first, then the PDFs to print). Use when the owner types /FMBART_Museu, or says they want to add a drawing, a new piece, "uma obra nova", or to make, generate or print an album, a book, "um álbum", "um livro", a gift for the grandparents. Skip for "Processa a entrada <nome>" with the form already filled (that is the plain CLAUDE.md flow), for animating an existing piece (animar-obra), and for changes to the album generator's code.
---

# FMB·ART — o museu, passo a passo

The owner is not a developer and often follows over Remote Control from a phone. This skill
collects what is needed through short questions, then does the work. Everything said to the
owner is in Portuguese (PT-PT), plain and warm, with no emoji. This file and its references are
the working method; the rules they follow live elsewhere and are linked, not copied:
[`CLAUDE.md`](../../../CLAUDE.md) (processing an entry), [`ART_GUIDE.md`](../../../ART_GUIDE.md)
(what an artwork entry is), [`intake/README.md`](../../../intake/README.md) (the tray), and the
header of [`scripts/album.js`](../../../scripts/album.js) (the album).

## How to ask

- Choices go through AskUserQuestion, with the likely answer first. Free text (the child's
  words, a dedication) is asked in a plain message; group the free-text questions of one step
  into one numbered message and say that "salta" leaves one empty. Do not ask one free-text
  field per message: on a phone that is a dozen round trips.
- Never ask what the files already answer (dimensions, existing artists, ages from earlier works,
  which originals exist). Look first, then propose it as the default.
- Send what the owner should look at with SendUserFile: pictures with `display: "render"`,
  `livro.html` and the PDFs with `display: "attach"`.
- Keep the task list current: one step per stage below.

## The entry tray

Everything the owner brings goes into one folder: **`intake/nova/`**. It is a tray, not a
home: its contents are out of git (the repo is public, so raw phone photos must never be
committed) and every file leaves it once used. When a run ends the tray is empty again, apart
from `LEIA-ME.txt`. Any name the phone gave the file is fine; Claude names things.

Supported: photos in jpeg, jpg, png, webp or tif; audio in mp3 (m4a, wav or ogg need converting,
see the new-artwork reference). HEIC (iPhone) cannot be read: ask the owner to export it as JPEG.

## Start

1. Look at `intake/nova/`. If it already holds files, say so ("Já estão na bandeja: ...") so
   they are not forgotten.
2. Ask, with AskUserQuestion: **"O que queres fazer?"**
   - "Acrescentar uma obra nova" — "Uma obra para o museu: foto, áudio se houver, e a história dela."
   - "Fazer um álbum" — "Um livro com obras do museu: primeiro para folhear no ecrã, depois para imprimir."
3. Follow the reference for the branch, reading it in full first:
   - New artwork: [`obra.md`](obra.md)
   - Album: [`album.md`](album.md)
4. At the end, ask whether there is another one to do ("Há mais alguma?") and loop to step 2 if so.

## Never

- Do not commit or push without the owner's yes on what will be committed (CLAUDE.md).
- Do not leave anything in `intake/nova/`, and do not commit anything from it.
- Do not edit or filter a photo beyond what `scripts/optimize.js` does. The painting is the painting.
- Do not put family texts (dedications, gift files) anywhere tracked: `album/presentes/*` is
  gitignored on purpose, except `exemplo.md`.
