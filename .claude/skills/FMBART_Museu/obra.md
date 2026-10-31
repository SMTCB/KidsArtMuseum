# Acrescentar uma obra nova

The goal of this branch is a filled-in intake form, `intake/<name>.md`, with its photo (and
audio) beside it. From there the work is exactly CLAUDE.md "Most common task: process a new
artwork from the intake tray", steps 1–10. This reference only covers getting there, and making
sure every file ends in its final place.

## 1. The files

Tell the owner, in these words or close to them:

> Guarda a foto da obra (e o ficheiro de áudio, se houver) na pasta `intake/nova/`, com o nome
> que tiverem. Diz-me quando estiver.

Wait for the answer, then list `intake/nova/`, ignoring `LEIA-ME.txt`.

- **No photo:** say what you see and ask again.
- **HEIC:** ask for a JPEG export (Fotos do iPhone: Partilhar, depois guardar como ficheiro
  JPEG). Do not try to convert it.
- **Several photos:** open each with Read and ask which one is this work (AskUserQuestion,
  describing each in a few words). The others stay in the tray for the next round; say so.
- **Audio not in mp3:** run `ffmpeg -version`. If it is there, convert with
  `ffmpeg -i <in> -ac 1 -b:a 64k intake/<name>.mp3` (the format `audio-data.js` describes:
  mono, about 64 kbps). If not, tell the owner and ask whether to leave the audio out for now,
  or have them save it as mp3. Do not install software without asking.

Open the photo with Read: you will need it for the questions and for the palette later.

## 2. The questions

**Artist**, AskUserQuestion. The options are the distinct `artist` values in `art-data.js`,
most recent work first, plus the free "Other". A new name is fine (it becomes a new room);
confirm the spelling.

**Year and age**, AskUserQuestion with the computed defaults. The year defaults to the current
one. The age is worked out from the artist's latest work (`age + (year − that year)`); offer that
and the age one below it, since a birthday may fall in between. For a new artist there is no
default: ask.

**The rest, in one numbered message.** Say "salta" leaves an answer empty:

1. **Título** — uma sugestão; eu acabo de o afinar.
2. **Técnica e materiais** — por exemplo guache, colagem, barro e palitos.
3. **Contexto** — como nasceu: na escola, em casa, num dia especial?
4. **O que a criança disse** sobre a obra, com as palavras dela.
5. **Ideias para a animação** — se houver (por exemplo "os olhos deviam mexer").
6. **Mais alguma coisa** — um momento engraçado, em quem estava a pensar.

If there is audio, add:

7. **O que diz o áudio**, por escrito, para quem não pode ouvir. Pode ser aproximado.

If an answer is thin where it matters (no title, nothing about the work at all), ask once more
for that one thing. Otherwise move on: the form allows empty sections.

## 3. Name the entry and fill the form

- **Name**: `<artist-slug>-<short-noun>`, lowercase with hyphens, ASCII (ART_GUIDE §7). The
  noun comes from the title ("Gato de Barro" by Miguel → `miguel-gato`). It must not exist in
  `intake/`, `intake/processed/` or as an `id` in `art-data.js`; add a word if it does.
- **Move out of the tray**, keeping the extension in lower case:
  `intake/nova/<photo>` → `intake/<name>.<ext>`, and the audio → `intake/<name>.mp3`.
- **Write `intake/<name>.md`** with the shape of `intake/TEMPLATE.md`: the front matter
  (`photo` is `<name>.jpeg`, the name optimize.js will give it), then the four sections. The
  technique goes at the top of "Contexto" as `Técnica: ...`; it becomes `medium` only if it is
  not paint (ART_GUIDE §1). The audio transcript goes under "Notas extra" as
  `Áudio (transcrição): ...`, ready for the `text` field of `audio-data.js`.
- The tray must now be empty except for photos kept for a later round. Check.

## 4. Process the entry

Say in one line that the form is done, then do CLAUDE.md steps 1–10 for `<name>` without asking
the owner to type "Processa a entrada". Notes for this route:

- Step 3 (`node scripts/optimize.js <name>.<ext>`) also keeps the untouched original as
  `album/originais/<name>.<ext>`. Step 10 renames it to `<id>.<ext>`. Do not skip that rename:
  the printed album finds originals by id.
- For the audio entry in `audio-data.js`, read the length in seconds with PowerShell:
  ```powershell
  $sh = New-Object -ComObject Shell.Application
  $f = $sh.Namespace("$PWD\assets\art\<id>"); $f.GetDetailsOf($f.ParseName("audio.mp3"), 27)
  ```
  and use the transcript from the form as `text`.
- At step 9, present the proposal in a way that reads on a phone: the title, the animation and
  why (one sentence), the palette, and what each dot points at. Send a screenshot of the piece
  in the gallery (preview tools) with SendUserFile, then ask for the yes with AskUserQuestion:
  "Publicar" / "Mudar alguma coisa".
- After the push, check that these are all true, and say so in the closing message:
  - `intake/nova/` holds only `LEIA-ME.txt` (or photos kept for another round);
  - `intake/` holds no `<name>.*` (the form is in `intake/processed/`);
  - `assets/art/<id>/` has `photo.jpeg`, `thumb-480.jpeg`, `thumb-960.jpeg`, and `audio.mp3` if
    there was audio;
  - `album/originais/<id>.<ext>` exists.
