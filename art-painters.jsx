// ============================================================
// FMB / ART — "À maneira dos mestres"
// Painter-identity treatments. Each wraps ANY uploaded drawing
// in the unmistakable visual language of a master — the same
// idea as the Warhol piece-animation, but reusable on any art.
//
// Same contract: component receives { art }, uses art.src /
// art.palette / art.bg only. Appends to window.ANIMS and
// window.TEMPLATE_LIBRARY (group: "mestres").
// ============================================================

const { useState: mState, useEffect: mEffect, useRef: mRef, useId: mId } = React;

// ============================================================
// MONDRIAN — De Stijl grid of black bars + primary blocks
// ============================================================
function MondrianAnimation({ art }) {
  const PRIMARIES = ["#d42a21", "#f5d014", "#1f53b0", "#f4efe6"];
  // fixed cells that sit ON TOP of the art; null = window onto the art
  const initial = [
    { x: 0, y: 0, w: 22, h: 30, c: "#d42a21" },
    { x: 78, y: 0, w: 22, h: 18, c: null },
    { x: 78, y: 18, w: 22, h: 50, c: "#1f53b0" },
    { x: 0, y: 68, w: 22, h: 32, c: "#f5d014" },
    { x: 55, y: 68, w: 23, h: 32, c: null },
    { x: 22, y: 0, w: 33, h: 30, c: null }
  ];
  const [cells, setCells] = mState(initial);
  const lines = { v: [22, 55, 78], h: [30, 68] };

  const cycle = (i) => (e) => {
    e.stopPropagation();
    setCells((cs) => cs.map((cell, j) => {
      if (j !== i) return cell;
      const order = [null, ...PRIMARIES];
      const idx = order.indexOf(cell.c);
      return { ...cell, c: order[(idx + 1) % order.length] };
    }));
  };

  return (
    <div className="tpl-layer tpl-mondrian" style={{ background: "#f4efe6" }} aria-hidden>
      <img src={art.src} alt="" className="tpl-img" />
      {cells.map((cell, i) => (
        <div key={i} className="mond-cell" onClick={cycle(i)} style={{
          left: `${cell.x}%`, top: `${cell.y}%`, width: `${cell.w}%`, height: `${cell.h}%`,
          background: cell.c || "transparent",
          animationDelay: `${i * 90}ms`
        }} />
      ))}
      {lines.v.map((x, i) => <span key={"v" + i} className="mond-line mond-v" style={{ left: `${x}%`, animationDelay: `${i * 80}ms` }} />)}
      {lines.h.map((y, i) => <span key={"h" + i} className="mond-line mond-h" style={{ top: `${y}%`, animationDelay: `${120 + i * 80}ms` }} />)}
      <span className="mond-line mond-v" style={{ left: "0%" }} />
      <span className="mond-line mond-v" style={{ left: "100%" }} />
      <span className="mond-line mond-h" style={{ top: "0%" }} />
      <span className="mond-line mond-h" style={{ top: "100%" }} />
      <div className="tpl-hint">toca nos blocos · à maneira de Mondrian</div>
    </div>
  );
}

// ============================================================
// PICASSO — Cubist planes shift out of register
// ============================================================
const CUBI_PLANES = [
  { clip: "polygon(0 0, 45% 0, 34% 50%, 0 62%)",        ox: -3, oy: -2, r: -3 },
  { clip: "polygon(45% 0, 100% 0, 100% 42%, 34% 50%)",  ox: 4,  oy: -3, r: 2 },
  { clip: "polygon(0 62%, 34% 50%, 56% 100%, 0 100%)",  ox: -4, oy: 3,  r: 3 },
  { clip: "polygon(34% 50%, 100% 42%, 80% 74%, 56% 100%)", ox: 3, oy: 4, r: -2 },
  { clip: "polygon(100% 42%, 100% 100%, 80% 74%)",      ox: 5,  oy: 2,  r: 4 },
  { clip: "polygon(30% 28%, 68% 32%, 60% 72%, 30% 68%)", ox: -2, oy: -4, r: -5 }
];

