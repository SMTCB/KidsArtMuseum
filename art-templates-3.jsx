// ============================================================
// FMB / ART — Treatment templates (batch 3)
// Five more reusable per-piece effects. Same contract as
// batch 2: each component receives { art } and uses only
// generic fields (art.src, art.palette, art.bg) so any
// uploaded drawing can be assigned any template.
//
// Appends into window.ANIMS + window.TEMPLATE_LIBRARY.
// Unique hook aliases avoid global clashes with the other
// template files when they all load together.
// ============================================================

const { useState: t3State, useEffect: t3Effect, useRef: t3Ref, useMemo: t3Memo, useId: t3Id } = React;

// ============================================================
// 6 · HOLOGRAMA (Holographic) — move finger / cursor
//     The drawing becomes a shiny holo trading-card that
//     tilts in 3D and throws a rainbow sheen toward the light.
// ============================================================
function HoloAnimation({ art }) {
  const ref = t3Ref(null);
  const [s, setS] = t3State({ rx: 0, ry: 0, mx: 50, my: 50, active: false });

  const move = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    const px = (t.clientX - r.left) / r.width;
    const py = (t.clientY - r.top) / r.height;
    setS({
      ry: (px - 0.5) * 34,
      rx: -(py - 0.5) * 34,
      mx: px * 100,
      my: py * 100,
      active: true
    });
  };
  const leave = () => setS((v) => ({ ...v, rx: 0, ry: 0, active: false }));

  return (
    <div className="tpl-layer tpl-holo" ref={ref}
      onPointerMove={move} onPointerLeave={leave}
      onTouchMove={(e) => { e.preventDefault(); move(e); }}
      style={{ background: art.bg || "#0d0b14" }} aria-hidden>
      <div className="holo-card" style={{ transform: `rotateX(${s.rx}deg) rotateY(${s.ry}deg)` }}>
        <img src={art.src} alt="" className="tpl-img" />
        <div className="holo-sheen" style={{
          opacity: s.active ? 0.85 : 0.4,
          backgroundPosition: `${s.mx}% ${s.my}%`
        }} />
        <div className="holo-glare" style={{
          background: `radial-gradient(circle at ${s.mx}% ${s.my}%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 45%)`
        }} />
      </div>
      {!s.active && <div className="tpl-hint">inclina à luz ✨</div>}
    </div>
  );
}

// ============================================================
// 7 · PERSIANA (Blinds) — tap to peek
//     The drawing is cut into horizontal slats that flip open
//     like a window blind, peeking at the colour behind.
// ============================================================
function BlindAnimation({ art }) {
  const N = 9;
  const [open, setOpen] = t3State(false);
  const back = (art.palette && art.palette.length)
    ? `linear-gradient(135deg, ${art.palette.slice(0, 3).join(", ")})`
    : "#222";

  return (
    <div className="tpl-layer tpl-blind" onClick={() => setOpen((o) => !o)}
      style={{ background: back }} aria-hidden>
      {Array.from({ length: N }).map((_, i) => (
        <div key={i} className={"blind-slat" + (open ? " is-open" : "")}
          style={{
            height: `${100 / N}%`,
            transformOrigin: i % 2 ? "top" : "bottom",
            transitionDelay: `${(open ? i : N - i) * 45}ms`,
            backgroundImage: `url(${art.src})`,
            backgroundSize: `100% ${N * 100}%`,
            backgroundPosition: `center ${(i / (N - 1)) * 100}%`
          }} />
      ))}
      <div className="tpl-hint">{open ? "toca para fechar" : "toca para espreitar 👀"}</div>
    </div>
  );
}

