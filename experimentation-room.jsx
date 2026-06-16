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

  // Only show groups that have entries in the library
  const groups = ER_GROUP_ORDER.filter(g => library.some(t => t.group === g));

  const [activeGroup, setActiveGroup] = erState(groups[0] || "");
  const [activeId, setActiveId] = erState(
    (library.find(t => t.group === (groups[0] || "")) || library[0] || {}).id || null
  );

  const activeTpl  = library.find(t => t.id === activeId) || null;
  const Anim       = activeTpl && window.ANIMS && window.ANIMS[activeTpl.anim];
  const inGroup    = library.filter(t => t.group === activeGroup);

  // Compute stage size so the artwork always fills without distortion.
  // Pure-CSS aspect-ratio clamping is unreliable in this flex context (see
  // bug: portrait artwork stage becomes landscape because max-height:100%
  // doesn't trigger proportional width reduction in all browsers).
  const wrapRef    = erRef(null);
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

  // ESC closes the room
  erEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const selectGroup = (g) => {
    setActiveGroup(g);
    const first = library.find(t => t.group === g);
    if (first) setActiveId(first.id);
  };

  return (
    <div className="er-overlay" role="dialog" aria-modal="true" aria-label="Sala de Experimentação">

      {/* ── Top bar ── */}
      <div className="er-bar">
        <button className="er-back" onClick={onClose} aria-label="Voltar ao museu">
          ← Voltar
        </button>
        <div className="er-bar-center">
          <span className="er-bar-mono">SALA DE EXPERIMENTAÇÃO</span>
          <span className="er-bar-title">{art.title}</span>
        </div>
        <div className="er-bar-right">
          <span className="er-bar-meta">{art.signature || art.artist}&ensp;·&ensp;{art.age} anos</span>
        </div>
      </div>

      {/* ── Main body ── */}
      <div className="er-body">

        {/* Left — live preview */}
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
            <div className="er-preview-label">
              <div className="er-preview-label-top">
                <span
                  className="er-preview-name"
                  style={{ color: ER_GROUP_ACCENTS[activeTpl.group] || "#f4efe6" }}
                >
                  {activeTpl.name}
                </span>
                <span className="er-preview-en">{activeTpl.en}</span>
                <span className="er-preview-chip">{activeTpl.interaction}</span>
              </div>
              <p className="er-preview-concept">{activeTpl.concept}</p>
            </div>
          )}
        </div>

        {/* Right — effect picker */}
        <div className="er-picker-panel">

          {/* Group tabs */}
          <div className="er-groups" role="tablist">
            {groups.map(g => (
              <button
                key={g}
                role="tab"
                aria-selected={activeGroup === g}
                className={"er-group-tab" + (activeGroup === g ? " is-active" : "")}
                style={{ "--accent": ER_GROUP_ACCENTS[g] }}
                onClick={() => selectGroup(g)}
              >
                {ER_GROUP_LABELS[g] || g}
              </button>
            ))}
          </div>

          {/* Effect cards */}
          <div className="er-cards">
            {inGroup.map((tpl, i) => (
              <button
                key={tpl.id}
                className={"er-card" + (activeId === tpl.id ? " is-active" : "")}
                style={{ "--accent": ER_GROUP_ACCENTS[tpl.group] || "#f4efe6" }}
                onClick={() => setActiveId(tpl.id)}
                aria-pressed={activeId === tpl.id}
                title={tpl.concept}
              >
                <div className="er-card-thumb">
                  <img src={art.src} alt="" className="er-card-img" />
                  <div className="er-card-num">{String(i + 1).padStart(2, "0")}</div>
                  {activeId === tpl.id && <div className="er-card-active-badge">✓</div>}
                </div>
                <div className="er-card-body">
                  <span className="er-card-name">{tpl.name}</span>
                  <span className="er-card-hint">{tpl.interaction}</span>
                </div>
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

window.ExperimentationRoom = ExperimentationRoom;