function PicassoAnimation({ art }) {
  // Interaction-driven: a slight permanent offset reads "cubist",
  // a tap fractures the planes apart and they ease back together.
  const [k, setK] = mState(1);
  const timer = mRef(0);
  const burst = (e) => {
    e.stopPropagation();
    setK(3.4);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setK(1), 1400);
  };
  mEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="tpl-layer tpl-picasso" onClick={burst}
      style={{ background: art.bg || "#2a2722" }} aria-hidden>
      {CUBI_PLANES.map((p, i) => (
        <div key={i} className="cubi-plane" style={{
          clipPath: p.clip, WebkitClipPath: p.clip,
          backgroundImage: `url(${art.src})`,
          transform: `translate(${p.ox * k}%, ${p.oy * k}%) rotate(${p.r * (k / 2)}deg)`
        }} />
      ))}
      <div className="tpl-hint">toca para fragmentar · à maneira de Picasso</div>
    </div>
  );
}

// ============================================================
// POLLOCK — action drips splatter across the drawing
// ============================================================
function PollockAnimation({ art }) {
  const ref = mRef(null);
  const palette = (art.palette && art.palette.length ? art.palette : ["#e9d24a", "#c8211c", "#1a1a1a", "#f4efe6"]);
  const make = (x, y) => ({
    key: Math.random(),
    x, y,
    size: 18 + Math.random() * 70,
    col: palette[Math.floor(Math.random() * palette.length)],
    rot: Math.random() * 360,
    drip: 10 + Math.random() * 60
  });
  const seed = () => Array.from({ length: 22 }, () => make(Math.random() * 100, Math.random() * 100));
  const [blobs, setBlobs] = mState(seed);

  const fling = (e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    const x = ((t.clientX - r.left) / r.width) * 100;
    const y = ((t.clientY - r.top) / r.height) * 100;
    const burst = Array.from({ length: 6 }, () =>
      make(x + (Math.random() - 0.5) * 26, y + (Math.random() - 0.5) * 26));
    setBlobs((b) => [...b.slice(-60), ...burst]);
  };

  return (
    <div className="tpl-layer tpl-pollock" ref={ref} onClick={fling}
      style={{ background: art.bg || "#15110c" }} aria-hidden>
      <img src={art.src} alt="" className="tpl-img pollock-base" />
      {blobs.map((b) => (
        <span key={b.key} className="pollock-blob" style={{
          left: `${b.x}%`, top: `${b.y}%`,
          width: `${b.size}px`, height: `${b.size}px`,
          background: b.col,
          transform: `translate(-50%, -50%) rotate(${b.rot}deg)`,
          "--drip": `${b.drip}px`,
          boxShadow: `${b.size * 0.4}px ${b.size * 0.2}px 0 ${-b.size * 0.32}px ${b.col}, ${-b.size * 0.3}px ${b.size * 0.35}px 0 ${-b.size * 0.36}px ${b.col}`
        }} />
      ))}
      <div className="tpl-hint">toca para salpicar · à maneira de Pollock</div>
    </div>
  );
}

// ============================================================
// KUSAMA — infinity polka dots multiply over the drawing
// ============================================================
function KusamaAnimation({ art }) {
  const ref = mRef(null);
  const [extra, setExtra] = mState([]);
  const spawn = (e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    const cx = ((t.clientX - r.left) / r.width) * 100;
    const cy = ((t.clientY - r.top) / r.height) * 100;
    const cluster = Array.from({ length: 7 }, () => ({
      key: Math.random(),
      x: cx + (Math.random() - 0.5) * 24,
      y: cy + (Math.random() - 0.5) * 24,
      s: 6 + Math.random() * 26,
      d: Math.random() * 0.4
    }));
    setExtra((p) => [...p.slice(-80), ...cluster]);
  };
  return (
    <div className="tpl-layer tpl-kusama" ref={ref} onClick={spawn}
      style={{ background: "#c01818" }} aria-hidden>
      <img src={art.src} alt="" className="tpl-img kusama-base" />
      <div className="kusama-field" />
      {extra.map((d) => (
        <span key={d.key} className="kusama-dot" style={{
          left: `${d.x}%`, top: `${d.y}%`,
          width: `${d.s}px`, height: `${d.s}px`,
          animationDelay: `${d.d}s`
        }} />
      ))}
      <div className="tpl-hint">toca para multiplicar · à maneira de Kusama</div>
    </div>
  );
}

