// ============================================================
// FMB / ART — Treatment templates (batch 2)
// Five new reusable per-piece animations. Each is a React
// component receiving { art } and using only generic fields
// (art.src, art.palette, art.bg) so the model can assign any
// template to any uploaded artwork.
//
// Drop-in compatible with art-animations.jsx: they merge into
// window.ANIMS and can be referenced from art-data.js `anim`.
// Unique hook aliases avoid global-scope clashes with
// art-animations.jsx when both files load together.
// ============================================================

const { useState: tState, useEffect: tEffect, useRef: tRef, useMemo: tMemo, useId: tId } = React;

// ============================================================
// 1 · ESTILHAÇO (Explosion) — tap to trigger
//     The piece shatters into a grid of tiles that blast
//     outward, tumble, then snap back together.
// ============================================================
function ExplosionAnimation({ art }) {
  const COLS = 7, ROWS = 9;
  const [burst, setBurst] = tState(0);

  // Fresh scatter vectors each burst so it never repeats.
  const tiles = tMemo(() => {
    const arr = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cx = (c + 0.5) / COLS - 0.5;
        const cy = (r + 0.5) / ROWS - 0.5;
        const dist = Math.hypot(cx, cy) || 0.001;
        const mag = 70 + Math.random() * 150;
        arr.push({
          c, r,
          dx: (cx / dist) * mag + (Math.random() - 0.5) * 50,
          dy: (cy / dist) * mag + (Math.random() - 0.5) * 50,
          rot: (Math.random() - 0.5) * 140,
          delay: Math.round(Math.random() * 80)
        });
      }
    }
    return arr;
  }, [burst]);

  const trigger = (e) => { e.stopPropagation(); setBurst((b) => b + 1); };

  return (
    <div className="tpl-layer tpl-explode" onClick={trigger}
      style={{ background: art.bg || "#141018" }} aria-hidden>
      <div className="exp-grid" key={burst}
        style={{ gridTemplateColumns: `repeat(${COLS},1fr)`, gridTemplateRows: `repeat(${ROWS},1fr)` }}>
        {tiles.map((t, i) => (
          <span
            key={i}
            className={"exp-shard" + (burst > 0 ? " is-bursting" : "")}
            style={{
              backgroundImage: `url(${art.src})`,
              backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
              backgroundPosition: `${(t.c / (COLS - 1)) * 100}% ${(t.r / (ROWS - 1)) * 100}%`,
              "--dx": `${t.dx}px`, "--dy": `${t.dy}px`,
              "--rot": `${t.rot}deg`, "--delay": `${t.delay}ms`
            }}
          />
        ))}
      </div>
      {burst === 0 && <div className="tpl-hint">toca para explodir 💥</div>}
    </div>
  );
}

// ============================================================
// 2 · LANTERNA (Spotlight) — move finger / cursor
//     The artwork sits in the dark; the pointer is a torch
//     beam that reveals only what it touches.
// ============================================================
function SpotlightAnimation({ art }) {
  const ref = tRef(null);
  const [p, setP] = tState({ x: 50, y: 44, active: false });

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

  return (
    <div className="tpl-layer tpl-spotlight" ref={ref}
      onPointerMove={move} onPointerLeave={leave}
      onTouchMove={(e) => { e.preventDefault(); move(e); }}
      aria-hidden>
      <img src={art.src} alt="" className="tpl-img" />
      <div className="spot-dark" style={{
        background: `radial-gradient(circle 20% at ${p.x}% ${p.y}%, transparent 0%, transparent 42%, rgba(6,4,12,0.55) 60%, rgba(6,4,12,0.95) 80%)`
      }} />
      <div className="spot-glow" style={{ left: `${p.x}%`, top: `${p.y}%`, opacity: p.active ? 0.9 : 0.45 }} />
      {!p.active && <div className="tpl-hint">passa o dedo para iluminar 🔦</div>}
    </div>
  );
}

