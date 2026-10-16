// Gallery shell: wall layout, zoom modal, discover dots, rainbow mini-game.
// All per-piece animations live in art-animations.jsx (loaded before this file)
// and are looked up via window.ANIMS by art.anim id.

const { useState, useEffect, useRef } = React;

// Small versions of the photo for the wall and hallway (QUA-12). Convention, no schema field:
// assets/art/<id>/photo.jpeg has thumb-480.jpeg and thumb-960.jpeg beside it (npm run thumbs).
// If they are missing, the image falls back to the full photo.
function thumbProps(art, sizes) {
  const base = art.src.replace(/photo\.jpeg$/, "");
  if (base === art.src) return { src: art.src };
  return {
    src: base + "thumb-960.jpeg",
    srcSet: base + "thumb-480.jpeg 480w, " + base + "thumb-960.jpeg 960w",
    sizes,
    onError: (e) => {
      e.currentTarget.onerror = null;
      e.currentTarget.removeAttribute("srcset");
      e.currentTarget.src = art.src;
    }
  };
}

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

// ---------- Audio description (voice reading the piece) ----------
// Data lives in audio-data.js (window.AUDIO[art.id]); no entry = no control.
const fmtTime = (s) => {
  s = Math.max(0, Math.round(s || 0));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
};

function AudioDescription({ art }) {
  const entry = (window.AUDIO || {})[art.id];
  const audioRef = useRef(null);
  const [state, setState] = useState("idle");   // idle | loading | playing | paused | error
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(entry ? entry.secs : 0);
  const [showText, setShowText] = useState(false);

  // Stops with the piece: unmount covers close, prev/next and the Sala.
  useEffect(() => () => {
    const a = audioRef.current;
    if (a) { a.pause(); a.removeAttribute("src"); a.load(); }
  }, []);

  if (!entry) return null;

  const ensure = () => {
    if (audioRef.current) return audioRef.current;
    const a = new Audio();
    a.preload = "none";
    a.src = entry.src;
    a.onplaying = () => setState("playing");
    a.onwaiting = () => setState("loading");
    a.onpause = () => { if (!a.ended) setState("paused"); };
    a.onended = () => { setState("idle"); setTime(0); };
    a.onerror = () => setState("error");
    a.ontimeupdate = () => setTime(a.currentTime);
    a.onloadedmetadata = () => { if (isFinite(a.duration)) setDur(a.duration); };
    audioRef.current = a;
    return a;
  };

  const toggle = () => {
    const a = ensure();
    if (state === "playing" || state === "loading") { a.pause(); return; }
    if (state === "error") a.load();
    setState("loading");
    a.play().catch(() => setState("error"));
  };

  const busy = state === "playing" || state === "loading";
  return (
    <div className="zm-audio">
      <button className="zm-btn" onClick={toggle} aria-pressed={state === "playing"}>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
          {busy ? <path d="M6 5h4v14H6zM14 5h4v14h-4z" /> : <path d="M7 4.5v15l13-7.5z" />}
        </svg>
        {busy ? "Pausar" : state === "paused" ? "Continuar" : "Ouvir a descrição"}
      </button>
      {(state !== "idle" || time > 0) && (
        <div className="zm-audio-bar" aria-hidden="true">
          <span style={{ width: (dur ? Math.min(100, (time / dur) * 100) : 0) + "%" }} />
        </div>
      )}
      <div className="zm-audio-meta" aria-live="polite">
        {state === "error"
          ? "Não foi possível ouvir. Tenta outra vez."
          : fmtTime(time) + " / " + fmtTime(dur)}
        {entry.text && (
          <button className="zm-link" aria-expanded={showText} onClick={() => setShowText(v => !v)}>
            {showText ? "Esconder texto" : "Ler"}
          </button>
        )}
      </div>
      {showText && entry.text && <p className="zm-audio-text">{entry.text}</p>}
    </div>
  );
}

// ---------- Visitor comments (Name + Comment, no accounts) ----------
// Backed by /api/comments (api/comments.js). Plain static hosting without it → friendly notice.
const ago = (ts) => {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "agora mesmo";
  if (m < 60) return "há " + m + " min";
  const h = Math.floor(m / 60);
  if (h < 24) return "há " + h + (h === 1 ? " hora" : " horas");
  const d = Math.floor(h / 24);
  return "há " + d + (d === 1 ? " dia" : " dias");
};
const storedName = () => { try { return localStorage.getItem("fmb-name") || ""; } catch (e) { return ""; } };
const LINK_RE = /(https?:\/\/|www\.)/i;