// ============================================================
// VAN GOGH — swirling impasto sky + drifting stars
// ============================================================
function VanGoghSwirlAnimation({ art }) {
  const rawId = mId();
  const fid = "vg-" + rawId.replace(/[:]/g, "");
  const stars = Array.from({ length: 11 }, (_, i) => ({
    x: (i * 23 + 9) % 96, y: (i * 31 + 7) % 88, s: 8 + (i % 4) * 7, d: (i * 0.4) % 3.5
  }));
  return (
    <div className="tpl-layer tpl-vangogh" style={{ background: "#0b1d3a" }} aria-hidden>
      <svg className="ripple-defs" width="0" height="0" aria-hidden>
        <filter id={fid} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="turbulence" baseFrequency="0.011 0.016" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="22" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <img src={art.src} alt="" className="tpl-img vg-img" style={{ filter: `url(#${fid})` }} />
      <div className="vg-swirl" />
      <div className="vg-swirl vg-swirl-2" />
      {stars.map((s, i) => (
        <span key={i} className="vg-star" style={{
          left: `${s.x}%`, top: `${s.y}%`, width: `${s.s}px`, height: `${s.s}px`,
          animationDelay: `${s.d}s`
        }} />
      ))}
      <div className="tpl-hint">à maneira de Van Gogh 🌙</div>
    </div>
  );
}

// ============================================================
// KLIMT — gold-leaf ornament + shimmering sweep
// ============================================================
function KlimtAnimation({ art }) {
  const [shimmer, setShimmer] = mState(0);
  const flash = (e) => { e.stopPropagation(); setShimmer((s) => s + 1); };
  return (
    <div className="tpl-layer tpl-klimt" onClick={flash}
      style={{ background: "#1c1505" }} aria-hidden>
      <img src={art.src} alt="" className="tpl-img klimt-img" />
      <div className="klimt-ornament" />
      <div className="klimt-spirals" />
      <div key={shimmer} className="klimt-sheen" />
      <div className="klimt-frame" />
      <div className="tpl-hint">toca para brilhar · à maneira de Klimt</div>
    </div>
  );
}

// ============================================================
// KEITH HARING — pop frame that bounces inside radiating energy
// ============================================================
function HaringAnimation({ art }) {
  const BGS = ["#f5c518", "#e8402a", "#1f9e57", "#2056c8", "#ec5fa6"];
  const [bg, setBg] = mState(0);
  const dashes = Array.from({ length: 18 }, (_, i) => i);
  const cycle = (e) => { e.stopPropagation(); setBg((b) => (b + 1) % BGS.length); };
  return (
    <div className="tpl-layer tpl-haring" onClick={cycle}
      style={{ background: BGS[bg] }} aria-hidden>
      <div className="haring-rays">
        {dashes.map((i) => (
          <span key={i} className="haring-dash" style={{
            transform: `rotate(${(360 / dashes.length) * i}deg) translateY(-128px)`,
            animationDelay: `${(i % 6) * 0.12}s`
          }} />
        ))}
      </div>
      <div className="haring-frame">
        <img src={art.src} alt="" className="tpl-img" />
      </div>
      <div className="tpl-hint">toca para mudar a cor · à maneira de Haring</div>
    </div>
  );
}