// ============================================================
// 3 · CALEIDOSCÓPIO (Mirror) — drag to spin
//     Four mirrored copies fold into a living kaleidoscope;
//     drag rotates the symmetry, and it drifts on its own.
// ============================================================
function KaleidoscopeAnimation({ art }) {
  const drag = tRef(false);
  const last = tRef(0);
  const [angle, setAngle] = tState(0);

  // Gentle auto-drift when not dragging.
  tEffect(() => {
    let raf, prev = performance.now();
    const loop = (t) => {
      const dt = t - prev; prev = t;
      if (!drag.current) setAngle((a) => a + dt * 0.006);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const down = (e) => { drag.current = true; last.current = (e.touches ? e.touches[0] : e).clientX; };
  const moveH = (e) => {
    if (!drag.current) return;
    const x = (e.touches ? e.touches[0] : e).clientX;
    setAngle((a) => a + (x - last.current) * 0.5);
    last.current = x;
  };
  const up = () => { drag.current = false; };

  tEffect(() => {
    window.addEventListener("mousemove", moveH);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", moveH, { passive: true });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", moveH);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", moveH);
      window.removeEventListener("touchend", up);
    };
  }, []);

  const quad = (cls) => (
    <div className={"kal-quad " + cls} style={{ backgroundImage: `url(${art.src})` }} />
  );

  return (
    <div className="tpl-layer tpl-kaleido" onMouseDown={down} onTouchStart={down}
      style={{ background: art.bg || "#120f18" }} aria-hidden>
      <div className="kal-rotor" style={{ transform: `rotate(${angle}deg)` }}>
        {quad("kq-tl")}{quad("kq-tr")}{quad("kq-bl")}{quad("kq-br")}
      </div>
      <div className="kal-vignette" />
      <div className="tpl-hint">arrasta para girar 🔮</div>
    </div>
  );
}

// ============================================================
// 4 · PULSAR (Pulse) — tap / auto
//     A steady heartbeat scales the piece and emits expanding
//     glow rings; each tap sends a stronger beat.
// ============================================================
function PulseAnimation({ art }) {
  const [rings, setRings] = tState([]);
  const col = (art.palette && art.palette[0]) || "#ec3a8a";

  const pushRing = (big) => {
    const key = Math.random();
    setRings((rs) => [...rs.slice(-6), { key, big }]);
    setTimeout(() => setRings((rs) => rs.filter((r) => r.key !== key)), 1700);
  };

  tEffect(() => {
    const id = setInterval(() => pushRing(false), 1400);
    return () => clearInterval(id);
  }, []);

  const tap = (e) => { e.stopPropagation(); pushRing(true); };

  return (
    <div className="tpl-layer tpl-pulse" onClick={tap}
      style={{ background: art.bg || "#141018" }} aria-hidden>
      {rings.map((r) => (
        <span key={r.key} className={"pulse-ring" + (r.big ? " is-big" : "")}
          style={{ borderColor: col }} />
      ))}
      <img src={art.src} alt="" className="tpl-img tpl-heartbeat" />
      <div className="tpl-hint">toca para o coração bater ❤️</div>
    </div>
  );
}

// ============================================================
// 5 · ONDAS (Ripple) — tap the water
//     The piece waves under an ambient water displacement;
//     each tap drops an expanding ripple where you touch.
// ============================================================
function RippleAnimation({ art }) {
  const ref = tRef(null);
  const rawId = tId();
  const fid = "water-" + rawId.replace(/[:]/g, "");
  const [ripples, setRipples] = tState([]);

  const tap = (e) => {
    e.stopPropagation();
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    const x = ((t.clientX - r.left) / r.width) * 100;
    const y = ((t.clientY - r.top) / r.height) * 100;
    const key = Math.random();
    setRipples((rs) => [...rs.slice(-8), { key, x, y }]);
    setTimeout(() => setRipples((rs) => rs.filter((p) => p.key !== key)), 1500);
  };

  return (
    <div className="tpl-layer tpl-ripple" ref={ref} onClick={tap}
      style={{ background: art.bg || "#0a2030" }} aria-hidden>
      <svg className="ripple-defs" width="0" height="0" aria-hidden>
        <filter id={fid} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="4" result="noise">
            <animate attributeName="baseFrequency" dur="16s"
              values="0.012 0.02;0.018 0.012;0.012 0.02" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="18"
            xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <img src={art.src} alt="" className="tpl-img ripple-img" style={{ filter: `url(#${fid})` }} />
      {ripples.map((p) => (
        <span key={p.key} className="ripple-ring" style={{ left: `${p.x}%`, top: `${p.y}%` }} />
      ))}
      <div className="ripple-sheen" />
      <div className="tpl-hint">toca na água 💧</div>
    </div>
  );
}

// ============================================================
// Export — merge into the shared registry
// ============================================================
window.ANIMS = Object.assign({}, window.ANIMS, {
  explode: ExplosionAnimation,
  spotlight: SpotlightAnimation,
  kaleido: KaleidoscopeAnimation,
  pulse: PulseAnimation,
  ripple: RippleAnimation
});

// Metadata for the Treatment Library showcase (and future tooling).
window.TEMPLATE_LIBRARY = [
  {
    id: "explode", anim: "explode", name: "Estilhaço", en: "Explosion", group: "gestos",
    interaction: "Toca para disparar",
    concept: "A obra estilhaça-se em fragmentos que voam para fora e se voltam a juntar."
  },
  {
    id: "spotlight", anim: "spotlight", name: "Lanterna", en: "Spotlight", group: "gestos",
    interaction: "Move o dedo / cursor",
    concept: "A pintura fica no escuro e o cursor é uma lanterna que revela só o que toca."
  },
  {
    id: "kaleido", anim: "kaleido", name: "Caleidoscópio", en: "Mirror", group: "gestos",
    interaction: "Arrasta para girar",
    concept: "Quatro cópias espelhadas dobram-se num caleidoscópio vivo que roda ao arrastar."
  },
  {
    id: "pulse", anim: "pulse", name: "Pulsar", en: "Pulse", group: "gestos",
    interaction: "Toca / automático",
    concept: "Um batimento constante faz a obra respirar e lança anéis de luz a cada batida."
  },
  {
    id: "ripple", anim: "ripple", name: "Ondas", en: "Ripple", group: "gestos",
    interaction: "Toca na água",
    concept: "A obra ondula como água e cada toque larga uma onda que se expande."
  }
];

Object.assign(window, {
  ExplosionAnimation, SpotlightAnimation, KaleidoscopeAnimation,
  PulseAnimation, RippleAnimation
});
