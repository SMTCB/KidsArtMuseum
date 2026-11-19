// Gallery shell: wall layout, zoom modal, discover dots, rainbow mini-game.
// All per-piece animations live in art-animations.jsx (loaded before this file)
// and are looked up via window.ANIMS by art.anim id.

const { useState, useEffect, useLayoutEffect, useRef } = React;

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
        <div className="rg-hint">Pinta o teu arco-íris!</div>
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
// Which dot is open lives in ZoomModal: the "Para descobrir" list opens the same popover.
// Near an edge the popover turns inward so it stays on the photo's side of the screen.
function DiscoverDot({ dot, n, open, onToggle }) {
  const side = (dot.y < 24 ? " is-low" : "") + (dot.x < 26 ? " is-left" : dot.x > 74 ? " is-right" : "");
  return (
    <button
      className={"dd" + side + (open ? " is-open" : "")}
      style={{ left: dot.x + "%", top: dot.y + "%" }}
      aria-expanded={open}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
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

// Small line icons for the page chrome (no emoji in UI copy).
function Ico({ name, size = 18 }) {
  const paths = {
    back: <path d="M19 12H5M11 6l-6 6 6 6" />,
    next: <path d="M5 12h14M13 6l6 6-6 6" />,
    room: <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3M7.5 15h9" />,
    brush: <path d="M14 4l6 6-8.5 8.5a3 3 0 0 1-2.1.9H5v-4.4a3 3 0 0 1 .9-2.1zM12 6l6 6" />
  };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
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

// Small speaker beside a title on the wall: this piece has the artist's voice (audio-data.js).
function AudioMark({ art, badge }) {
  if (!(window.AUDIO || {})[art.id]) return null;
  return (
    <span className={"art-audio-mark" + (badge ? " art-audio-badge" : "")} role="img" aria-label="Tem descrição em áudio" title="Tem descrição em áudio">
      <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M3 9.5v5h3.5L11 18.5v-13L6.5 9.5z"/>
        <path d="M14 8.5a5 5 0 0 1 0 7M16.6 5.9a9 9 0 0 1 0 12.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    </span>
  );
}

// ---------- Comment counts (which pieces have comments) ----------
// One request for the whole museum: /api/comments?counts=1 → { "<art id>": n }. Cached in
// window.COMMENT_COUNTS. Without the server (local, or comments off) it stays empty and no mark shows.
window.COMMENT_COUNTS = window.COMMENT_COUNTS || {};
let commentCountsAsked = false;
function setCommentCount(id, n) {
  window.COMMENT_COUNTS[id] = n;
  window.dispatchEvent(new Event("fmb-comment-counts"));
}
function useCommentCount(id) {
  const [, tick] = useState(0);
  useEffect(() => {
    const on = () => tick(x => x + 1);
    window.addEventListener("fmb-comment-counts", on);
    if (!commentCountsAsked) {
      commentCountsAsked = true;
      fetch("/api/comments?counts=1")
        .then(r => (r.ok ? r.json() : null))
        .then(j => {
          if (j && j.counts) { Object.assign(window.COMMENT_COUNTS, j.counts); window.dispatchEvent(new Event("fmb-comment-counts")); }
        })
        .catch(() => {});
    }
    return () => window.removeEventListener("fmb-comment-counts", on);
  }, []);
  return window.COMMENT_COUNTS[id] || 0;
}

// Small speech bubble beside a title on the wall: visitors have commented on this piece.
function CommentMark({ art, badge }) {
  const n = useCommentCount(art.id);
  if (!n) return null;
  const label = n === 1 ? "1 comentário" : n + " comentários";
  return (
    <span className={"art-comment-mark" + (badge ? " art-comment-badge" : "")} role="img" aria-label={label} title={label}>
      <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M4 5h16v11H9l-5 4z"/>
      </svg>
    </span>
  );
}

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

  // Drag the bar to jump; "Recomeçar" goes back to 0:00 and keeps the state (playing or paused).
  const seekTo = (t) => {
    const a = ensure();
    const go = () => { a.currentTime = t; setTime(t); };
    if (a.readyState >= 1) go();
    else { a.addEventListener("loadedmetadata", go, { once: true }); a.load(); }
  };
  const restart = () => {
    const a = ensure();
    seekTo(0);
    if (state === "idle" || state === "error") { setState("loading"); a.play().catch(() => setState("error")); }
  };

  const busy = state === "playing" || state === "loading";
  const label = busy ? "Pausar" : state === "paused" ? "Continuar" : "Ouvir a descrição";
  return (
    <div className="zm-audio">
      <button className="zm-play" onClick={toggle} aria-pressed={state === "playing"} aria-label={label}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
          {busy ? <path d="M6 5h4v14H6zM14 5h4v14h-4z" /> : <path d="M7 4.5v15l13-7.5z" />}
        </svg>
      </button>
      <div className="zm-audio-body">
        <div className="zm-audio-title" aria-hidden="true">{label}</div>
        <input
          type="range" className="zm-audio-seek" aria-label="Posição do áudio"
          min="0" max={dur || 1} step="0.1" value={Math.min(time, dur || 1)}
          style={{ "--pos": (dur ? Math.min(100, (time / dur) * 100) : 0) + "%" }}
          onChange={(e) => seekTo(parseFloat(e.target.value))}
        />
        <div className="zm-audio-meta" aria-live="polite">
          <span>
            {state === "error"
              ? "Não foi possível ouvir. Tenta outra vez."
              : fmtTime(time) + " / " + fmtTime(dur)}
          </span>
          <button className="zm-link" onClick={restart}>Recomeçar</button>
          {entry.text && (
            <button className="zm-link" aria-expanded={showText} onClick={() => setShowText(v => !v)}>
              {showText ? "Esconder texto" : "Ler"}
            </button>
          )}
        </div>
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

// ---------- The piece's own frame, away from the wall ----------
// The artwork page and the Sala hang the photo in the same frame it wears on the wall (QUA-16):
// the wrapper carries `gw-piece-<id>`, so the frame looks in gallery.css apply as they are.
// Their paddings are shares of the frame's width, so the plate is sized by width: it is
// measured once at any width (its height is a fixed multiple of it), then set to the largest
// width that fits `avail` ({ w, h } in px). `children` is the photo block, which must fill the
// mat's width and keep the artwork's ratio; `ratio` only tells the plate when to measure again.
function FramedPlate({ art, ratio, avail, children, className }) {
  const ref = useRef(null);
  const [w, setW] = useState(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !avail || !(avail.w > 0) || !(avail.h > 0)) return;
    const w0 = el.offsetWidth, h0 = el.offsetHeight;
    if (!w0 || !h0) return;
    setW(Math.max(80, Math.floor(Math.min(avail.w, avail.h / (h0 / w0)))));
  }, [avail && avail.w, avail && avail.h, art.id, ratio]);
  return (
    <div ref={ref} className={"zm-plate gw-piece-" + art.id + (className ? " " + className : "")}
      style={{ width: (w || 320) + "px" }}>
      <span className="gw-frame"><span className="gw-mat">{children}</span></span>
    </div>
  );
}

// ---------- Zoom modal: the artwork's page ----------
// A light catalogue page (QUA-15): the plate, then title, palette, audio, the dots as a list,
// comments and share, the door to the Sala, and the neighbouring works at the foot.
// `nav` = { pos, total, prev, next } within the gallery being walked (from Hallway).
function ZoomModal({ art, onClose, onStep, theme, nav }) {
  const [showDots, setShowDots] = useState(false);
  const [openDot, setOpenDot] = useState(null);
  const [game, setGame] = useState(false);
  const [showRoom, setShowRoom] = useState(false);   // ← Experimentation Room
  const [showComments, setShowComments] = useState(false);
  const [nComments, setNComments] = useState(null);
  const known = useCommentCount(art.id);
  const [viewIx, setViewIx] = useState(0);            // which angle of a 3D piece (ADR-0019)
  const pageRef = useRef(null);
  const frameRef = useRef(null);
  const [avail, setAvail] = useState(null);           // room for the framed plate, in px
  const views = art.views && art.views.length > 1 ? art.views : null;
  const v = views ? views[viewIx] || views[0] : null;
  // The first view is the main photo: it keeps the animation. The others are plain photos.
  const onMain = !v || viewIx === 0;
  const shown = onMain ? art : { ...art, src: v.src, w: v.w, h: v.h, dots: v.dots || [] };
  const Anim = (onMain && window.ANIMS && window.ANIMS[art.anim]) || PlainAnim;
  const nEffects = (window.TEMPLATE_LIBRARY || []).length;

  useEffect(() => { setViewIx(0); }, [art.id]);
  useEffect(() => { setOpenDot(null); }, [art.id, viewIx]);

  // How much room the plate has: the left column beside the text on a wide screen (it stays in
  // view while the text scrolls), the width of the page on a phone. 40px is left for the shadow.
  useLayoutEffect(() => {
    const calc = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      if (vw > 900) {
        const wide = vw > 1100;
        const col = Math.min(vw, 1480) - 2 * (wide ? 48 : 32) - (wide ? 380 : 340) - (wide ? 64 : 44);
        setAvail({ w: col - 40, h: vh - 168 - (views ? 74 : 0) - 40 });
      } else {
        setAvail({ w: vw - 48 - 30, h: vh * 0.62 });
      }
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [!!views]);
  // A new piece starts at the top of its page
  useEffect(() => { if (pageRef.current) pageRef.current.scrollTop = 0; }, [art.id]);

  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA)$/.test((e.target && e.target.tagName) || "");
      // The Sala has its own keys: Esc there comes back to this page, it does not close it too
      if (showRoom) return;
      if (e.key === "Escape") {
        if (showComments) setShowComments(false);
        else if (game) setGame(false);
        else onClose();
        return;
      }
      if (!onStep || game || typing) return;
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

  // Reveal dots after a beat so the page settles first
  useEffect(() => {
    setShowDots(false);
    setNComments(null);
    const t = setTimeout(() => setShowDots(true), 650);
    return () => clearTimeout(t);
  }, [art.id]);

  // A row of the list opens its dot on the photo, and brings the photo back into view
  const showDot = (i) => {
    const next = openDot === i ? null : i;
    setOpenDot(next);
    if (next !== null && frameRef.current && frameRef.current.scrollIntoView) {
      const calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      frameRef.current.scrollIntoView({ block: "nearest", behavior: calm ? "auto" : "smooth" });
    }
  };

  // ── Open the Experimentation Room ──
  if (showRoom) {
    const ExperiRoom = window.ExperimentationRoom || PlainAnim;
    return <ExperiRoom art={art} onClose={() => setShowRoom(false)} />;
  }

  return (
    <div className={"zoom-modal theme-" + theme} ref={pageRef} role="dialog" aria-modal="true" aria-label={art.title}>
      <header className="zm-bar">
        <button className="zm-back" onClick={onClose}>
          <Ico name="back" />
          {theme === "wall" ? "Parede" : "Galeria"}
        </button>
        {nav && (
          <div className="zm-pager">
            {onStep && (
              <button className="zm-nav" aria-label="Obra anterior" onClick={() => onStep(-1)}><Ico name="back" /></button>
            )}
            <span className="zm-pos">{nav.pos} / {nav.total}</span>
            {onStep && (
              <button className="zm-nav" aria-label="Obra seguinte" onClick={() => onStep(1)}><Ico name="next" /></button>
            )}
          </div>
        )}
      </header>

      <div className="zm-page" key={art.id}>
        <div className={"zm-view" + (views ? " has-views" : "")}>
          <FramedPlate art={art} ratio={shown.w / shown.h} avail={avail}>
            <div className={"zm-frame zm-frame-" + (onMain ? art.anim : "plain")} key={viewIx} ref={frameRef}
              style={{ aspectRatio: `${shown.w} / ${shown.h}` }}>
              <Anim art={shown} />
              {showDots && shown.dots.map((d, i) => (
                <DiscoverDot key={i} dot={d} n={i + 1} open={openDot === i}
                  onToggle={() => setOpenDot(openDot === i ? null : i)} />
              ))}
            </div>
          </FramedPlate>
          {views && (
            <div className="zm-views" role="group" aria-label="Ângulos da obra">
              {views.map((vw, i) => (
                <button key={i} className={"zm-view-chip" + (i === viewIx ? " is-on" : "")}
                  aria-pressed={i === viewIx} onClick={() => setViewIx(i)}>{vw.label}</button>
              ))}
            </div>
          )}
        </div>

        <div className="zm-label">
          <h2 className="zm-label-title">{art.title}</h2>
          <div className="zm-label-meta">
            <span>{art.signature || art.artist}</span>
            <span className="zm-dot">•</span>
            <span>{art.age} anos</span>
            <span className="zm-dot">•</span>
            <span>{art.year}</span>
          </div>
          <div className="zm-palette" role="img" aria-label="As cores da obra">
            <span className="zm-palette-rule" />
            {(art.palette || []).map((c, i) => (
              <span key={i} className="zm-swatch" style={{ background: c }} />
            ))}
          </div>

          {art.interactive === "paint-rainbow" && (
            <button className="zm-cta" onClick={() => setGame(true)}>
              <Ico name="brush" size={16} />
              Pinta o teu próprio
            </button>
          )}

          <AudioDescription art={art} />

          {shown.dots.length > 0 && (
            <section className="zm-finds">
              <h3 className="zm-kicker">Para descobrir</h3>
              <ol>
                {shown.dots.map((d, i) => (
                  <li key={i}>
                    <button className={"zm-find" + (openDot === i ? " is-on" : "")}
                      aria-pressed={openDot === i} onClick={() => showDot(i)}>
                      <span className="zm-find-n">{i + 1}</span>
                      <span className="zm-find-text"><strong>{d.label}</strong><em>{d.detail}</em></span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div className="zm-actions">
            <button className="zm-btn" onClick={() => setShowComments(v => !v)} aria-expanded={showComments}>
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>
              Comentários{(nComments != null ? nComments : known) ? " (" + (nComments != null ? nComments : known) + ")" : ""}
            </button>
            <ShareButton art={art} />
          </div>

          {/* ── The door to the Experimentation Room ── */}
          <button className="zm-room" onClick={() => setShowRoom(true)}>
            <Ico name="room" size={22} />
            <span className="zm-room-text">
              <strong>Sala de Experimentação</strong>
              <em>{nEffects ? nEffects + " efeitos para experimentar nesta obra" : "Efeitos para experimentar nesta obra"}</em>
            </span>
            <Ico name="next" />
          </button>
        </div>
      </div>

      {onStep && nav && nav.prev && nav.next && (
        <nav className="zm-foot" aria-label="Outras obras">
          <button className="zm-foot-link" onClick={() => onStep(-1)}>
            <span className="zm-foot-dir">← Anterior</span>
            <span className="zm-foot-title">{nav.prev.title}</span>
          </button>
          <button className="zm-foot-link zm-foot-next" onClick={() => onStep(1)}>
            <span className="zm-foot-dir">Seguinte →</span>
            <span className="zm-foot-title">{nav.next.title}</span>
          </button>
        </nav>
      )}

      {showComments && <div className="zm-scrim" onClick={() => setShowComments(false)} />}
      {showComments && <CommentsPanel key={"comments-" + art.id} art={art} onClose={() => setShowComments(false)} onCount={(n) => { setNComments(n); setCommentCount(art.id, n); }} />}

      {game && (
        <div className="zm-game" onClick={(e) => e.stopPropagation()}>
          <RainbowGame onClose={() => setGame(false)} />
        </div>
      )}
    </div>
  );
}

// ---------- Share (link + postal) ----------
// Texto de partilha: rascunho para afinar. Duas versões, troca-se SHARE_TONE.
const SHARE_TONE = "warm";
const shareText = (art) => SHARE_TONE === "warm"
  ? `Olha esta obra do ${art.artist}, ${art.age} anos: "${art.title}". Está no nosso museu.`
  : `"${art.title}", de ${art.signature || art.artist} (${art.age} anos), no museu FMB · ART.`;

// The /o/<id> page (scripts/build.js) carries the link preview. Locally it does not exist.
const shareUrl = (art) =>
  /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    ? location.origin + "/#/todos/" + art.id
    : location.origin + "/o/" + art.id;

// Postal: the photo in a frame on the artwork's own ground, with title and brand. Canvas only.
async function makePostal(art) {
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = art.src;
  });
  const W = 1080, pad = 70, label = 190;
  const maxW = W - pad * 2, maxH = 1100;
  const k = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
  const pw = Math.round(img.naturalWidth * k), ph = Math.round(img.naturalHeight * k);
  const H = pad + ph + label + pad / 2;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = art.bg; g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(0,0,0,0.28)"; g.fillRect(0, 0, W, H);
  const x = (W - pw) / 2;
  g.fillStyle = "#f6f1e6"; g.fillRect(x - 18, pad - 18, pw + 36, ph + 36);
  g.drawImage(img, x, pad, pw, ph);
  g.textAlign = "center"; g.fillStyle = "#f6f1e6";
  g.font = "600 52px Georgia, serif";
  g.fillText(art.title, W / 2, pad + ph + 92, maxW);
  g.font = "500 28px system-ui, sans-serif";
  g.fillText(`${art.signature || art.artist}  ·  ${art.age} anos`, W / 2, pad + ph + 140, maxW);
  g.font = "600 20px system-ui, sans-serif";
  g.globalAlpha = 0.7;
  g.fillText("FMB · ART", W / 2, H - 28);
  return new Promise((res) => c.toBlob(res, "image/png"));
}

function ShareButton({ art }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  useEffect(() => { setOpen(false); setNote(""); }, [art.id]);
  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(""), 2500);
    return () => clearTimeout(t);
  }, [note]);

  const sendLink = async () => {
    setOpen(false);
    const data = { title: art.title, text: shareText(art), url: shareUrl(art) };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(data.text + " " + data.url);
      setNote("Ligação copiada");
    } catch (e) {
      if (e && e.name === "AbortError") return;
      setNote("Não foi possível partilhar");
    }
  };

  const sendPostal = async () => {
    setOpen(false);
    setNote("A preparar o postal...");
    try {
      const blob = await makePostal(art);
      const file = new File([blob], art.id + ".png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: art.title, text: shareText(art) });
        setNote("");
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = art.id + ".png";
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        setNote("Postal guardado");
      }
    } catch (e) {
      setNote(e && e.name === "AbortError" ? "" : "Não foi possível criar o postal");
    }
  };

  return (
    <div className="zm-share">
      <button className="zm-btn" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-haspopup="true">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/></svg>
        Partilhar
      </button>
      {open && (
        <div className="zm-share-menu" role="menu">
          <button role="menuitem" onClick={sendLink}>Enviar a ligação</button>
          <button role="menuitem" onClick={sendPostal}>Enviar como postal</button>
        </div>
      )}
      <span className="zm-share-note" role="status" aria-live="polite">{note}</span>
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
        <span className="wp-plaque-title">{art.title}<AudioMark art={art} /><CommentMark art={art} /></span>
        <span className="wp-plaque-meta">{art.signature || art.artist} · {art.age} anos</span>
      </span>
    </button>
  );
}

// ---------- Gallery wall (theme: wall) ----------
// "Todos" flows into rows of equal height and scrolls (flowWallLayout); artist galleries
// fit one screen (autoWallLayout). Click any piece to zoom into the regular ZoomModal.

function WallPiecePin({ art, layout, onOpen, i }) {
  return (
    <button
      className={"gw-piece gw-piece-" + art.id + " wp-anim-" + art.anim}
      style={{
        left: layout.l + "%",
        top: layout.tpx != null ? layout.tpx + "px" : layout.t + "%",
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
        <AudioMark art={art} badge />
        <CommentMark art={art} badge />
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

// "Todos": pieces flow into rows of equal height that fill the wall's width, and the wall
// grows downward (scrolls) as the collection does. No hand placement, nothing is clipped.
// Positions: l = % of board width, tpx = px from the board's top; the board gets `height`.
function flowWallLayout(pieces, vw, vh) {
  const ratios = pieces.map((a) => a.w / a.h);
  const side = Math.max(vw * 0.05, 24);
  const availW = vw - 2 * side;
  const gx = Math.max(vw * 0.02, 18), gy = 64;
  const target = Math.min(Math.max(vh * 0.27, 150), 270);
  const top0 = 128, bottom = 130; // clear the app bar above and the hint pill below
  const rows = [[]];
  let sum = 0;
  ratios.forEach((r, i) => {
    const cur = rows[rows.length - 1];
    if (cur.length && (sum + r) * target + cur.length * gx > availW) { rows.push([]); sum = 0; }
    rows[rows.length - 1].push(i);
    sum += r;
  });
  const out = {};
  let y = top0;
  rows.forEach((row, ri) => {
    const rs = row.reduce((x, i) => x + ratios[i], 0);
    const fit = (availW - (row.length - 1) * gx) / rs;
    // the last row keeps a natural height instead of stretching a few pieces across the wall
    const h = ri === rows.length - 1 ? Math.min(fit, target) : Math.min(fit, target * 1.25);
    const rw = rs * h + (row.length - 1) * gx;
    let x = (vw - rw) / 2;
    row.forEach((i) => {
      const w = h * ratios[i];
      out[pieces[i].id] = { l: (x / vw) * 100, tpx: y, w: (w / vw) * 100 };
      x += w + gx;
    });
    y += h + gy;
  });
  return { layouts: out, height: y - gy + bottom };
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

function GalleryWall({ theme, pieces, heading, zoomed, setZoomed, onStep, nav }) {
  const vp = useViewport();
  // Artist galleries (few pieces) fit one screen; "Todos" flows into rows and scrolls.
  const flow = heading ? null : flowWallLayout(pieces, vp.w, vp.h);
  const layouts = heading ? autoWallLayout(pieces, vp.w, vp.h) : flow.layouts;
  return (
    <div className={"gallery-wall theme-" + theme + (heading ? "" : " gallery-wall-flow")}>
      {heading && (
        <div className="gw-heading">
          <h1 className="gw-heading-name">{heading.name}</h1>
          <p className="gw-heading-meta">{heading.meta}</p>
        </div>
      )}
      <div className="gw-room">
        <div className={"gw-board" + (heading ? "" : " gw-board-flow")} style={flow ? { height: flow.height + "px" } : undefined}>
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

      {zoomed && <ZoomModal art={zoomed} onClose={() => setZoomed(null)} onStep={onStep} theme={theme} nav={nav} />}
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
  // Where the open piece sits in this gallery, and which works hang either side of it
  const at = zoomed ? pieces.indexOf(zoomed) : -1;
  const nav = zoomed ? {
    pos: at + 1,
    total: pieces.length,
    prev: pieces[(at - 1 + pieces.length) % pieces.length],
    next: pieces[(at + 1) % pieces.length]
  } : null;

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
      zoomed={zoomed} setZoomed={setZoomed} onStep={step} nav={nav} />;
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

      {zoomed && <ZoomModal art={zoomed} onClose={() => setZoomed(null)} onStep={step} theme={theme} nav={nav} />}
    </div>
  );
}

Object.assign(window, { Hallway, GalleryWall, WallPiecePin, ZoomModal, WallPiece, RainbowGame, DiscoverDot, FramedPlate });