// ============================================================
// LICHTENSTEIN — Ben-Day dots + comic burst word
// ============================================================
const LICH_WORDS = ["POP!", "WHAM!", "ZÁS!", "BOOM!", "ARTE!"];
function LichtensteinAnimation({ art }) {
  const [w, setW] = mState(0);
  const bump = (e) => { e.stopPropagation(); setW((v) => (v + 1) % LICH_WORDS.length); };
  return (
    <div className="tpl-layer tpl-lich" onClick={bump}
      style={{ background: "#f5d014" }} aria-hidden>
      <img src={art.src} alt="" className="tpl-img lich-img" />
      <div className="lich-dots" />
      <div className="lich-frame" />
      <div key={w} className="lich-burst">
        <span className="lich-word">{LICH_WORDS[w]}</span>
      </div>
      <div className="tpl-hint">toca para o balão · à maneira de Lichtenstein</div>
    </div>
  );
}

// ============================================================
// Export — merge into the shared registries
// ============================================================
window.ANIMS = Object.assign({}, window.ANIMS, {
  mondrian: MondrianAnimation,
  picasso: PicassoAnimation,
  pollock: PollockAnimation,
  kusama: KusamaAnimation,
  vangoghswirl: VanGoghSwirlAnimation,
  klimt: KlimtAnimation,
  haring: HaringAnimation,
  lichtenstein: LichtensteinAnimation
});

window.TEMPLATE_LIBRARY = (window.TEMPLATE_LIBRARY || []).concat([
  {
    id: "mondrian", anim: "mondrian", name: "Mondrian", en: "De Stijl", group: "mestres",
    interaction: "Toca nos blocos",
    concept: "Linhas pretas e blocos de vermelho, azul e amarelo cobrem a obra como uma composição de Mondrian."
  },
  {
    id: "picasso", anim: "picasso", name: "Picasso", en: "Cubismo", group: "mestres",
    interaction: "Toca para fragmentar",
    concept: "A obra parte-se em planos angulares que saem de registo, à maneira do cubismo de Picasso."
  },
  {
    id: "pollock", anim: "pollock", name: "Pollock", en: "Action Painting", group: "mestres",
    interaction: "Toca para salpicar",
    concept: "Salpicos e fios de tinta voam sobre o desenho; cada toque atira mais pintura, como Jackson Pollock."
  },
  {
    id: "kusama", anim: "kusama", name: "Kusama", en: "Infinity Dots", group: "mestres",
    interaction: "Toca para multiplicar",
    concept: "Bolinhas infinitas multiplicam-se sobre a obra num fundo vermelho, à maneira de Yayoi Kusama."
  },
  {
    id: "vangoghswirl", anim: "vangoghswirl", name: "Van Gogh", en: "Noite Estrelada", group: "mestres",
    interaction: "Automático",
    concept: "O desenho redemoinha em pinceladas e estrelas brilhantes, como a Noite Estrelada de Van Gogh."
  },
  {
    id: "klimt", anim: "klimt", name: "Klimt", en: "Folha de Ouro", group: "mestres",
    interaction: "Toca para brilhar",
    concept: "Ornamentos e espirais de ouro envolvem a obra com um brilho de folha dourada, à maneira de Klimt."
  },
  {
    id: "haring", anim: "haring", name: "Haring", en: "Pop Energy", group: "mestres",
    interaction: "Toca para mudar a cor",
    concept: "A obra salta dentro de raios de energia sobre cores berrantes, à maneira de Keith Haring."
  },
  {
    id: "lichtenstein", anim: "lichtenstein", name: "Lichtenstein", en: "Ben-Day", group: "mestres",
    interaction: "Toca para o balão",
    concept: "Pontos Ben-Day e um balão de banda desenhada transformam a obra em pop-art de Lichtenstein."
  }
]);

Object.assign(window, {
  MondrianAnimation, PicassoAnimation, PollockAnimation, KusamaAnimation,
  VanGoghSwirlAnimation, KlimtAnimation, HaringAnimation, LichtensteinAnimation
});