// ============================================================
// 8 · MOSAICO (Pixelate) — tap to scramble
//     The drawing assembles itself from chunky pixels into a
//     sharp image; tap and it dissolves back into blocks.
// ============================================================
function MosaicAnimation({ art }) {
  const canvasRef = t3Ref(null);
  const imgRef = t3Ref(null);
  const raf = t3Ref(0);
  const running = t3Ref(false);
  const startRef = t3Ref(null);
  const res = t3Ref(0.04);     // 0..1 — fraction of full resolution
  const target = t3Ref(1);

  const draw = () => {
    const c = canvasRef.current, img = imgRef.current;
    if (!c || !img || !img.complete || !img.naturalWidth) return;
    const W = c.clientWidth, H = c.clientHeight;
    if (c.width !== W) c.width = W;
    if (c.height !== H) c.height = H;
    const ctx = c.getContext("2d");
    // ease res toward target
    res.current += (target.current - res.current) * 0.06;
    const blocks = Math.max(6, Math.round(8 + res.current * res.current * 150));
    const ar = img.naturalWidth / img.naturalHeight;
    // cover-fit source crop
    let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
    if (ar > W / H) { sw = sh * (W / H); sx = (img.naturalWidth - sw) / 2; }
    else { sh = sw * (H / W); sy = (img.naturalHeight - sh) / 2; }
    const bw = Math.max(1, Math.round(blocks * (W / H)));
    const off = document.createElement("canvas");
    off.width = bw; off.height = blocks;
    const octx = off.getContext("2d");
    octx.imageSmoothingEnabled = true;
    octx.drawImage(img, sx, sy, sw, sh, 0, 0, bw, blocks);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(off, 0, 0, bw, blocks, 0, 0, W, H);
  };

  t3Effect(() => {
    const loop = () => {
      draw();
      // stop spinning the loop once the image has fully resolved
      if (target.current === 1 && Math.abs(target.current - res.current) < 0.01) {
        running.current = false;
        return;
      }
      raf.current = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running.current) return;
      running.current = true;
      raf.current = requestAnimationFrame(loop);
    };
    const img = imgRef.current;
    if (img && img.complete) start();
    else if (img) img.addEventListener("load", start, { once: true });
    startRef.current = start;
    return () => { running.current = false; cancelAnimationFrame(raf.current); };
  }, []);

  const scramble = () => {
    res.current = 0.02; target.current = 0.02;
    if (startRef.current) startRef.current();
    setTimeout(() => { target.current = 1; if (startRef.current) startRef.current(); }, 360);
  };

  return (
    <div className="tpl-layer tpl-mosaic" onClick={scramble}
      style={{ background: art.bg || "#0c0b10" }} aria-hidden>
      <img ref={imgRef} src={art.src} alt="" className="mosaic-src"
        onLoad={() => { res.current = 0.02; target.current = 1; }} />
      <canvas ref={canvasRef} className="mosaic-canvas" />
      <div className="tpl-hint">toca para baralhar ▦</div>
    </div>
  );
}

// ============================================================
// 9 · CARIMBO (Stamp) — tap anywhere
//     Each tap presses a tiny rotated copy of the drawing onto
//     the canvas, building a playful repeating pattern.
// ============================================================
function StampAnimation({ art }) {
  const ref = t3Ref(null);
  const [stamps, setStamps] = t3State([]);
  const palette = art.palette && art.palette.length ? art.palette : ["#fff"];

  const press = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    const x = ((t.clientX - r.left) / r.width) * 100;
    const y = ((t.clientY - r.top) / r.height) * 100;
    const stamp = {
      key: Math.random(),
      x, y,
      size: 56 + Math.random() * 64,
      rot: (Math.random() - 0.5) * 50,
      ring: palette[Math.floor(Math.random() * palette.length)]
    };
    setStamps((s) => [...s.slice(-23), stamp]);
  };

  return (
    <div className="tpl-layer tpl-stamp" ref={ref} onClick={press}
      style={{ background: art.bg || "#13111a" }} aria-hidden>
      {stamps.map((st) => (
        <span key={st.key} className="stamp-mark" style={{
          left: `${st.x}%`, top: `${st.y}%`,
          width: `${st.size}px`, height: `${st.size}px`,
          transform: `translate(-50%, -50%) rotate(${st.rot}deg)`,
          backgroundImage: `url(${art.src})`,
          boxShadow: `0 0 0 4px ${st.ring}, 0 8px 18px rgba(0,0,0,0.4)`
        }} />
      ))}
      {stamps.length === 0 && <div className="stamp-ghost" style={{ backgroundImage: `url(${art.src})` }} />}
      <div className="tpl-hint">toca para carimbar 🖐️</div>
    </div>
  );
}

