// Artwork data — drop in new entries to extend the museum.
// `aspect` is height/width (used to size frames on the wall).
// `dots` are tap-to-discover details (x,y are % of image).
// `anim` picks an animation routine in gallery-core.jsx.
window.ART = [
  {
    id: "miro",
    title: "O Senhor Vermelho",
    artist: "Miguel",
    age: 6,
    year: 2026,
    signature: "Miguel Miró",
    src: "assets/art/miguel-miro.jpeg",
    w: 3648, h: 4799,
    bg: "#1a5a9a",
    palette: ["#b9261c", "#1a5a9a", "#e9d24a", "#f4ede0", "#0d1d33"],
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
    src: "assets/art/miguel-van-gogh.jpeg",
    w: 3600, h: 5159,
    bg: "#d9b04a",
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
    src: "assets/art/self-portrait.jpeg",
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
    src: "assets/art/matisse.jpeg",
    w: 3334, h: 3349,
    bg: "#bda582",
    palette: ["#1f8fd4", "#bda582", "#9a8466"],
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
    src: "assets/art/era-uma-vez.jpeg",
    w: 3942, h: 5180,
    bg: "#f1ece1",
    palette: ["#ec6aa3", "#1a3a8a", "#e6c12a", "#f1ece1"],
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
    src: "assets/art/clay-sculpture.jpeg",
    w: 3140, h: 4500,
    bg: "#c0a079",
    palette: ["#c87b66", "#c0a079", "#9d6552"],
    anim: "sculpture",
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
    src: "assets/art/miguel-warhol.jpeg",
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
    src: "assets/art/miguel-mbappe.jpeg",
    w: 3737, h: 4961,
    bg: "#c8211c",
    palette: ["#c8211c", "#1f7a3a", "#f1ece1", "#1a2a5a", "#d68a6a"],
    anim: "mbappe",
    medium: "Recorte e colagem",
    dots: [
      { x: 32, y: 30, label: "Audemars Piguet", detail: "O rel\u00f3gio que o Mbap\u00e9 usa" },
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
    src: "assets/art/manuel-figure.jpeg",
    w: 2223, h: 2682,
    bg: "#e8f0e0",
    palette: ["#1f8a4a", "#1a1a1a", "#e8d96a", "#c8211c", "#7a3a1f"],
    anim: "maestro",
    dots: [
      { x: 50, y: 28, label: "Bon\u00e9 preto", detail: "Sempre na cabe\u00e7a" },
      { x: 27, y: 55, label: "M\u00e3o esquerda", detail: "Levantada para sa\u00fadar" },
      { x: 73, y: 55, label: "M\u00e3o direita", detail: "A acenar tamb\u00e9m" },
      { x: 50, y: 60, label: "Camisola \u00e0s riscas", detail: "Verde e branca" }
    ]
  },
  {
    id: "luna",
    title: "LUNA",
    artist: "Manuel",
    age: 7,
    year: 2026,
    signature: "Manuel",
    src: "assets/art/luna.jpeg",
    w: 777, h: 3608,
    bg: "#f4efe2",
    palette: ["#2a6fd8", "#ec3a2a", "#e6c12a", "#3aa46a", "#ec6aa3"],
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
    src: "assets/art/dia-da-mae.jpeg",
    w: 2363, h: 3655,
    bg: "#f2c7d9",
    palette: ["#e9a0bd", "#f7d54a", "#ec3a2a", "#3aa46a", "#5a78d8", "#a04acb"],
    anim: "rainbow",
    interactive: "paint-rainbow",
    dots: [
      { x: 80, y: 12, label: "Sol", detail: "Sempre a brilhar" },
      { x: 30, y: 70, label: "O artista", detail: "A pintar o c\u00e9u" },
      { x: 50, y: 35, label: "Arco-\u00edris", detail: "Toca para pintar!" }
    ]
  }
];

// Hallway sequence — order pieces appear on the wall.
window.HALLWAY_ORDER = [
  "miro", "vangogh", "warhol", "portrait", "matisse",
  "mbappe", "luna", "manuelfigure", "eraumavez", "diadamae", "clay"
];
