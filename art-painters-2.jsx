// ============================================================
// FMB / ART — "À maneira dos mestres" (batch 2)
// Ten more painter-identity treatments. Each wraps ANY uploaded
// drawing in the unmistakable visual language of a master, the
// same contract as batch 1: component receives { art }, uses
// art.src / art.palette / art.bg only.
//
// Appends to window.ANIMS and window.TEMPLATE_LIBRARY
// (group: "mestres"). Unique hook aliases (m2*) avoid global
// clashes with the other painter/template files.
// ============================================================

const { useState: m2State, useEffect: m2Effect, useRef: m2Ref, useMemo: m2Memo } = React;

// ============================================================
// MONET — impressionist dappled light, soft & shimmering
// ============================================================
function MonetAnimation({ art }) {
  return (
    <div className="tpl-layer tpl-monet" style={{ background: art.bg || "#b7c8c0" }} aria-hidden>
      <img src={art.src} alt="" className="tpl-img monet-img" />
      <div className="monet-dabs" />
      <div className="monet-haze" />
      <div className="tpl-hint">à maneira de Monet 🌸</div>
    </div>
  );
}

// ============================================================
// SEURAT — pointillism; tap to dissolve into dots
// ============================================================
function SeuratAnimation({ art }) {
  const [dots, setDots] = m2State(true);
  return (
    <div className={"tpl-layer tpl-seurat" + (dots ? " is-dots" : "")}
      onClick={() => setDots((d) => !d)} aria-hidden>
      <img src={art.src} alt="" className="tpl-img seurat-img" />
      <div className="seurat-screen" />
      <div className="seurat-grain" />
      <div className="tpl-hint">{dots ? "toca para juntar os pontos" : "toca para os pontos"} · à maneira de Seurat</div>
    </div>
  );
}

// ============================================================
// MATISSE — paper cut-outs that rearrange on tap
// ============================================================
const MATC_KINDS = ["matc-leaf", "matc-blob", "matc-snake"];
function MatisseCutAnimation({ art }) {
  const palette = (art.palette && art.palette.length)
    ? art.palette
    : ["#e8402a", "#1f7ab0", "#f5c518", "#1f9e57", "#2a2a2a"];
  const makeShapes = () => Array.from({ length: 7 }, (_, i) => ({
    key: Math.random(),
    kind: MATC_KINDS[i % MATC_KINDS.length],
    x: 12 + Math.random() * 76,
    y: 12 + Math.random() * 76,
    s: 60 + Math.random() * 96,
    r: (Math.random() - 0.5) * 80,
    col: palette[i % palette.length]
  }));
  const [shapes, setShapes] = m2State(makeShapes);
  return (
    <div className="tpl-layer tpl-matissecut" onClick={() => setShapes(makeShapes())} aria-hidden>
      <img src={art.src} alt="" className="tpl-img matc-img" />
      {shapes.map((s) => (
        <span key={s.key} className={"matc-shape " + s.kind} style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: `${s.s}px`, height: `${s.s}px`,
          background: s.col, "--r": `${s.r}deg`
        }} />
      ))}
      <div className="tpl-hint">toca para recortar · à maneira de Matisse ✂️</div>
    </div>
  );
}

// ============================================================
// MUNCH — The Scream; wavy anguished sky, automatic
// ============================================================
function MunchAnimation({ art }) {
  return (
    <div className="tpl-layer tpl-munch" aria-hidden>
      <div className="munch-sky" />
      <img src={art.src} alt="" className="tpl-img munch-img" />
      <div className="munch-bands" />
      <div className="tpl-hint">à maneira de Munch 😱</div>
    </div>
  );
}

// ============================================================
// HOKUSAI — The Great Wave; foam + surging blue, tap a wave
// ============================================================
function HokusaiAnimation({ art }) {
  const [surge, setSurge] = m2State(0);
  return (
    <div className="tpl-layer tpl-hokusai" onClick={(e) => { e.stopPropagation(); setSurge((s) => s + 1); }}
      aria-hidden>
      <img src={art.src} alt="" className="tpl-img hok-img" />
      <div className="hok-tint" />
      <div className="hok-wave" />
      <div key={surge} className="hok-foam" />
      <div className="tpl-hint">à maneira de Hokusai 🌊</div>
    </div>
  );
}

// ============================================================
// DALÍ — surrealist melting dream, automatic warp
// ============================================================
function DaliAnimation({ art }) {
  return (
    <div className="tpl-layer tpl-dali" aria-hidden>
      <div className="dali-sky" />
      <div className="dali-shadow" />
      <img src={art.src} alt="" className="tpl-img dali-img" />
      <div className="dali-haze" />
      <div className="tpl-hint">à maneira de Dalí 🕰️</div>
    </div>
  );
}

