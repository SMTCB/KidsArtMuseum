// Artwork data — THE catalogue. Schema is fixed and binding: see ART_GUIDE.md §1.
// `w`/`h` are the original pixel dimensions (frames are sized from their ratio).
// `dots` are tap-to-discover details (x,y are % of the image).
// `anim` is a key into window.ANIMS, defined at the bottom of art-animations.jsx.
// Append new ids to window.HALLWAY_ORDER at the bottom of this file.
window.ART = [
  {
    id: "miro",
    title: "O Senhor Vermelho",
    artist: "Miguel",
    age: 6,
    year: 2026,
    signature: "Miguel Miró",
    src: "assets/art/miro/photo.jpeg",
    w: 3648, h: 4799,
    bg: "#225f9e",
    palette: ["#b9261c", "#225f9e", "#ccc343", "#f4ede0", "#0d1d33"],
    anim: "miro",
    dots: [
      { x: 32, y: 22, label: "Olho amarelo", detail: "Um olho que pisca" },
      { x: 55, y: 22, label: "Olho vermelho", detail: "Outro olho!" },
      { x: 50, y: 88, label: "Os p\u00e9s", detail: "Pronto para correr" }
    ]
  },
  {
    id: "vangogh",
    title: "Os Girass\u00f3is do Miguel",
    artist: "Miguel",
    age: 6,
    year: 2026,
    signature: "Miguel van Gogh",
    src: "assets/art/vangogh/photo.jpeg",
    w: 3600, h: 5159,
    bg: "#d6a93a",
    palette: ["#d6a93a", "#a6c9c2", "#7a3a1f", "#f1e4b8"],
    anim: "sunflowers",
    dots: [
      { x: 30, y: 30, label: "Girassol", detail: "Vira-se para o sol" },
      { x: 50, y: 75, label: "Jarro de barro", detail: "Pintado \u00e0 m\u00e3o" },
      { x: 50, y: 8, label: "Assinatura", detail: "MIGUEL no topo" }
    ]
  },
  {
    id: "portrait",
    title: "Auto-Retrato (com nariz que mexe)",
    artist: "Miguel",
    age: 6,
    year: 2026,
    signature: "Miguel",
    src: "assets/art/portrait/photo.jpeg",
    w: 2900, h: 5308,
    bg: "#efe6cf",
    palette: ["#efe6cf", "#1a1a1a", "#7a3a1f", "#3a6b4a"],
    anim: "portrait",
    dots: [
      { x: 50, y: 32, label: "Nariz 3D", detail: "Sai do papel!" },
      { x: 32, y: 25, label: "Olho esquerdo", detail: "Segue o cursor" },
      { x: 50, y: 50, label: "Sorriso de l\u00e3", detail: "Cosido com fio vermelho" }
    ]
  },
  {
    id: "matisse",
    title: "Forma Azul (pend\u00edculo)",
    artist: "Miguel",
    age: 6,
    year: 2026,
    signature: "Miguel Matisse",
    src: "assets/art/matisse/photo.jpeg",
    w: 3334, h: 3349,
    bg: "#b09778",
    palette: ["#1f8fd4", "#b09778", "#9a8466"],
    anim: "matisse",
    dots: [
      { x: 45, y: 35, label: "Recorte", detail: "Tesoura e papel" },
      { x: 45, y: 5, label: "Fio", detail: "Pendurado no ar" }
    ]
  },
  {
    id: "eraumavez",
    title: "Era Uma Vez\u2026",
    artist: "Miguel",
    age: 6,
    year: 2026,
    signature: "Miguel",
    src: "assets/art/eraumavez/photo.jpeg",
    w: 3942, h: 5180,
    bg: "#f1ece1",
    palette: ["#d07682", "#1a3a8a", "#e6c12a", "#f1ece1"],
    anim: "story",
    dots: [
      { x: 15, y: 35, label: "Gato cor-de-rosa", detail: "Tem bigodes" },
      { x: 45, y: 30, label: "Cobra azul", detail: "Com l\u00edngua de fora" },
      { x: 80, y: 35, label: "Castelo", detail: "Onde mora a princesa" },
      { x: 50, y: 85, label: "Girafa amarela", detail: "Toca no arco-\u00edris" }
    ]
  },
  {
    id: "clay",
    title: "Gato de Barro",
    artist: "Miguel",
    age: 6,
    year: 2026,
    signature: "Miguel Bragan\u00e7a",
    src: "assets/art/clay/photo.jpeg",
    w: 3140, h: 4500,
    bg: "#c0a079",
    palette: ["#c87b66", "#c0a079", "#9d6552"],
    anim: "palitos",
    medium: "Barro e palitos",
    dots: [
      { x: 50, y: 25, label: "Cara de gato", detail: "Orelhas e olhos" },
      { x: 50, y: 55, label: "Bra\u00e7os de palito", detail: "Espetados no corpo" },
      { x: 80, y: 88, label: "Bolinhas extra", detail: "Sobrou barro" }
    ]
  },
  {
    id: "warhol",
    title: "Auto-Retrato Pop",
    artist: "Miguel",
    age: 6,
    year: 2026,
    signature: "Miguel \u00b7 \u00e0 maneira de Andy Warhol",
    src: "assets/art/warhol/photo.jpeg",
    w: 3596, h: 5198,
    bg: "#ec3a8a",
    palette: ["#ec3a8a", "#f7d54a", "#3aa46a", "#f08a2a", "#2a6fd8", "#a04acb"],
    anim: "warhol",
    dots: [
      { x: 26, y: 26, label: "Rosa choque", detail: "Cabelo vermelho, sobrancelhas azuis" },
      { x: 74, y: 26, label: "Amarelo limonada", detail: "Cabelo verde, boca vermelha" },
      { x: 26, y: 74, label: "Verde relva", detail: "Cabelo verde, boca verde" },
      { x: 74, y: 74, label: "Laranja pop", detail: "Cabelo azul, boca azul" }
    ]
  },
  {
    id: "mbappe",
    title: "Composi\u00e7\u00e3o Livre (Mbap\u00e9)",
    artist: "Miguel",
    age: 6,
    year: 2026,
    signature: "Miguel",
    src: "assets/art/mbappe/photo.jpeg",
    w: 3737, h: 4961,
    bg: "#c1181f",
    palette: ["#c1181f", "#1f7a3a", "#f1ece1", "#1a2a5a", "#d68a6a"],
    anim: "relogio",
    medium: "Recorte e colagem",
    dots: [
      { x: 26, y: 27, label: "Audemars Piguet", detail: "O rel\u00f3gio que o Mbap\u00e9 usa" },
      { x: 65, y: 22, label: "A casa de f\u00e9rias", detail: "Onde estaciona o carro" },
      { x: 65, y: 56, label: "M B A P", detail: "Escrito com tinta azul" },
      { x: 35, y: 85, label: "Lou\u00e7a", detail: "Recortada de uma revista" }
    ]
  },
  {
    id: "manuelfigure",
    title: "O Maestro de Bon\u00e9 Preto",
    artist: "Manuel",
    age: 7,
    year: 2026,
    signature: "Manuel",
    src: "assets/art/manuelfigure/photo.jpeg",
    w: 2223, h: 2682,
    bg: "#e8d96a",
    palette: ["#1f8a4a", "#1a1a1a", "#e8d96a", "#c8211c", "#7a3a1f"],
    anim: "jogador",
    dots: [
      { x: 50, y: 28, label: "Bon\u00e9 preto", detail: "Sempre na cabe\u00e7a" },
      { x: 27, y: 55, label: "M\u00e3o esquerda", detail: "Levantada para sa\u00fadar" },
      { x: 73, y: 55, label: "M\u00e3o direita", detail: "A acenar tamb\u00e9m" },
      { x: 50, y: 50, label: "Camisola \u00e0s riscas", detail: "Verde e branca" }
    ]
  },
  {
    id: "luna",
    title: "LUNA",
    artist: "Manuel",
    age: 7,
    year: 2026,
    signature: "Manuel",
    src: "assets/art/luna/photo.jpeg",
    w: 777, h: 3608,
    bg: "#82ab8b",
    palette: ["#4f6ed1", "#d75441", "#e6c12a", "#82ab8b", "#cf6673"],
    anim: "luna",
    dots: [
      { x: 50, y: 5, label: "A lua", detail: "Pintura salpicada" },
      { x: 50, y: 30, label: "Tiras azuis", detail: "Papel de seda" },
      { x: 50, y: 55, label: "Renda branca", detail: "Doily da cozinha" },
      { x: 50, y: 85, label: "Janela vermelha", detail: "Casa com M" }
    ]
  },
  {
    id: "diadamae",
    title: "Dia da M\u00e3e 2026",
    artist: "Muna",
    age: 4,
    year: 2026,
    signature: "Muna",
    src: "assets/art/diadamae/photo.jpeg",
    w: 2363, h: 3655,
    bg: "#d18aa8",
    palette: ["#d18aa8", "#f7d54a", "#ec3a2a", "#8db97f", "#3980e6", "#a04acb"],
    anim: "rainbow",
    interactive: "paint-rainbow",
    dots: [
      { x: 80, y: 12, label: "Sol", detail: "Sempre a brilhar" },
      { x: 30, y: 70, label: "O artista", detail: "A pintar o c\u00e9u" },
      { x: 50, y: 35, label: "Arco-\u00edris", detail: "Toca para pintar!" }
    ]
  },
  {
    id: "portal",
    title: "Um Portal Para a Minha Cabeça",
    artist: "Miguel",
    age: 6,
    year: 2026,
    signature: "Miguel",
    src: "assets/art/portal/photo.jpeg",
    w: 1500, h: 1110,
    bg: "#4bae6a",
    palette: ["#4bae6a", "#c06921", "#21529d", "#c8321e", "#7a4510"],
    anim: "portal",
    dots: [
      { x: 66, y: 52, label: "O portal", detail: "Cor de chocolate" },
      { x: 13, y: 38, label: "Risco azul", detail: "Forte, forte, forte" },
      { x: 88, y: 30, label: "Rabisco vermelho", detail: "Cor de fogo" },
      { x: 50, y: 95, label: "O carimbo", detail: "Inventarte 26/27" }
    ]
  },
  {
    id: "casaaranhas",
    title: "Uma Casa das Aranhas",
    artist: "Muna",
    age: 4,
    year: 2026,
    signature: "Muna",
    src: "assets/art/casaaranhas/photo.jpeg",
    w: 1500, h: 1119,
    bg: "#abd464",
    palette: ["#abd464", "#d8281e", "#ec871e", "#7eb0ce", "#5b3b2a"],
    anim: "teia",
    dots: [
      { x: 30, y: 65, label: "A casa", detail: "Onde moram as aranhas" },
      { x: 62, y: 60, label: "Teia vermelha", detail: "Voltas e mais voltas" },
      { x: 70, y: 27, label: "Teia laranja", detail: "Cor de sol" },
      { x: 36, y: 8, label: "O carimbo", detail: "Inventarte 26/27" }
    ]
  },
  {
    id: "rasgacola",
    title: "Rasga, Cola e Descola!",
    artist: "Miguel",
    age: 6,
    year: 2026,
    signature: "Miguel",
    src: "assets/art/rasgacola/photo.jpeg",
    w: 1439, h: 2000,
    bg: "#c8b898",
    palette: ["#c8b898", "#b58958", "#899175", "#9d695b", "#5d503d"],
    medium: "Colagem",
    anim: "rasgacola",
    dots: [
      { x: 50, y: 11, label: "O título", detail: "Escrito à máquina" },
      { x: 43, y: 36, label: "O rosa", detail: "Um pedaço rasgado" },
      { x: 48, y: 62, label: "O lilás", detail: "Pintado à aguarela" },
      { x: 86, y: 84, label: "O castanho", detail: "Cola e descola" }
    ]
  },
  {
    id: "meiodemim",
    title: "1/2 de Mim",
    artist: "Miguel",
    age: 6,
    year: 2026,
    signature: "Miguel",
    src: "assets/art/meiodemim/photo.jpeg",
    w: 2000, h: 1345,
    bg: "#b8a888",
    palette: ["#b8a888", "#e0601c", "#56120f", "#8e846d", "#a9a83a"],
    medium: "Cera e fotografia",
    anim: "meiodemim",
    dots: [
      { x: 20, y: 12, label: "O cabelo", detail: "Rabiscos a voar" },
      { x: 23, y: 80, label: "A língua", detail: "Vermelha, a sair" },
      { x: 67.5, y: 48, label: "O outro lado", detail: "Metade fotografia" },
      { x: 93, y: 96, label: "O carimbo", detail: "Inventarte" }
    ]
  },
  {
    id: "maemargarida",
    title: "Mãe Margarida",
    artist: "Miguel",
    age: 6,
    year: 2026,
    signature: "Miguel",
    src: "assets/art/maemargarida/photo.jpeg",
    w: 1368, h: 2000,
    bg: "#a41302",
    palette: ["#a41302", "#d8c8a8", "#a17b3e", "#706246", "#1c1c1c"],
    medium: "Colagem",
    anim: "maemargarida",
    dots: [
      { x: 58, y: 13, label: "Corações de cartão", detail: "Recortados à mão" },
      { x: 66.4, y: 50, label: "O olho verdadeiro", detail: "Recortado de uma fotografia" },
      { x: 22, y: 39.5, label: "O outro olho", detail: "Desenhado com pestanas" },
      { x: 42, y: 62.5, label: "O sorriso", detail: "Traços cruzados a lápis" }
    ]
  },
  {
    id: "agentesecreto",
    title: "Agente Secreto",
    artist: "Miguel",
    age: 6,
    year: 2026,
    signature: "Miguel",
    src: "assets/art/agentesecreto/photo.jpeg",
    w: 2000, h: 1155,
    bg: "#d8c8a8",
    palette: ["#d8c8a8", "#c8b898", "#98927e", "#712a24", "#7d643c"],
    medium: "Colagem e cartão",
    anim: "agentesecreto",
    dots: [
      { x: 14, y: 32, label: "O bigode", detail: "Disfarce de agente" },
      { x: 22, y: 48, label: "Top Secret", detail: "Carimbado no processo" },
      { x: 40, y: 25, label: "Rabiscos vermelhos", detail: "Segredos por decifrar" },
      { x: 85, y: 48, label: "A lupa", detail: "Feita de cartão" }
    ]
  },
  {
    id: "sernormal",
    title: "Ser Diferente É Normal",
    artist: "Muna",
    age: 4,
    year: 2026,
    signature: "Muna",
    src: "assets/art/sernormal/photo.jpeg",
    w: 2000, h: 1390,
    bg: "#5b6f82",
    palette: ["#5b6f82", "#b88087", "#8d3030", "#513623", "#412330"],
    anim: "palitos",
    dots: [
      { x: 27, y: 50, label: "O ursinho", detail: "De orelhas redondas" },
      { x: 50, y: 36, label: "Cara amarela", detail: "Sorri de lado" },
      { x: 79, y: 25, label: "Orelhas roxas", detail: "Quase um coelho" },
      { x: 66, y: 94, label: "A frase", detail: "Ser diferente é normal" }
    ]
  },
  {
    id: "outono",
    title: "Duas Árvores de Outono",
    artist: "Muna",
    age: 4,
    year: 2026,
    signature: "Muna",
    src: "assets/art/outono/photo.jpeg",
    w: 2000, h: 1428,
    bg: "#6b4a34",
    palette: ["#6b4a34", "#6daa65", "#3d7544", "#4c874f", "#526046"],
    anim: "outono",
    dots: [
      { x: 24, y: 22, label: "Folhas verdes", detail: "Pinceladas largas" },
      { x: 38, y: 62, label: "O tronco", detail: "Castanho até ao fundo" },
      { x: 82, y: 55, label: "Árvore pelada", detail: "Já sem uma folha" },
      { x: 56, y: 95, label: "A assinatura", detail: "Com a data de hoje" }
    ]
  }
];

// Hallway sequence — order pieces appear on the wall.
window.HALLWAY_ORDER = [
  "miro", "vangogh", "warhol", "portrait", "matisse",
  "mbappe", "luna", "manuelfigure", "eraumavez", "diadamae", "clay",
  "portal", "casaaranhas",
  "rasgacola", "meiodemim", "maemargarida", "agentesecreto",
  "sernormal", "outono"
];
