// ============================================================
// FMB / ART — Treatment templates (batch 4)
// Five more reusable per-piece effects. Same contract as the
// earlier batches: each component receives { art } and uses
// only generic fields (art.src, art.palette, art.bg) so any
// uploaded drawing can be assigned any template.
//
// Appends into window.ANIMS + window.TEMPLATE_LIBRARY
// (group: "magia"). Unique hook aliases avoid global clashes
// with the other template files when they all load together.
// ============================================================

const { useState: t4State, useEffect: t4Effect, useRef: t4Ref, useMemo: t4Memo } = React;

// ============================================================
// 11 · NÉON (Neon sign) — tap to switch on / off
//     The drawing becomes a humming neon sign, traced in glow,
//     that flickers to life. Tap the switch to kill the lights.
// ============================================================
function NeonAnimation({ art }) {
  const [on, setOn] = t4State(true);
  const glow = (art.palette && art.palette[0]) || "#ff3da6";
  const glow2 = (art.palette && art.palette[2]) || (art.palette && art.palette[1]) || "#36d1ff";

  return (
    <div className={"tpl-layer tpl-neon " + (on ? "is-on" : "is-off")}
      onClick={() => setOn((o) => !o)}
      style={{ "--glow": glow, "--glow2": glow2, "--haze": glow }} aria-hidden>
      <div className="neon-hum" />
      <img src={art.src} alt="" className="tpl-img neon-img" />
      <div className="tpl-hint">{on ? "toca para apagar 💡" : "toca para acender ⚡"}</div>
    </div>
  );
}

// ============================================================
// 12 · LUPA (Magnifier) — move finger / cursor
//     A magnifying glass follows the pointer and blows up
//     whatever detail sits beneath it.
// ============================================================
function MagnifierAnimation({ art }) {
  const ref = t4Ref(null);
  const [p, setP] = t4State({ x: 50, y: 46, active: false });

  const move = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    setP({
      x: ((t.clientX - r.left) / r.width) * 100,
      y: ((t.clientY - r.top) / r.height) * 100,
      active: true
    });
  };
  const leave = () => setP((s) => ({ ...s, active: false }));

  const ZOOM = 2.4;

  return (
    <div className="tpl-layer tpl-lupa" ref={ref}
      onPointerMove={move} onPointerLeave={leave}
      onTouchMove={(e) => { e.preventDefault(); move(e); }}
      aria-hidden>
      <img src={art.src} alt="" className="tpl-img lupa-base" />
      <div className="lupa-lens" style={{
        left: `${p.x}%`, top: `${p.y}%`,
        opacity: p.active ? 1 : 0,
        backgroundImage: `url(${art.src})`,
        backgroundSize: `${ZOOM * 100}% ${ZOOM * 100}%`,
        backgroundPosition: `${p.x}% ${p.y}%`
      }} />
      {!p.active && <div className="tpl-hint">passa o dedo para ampliar 🔍</div>}
    </div>
  );
}

// ============================================================
// 13 · VITRAL (Stained glass) — tap to relight
//     Dark leading splits the drawing into glowing diamond
//     panes; sunlight drifts behind the glass. Tap and a burst
//     of light floods through.
// ============================================================
function StainedGlassAnimation({ art }) {
  const [lit, setLit] = t4State(0);
  const relight = (e) => { e.stopPropagation(); setLit((v) => v + 1); };

  return (
    <div className="tpl-layer tpl-vitral" onClick={relight}
      style={{ background: art.bg || "#050409" }} aria-hidden>
      <img src={art.src} alt="" className="tpl-img vitral-img" />
      <div className="vitral-light" />
      <div className="vitral-glass" />
      <div className="vitral-lead" />
      <div key={lit} className={"vitral-flash" + (lit > 0 ? " is-lit" : "")} />
      <div className="tpl-hint">toca para o sol entrar 🪟</div>
    </div>
  );
}