// ============================================================
// FRIDA KAHLO — folk botanical frame; tap to bloom flowers
// ============================================================
function FridaAnimation({ art }) {
  const FLW = ["#e8402a", "#f25f9e", "#7a3aa0", "#f5a623"];
  // a ring of leaves around the portrait
  const leaves = m2Memo(() => Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2;
    const rad = 40 + (i % 2) * 5;
    return {
      key: "l" + i,
      x: 50 + Math.cos(a) * rad,
      y: 50 + Math.sin(a) * rad * 1.04,
      r: (a * 180) / Math.PI + 90
    };
  }), []);
  const [flowers, setFlowers] = m2State([]);
  const bloom = (e) => {
    const a = Math.random() * Math.PI * 2;
    const rad = 38 + Math.random() * 8;
    const cluster = Array.from({ length: 3 }, () => {
      const aa = a + (Math.random() - 0.5) * 0.8;
      const rr = rad + (Math.random() - 0.5) * 10;
      return {
        key: Math.random(),
        x: 50 + Math.cos(aa) * rr,
        y: 50 + Math.sin(aa) * rr * 1.04,
        s: 26 + Math.random() * 26,
        col: FLW[Math.floor(Math.random() * FLW.length)]
      };
    });
    setFlowers((f) => [...f.slice(-40), ...cluster]);
  };
  return (
    <div className="tpl-layer tpl-frida" onClick={bloom} aria-hidden>
      {leaves.map((l) => (
        <span key={l.key} className="frida-leaf" style={{
          left: `${l.x}%`, top: `${l.y}%`, "--r": `${l.r}deg`
        }} />
      ))}
      <img src={art.src} alt="" className="frida-img" />
      {flowers.map((f) => (
        <span key={f.key} className="frida-flower" style={{
          left: `${f.x}%`, top: `${f.y}%`, "--s": `${f.s}px`, "--pet": f.col
        }} />
      ))}
      <div className="tpl-hint">toca para florir · à maneira de Frida 🌺</div>
    </div>
  );
}

// ============================================================
// BANKSY — stencil street art; tap to spray a colour drip
// ============================================================
function BanksyAnimation({ art }) {
  const ref = m2Ref(null);
  const SPRAY = ["#e8402a", "#f25f9e", "#1f9e57", "#f5a623"];
  const [sprays, setSprays] = m2State([]);
  const spray = (e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    const x = ((t.clientX - r.left) / r.width) * 100;
    const y = ((t.clientY - r.top) / r.height) * 100;
    const col = SPRAY[Math.floor(Math.random() * SPRAY.length)];
    const cluster = Array.from({ length: 5 }, () => ({
      key: Math.random(),
      x: x + (Math.random() - 0.5) * 16,
      y: y + (Math.random() - 0.5) * 16,
      s: 14 + Math.random() * 40,
      col
    }));
    setSprays((s) => [...s.slice(-40), ...cluster]);
  };
  return (
    <div className="tpl-layer tpl-banksy" ref={ref} onClick={spray} aria-hidden>
      <img src={art.src} alt="" className="tpl-img banksy-img" />
      <div className="banksy-grit" />
      {sprays.map((s) => (
        <span key={s.key} className="banksy-spray" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: `${s.s}px`, height: `${s.s}px`, background: s.col
        }} />
      ))}
      <div className="tpl-hint">toca para pintar · à maneira de Banksy 🎨</div>
    </div>
  );
}

// ============================================================
// ROTHKO — luminous colour-field blocks, automatic breathe
// ============================================================
function RothkoAnimation({ art }) {
  const pal = (art.palette && art.palette.length >= 2)
    ? art.palette
    : ["#c8211c", "#e9d24a", "#1a5a9a", "#f4ede0"];
  const blocks = [
    { col: pal[0 % pal.length], top: 6, h: 42, d: "0s" },
    { col: pal[1 % pal.length], top: 52, h: 40, d: "1.2s" },
    { col: pal[2 % pal.length], top: 50, h: 0, d: "0s" }
  ].slice(0, 2);
  return (
    <div className="tpl-layer tpl-rothko" style={{ background: pal[3 % pal.length] || "#3a1410" }} aria-hidden>
      <img src={art.src} alt="" className="tpl-img rothko-img" />
      <div className="rothko-field">
        {blocks.map((b, i) => (
          <div key={i} className="rothko-block" style={{
            top: `${b.top}%`, height: `${b.h}%`, background: b.col, animationDelay: b.d
          }} />
        ))}
      </div>
      <div className="tpl-hint">à maneira de Rothko</div>
    </div>
  );
}

