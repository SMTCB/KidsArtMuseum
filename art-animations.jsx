// Rich per-piece animations for each artwork.
// Each component is rendered inside the zoom-modal frame.
// Exports window.ANIMS so gallery-core.jsx can look up by anim id.

const { useState: useS, useEffect: useE, useRef: useR } = React;

// ============================================================
// MIRÓ — Full dance routine + disco lights + music notes
// ============================================================
function MiroAnimation({ art }) {
  return (
    <div className="anim-layer anim-miro-stage" aria-hidden>
      <div className="miro-disco" />
      <div className="miro-disco miro-disco-2" />
      <img src={art.src} alt="" className="anim-img anim-dance" />
      <div className="miro-spotlight" />
      {Array.from({ length: 8 }).map((_, i) => (
        <span key={"n" + i} className="music-note" style={{
          left: `${5 + (i * 13) % 90}%`,
          animationDelay: `${(i * 0.45) % 4}s`,
          fontSize: `${22 + (i % 3) * 8}px`,
          color: ["#f7d54a", "#ec3a2a", "#fff", "#2a6fd8"][i % 4]
        }}>{["♪", "♫", "♩", "♬"][i % 4]}</span>
      ))}
      {Array.from({ length: 14 }).map((_, i) => (
        <span key={"s" + i} className="disco-star" style={{
          left: `${(i * 11) % 95}%`,
          top: `${(i * 17) % 90}%`,
          animationDelay: `${(i * 0.2) % 2.4}s`
        }} />
      ))}
    </div>
  );
}

// ============================================================
// SUNFLOWERS — Side-by-side compare with Van Gogh's original
// ============================================================
const VAN_GOGH_URL = "assets/art/van-gogh-original.jpg";

