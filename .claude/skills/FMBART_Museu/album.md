# Fazer um álbum

The generator is `scripts/album.js`; its header lists every option and what each output is.
The identity is fixed (ADR-0018, `docs/design/IDENTITY.md`): this branch chooses content, never
the look. The order is always the same: **livro.html first, to look at; the PDFs only after a
yes**, because the PDFs take minutes and the livro takes seconds.

Nothing in this branch is committed: `album/out/`, `album/originais/` and `album/presentes/*`
are all out of git. Do not offer a commit at the end.

## 1. Which kind

If `album/presentes/` holds gift files other than `exemplo.md`, first offer to reopen one
("Continuar o álbum <titulo>"); a reopened gift jumps to step 3 with its answers as defaults.

Otherwise ask, with AskUserQuestion, **"Que álbum queres fazer?"**

- "Álbum-presente" — "Escolhes as obras, a ordem, o título e uma dedicatória."
- "Obra completa de uma criança" — "Todas as obras de uma criança, pela ordem do museu, sem textos novos."

## 2a. Obra completa

Ask the artist (AskUserQuestion, the names in `art-data.js`), then the year if that artist has
works in more than one ("Todos os anos" first). The album is `npm run album -- <Artista> [ano]`;
its folder is `album/out/<artista>-<ano>/`. Go to step 4.

## 2b. Álbum-presente: the works

1. Run `npm run folha` and send `album/out/folha.jpeg` (render). It shows every work with a
   number; `npm run album -- --lista` has the same numbers with the ids.
2. Ask in a message: **"Que obras entram, e por que ordem? Escreve os números pela ordem do
   livro, por exemplo 3, 1, 12."** Ranges like 5-9 are fine. Map the numbers to ids through
   `--lista`; repeat back the titles in order and fix anything unclear before going on.
3. **Capa**, AskUserQuestion: the first works chosen (at most four options), "Other" for a
   number. Default: the first work.

## 2c. Álbum-presente: the texts

In one numbered message ("salta" leaves the museum's default):

1. **Título** do livro, grande na capa. Por exemplo "Para os Avós".
2. **Subtítulo**, pequeno por baixo. Por exemplo "Natal · 2026". Sem ele, vão os anos das obras.
3. **Dedicatória**, na primeira página. Uma linha em branco separa parágrafos. Sem ela, a página
   diz "Este livro pertence a" com uma linha para escrever à mão.
4. **Abertura** — um parágrafo curto na página de título (opcional).

Then ask with AskUserQuestion **"Queres mudar alguma coisa nas obras?"**: "Não, ficam como no
museu" / "Sim, em algumas". On yes, ask which (by number), and for each, in one message: título,
técnica, o que a criança disse (sai entre aspas), and the notes that replace "Repara em" (one per
line, `nota — pormenor`). Show each work's current dots so the owner can see what they replace.

## 2d. Write the gift file

- **Name** the file after the occasion, lowercase with hyphens: `avos-natal-2026`. Propose it,
  do not ask unless it clashes with an existing file.
- Write `album/presentes/<nome>.md` with the shape of `album/presentes/exemplo.md` (front matter
  `titulo`, `subtitulo`, `capa`; then `## Dedicatória`, `## Abertura`, `## Obras` with one
  `### <id>` per work in book order). Leave out what was skipped. Leave out the HTML comments.
- The album is `npm run album -- <nome>`; its folder is `album/out/<nome>/`.

## 3. The originals

Run `npm run album -- <album> --originais`. It lists which works have an untouched photo in
`album/originais/`. The PDF prints sharper from those; the site photos (at most 3000 px) are
fine on screen and usually fine on paper, and the run warns below 150 dpi.

If all have one, say so in a line and go on. If some are missing, list their titles and ask
with AskUserQuestion **"Tens as fotos originais destas obras?"**

- "Continuar com as do site" (first: it always works)
- "Vou pôr as originais na bandeja"

On the second, say: **"Guarda as fotos originais em `intake/nova/`, com o nome que tiverem, e
diz-me quando estiver."** Then for each photo in the tray, open it with Read and match it to
one of the missing works by looking (compare with `assets/art/<id>/thumb-480.jpeg`). Show the
matches as a list and confirm them with one AskUserQuestion before moving anything. Move each to
`album/originais/<id>.<ext>` (extension in lower case). A photo that matches nothing stays in
the tray: ask about it. HEIC cannot be read: ask for JPEG. Run `--originais` again and report.

## 4. The livro first

Run `npm run album -- <album> --so livro` (seconds). Send `album/out/<pasta>/livro.html`
(attach) and say it opens in any browser and the pages turn with a tap or a swipe. If the
preview tools are available, also open it and send a screenshot of the cover and of one spread,
so the owner can judge from the phone.

Ask with AskUserQuestion **"O livro está como queres?"**: "Sim, gerar os PDF para imprimir" /
"Mudar alguma coisa". On a change, edit the gift file (or the choice of works) and run step 4
again. Changes to the look are not this skill's: say they are a change to the generator.

## 5. The PDFs

Ask with AskUserQuestion **"Já sabes a lombada que a gráfica pede?"**

- "Ainda não, estimar" — the spine is estimated from the page count; the run says so.
- "Sim" — then ask for the number in mm, and whether it is a hardcover ("capa dura"). A
  hardcover case wrap needs the printer's margin: ask for it too and pass `--dobra <mm>`.

Run `npm run album -- <album> --so pdf [--lombada <mm>] [--dobra <mm>]` in the background
(about 3 minutes for a dozen works; you are woken when it ends). Then send `miolo.pdf` and
`capa-aberta.pdf` (attach), and report from the run's output: pages, the cover size and spine,
how many works had originals, and any resolution warnings. `capa.pdf` (the front alone) is in the
same folder for a printer that wants the panels apart.

For numbered copies (`--tiragem N`) ask only if the owner mentions copies or an edition.
