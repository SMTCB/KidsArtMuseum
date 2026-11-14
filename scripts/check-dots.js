// Fails if a discovery dot (the numbered markers) sits on top of an animated spot.
// Rule: ART_GUIDE §6. The animation is the surprise; a number on top of it hides it.
//
// SPOTS lists, per artwork id, the boxes (% of the image: l, t, w, h) where the routine
// draws something that moves. They mirror the constants in art-animations.jsx; when you
// re-measure a routine there, update the entry here. Usage: node scripts/check-dots.js
const fs = require("fs");
const path = require("path");
global.window = {};
require(path.join(__dirname, "..", "art-data.js"));
const ART = global.window.ART;
const byId = Object.fromEntries(ART.map((a) => [a.id, a]));

const MARGIN = 4; // % of the image kept clear around each box, so the number never touches it


const SPOTS = {
  rasgacola: [
    { l: 63.1, t: 19.9, w: 29.0, h: 10.0 }, { l: 60.3, t: 31.8, w: 29.3, h: 10.5 },
    { l: 69.8, t: 49.3, w: 30.2, h: 20.0 }, { l: 46.2, t: 71.8, w: 28.5, h: 15.5 }
  ],
  meiodemim: [[15.6, 44.0], [27.6, 45.1]].map(([cx, cy]) => {
    const r = 3.3, hh = r * byId.meiodemim.w / byId.meiodemim.h;
    return { l: cx - r, t: cy - hh, w: 2 * r, h: 2 * hh };
  }),
  maemargarida: [{ l: 58.3, t: 35.3, w: 16.2, h: 9.0 }],
  agentesecreto: [[84.5, 27], [62, 36], [50, 52], [58, 66]].map(([cx, cy]) => {
    const r = 7, hh = r * byId.agentesecreto.w / byId.agentesecreto.h;
    return { l: cx - r, t: cy - hh, w: 2 * r, h: 2 * hh };
  }),
  manuelfigure: (() => {
    // the ball's path, sampled between waypoints; each sample is a box the size of the ball
    const a = byId.manuelfigure, d = 11, hh = d * a.w / a.h;
    const P = [[41, 81], [53, 60], [68, 79], [69, 73], [70, 80], [54, 62], [41, 81]];
    const out = [];
    for (let i = 0; i < P.length - 1; i++)
      for (let t = 0; t <= 1; t += 0.1)
        out.push({ l: P[i][0] + (P[i + 1][0] - P[i][0]) * t - d / 2, t: P[i][1] + (P[i + 1][1] - P[i][1]) * t - hh / 2, w: d, h: hh });
    return out;
  })(),
  sernormal: [{ l: 58.75, t: 40.6, w: 14.85, h: 7.55 }, { l: 77.8, t: 35.6, w: 13.7, h: 10.1 }],
  outono: (() => {
    // buds are ~6% long; each fall is sampled along its path, as boxes the size of a leaf
    const a = byId.outono, W = a.w, H = a.h, d = 100 * 110 / W, hh = 100 * 110 / H;
    const out = [];
    [[170, 110], [400, 62], [800, 55], [990, 300], [135, 260]].forEach(([x, y]) => out.push({ l: 100 * (x - 110) / W, t: 100 * (y - 110) / H, w: 2 * d, h: 2 * hh }));
    [[1470, 290, -170, 860], [1470, 290, -110, 840], [1830, 335, 80, 800]].forEach(([x, y, dx, dy]) => {
      for (let t = 0; t <= 1.001; t += 0.1) out.push({ l: 100 * (x + dx * t - 110) / W, t: 100 * (y + dy * t - 110) / H, w: 2 * d, h: 2 * hh });
    });
    return out;
  })(),
  floresta: [{ l: 10.15, t: 6.07, w: 43.85, h: 52.93 }],
  outonomuna: [
    { l: 52.05, t: 55.87, w: 4.55, h: 11.2 }, { l: 56.6, t: 57.67, w: 4.7, h: 9.4 },
    { l: 66.55, t: 55.67, w: 5.05, h: 10.87 }, { l: 39.8, t: 43.8, w: 7.55, h: 22.87 },
    { l: 22.25, t: 5.33, w: 23.15, h: 61.73 }
  ],
  // head and tail, plus room for their sweep as they turn
  passaro: [{ l: 18.35, t: 65.87, w: 10.15, h: 15.67 }, { l: 37.85, t: 63.87, w: 8.95, h: 14.6 }],
  // the line's sweep, 8.5% left to 10% right: head and hair, arms, body, legs
  autoretratomuna: [
    { l: 25.6, t: 6.2, w: 64.4, h: 46.3 }, { l: 10.7, t: 65, w: 79.8, h: 13 },
    { l: 31.3, t: 52, w: 43.7, h: 40 }, { l: 34.9, t: 88, w: 38.8, h: 11.5 }
  ],
  portal: [{ l: 34, t: 30, w: 27, h: 54 }],
  clay: [{ l: 3.5, t: 49, w: 28, h: 3 }, { l: 63, t: 46.5, w: 28, h: 5 }],
  mbappe: [{ l: 36 - 4.8, t: 23.2 - 4.8 * byId.mbappe.w / byId.mbappe.h, w: 9.6, h: 9.6 * byId.mbappe.w / byId.mbappe.h }],
  // piscadela: the yellow eye the lid closes over (PISCADELA_EYE)
  miro: [{ l: 23.2, t: 19.7, w: 16.0, h: 13.6 }],
  // pendulo: the area the cut-out sweeps at ±4.5° about its string, in 5% bands
  matisse: [
    { l: 51.4, t: 3.0, w: 19.1, h: 1.9 }, { l: 39.8, t: 5, w: 33.5, h: 5 }, { l: 34.7, t: 10, w: 39.1, h: 5 },
    { l: 32.0, t: 15, w: 41.4, h: 5 }, { l: 30.5, t: 20, w: 40.8, h: 5 }, { l: 29.4, t: 25, w: 26.0, h: 5 },
    { l: 28.2, t: 30, w: 30.5, h: 5 }, { l: 26.0, t: 35, w: 34.3, h: 5 }, { l: 23.3, t: 40, w: 37.1, h: 5 },
    { l: 20.9, t: 45, w: 38.5, h: 5 }, { l: 18.6, t: 50, w: 37.3, h: 5 }, { l: 17.0, t: 55, w: 31.5, h: 5 },
    { l: 16.9, t: 60, w: 21.6, h: 5 }, { l: 19.3, t: 65, w: 13.7, h: 3.6 }
  ],
  // luar: the glowing ring round the moon (LUAR); the moon itself stays clear
  luna: [{ l: 69, t: 0, w: 31, h: 12 }, { l: 0, t: 11.5, w: 100, h: 6 }, { l: 0, t: 0, w: 9, h: 12 }]
};

let bad = 0;
for (const [id, boxes] of Object.entries(SPOTS)) {
  const art = byId[id];
  if (!art) { console.log(`? ${id}: not in art-data.js`); bad++; continue; }
  art.dots.forEach((d, i) => {
    const hit = boxes.some((b) =>
      d.x > b.l - MARGIN && d.x < b.l + b.w + MARGIN && d.y > b.t - MARGIN && d.y < b.t + b.h + MARGIN);
    if (hit) {
      console.log(`x ${id}: dot ${i + 1} "${d.label}" (${d.x}, ${d.y}) is on an animated spot`);
      bad++;
    }
  });
}
console.log(bad ? `\n${bad} dot(s) on top of an animation` : "dots clear of animated spots");
process.exit(bad ? 1 : 0);
