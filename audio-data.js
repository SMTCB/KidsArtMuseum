// ============================================================
// FMB / ART — descrições em áudio das obras
//
// Uma entrada por obra, com a chave igual ao `id` em art-data.js.
// Uma obra sem entrada não mostra o botão "Ouvir a descrição".
//
//   "portal": {
//     src:  "assets/art/portal/audio.mp3",   // mono, ~64 kbps, 15–60 s
//     secs: 38,                           // duração aproximada, em segundos
//     text: "O que a voz diz, por escrito." // transcrição (acessibilidade)
//   }
//
// Cada ficheiro fica na pasta da obra: assets/art/<id>/audio.mp3. Ver docs/design/AUDIO_AND_COMMENTS.md.
// ============================================================
window.AUDIO = {
  "miro": {
    src:  "assets/art/miro/audio.mp3",
    secs: 25
  },
  "casaaranhas": {
    src:  "assets/art/casaaranhas/audio.mp3",
    secs: 20
  }
};