// ============================================================
// 14 · CONFETI (Confetti) — tap to celebrate
//     Every tap blasts a shower of paper confetti up from the
//     point you touched, in the drawing's own colours.
// ============================================================
function ConfettiAnimation({ art }) {
  const ref = t4Ref(null);
  const [bits, setBits] = t4State([]);
  const [pop, setPop] = t4State(false);
  const palette = (art.palette && art.palette.length)
    ? art.palette
    : ["#ec3a8a", "#f5d014", "#36d1ff", "#7bd88f", "#ff7a3d"];

  const burst = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    const x = ((t.clientX - r.left) / r.width) * 100;
    const y = ((t.clientY - r.top) / r.height) * 100;
    const batch = Array.from({ length: 28 }, () => {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.0;
      const spread = 90 + Math.random() * 150;
      const round = Math.random() < 0.35;
      return {
        key: Math.random(),
        x, y,
        col: palette[Math.floor(Math.random() * palette.length)],
        w: 6 + Math.random() * 8,
        h: round ? null : 9 + Math.random() * 12,
        round,
        dx: Math.cos(ang) * spread + (Math.random() - 0.5) * 60,
        rise: -(60 + Math.random() * 90),
        dy: 120 + Math.random() * 160,
        life: 1.1 + Math.random() * 0.9,
        spin: 0.4 + Math.random() * 0.8
      };
    });
    setBits((b) => [...b.slice(-90), ...batch]);
    setPop(true);
    setTimeout(() => setPop(false), 240);
    batch.forEach((p) => setTimeout(
      () => setBits((b) => b.filter((q) => q.key !== p.key)), p.life * 1000 + 60));
  };

  return (
    <div className={"tpl-layer tpl-confetti" + (pop ? " is-pop" : "")} ref={ref}
      onClick={burst} style={{ background: art.bg || "#141018" }} aria-hidden>
      <img src={art.src} alt="" className="tpl-img confetti-img" />
      {bits.map((b) => (
        <span key={b.key} className="confetti-bit" style={{
          left: `${b.x}%`, top: `${b.y}%`,
          width: `${b.w}px`, height: `${b.round ? b.w : b.h}px`,
          borderRadius: b.round ? "50%" : "1px",
          "--col": b.col,
          "--dx": `${b.dx}px`, "--rise": `${b.rise}px`, "--dy": `${b.dy}px`,
          "--life": `${b.life}s`, "--spin": `${b.spin}s`
        }}>
          <i />
        </span>
      ))}
      <div className="tpl-hint">toca para festejar 🎉</div>
    </div>
  );
}

// ============================================================
// 15 · DERRETER (Melt) — tap to melt / reform
//     The drawing slides off the canvas in gooey ribbons that
//     droop and drip. Tap again and it climbs back together.
// ============================================================
function MeltAnimation({ art }) {
  const N = 14;
  const [melted, setMelted] = t4State(false);

  const strips = t4Memo(() => Array.from({ length: N }, (_, i) => ({
    drop: 26 + Math.random() * 90,
    stretch: 1.04 + Math.random() * 0.16,
    tail: 16 + Math.random() * 46
  })), []);

  return (
    <div className={"tpl-layer tpl-melt" + (melted ? " is-melted" : "")}
      onClick={() => setMelted((m) => !m)}
      style={{ background: art.bg ? undefined : undefined }} aria-hidden>
      {strips.map((s, i) => (
        <div key={i} className="melt-strip" style={{
          width: `${100 / N}%`,
          backgroundImage: `url(${art.src})`,
          backgroundSize: `${N * 100}% 100%`,
          backgroundPosition: `${(i / (N - 1)) * 100}% center`,
          transitionDelay: `${(melted ? i : N - i) * 28}ms`,
          "--drop": `${s.drop}px`,
          "--stretch": s.stretch,
          "--tail": `${s.tail}px`
        }} />
      ))}
      <div className="tpl-hint">{melted ? "toca para recompor 🧊" : "toca para derreter 🫠"}</div>
    </div>
  );
}

// ============================================================
// Export — merge into the shared registries
// ============================================================
window.ANIMS = Object.assign({}, window.ANIMS, {
  neon: NeonAnimation,
  lupa: MagnifierAnimation,
  vitral: StainedGlassAnimation,
  confetti: ConfettiAnimation,
  melt: MeltAnimation
});

window.TEMPLATE_LIBRARY = (window.TEMPLATE_LIBRARY || []).concat([
  {
    id: "neon", anim: "neon", name: "Néon", en: "Neon", group: "magia",
    interaction: "Toca para acender",
    concept: "A obra vira um letreiro de néon que brilha e pisca; toca no interruptor para apagar e acender."
  },
  {
    id: "lupa", anim: "lupa", name: "Lupa", en: "Magnifier", group: "magia",
    interaction: "Move o dedo / cursor",
    concept: "Uma lupa segue o cursor e amplia cada pormenor escondido do desenho."
  },
  {
    id: "vitral", anim: "vitral", name: "Vitral", en: "Stained Glass", group: "magia",
    interaction: "Toca para o sol entrar",
    concept: "Chumbo escuro divide a obra em losangos de vidro que brilham quando o sol passa atrás."
  },
  {
    id: "confetti", anim: "confetti", name: "Confeti", en: "Confetti", group: "magia",
    interaction: "Toca para festejar",
    concept: "Cada toque dispara uma chuva de confeti nas cores da própria obra, como uma festa."
  },
  {
    id: "melt", anim: "melt", name: "Derreter", en: "Melt", group: "magia",
    interaction: "Toca para derreter",
    concept: "O desenho escorre da tela em fitas pegajosas que pingam — e volta a subir ao segundo toque."
  }
]);

Object.assign(window, {
  NeonAnimation, MagnifierAnimation, StainedGlassAnimation,
  ConfettiAnimation, MeltAnimation
});
