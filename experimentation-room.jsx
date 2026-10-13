// ============================================================
// FMB / ART — Sala de Experimentação
// Full-screen overlay that lets the user apply any of the
// 33 template / painter effects to the selected artwork.
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

const ER_GROUP_ACCENTS = {
  gestos:  "#f08a2a",
  materia: "#5a78d8",
  magia:   "#a04acb",
  mestres: "#f7d54a"
};

// Order the groups in a fixed, intentional sequence
const ER_GROUP_ORDER = ["gestos", "materia", "magia", "mestres"];

function ExperimentationRoom({ art, onClose }) {
  const library = window.TEMPLATE_LIBRARY || [];

  // One flat list in a fixed group order; the group shows as a colour dot.
  const effects = ER_GROUP_ORDER.flatMap(g => library.filter(t => t.group === g));

  const [activeId, setActiveId] = erState((effects[0] || {}).id || null);
  const activeIdx = Math.max(0, effects.findIndex(t => t.id === activeId));
  const activeTpl = effects[activeIdx] || null;
  const Anim      = activeTpl && window.ANIMS && window.ANIMS[activeTpl.anim];
  const step = (d) => {
    if (effects.length) setActiveId(effects[(activeIdx + d + effects.length) % effects.length].id);
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
      const { width, height } = wrap.getBoundingClientRect();
      if (!width || !height) return;
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

  // Keep the active effect visible in the list
  erEffect(() => {
    const el = listRef.current && listRef.current.querySelector(".is-active");
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  return (
    <div className="er-overlay" role="dialog" aria-modal="true" aria-label="Sala de Experimentação">

      {/* ── Top bar ── */}
      <div className="er-bar">
        <button className="er-back" onClick={onClose} aria-label="Voltar ao museu">
          ← Voltar
        </button>
        <span className="er-bar-title">{art.title}</span>
      </div>

      {/* ── Main body ── */}
      <div className="er-body">

        {/* Preview + caption */}
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
            <div className="er-preview-label" aria-live="polite">
              <span
                className="er-preview-name"
                style={{ color: ER_GROUP_ACCENTS[activeTpl.group] || "#f4efe6" }}
              >
                {activeTpl.name}
              </span>
              <p className="er-preview-concept">{activeTpl.concept}</p>
              <p className="er-preview-how">{activeTpl.interaction}</p>
            </div>
          )}
        </div>

        {/* Effect picker */}
        <div className="er-picker-panel">
          <div className="er-picker-head">
            <button className="er-step" onClick={() => step(-1)} aria-label="Efeito anterior">←</button>
            <span className="er-picker-count">
              {String(activeIdx + 1).padStart(2, "0")} / {effects.length}
            </span>
            <button className="er-step" onClick={() => step(1)} aria-label="Efeito seguinte">→</button>
          </div>

          <div className="er-list" ref={listRef} role="listbox" aria-label="Efeitos">
            {effects.map(tpl => (
              <button
                key={tpl.id}
                role="option"
                aria-selected={activeId === tpl.id}
                className={"er-item" + (activeId === tpl.id ? " is-active" : "")}
                style={{ "--accent": ER_GROUP_ACCENTS[tpl.group] || "#f4efe6" }}
                onClick={() => setActiveId(tpl.id)}
                title={ER_GROUP_LABELS[tpl.group]}
              >
                <span className="er-item-dot" aria-hidden />
                <span className="er-item-name">{tpl.name}</span>
              </button>
            ))}
          </div>

          <div className="er-legend" aria-hidden>
            {ER_GROUP_ORDER.filter(g => effects.some(t => t.group === g)).map(g => (
              <span key={g} className="er-legend-item" style={{ "--accent": ER_GROUP_ACCENTS[g] }}>
                <span className="er-item-dot" />{ER_GROUP_LABELS[g]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.ExperimentationRoom = ExperimentationRoom;
