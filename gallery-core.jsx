// Gallery shell: wall layout, zoom modal, discover dots, rainbow mini-game.
// All per-piece animations live in art-animations.jsx (loaded before this file)
// and are looked up via window.ANIMS by art.anim id.

const { useState, useEffect, useRef } = React;

// ---------- Rainbow paint-your-own mini-game ----------
function RainbowGame({ onClose }) {
  const canvasRef = useRef(null);
  const [color, setColor] = useState("#ec3a2a");
  const colors = ["#ec3a2a", "#f08a2a", "#f7d54a", "#3aa46a", "#5a78d8", "#a04acb"];
  const drawing = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * 2;
    c.height = rect.height * 2;
    const ctx = c.getContext("2d");
    ctx.scale(2, 2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 28;
  }, []);

  const xy = (e) => {
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };

  const start = (e) => {
    drawing.current = true;
    const { x, y } = xy(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e) => {
    if (!drawing.current) return;
    const { x, y } = xy(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const end = () => { drawing.current = false; };
  const clear = () => {
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
  };

  return (
    <div className="rainbow-game">
      <div className="rg-canvas-wrap">
        <canvas
          ref={canvasRef}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={(e) => { e.preventDefault(); start(e); }}
          onTouchMove={(e) => { e.preventDefault(); move(e); }}
          onTouchEnd={end}
        />
        <div className="rg-hint">Pinta o teu arco-íris! 🎨</div>
      </div>
      <div className="rg-controls">
        <div className="rg-colors">
          {colors.map((c) => (
            <button key={c} className={"rg-color " + (color === c ? "is-active" : "")}
              style={{ background: c }} onClick={() => setColor(c)} aria-label={c} />
          ))}
        </div>
        <div className="rg-actions">
          <button className="rg-btn" onClick={clear}>Limpar</button>
          <button className="rg-btn rg-btn-primary" onClick={onClose}>Pronto</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Discover dot ----------
function DiscoverDot({ dot, n }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      className={"dd " + (open ? "is-open" : "")}
      style={{ left: dot.x + "%", top: dot.y + "%" }}
      onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
    >
      <span className="dd-num">{n}</span>
      <span className="dd-pulse" />
      {open && (
        <span className="dd-pop">
          <strong>{dot.label}</strong>
          <em>{dot.detail}</em>
        </span>
      )}
    </button>
  );
}

// ---------- Default fallback animation (just static image) ----------
function PlainAnim({ art }) {
  return <img src={art.src} alt="" className="anim-img" />;
}

// ---------- Zoom modal (the "frame view") ----------
function ZoomModal({ art, onClose, theme }) {
  const [showDots, setShowDots] = useState(false);
  const [game, setGame] = useState(false);
  const Anim = (window.ANIMS && window.ANIMS[art.anim]) || PlainAnim;

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Reveal dots after a beat so the zoom animation finishes first
  useEffect(() => {
    const t = setTimeout(() => setShowDots(true), 650);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={"zoom-modal theme-" + theme} onClick={onClose}>
      <button className="zm-close" onClick={onClose} aria-label="Fechar">×</button>

      <div className="zm-stage" onClick={(e) => e.stopPropagation()}>
        <div className={"zm-frame zm-frame-" + art.anim} style={{ aspectRatio: `${art.w} / ${art.h}` }}>
          <Anim art={art} />
          {showDots && art.dots.map((d, i) => (
            <DiscoverDot key={i} dot={d} n={i + 1} />
          ))}
        </div>

        <div className="zm-label">
          <div className="zm-label-title">{art.title}</div>
          <div className="zm-label-meta">
            <span>{art.signature || art.artist}</span>
            <span className="zm-dot">•</span>
            <span>{art.age} anos</span>
            <span className="zm-dot">•</span>
            <span>{art.year}</span>
          </div>
          {art.interactive === "paint-rainbow" && (
            <button className="zm-cta" onClick={() => setGame(true)}>
              🎨 Pinta o teu próprio
            </button>
          )}
        </div>
      </div>

      {game && (
        <div className="zm-game" onClick={(e) => e.stopPropagation()}>
          <RainbowGame onClose={() => setGame(false)} />
        </div>
      )}
    </div>
  );
}

// ---------- Wall painting (the piece on the wall) ----------
function WallPiece({ art, theme, onOpen, index }) {
  const aspect = art.h / art.w;
  const baseH = aspect > 3 ? 720 : aspect > 1.5 ? 620 : aspect > 1 ? 540 : 480;
  const w = baseH / aspect;

  return (
    <button
      className={"wall-piece wp-anim-" + art.anim}
      style={{ "--w": w + "px", "--h": baseH + "px" }}
      onClick={() => onOpen(art)}
      aria-label={`Abrir ${art.title}`}
    >
      <span className="wp-spotlight" aria-hidden />
      <span className="wp-frame">
        <span className="wp-mat">
          <img src={art.src} alt={art.title} className="wp-img" loading="lazy" />
        </span>
      </span>
      <span className="wp-plaque">
        <span className="wp-plaque-title">{art.title}</span>
        <span className="wp-plaque-meta">{art.signature || art.artist} · {art.age} anos</span>
      </span>
    </button>
  );
}

// ---------- Salon-style gallery wall (theme: wall) ----------
// Pieces are absolutely positioned on a fixed-ratio wall. No scroll.
// Click any piece to zoom into the regular ZoomModal.
// Top-aligned in loose rows so different aspect ratios stay neat.
// l: % of board width (top-left edge); t: cqh (= % of board height);
// w: cqh — height is derived from the image's natural aspect ratio.
const WALL_LAYOUT = {
  // top-left positioning. l: % of board width; t: % of board height;
  // w: % of board width. Height is derived via CSS aspect-ratio on the frame.
  // Row 1 (top edge ~8–12%)
  warhol:       { l: 4,  t: 8,  w: 13 },
  miro:         { l: 22, t: 12, w: 11 },
  vangogh:      { l: 37, t: 8,  w: 12 },
  eraumavez:    { l: 54, t: 10, w: 12 },
  mbappe:       { l: 70, t: 9,  w: 12 },
  // Row 2 (top edge ~50–58%)
  matisse:      { l: 4,  t: 58, w: 10 },
  portrait:     { l: 19, t: 50, w: 9 },
  luna:         { l: 32, t: 50, w: 4 },
  diadamae:     { l: 40, t: 52, w: 12 },
  clay:         { l: 57, t: 53, w: 11 },
  manuelfigure: { l: 73, t: 56, w: 11 }
};

function WallPiecePin({ art, layout, onOpen, i }) {
  return (
    <button
      className={"gw-piece gw-piece-" + art.id + " wp-anim-" + art.anim}
      style={{
        left: layout.l + "%",
        top: layout.t + "%",
        width: layout.w + "%",
        "--ratio": `${art.w} / ${art.h}`,
        "--i": i
      }}
      onClick={() => onOpen(art)}
      aria-label={`Abrir ${art.title}`}
    >
      <span className="gw-frame">
        <span className="gw-mat">
          <img src={art.src} alt={art.title} className="gw-img" loading="lazy" />
        </span>
      </span>
      <span className="gw-tag">
        <span className="gw-tag-title">{art.title}</span>
        <span className="gw-tag-meta">{art.signature || art.artist}</span>
      </span>
    </button>
  );
}

function GalleryWall({ theme, pieces, zoomed, setZoomed }) {
  return (
    <div className={"gallery-wall theme-" + theme}>
      <div className="gw-room">
        <div className="gw-board">
          {pieces.map((art, i) => {
            const layout = WALL_LAYOUT[art.id];
            if (!layout) return null;
            return (
              <WallPiecePin
                key={art.id}
                art={art}
                layout={layout}
                i={i}
                onOpen={setZoomed}
              />
            );
          })}
        </div>
      </div>

      {zoomed && <ZoomModal art={zoomed} onClose={() => setZoomed(null)} theme={theme} />}
    </div>
  );
}

// ---------- Long horizontal hallway ----------
function Hallway({ theme }) {
  const [zoomed, setZoomed] = useState(null);
  const scrollerRef = useRef(null);
  const pieces = HALLWAY_ORDER.map((id) => ART.find((a) => a.id === id)).filter(Boolean);

  // The salon-style wall is its own layout — bypass the scrolling hallway.
  if (theme === "wall") {
    return <GalleryWall theme={theme} pieces={pieces} zoomed={zoomed} setZoomed={setZoomed} />;
  }

  // Horizontal scroll via mouse wheel
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Keyboard nav arrows
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onKey = (e) => {
      if (zoomed) return;
      if (e.key === "ArrowRight") el.scrollBy({ left: 600, behavior: "smooth" });
      if (e.key === "ArrowLeft") el.scrollBy({ left: -600, behavior: "smooth" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  const scrollBy = (dx) => {
    scrollerRef.current?.scrollBy({ left: dx, behavior: "smooth" });
  };

  return (
    <div className={"hallway theme-" + theme}>
      <div className="hall-bg" aria-hidden>
        <div className="hall-ceiling" />
        <div className="hall-wall" />
        <div className="hall-floor" />
        <div className="hall-lights">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="hall-light" />
          ))}
        </div>
      </div>

      <div className="hall-scroller" ref={scrollerRef}>
        <div className="hall-strip">
          <div className="hall-end hall-end-left" aria-hidden>
            <div className="hall-end-title">
              <span className="hall-end-mono">FMB / ART</span>
              <span className="hall-end-sub">Galeria de Arte · Coleção 2026</span>
            </div>
          </div>
          {pieces.map((art, i) => (
            <WallPiece key={art.id} art={art} theme={theme} onOpen={setZoomed} index={i} />
          ))}
          <div className="hall-end hall-end-right" aria-hidden>
            <div className="hall-end-title">
              <span className="hall-end-mono">Fim da Galeria</span>
              <span className="hall-end-sub">Obrigado pela visita</span>
            </div>
          </div>
        </div>
      </div>

      <button className="nav-arrow nav-arrow-left" onClick={() => scrollBy(-700)} aria-label="Anterior">←</button>
      <button className="nav-arrow nav-arrow-right" onClick={() => scrollBy(700)} aria-label="Seguinte">→</button>

      {zoomed && <ZoomModal art={zoomed} onClose={() => setZoomed(null)} theme={theme} />}
    </div>
  );
}

Object.assign(window, { Hallway, GalleryWall, WallPiecePin, ZoomModal, WallPiece, RainbowGame, DiscoverDot });
