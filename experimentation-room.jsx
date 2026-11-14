// ============================================================
// FMB / ART — Sala de Experimentação
// Full-screen page that lets the visitor apply any of the
// 33 template / painter effects to the selected artwork.
// Light catalogue register, like the artwork's page (QUA-15):
// the plate, a caption, and the effects as an index folded
// into its four families (one open at a time, plus / minus).
//
// Loaded AFTER all template + painter files so that
// window.ANIMS and window.TEMPLATE_LIBRARY are fully
// populated before this component ever renders.
//
// Exports window.ExperimentationRoom for gallery-core.jsx.
// ============================================================

const { useState: erState, useEffect: erEffect, useRef: erRef } = React;

const ER_GROUP_LABELS = {
  gestos:  "Gestos",
  materia: "Matéria",
  magia:   "Magia",
  mestres: "À Maneira dos Mestres"
};

// Order the groups in a fixed, intentional sequence
const ER_GROUP_ORDER = ["gestos", "materia", "magia", "mestres"];

const erPad = (n) => String(n).padStart(2, "0");

function ErIcon({ d, size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
  );
}

function ExperimentationRoom({ art, onClose }) {
  const library = window.TEMPLATE_LIBRARY || [];

  // One flat, numbered list in a fixed group order; the index shows it family by family.
  const effects = ER_GROUP_ORDER.flatMap(g => library.filter(t => t.group === g));
  const groups = ER_GROUP_ORDER
    .map(g => ({ id: g, label: ER_GROUP_LABELS[g], items: effects.map((t, i) => ({ t, i })).filter(o => o.t.group === g) }))
    .filter(gr => gr.items.length);

  const [activeId, setActiveId] = erState((effects[0] || {}).id || null);
  // Which family is unfolded (null = all folded). On a short screen the index starts folded,
  // so the artwork keeps its room.
  const [openGroup, setOpenGroup] = erState(() =>
    window.innerHeight < 720 ? null : (effects[0] || {}).group || null);
  const activeIdx = Math.max(0, effects.findIndex(t => t.id === activeId));
  const activeTpl = effects[activeIdx] || null;
  const Anim      = activeTpl && window.ANIMS && window.ANIMS[activeTpl.anim];
  const step = (d) => {
    if (!effects.length) return;
    const next = effects[(activeIdx + d + effects.length) % effects.length];
    setActiveId(next.id);
    // Follow the effect into its family, unless the visitor folded everything away
    setOpenGroup(g => (g === null ? null : next.group));
  };

  // Compute stage size so the artwork always fills without distortion.
  // Pure-CSS aspect-ratio clamping is unreliable in this flex context (see
  // bug: portrait artwork stage becomes landscape because max-height:100%
  // doesn't trigger proportional width reduction in all browsers).
  const wrapRef = erRef(null);
  const listRef = erRef(null);
  const [stageSize, setStageSize] = erState(null);

  erEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ratio = art.w / art.h;
    const compute = () => {
      // The wrap's padding is where the plate's passe-partout and shadow are drawn
      const cs = getComputedStyle(wrap);
      const width = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const height = wrap.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      if (!(width > 0) || !(height > 0)) return;
      let w, h;
      if (width / height > ratio) {
        h = height; w = Math.round(h * ratio);
      } else {
        w = width;  h = Math.round(w / ratio);
      }
      setStageSize({ width: w, height: h });
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [art.w, art.h]);

  // ESC closes the room; arrows step through the effects
  erEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, activeIdx]);

  // Keep the active effect visible in the index
  erEffect(() => {
    const el = listRef.current && listRef.current.querySelector(".er-item.is-active");
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId, openGroup]);

  return (
    <div className="er-overlay" role="dialog" aria-modal="true" aria-label="Sala de Experimentação">

      {/* ── Top bar ── */}
      <div className="er-bar">
        <button className="er-back" onClick={onClose} aria-label={"Voltar a " + art.title}>
          <ErIcon d="M19 12H5M11 6l-6 6 6 6" />
          <span>{art.title}</span>
        </button>
        <span className="er-bar-kicker">Sala de Experimentação</span>
      </div>

      {/* ── Main body ── */}
      <div className="er-body">

        {/* Plate + caption */}
        <div className="er-preview-panel">
          <div className="er-stage-wrap" ref={wrapRef}>
            <div
              className="er-stage"
              style={stageSize
                ? { width: stageSize.width + "px", height: stageSize.height + "px" }
                : { aspectRatio: `${art.w} / ${art.h}`, width: "100%", maxHeight: "100%" }
              }
            >
              {Anim
                ? <Anim art={art} key={activeId} />
                : <img src={art.src} alt={art.title} className="anim-img" />
              }
            </div>
          </div>

          {activeTpl && (
            <div className="er-caption">
              <div className="er-caption-top">
                <div className="er-caption-head" aria-live="polite">
                  <span className="er-kicker">
                    Efeito {erPad(activeIdx + 1)} de {effects.length} · {ER_GROUP_LABELS[activeTpl.group]}
                  </span>
                  <span className="er-preview-name">{activeTpl.name}</span>
                </div>
                <span className="er-steps">
                  <button className="er-step" onClick={() => step(-1)} aria-label="Efeito anterior">
                    <ErIcon d="M19 12H5M11 6l-6 6 6 6" size={16} />
                  </button>
                  <button className="er-step" onClick={() => step(1)} aria-label="Efeito seguinte">
                    <ErIcon d="M5 12h14M13 6l6 6-6 6" size={16} />
                  </button>
                </span>
              </div>
              <p className="er-preview-concept">{activeTpl.concept}</p>
              <p className="er-preview-how">{activeTpl.interaction}</p>
            </div>
          )}
        </div>

        {/* Index of effects, folded into families */}
        <div className="er-index" ref={listRef} aria-label="Efeitos">
          {groups.map(gr => {
            const open = openGroup === gr.id;
            const holds = !!activeTpl && activeTpl.group === gr.id;
            return (
              <section key={gr.id} className={"er-group" + (open ? " is-open" : "") + (holds ? " has-active" : "")}>
                <button className="er-group-head" aria-expanded={open} aria-controls={"er-group-" + gr.id}
                  onClick={() => setOpenGroup(open ? null : gr.id)}>
                  <span className="er-group-name">{gr.label}</span>
                  <span className="er-group-count">{gr.items.length}</span>
                  <span className="er-group-toggle" aria-hidden="true">
                    <ErIcon d={open ? "M6 12h12" : "M6 12h12M12 6v12"} size={16} />
                  </span>
                </button>
                {open && (
                  <div className="er-group-list" id={"er-group-" + gr.id} role="listbox" aria-label={gr.label}>
                    {gr.items.map(({ t, i }) => (
                      <button
                        key={t.id}
                        role="option"
                        aria-selected={activeId === t.id}
                        className={"er-item" + (activeId === t.id ? " is-active" : "")}
                        onClick={() => setActiveId(t.id)}
                      >
                        <span className="er-item-n">{erPad(i + 1)}</span>
                        <span className="er-item-name">{t.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

window.ExperimentationRoom = ExperimentationRoom;