function CommentsPanel({ art, onClose, onCount }) {
  const [list, setList] = useState(null);        // null = loading
  const [down, setDown] = useState(false);
  const [name, setName] = useState(storedName);
  const [text, setText] = useState("");
  const [hp, setHp] = useState("");               // honeypot, hidden from people
  const [errs, setErrs] = useState({});
  const [sending, setSending] = useState(false);
  const [fail, setFail] = useState("");
  const nameRef = useRef(null);

  useEffect(() => {
    let off = false;
    setList(null); setDown(false);
    fetch("/api/comments?art=" + encodeURIComponent(art.id))
      .then(r => { if (!r.ok) throw 0; return r.json(); })
      .then(j => { if (off) return; const c = j.comments || []; setList(c); onCount(c.length); })
      .catch(() => { if (!off) setDown(true); });
    return () => { off = true; };
  }, [art.id]);

  useEffect(() => { if (nameRef.current) nameRef.current.focus(); }, []);

  const check = (f) => {
    const msg = {
      name: !name.trim() ? "Escreve o teu nome." : LINK_RE.test(name) ? "Não é possível enviar ligações." : "",
      text: !text.trim() ? "Escreve um comentário." : LINK_RE.test(text) ? "Não é possível enviar ligações." : ""
    };
    setErrs(e => f ? { ...e, [f]: msg[f] } : msg);
    return !msg.name && !msg.text;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (sending || !check()) return;
    setSending(true); setFail("");
    try {
      const r = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ art: art.id, name, text, website: hp })
      });
      if (r.status === 429) throw "Já enviaste vários comentários. Tenta mais tarde.";
      if (!r.ok) throw 0;
      const j = await r.json();
      try { localStorage.setItem("fmb-name", name.trim()); } catch (e2) {}
      if (j.comment) {
        const next = [j.comment, ...(list || [])];
        setList(next); onCount(next.length);
      }
      setText("");
    } catch (err) {
      setFail(typeof err === "string" ? err : "Não foi possível enviar. O teu texto continua aqui; tenta outra vez.");
    }
    setSending(false);
  };

  return (
    <aside className="zm-comments" role="dialog" aria-label="Comentários" onClick={(e) => e.stopPropagation()}>
      <div className="zm-comments-head">
        <div>
          <h2 className="zm-comments-title">Comentários</h2>
          <p className="zm-comments-ask">O que sentiste ao ver esta obra?</p>
        </div>
        <button className="zm-comments-x" onClick={onClose} aria-label="Fechar comentários">×</button>
      </div>

      {down ? (
        <p className="zm-comments-note">Os comentários só funcionam no site publicado.</p>
      ) : (
        <>
          <form className="zm-form" onSubmit={submit} noValidate>
            <label className="zm-field">
              <span>Nome</span>
              <input ref={nameRef} value={name} maxLength={40} autoComplete="given-name"
                onChange={e => setName(e.target.value)} onBlur={() => check("name")}
                aria-invalid={!!errs.name} aria-describedby={errs.name ? "cm-e-name" : undefined} />
              {errs.name && <em id="cm-e-name" className="zm-err">{errs.name}</em>}
            </label>
            <label className="zm-field">
              <span>Comentário</span>
              <textarea rows={3} value={text} maxLength={280}
                onChange={e => setText(e.target.value)} onBlur={() => check("text")}
                aria-invalid={!!errs.text} aria-describedby={errs.text ? "cm-e-text" : undefined} />
              <small className="zm-count">{text.length} / 280</small>
              {errs.text && <em id="cm-e-text" className="zm-err">{errs.text}</em>}
            </label>
            <input className="zm-hp" tabIndex={-1} autoComplete="off" aria-hidden="true"
              value={hp} onChange={e => setHp(e.target.value)} name="website" />
            {fail && <em className="zm-err" role="alert">{fail}</em>}
            <button className="zm-cta zm-send" type="submit" disabled={sending}>
              {sending ? "A enviar…" : "Enviar"}
            </button>
          </form>

          {list === null && <p className="zm-comments-note">A carregar…</p>}
          {list && list.length === 0 && <p className="zm-comments-note">Ainda ninguém comentou. Sê o primeiro.</p>}
          {list && list.length > 0 && (
            <ul className="zm-comments-list">
              {list.map(c => (
                <li key={c.id} className="zm-comment">
                  <div className="zm-comment-head">
                    <strong>{c.name}</strong><time>{ago(c.ts)}</time>
                  </div>
                  <p>{c.text}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </aside>
  );
}

// ---------- Zoom modal (the "frame view") ----------
function ZoomModal({ art, onClose, onStep, theme }) {
  const [showDots, setShowDots] = useState(false);
  const [game, setGame] = useState(false);
  const [showRoom, setShowRoom] = useState(false);   // ← Experimentation Room
  const [showComments, setShowComments] = useState(false);
  const [nComments, setNComments] = useState(null);
  const Anim = (window.ANIMS && window.ANIMS[art.anim]) || PlainAnim;

  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA)$/.test((e.target && e.target.tagName) || "");
      if (e.key === "Escape") { showComments ? setShowComments(false) : onClose(); return; }
      if (!onStep || showRoom || game || typing) return;
      if (e.key === "ArrowRight") onStep(1);
      if (e.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onStep, showRoom, game, showComments]);

  // Reveal dots after a beat so the zoom animation finishes first
  useEffect(() => {
    setShowDots(false);
    setNComments(null);
    const t = setTimeout(() => setShowDots(true), 650);
    return () => clearTimeout(t);
  }, [art.id]);

  // ── Open the Experimentation Room ──
  if (showRoom) {
    const ExperiRoom = window.ExperimentationRoom || PlainAnim;
    return <ExperiRoom art={art} onClose={() => setShowRoom(false)} />;
  }

  return (
    <div className={"zoom-modal theme-" + theme} onClick={onClose}>
      <button className="zm-close" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Fechar">×</button>
      {onStep && (
        <>
          <button className="zm-nav zm-nav-prev" aria-label="Obra anterior"
            onClick={(e) => { e.stopPropagation(); onStep(-1); }}>←</button>
          <button className="zm-nav zm-nav-next" aria-label="Obra seguinte"
            onClick={(e) => { e.stopPropagation(); onStep(1); }}>→</button>
        </>
      )}

      <div className="zm-stage" key={art.id} onClick={(e) => e.stopPropagation()}>
        <div className={"zm-frame zm-frame-" + art.anim} style={{ aspectRatio: `${art.w} / ${art.h}`, "--ar": art.w / art.h }}>
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
          <AudioDescription art={art} />
          <button className="zm-btn" onClick={() => setShowComments(v => !v)} aria-expanded={showComments}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor"><path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1z"/></svg>
            Comentários{nComments ? " (" + nComments + ")" : ""}
          </button>
          {/* ── Experimentation Room button ── */}
          <button className="zm-cta zm-cta-room" onClick={() => setShowRoom(true)}>
            🔬 Sala de Experimentação
          </button>
        </div>
      </div>

      {showComments && <CommentsPanel key={art.id} art={art} onClose={() => setShowComments(false)} onCount={setNComments} />}

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
          <img {...thumbProps(art, "(max-width: 700px) 70vw, 360px")} alt={art.title} className="wp-img" loading="lazy" />
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
  // Three loose rows, top edge ~6–8%, ~37–43%, ~66–69%. Each piece is at most
  // ~24% of the board tall at 16:10 (about 27% at 16:9), so rows never touch.
  // Row 1
  warhol:        { l: 4.0,  t: 6,  w: 10.4 },
  miro:          { l: 19.6, t: 8,  w: 11.4 },
  vangogh:       { l: 36.3, t: 6,  w: 10.5 },
  eraumavez:     { l: 52.0, t: 7,  w: 11.4 },
  mbappe:        { l: 68.7, t: 6,  w: 11.3 },
  rasgacola:     { l: 85.2, t: 8,  w: 10.8 },
  // Row 2
  portrait:      { l: 4.0,  t: 37, w: 8.2 },
  matisse:       { l: 19.0, t: 41, w: 12.5 },
  luna:          { l: 38.3, t: 37, w: 3.2 },
  diadamae:      { l: 48.2, t: 38, w: 9.7 },
  clay:          { l: 64.7, t: 37, w: 10.5 },
  meiodemim:     { l: 82.0, t: 43, w: 14 },
  // Row 3
  portal:        { l: 4.0,  t: 67, w: 14 },
  casaaranhas:   { l: 24.6, t: 68, w: 14 },
  manuelfigure:  { l: 45.1, t: 66, w: 12.4 },
  maemargarida:  { l: 64.1, t: 66, w: 10.3 },
  agentesecreto: { l: 81.0, t: 69, w: 15 }
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
          <img {...thumbProps(art, "(max-width: 700px) 30vw, 16vw")} alt={art.title} className="gw-img" loading="lazy" />
        </span>
      </span>
      <span className="gw-tag">
        <span className="gw-tag-title">{art.title}</span>
        <span className="gw-tag-meta">{art.signature || art.artist}</span>
      </span>
    </button>
  );
}

// Artist galleries have few, varying pieces, so they are laid out automatically:
// pieces in a row share a height, rows are centred, and the largest fit wins.
function autoWallLayout(pieces, vw, vh) {
  const n = pieces.length;
  if (!n) return {};
  const ratios = pieces.map((a) => a.w / a.h);
  // Use nearly the whole room: below the heading (~150px) and above the hint pill (~64px).
  // gy leaves space for the plaque under each piece.
  const topStart = Math.max(vh * 0.22, 150);
  const availW = vw * 0.92, availH = vh - topStart - 64;
  const gx = vw * 0.02, gy = 46;
  let best = null;
  for (let k = 1; k <= Math.min(n, 5); k++) {
    const target = ratios.reduce((x, y) => x + y, 0) / k;
    const rows = [[]];
    let sum = 0;
    ratios.forEach((r, i) => {
      if (sum >= target && rows.length < k) { rows.push([]); sum = 0; }
      rows[rows.length - 1].push(i);
      sum += r;
    });
    let h = (availH - (rows.length - 1) * gy) / rows.length;
    rows.forEach((row) => {
      const rs = row.reduce((x, i) => x + ratios[i], 0);
      h = Math.min(h, (availW - (row.length - 1) * gx) / rs);
    });
    h = Math.min(h, vh * 0.5);
    if (!best || h > best.h) best = { h, rows };
  }
  const { h, rows } = best;
  const top0 = topStart + (availH - (rows.length * h + (rows.length - 1) * gy)) / 2;
  const out = {};
  rows.forEach((row, ri) => {
    const rw = row.reduce((x, i) => x + h * ratios[i], 0) + (row.length - 1) * gx;
    let x = (vw - rw) / 2;
    row.forEach((i) => {
      const w = h * ratios[i];
      out[pieces[i].id] = {
        l: (x / vw) * 100,
        t: ((top0 + ri * (h + gy)) / vh) * 100,
        w: (w / vw) * 100
      };
      x += w + gx;
    });
  });
  return out;
}

function useViewport() {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return vp;
}

function GalleryWall({ theme, pieces, heading, zoomed, setZoomed, onStep }) {
  const vp = useViewport();
  // "Todos" keeps the hand-hung salon layout; artist galleries are automatic.
  const layouts = heading ? autoWallLayout(pieces, vp.w, vp.h) : WALL_LAYOUT;
  return (
    <div className={"gallery-wall theme-" + theme}>
      {heading && (
        <div className="gw-heading">
          <h1 className="gw-heading-name">{heading.name}</h1>
          <p className="gw-heading-meta">{heading.meta}</p>
        </div>
      )}
      <div className="gw-room">
        <div className="gw-board">
          {pieces.map((art, i) => {
            const layout = layouts[art.id];
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

      {zoomed && <ZoomModal art={zoomed} onClose={() => setZoomed(null)} onStep={onStep} theme={theme} />}
    </div>
  );
}

// ---------- Long horizontal hallway ----------
// `artist` filters the gallery (null = everyone). Which artwork is open is owned
// by the router in index.html: openId / onOpen(id) / onClose() / onStep(id).
function Hallway({ theme, artist, openId, onOpen, onClose, onStep }) {
  const scrollerRef = useRef(null);
  const all = HALLWAY_ORDER.map((id) => ART.find((a) => a.id === id)).filter(Boolean);
  const pieces = artist ? all.filter((a) => a.artist === artist) : all;

  const zoomed = openId ? pieces.find((a) => a.id === openId) || null : null;
  const setZoomed = (art) => (art ? onOpen(art.id) : onClose());
  const step = pieces.length > 1 && onStep ? (dir) => {
    const i = pieces.findIndex((a) => a.id === openId);
    onStep(pieces[(i + dir + pieces.length) % pieces.length].id);
  } : undefined;

  const ages = pieces.map((a) => a.age);
  const heading = artist ? {
    name: artist,
    meta: pieces.length + (pieces.length === 1 ? " obra" : " obras") +
      (ages.length ? " · " + (Math.min(...ages) === Math.max(...ages)
        ? Math.min(...ages) + " anos"
        : Math.min(...ages) + "–" + Math.max(...ages) + " anos") : "")
  } : null;

  // The salon-style wall is its own layout — bypass the scrolling hallway.
  if (theme === "wall") {
    return <GalleryWall theme={theme} pieces={pieces} heading={heading}
      zoomed={zoomed} setZoomed={setZoomed} onStep={step} />;
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
              <span className="hall-end-mono">{artist ? "FMB / ART · " + artist : "FMB / ART"}</span>
              <span className="hall-end-sub">{artist ? heading.meta : "Galeria de Arte · Coleção 2026"}</span>
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

      {zoomed && <ZoomModal art={zoomed} onClose={() => setZoomed(null)} onStep={step} theme={theme} />}
    </div>
  );
}

Object.assign(window, { Hallway, GalleryWall, WallPiecePin, ZoomModal, WallPiece, RainbowGame, DiscoverDot });