function SunflowersAnimation({ art }) {
  const [pos, setPos] = useS(50); // 0..100, slider position
  const wrapRef = useR(null);
  const dragging = useR(false);

  const setFromEvent = (e) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    const x = ((t.clientX - r.left) / r.width) * 100;
    setPos(Math.max(0, Math.min(100, x)));
  };
  const onDown = (e) => { dragging.current = true; setFromEvent(e); e.preventDefault(); };
  const onMove = (e) => { if (dragging.current) setFromEvent(e); };
  const onUp = () => { dragging.current = false; };

  useE(() => {
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  return (
    <div className="anim-layer compare-layer" ref={wrapRef}
      onMouseDown={onDown} onTouchStart={onDown} aria-hidden>
      {/* Right side: Van Gogh original */}
      <img src={VAN_GOGH_URL} alt="" className="anim-img compare-bottom" />
      {/* Left side: Miguel's painting, clipped */}
      <div className="compare-top" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={art.src} alt="" className="anim-img" />
      </div>
      {/* Vertical divider */}
      <div className="compare-divider" style={{ left: pos + "%" }}>
        <div className="compare-handle">
          <span>◀</span><span>▶</span>
        </div>
      </div>
      {/* Labels */}
      <div className="compare-label compare-label-left">Miguel, 6 anos</div>
      <div className="compare-label compare-label-right">Van Gogh, 1888</div>
    </div>
  );
}

// ============================================================
// SELF-PORTRAIT — Eyes follow cursor + talking mouth
// ============================================================
function PortraitAnimation({ art }) {
  const wrap = useR(null);
  const [eye, setEye] = useS({ x: 0, y: 0 });
  const [talking, setTalking] = useS(false);

  useE(() => {
    const el = wrap.current;
    if (!el) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / r.width;
      const dy = (e.clientY - cy) / r.height;
      setEye({
        x: Math.max(-12, Math.min(12, dx * 36)),
        y: Math.max(-8, Math.min(8, dy * 28))
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Auto-talk every 5s for a couple seconds
  useE(() => {
    const tick = setInterval(() => {
      setTalking(true);
      setTimeout(() => setTalking(false), 2400);
    }, 6500);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="anim-layer" ref={wrap} aria-hidden>
      <img src={art.src} alt="" className="anim-img" />
      <span className="pupil pupil-l" style={{ transform: `translate(${eye.x}px, ${eye.y}px)` }} />
      <span className="pupil pupil-r" style={{ transform: `translate(${eye.x}px, ${eye.y}px)` }} />
      <span className={"talk-mouth " + (talking ? "is-talking" : "")} />
      {talking && (
        <div className="speech-bubble portrait-speech">
          Olá! Sou o Miguel! 👋
        </div>
      )}
    </div>
  );
}

// ============================================================
// MATISSE — Swinging blue cutout + wind lines
// ============================================================
function MatisseAnimation({ art }) {
  return (
    <div className="anim-layer" aria-hidden>
      <img src={art.src} alt="" className="anim-img anim-swing" />
      <div className="wind-lines">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="wind-line" style={{
            top: `${15 + i * 12}%`,
            animationDelay: `${(i * 0.4) % 2.4}s`
          }} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ERA UMA VEZ — "Conta-me a história" guided story mode
// ============================================================
const STORY_BEATS = [
  {
    x: 15, y: 32, r: 14,
    text: "Era uma vez um gato cor-de-rosa com bigodes muito longos…"
  },
  {
    x: 47, y: 27, r: 16,
    text: "…que era amigo de uma cobra azul, a viver dentro de um ovo gigante!"
  },
  {
    x: 82, y: 30, r: 14,
    text: "Ao longe via-se um castelo azul, muito muito alto."
  },
  {
    x: 50, y: 75, r: 16,
    text: "Em baixo, uma girafa amarela espreitava o céu cor-de-rosa…"
  },
  {
    x: 78, y: 80, r: 13,
    text: "…e os meninos cantavam a sua canção favorita. FIM. 🌈"
  }
];

function StoryAnimation({ art }) {
  const [step, setStep] = useS(-1); // -1 = idle, 0..n = story playing
  const beat = step >= 0 ? STORY_BEATS[step] : null;
  const playing = step >= 0;

  const start = () => setStep(0);
  const next = () => {
    if (step < STORY_BEATS.length - 1) setStep(step + 1);
    else setStep(-1);
  };

  // ESC to cancel
  useE(() => {
    if (!playing) return;
    const onKey = (e) => { if (e.key === "Escape") setStep(-1); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing]);

  return (
    <div className="anim-layer" aria-hidden>
      <img src={art.src} alt="" className="anim-img" />

      {/* Idle floaty sparkles + blinks */}
      {!playing && (
        <>
          <span className="blink blink-cat" style={{ left: "15%", top: "33%" }} />
          <span className="blink blink-snake" style={{ left: "48%", top: "27%", animationDelay: "0.7s" }} />
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="sparkle" style={{
              left: `${10 + (i * 9) % 80}%`,
              top: `${15 + (i * 13) % 70}%`,
              animationDelay: `${(i * 0.3) % 2.5}s`
            }} />
          ))}
        </>
      )}

      {/* Spotlight overlay when a beat is active */}
      {playing && beat && (
        <div
          className="story-spotlight"
          style={{
            background: `radial-gradient(circle at ${beat.x}% ${beat.y}%, transparent 0%, transparent ${beat.r}%, rgba(10,5,20,0.92) ${beat.r * 1.8}%)`
          }}
        />
      )}

      {/* Story controls */}
      {!playing ? (
        <button className="story-start" onClick={() => start()}>
          ▶ Conta-me a história
        </button>
      ) : (
        <div className="story-panel" onClick={(e) => e.stopPropagation()}>
          <div className="story-text">{beat.text}</div>
          <div className="story-controls">
            <div className="story-progress">
              {STORY_BEATS.map((_, i) => (
                <span key={i} className={"sp-dot " + (i === step ? "is-on" : i < step ? "is-done" : "")} />
              ))}
            </div>
            <button className="story-next" onClick={next}>
              {step < STORY_BEATS.length - 1 ? "Próximo →" : "Acabou ✨"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// CLAY SCULPTURE — Moving spotlight + gentle 3D rotation
// ============================================================
function SculptureAnimation({ art }) {
  return (
    <div className="anim-layer" aria-hidden>
      <img src={art.src} alt="" className="anim-img anim-tilt" />
      <div className="clay-spot" />
    </div>
  );
}

// ============================================================
// LUNA — Floating collage pieces + breath
// ============================================================
function LunaAnimation({ art }) {
  return (
    <div className="anim-layer" aria-hidden>
      <img src={art.src} alt="" className="anim-img anim-breathe" />
      {Array.from({ length: 18 }).map((_, i) => (
        <span key={i} className="confetti" style={{
          left: `${(i * 13) % 95}%`,
          top: `-5%`,
          animationDelay: `${(i * 0.3) % 4}s`,
          background: art.palette[i % art.palette.length]
        }} />
      ))}
    </div>
  );
}

// ============================================================
// DIA DA MÃE — Scratch-to-reveal rainbow
// ============================================================
function RainbowAnimation({ art }) {
  const canvasRef = useR(null);
  const imgRef = useR(null);
  const drawing = useR(false);
  const [revealed, setRevealed] = useS(0);
  const [showHint, setShowHint] = useS(true);

  // Set up the cover layer once the image loads (canvas matches its size)
  const initCover = () => {
    const c = canvasRef.current;
    const img = imgRef.current;
    if (!c || !img) return;
    const r = c.getBoundingClientRect();
    c.width = r.width * 2;
    c.height = r.height * 2;
    const ctx = c.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(2, 2);
    // Fill with a sky-pink that matches the artwork's bg
    const grad = ctx.createLinearGradient(0, 0, 0, r.height);
    grad.addColorStop(0, "#f2c7d9");
    grad.addColorStop(1, "#f6dbe6");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, r.width, r.height);
    // Add a subtle hint text
    ctx.fillStyle = "rgba(60,40,80,0.32)";
    ctx.font = "italic 22px 'Caveat', cursive";
    ctx.textAlign = "center";
    ctx.fillText("pinta para revelar 🌈", r.width / 2, r.height * 0.5);
  };

  useE(() => {
    const img = imgRef.current;
    if (img && img.complete) initCover();
  }, []);

  const xy = (e) => {
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };

  const stroke = (e) => {
    const c = canvasRef.current;
    if (!c) return;
    const { x, y } = xy(e);
    const ctx = c.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 38, 0, Math.PI * 2);
    ctx.fill();
  };

  const onDown = (e) => {
    drawing.current = true;
    setShowHint(false);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    stroke(e);
    e.preventDefault();
  };
  const onMove = (e) => {
    if (!drawing.current) return;
    stroke(e);
    if (Math.random() < 0.05) {
      const c = canvasRef.current;
      const ctx = c.getContext("2d");
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      let cleared = 0;
      for (let i = 3; i < data.length; i += 4 * 40) {
        if (data[i] < 30) cleared++;
      }
      setRevealed(Math.min(100, Math.round((cleared / (data.length / (4 * 40))) * 100)));
    }
  };
  const onUp = () => { drawing.current = false; };

  const reset = () => {
    setRevealed(0);
    setShowHint(true);
    initCover();
  };

  return (
    <div className="anim-layer rainbow-reveal" aria-hidden>
      <img ref={imgRef} src={art.src} alt="" className="anim-img" onLoad={initCover} />
      <canvas
        ref={canvasRef}
        className="reveal-canvas"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      {revealed > 70 && (
        <div className="rainbow-celebrate">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} className="celebrate-dot" style={{
              left: `${(i * 7) % 100}%`,
              top: `${(i * 11) % 100}%`,
              background: ["#ec3a2a", "#f08a2a", "#f7d54a", "#3aa46a", "#5a78d8", "#a04acb"][i % 6],
              animationDelay: `${(i * 0.05) % 1.4}s`
            }} />
          ))}
        </div>
      )}
      <div className="reveal-controls" onClick={(e) => e.stopPropagation()}>
        <div className="reveal-meter">
          <div className="reveal-meter-bar" style={{ width: revealed + "%" }} />
        </div>
        <span className="reveal-meter-label">{revealed}% revelado</span>
        <button className="reveal-reset" onClick={reset}>↺ Cobrir</button>
      </div>
    </div>
  );
}

// ============================================================
// WARHOL — Pop-art color cycling on each of the 4 panels
// ============================================================
const WARHOL_PALETTES = [
  // each entry: [tlBg, trBg, blBg, brBg]
  ["#ec3a8a", "#f7d54a", "#3aa46a", "#f08a2a"], // original-ish
  ["#f08a2a", "#ec3a8a", "#f7d54a", "#3aa46a"],
  ["#3aa46a", "#f08a2a", "#ec3a8a", "#f7d54a"],
  ["#f7d54a", "#3aa46a", "#f08a2a", "#ec3a8a"],
  ["#2a6fd8", "#ec3a2a", "#a04acb", "#f7d54a"],
  ["#a04acb", "#2a6fd8", "#ec3a2a", "#9aff3a"],
  ["#ec3a2a", "#2a6fd8", "#f7d54a", "#ec3a8a"]
];

function WarholAnimation({ art }) {
  const [phase, setPhase] = useS(0);
  const [paused, setPaused] = useS(false);
  const [burst, setBurst] = useS(null); // { idx, key }

  useE(() => {
    if (paused) return;
    const t = setInterval(() => {
      setPhase((p) => (p + 1) % WARHOL_PALETTES.length);
    }, 900);
    return () => clearInterval(t);
  }, [paused]);

  const colors = WARHOL_PALETTES[phase];

  const onPanelClick = (idx) => (e) => {
    e.stopPropagation();
    setBurst({ idx, key: Math.random() });
  };

  // The Warhol image has 4 quadrants. We position blend overlays over each.
  const panels = [
    { idx: 0, top: "2%",   left: "2%",  w: "47%", h: "47%" },
    { idx: 1, top: "2%",   left: "51%", w: "47%", h: "47%" },
    { idx: 2, top: "51%",  left: "2%",  w: "47%", h: "47%" },
    { idx: 3, top: "51%",  left: "51%", w: "47%", h: "47%" }
  ];

  return (
    <div className="anim-layer warhol-stage" aria-hidden>
      <div className="warhol-zigzag" />
      <img src={art.src} alt="" className="anim-img" />

      {panels.map((p) => (
        <div
          key={p.idx}
          className="warhol-panel"
          style={{
            top: p.top, left: p.left, width: p.w, height: p.h,
            background: colors[p.idx]
          }}
          onClick={onPanelClick(p.idx)}
        />
      ))}

      {/* Halftone dots overlay – pure pop-art */}
      <div className="warhol-halftone" />

      {/* Pulse a panel on click */}
      {burst && (
        <span
          key={burst.key}
          className="warhol-burst"
          style={{
            top: panels[burst.idx].top,
            left: panels[burst.idx].left,
            width: panels[burst.idx].w,
            height: panels[burst.idx].h
          }}
        />
      )}

      <div className="warhol-controls" onClick={(e) => e.stopPropagation()}>
        <button
          className="warhol-btn"
          onClick={() => setPaused(!paused)}
        >{paused ? "▶ play" : "⏸ pause"}</button>
        <button
          className="warhol-btn"
          onClick={() => setPhase((p) => (p + 1) % WARHOL_PALETTES.length)}
        >→ próximas cores</button>
      </div>
    </div>
  );
}

// ============================================================
// MBAPPÉ COLLAGE — pieces of the collage drift gently; sparkles
// ============================================================
function MbappeAnimation({ art }) {
  return (
    <div className="anim-layer mbappe-stage" aria-hidden>
      <img src={art.src} alt="" className="anim-img anim-breathe" />
      {/* Soccer ball icons + sparkles drifting up */}
      {Array.from({ length: 14 }).map((_, i) => (
        <span key={i} className="mbappe-spark" style={{
          left: `${(i * 11) % 95}%`,
          animationDelay: `${(i * 0.4) % 5}s`,
          background: ["#fff", "#f7d54a", "#1f7a3a", "#fff"][i % 4]
        }} />
      ))}
      <div className="mbappe-stamp">
        <span>⚽</span><span>MBAP</span><span>⚽</span>
      </div>
    </div>
  );
}

// ============================================================
// MANUEL MAESTRO — figure with waving arms (CSS pulse)
// ============================================================
function MaestroAnimation({ art }) {
  return (
    <div className="anim-layer maestro-stage" aria-hidden>
      <img src={art.src} alt="" className="anim-img anim-sway" />
      {/* Music notes float up from the maracas */}
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={"l" + i} className="maestro-note" style={{
          left: "22%",
          animationDelay: `${(i * 0.6) % 3}s`,
          color: ["#1f8a4a", "#c8211c", "#e8d96a"][i % 3]
        }}>{["♪", "♫", "♬"][i % 3]}</span>
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={"r" + i} className="maestro-note" style={{
          left: "76%",
          animationDelay: `${0.3 + (i * 0.6) % 3}s`,
          color: ["#c8211c", "#1f8a4a", "#e8d96a"][i % 3]
        }}>{["♬", "♪", "♫"][i % 3]}</span>
      ))}
    </div>
  );
}

// ============================================================
// Export to window
// ============================================================
window.ANIMS = {
  miro: MiroAnimation,
  sunflowers: SunflowersAnimation,
  warhol: WarholAnimation,
  portrait: PortraitAnimation,
  matisse: MatisseAnimation,
  mbappe: MbappeAnimation,
  maestro: MaestroAnimation,
  story: StoryAnimation,
  sculpture: SculptureAnimation,
  luna: LunaAnimation,
  rainbow: RainbowAnimation
};

Object.assign(window, {
  MiroAnimation, SunflowersAnimation, WarholAnimation, PortraitAnimation,
  MatisseAnimation, MbappeAnimation, MaestroAnimation,
  StoryAnimation, SculptureAnimation, LunaAnimation, RainbowAnimation
});
