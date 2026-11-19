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
  },
  "enfeitesnatal": {
    src:  "assets/art/enfeitesnatal/audio.mp3",
    secs: 19,
    text: "É uma borboleta, um caracol, outro caracol, outro caracol, um girassol e outro girassol e é isso."
  },
  "outono": {
    src:  "assets/art/outono/audio.mp3",
    secs: 18,
    text: "A árvore caduca, a árvore caduca, que é esta, e cai as folhas. E a outra, que não cai as folhas, está com folhas."
  },
  "diadamae": {
    src:  "assets/art/diadamae/audio.mp3",
    secs: 14,
    text: "Sou eu a tirar a máscara com o arco-íris, mas é só que eu pintei aquilo, o sol e o arco-íris."
  },
  "autoretratomuna": {
    src:  "assets/art/autoretratomuna/audio.mp3",
    secs: 11,
    text: "Eu inventei um menino que caiu ao chão e se magoou."
  },
  "floresta": {
    src:  "assets/art/floresta/audio.mp3",
    secs: 9,
    text: "É uma floresta do outono que tem guardas e minhocas e coelhos e árvores."
  },
  "agentesecreto": {
    src:  "assets/art/agentesecreto/audio.mp3",
    secs: 25,
    text: "É um espião que se chama Miguel Bragão, só tem uma lupa e desenhamos azul, depois pintamos azul alguma coisa e depois pintamos vermelho, depois pomos a lupa aí e dá-se para ver a coisa que pintámos."
  },
  "sernormal": {
    src:  "assets/art/sernormal/audio.mp3",
    secs: 23,
    text: "Se eu fiz aquilo, estavam lá animais e árvores atrás dos animais. O leão disse que os animais e o leão estavam presos nesta ilha."
  },
  "outonomuna": {
    src:  "assets/art/outonomuna/audio.mp3",
    secs: 22,
    text: "Está dentro do outono, onde tem corujas e aranhas e bolotas e isso. Ai, como se chama isso? Árvores? Cogumelos? Cogumelos!"
  },
  "warhol": {
    src:  "assets/art/warhol/audio.mp3",
    secs: 19,
    text: "São quatro Miguéis a mudar de cor: um é verde, outro é azul, outro é vermelho e outro é cor-de-laranja."
  }
};