// ============================================================
// BASQUIAT — neo-expressionist scrawl; tap to add crowns & marks
// ============================================================
const BASQ_KINDS = ["crown", "line", "x", "crown", "line"];
function BasquiatAnimation({ art }) {
  const ref = m2Ref(null);
  const COLS = ["#e8402a", "#f4d014", "#1f7ab0", "#1f9e57", "#f4ede0"];
  const seed = () => ([
    { key: "k0", kind: "crown", x: 24, y: 18, r: -8, w: 46, col: "#f4d014" },
    { key: "k1", kind: "line", x: 60, y: 80, r: -6, w: 90, col: "#e8402a" },
    { key: "k2", kind: "x", x: 80, y: 30, r: 0, w: 26, col: "#f4ede0" }
  ]);
  const [marks, setMarks] = m2State(seed);
  const add = (e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    const x = ((t.clientX - r.left) / r.width) * 100;
    const y = ((t.clientY - r.top) / r.height) * 100;
    const kind = BASQ_KINDS[Math.floor(Math.random() * BASQ_KINDS.length)];
    setMarks((m) => [...m.slice(-26), {
      key: Math.random(), kind, x, y,
      r: (Math.random() - 0.5) * 28,
      w: 30 + Math.random() * 70,
      col: COLS[Math.floor(Math.random() * COLS.length)]
    }]);
  };
  return (
    <div className="tpl-layer tpl-basquiat" ref={ref} onClick={add} aria-hidden>
      <img src={art.src} alt="" className="tpl-img basq-img" />
      <div className="basq-frame" />
      {marks.map((m) => (
        <span key={m.key} className={"basq-mark basq-" + m.kind} style={{
          left: `${m.x}%`, top: `${m.y}%`, "--r": `${m.r}deg`,
          "--w": `${m.w}px`, "--col": m.col
        }} />
      ))}
      <div className="tpl-hint">toca para rabiscar · à maneira de Basquiat 👑</div>
    </div>
  );
}

// ============================================================
// Export — merge into the shared registries
// ============================================================
window.ANIMS = Object.assign({}, window.ANIMS, {
  monet: MonetAnimation,
  seurat: SeuratAnimation,
  matissecut: MatisseCutAnimation,
  munch: MunchAnimation,
  hokusai: HokusaiAnimation,
  dali: DaliAnimation,
  frida: FridaAnimation,
  banksy: BanksyAnimation,
  rothko: RothkoAnimation,
  basquiat: BasquiatAnimation
});

window.TEMPLATE_LIBRARY = (window.TEMPLATE_LIBRARY || []).concat([
  {
    id: "monet", anim: "monet", name: "Monet", en: "Impressionismo", group: "mestres",
    interaction: "Automático",
    concept: "Luz trémula e pinceladas soltas envolvem a obra numa bruma de cor, à maneira de Monet."
  },
  {
    id: "seurat", anim: "seurat", name: "Seurat", en: "Pontilhismo", group: "mestres",
    interaction: "Toca para os pontos",
    concept: "A obra desfaz-se em milhares de pontinhos de cor que o olho volta a juntar, à maneira de Seurat."
  },
  {
    id: "matissecut", anim: "matissecut", name: "Matisse", en: "Recortes", group: "mestres",
    interaction: "Toca para recortar",
    concept: "Formas de papel recortado, vivas e orgânicas, dançam sobre o desenho, à maneira de Matisse."
  },
  {
    id: "munch", anim: "munch", name: "Munch", en: "O Grito", group: "mestres",
    interaction: "Automático",
    concept: "Um céu ondulante de laranja e sangue faz a obra vibrar de angústia, como O Grito de Munch."
  },
  {
    id: "hokusai", anim: "hokusai", name: "Hokusai", en: "A Grande Onda", group: "mestres",
    interaction: "Automático",
    concept: "Espuma e ondas azuis de ukiyo-e levantam-se sobre a obra, como A Grande Onda de Hokusai."
  },
  {
    id: "dali", anim: "dali", name: "Dalí", en: "Surrealismo", group: "mestres",
    interaction: "Automático",
    concept: "A obra derrete e deforma-se num sonho desértico, à maneira surrealista de Dalí."
  },
  {
    id: "frida", anim: "frida", name: "Frida Kahlo", en: "Flores", group: "mestres",
    interaction: "Toca para florir",
    concept: "Folhas e flores de feira enquadram o retrato; cada toque faz brotar mais, à maneira de Frida."
  },
  {
    id: "banksy", anim: "banksy", name: "Banksy", en: "Stencil", group: "mestres",
    interaction: "Toca para pintar",
    concept: "A obra vira um stencil a duas cores numa parede de rua; cada toque atira spray, à maneira de Banksy."
  },
  {
    id: "rothko", anim: "rothko", name: "Rothko", en: "Campo de Cor", group: "mestres",
    interaction: "Automático",
    concept: "Grandes blocos de cor luminosa respiram um sobre o outro, à maneira de Rothko."
  },
  {
    id: "basquiat", anim: "basquiat", name: "Basquiat", en: "Coroa", group: "mestres",
    interaction: "Toca para rabiscar",
    concept: "Coroas, riscos e cruzes crus saltam sobre a obra; cada toque rabisca mais, à maneira de Basquiat."
  }
]);

Object.assign(window, {
  MonetAnimation, SeuratAnimation, MatisseCutAnimation, MunchAnimation,
  HokusaiAnimation, DaliAnimation, FridaAnimation, BanksyAnimation,
  RothkoAnimation, BasquiatAnimation
});