// ============================================================
// 10 · CROMÁTICO (Chromatic glitch) — tap to glitch
//     The R/G/B channels drift apart for a retro-screen
//     shimmer; tap and the picture tears in a glitch burst.
// ============================================================
function ChromaticAnimation({ art }) {
  const rawId = t3Id();
  const uid = "chr-" + rawId.replace(/[:]/g, "");
  const [glitch, setGlitch] = t3State(false);

  const tap = (e) => {
    e.stopPropagation();
    setGlitch(true);
    setTimeout(() => setGlitch(false), 620);
  };

  const M = {
    r: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0",
    g: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0",
    b: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
  };

  return (
    <div className={"tpl-layer tpl-chroma" + (glitch ? " is-glitch" : "")} onClick={tap}
      aria-hidden>
      <svg className="chroma-defs" width="0" height="0" aria-hidden>
        <filter id={uid + "-r"}><feColorMatrix type="matrix" values={M.r} /></filter>
        <filter id={uid + "-g"}><feColorMatrix type="matrix" values={M.g} /></filter>
        <filter id={uid + "-b"}><feColorMatrix type="matrix" values={M.b} /></filter>
      </svg>
      <img src={art.src} alt="" className="chroma-ch chroma-r" style={{ filter: `url(#${uid}-r)` }} />
      <img src={art.src} alt="" className="chroma-ch chroma-g" style={{ filter: `url(#${uid}-g)` }} />
      <img src={art.src} alt="" className="chroma-ch chroma-b" style={{ filter: `url(#${uid}-b)` }} />
      <div className="chroma-scan" />
      <div className="tpl-hint">toca para falhar a imagem 📺</div>
    </div>
  );
}

// ============================================================
// Export — merge into the shared registries
// ============================================================
window.ANIMS = Object.assign({}, window.ANIMS, {
  holo: HoloAnimation,
  blind: BlindAnimation,
  mosaic: MosaicAnimation,
  stamp: StampAnimation,
  chroma: ChromaticAnimation
});

window.TEMPLATE_LIBRARY = (window.TEMPLATE_LIBRARY || []).concat([
  {
    id: "holo", anim: "holo", name: "Holograma", en: "Holographic", group: "materia",
    interaction: "Inclina à luz",
    concept: "A obra vira um cromo holográfico que se inclina em 3D e atira reflexos de arco-íris."
  },
  {
    id: "blind", anim: "blind", name: "Persiana", en: "Blinds", group: "materia",
    interaction: "Toca para espreitar",
    concept: "O desenho parte-se em lâminas que abrem como um estore para espreitar a cor atrás."
  },
  {
    id: "mosaic", anim: "mosaic", name: "Mosaico", en: "Pixelate", group: "materia",
    interaction: "Toca para baralhar",
    concept: "A obra monta-se a partir de pixéis gigantes até ficar nítida — e volta a desfazer-se ao toque."
  },
  {
    id: "stamp", anim: "stamp", name: "Carimbo", en: "Stamp", group: "materia",
    interaction: "Toca para carimbar",
    concept: "Cada toque carimba uma cópia pequenina da obra, construindo um padrão repetido."
  },
  {
    id: "chroma", anim: "chroma", name: "Cromático", en: "Chromatic", group: "materia",
    interaction: "Toca para falhar",
    concept: "Os canais de cor afastam-se num brilho de ecrã antigo e rasgam-se num glitch a cada toque."
  }
]);

Object.assign(window, {
  HoloAnimation, BlindAnimation, MosaicAnimation, StampAnimation, ChromaticAnimation
});
