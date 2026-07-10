// AnguloNode.jsx — nodo compacto + panel: elegí un concepto/ángulo guardado, arrancá desde una
// plantilla de ángulo sugerida (que se vuelve un concepto real y editable en cuanto la elegís),
// o escribí uno nuevo desde cero. Opcionalmente sumá fórmulas de hook para ese ángulo.
import { Handle, Position } from "@xyflow/react";
import { useState } from "react";
import { uid } from "@/lib/utils";
import { ANGULOS_RAPIDO, HOOK_FRAMEWORKS } from "@/lib/constants";
import { T, font, fontDisplay, Btn, Chip, NodeCloseBtn, NodeAddBtn } from "../ui.jsx";
import { BlockIcon } from "@/lib/blockIcons.jsx";
import { ChipIcon } from "@/lib/chipIcons.jsx";

export function AnguloNode({ data, selected, brand, onDelete, onAddStep, connecting }) {
  const concepto = (brand?.conceptos || []).find(c => c.id === data.conceptoId);
  const hookCount = (data.hookIds || []).length;
  return (
    <div style={{ position: "relative", width: 220, background: T.surface, borderRadius: T.radiusCard, border: `2px solid ${selected ? T.purple : T.gray}`, boxShadow: selected ? T.shadowAccent : T.shadowCard, overflow: "visible", fontFamily: font }}>
      {onDelete && <NodeCloseBtn onClick={onDelete} title="Quitar Ángulo" />}
      {onAddStep && <NodeAddBtn onClick={onAddStep} active={connecting} />}
      <Handle type="target" position={Position.Left} style={{ background: T.purple, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: T.purple, width: 8, height: 8 }} />
      <div style={{ padding: "13px 15px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <BlockIcon type="angulo" size={20} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: fontDisplay }}>Ángulo</span>
        </div>
        <div style={{ fontSize: 11, color: T.slate, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{concepto ? concepto.concepto : "Sin elegir — click para configurar"}</div>
        {hookCount > 0 && <div style={{ fontSize: 10, color: T.purple, marginTop: 3 }}>{hookCount} hook{hookCount === 1 ? "" : "s"} elegido{hookCount === 1 ? "" : "s"}</div>}
      </div>
    </div>
  );
}

export function AnguloPanel({ data, onChange, brand, updateBrand, notify }) {
  const [creating, setCreating] = useState(false);
  const [texto, setTexto] = useState("");
  const [anguloLabel, setAnguloLabel] = useState("");
  const [showHooks, setShowHooks] = useState(false);
  const conceptos = brand?.conceptos || [];
  const hookIds = data.hookIds || [];

  function guardarNuevoConcepto() {
    if (!texto.trim()) return;
    const nuevo = { id: uid(), concepto: texto.trim(), angulo: anguloLabel.trim(), estilo: "", hook: "" };
    updateBrand(b => ({ ...b, conceptos: [...(b.conceptos || []), nuevo] }));
    onChange({ ...data, conceptoId: nuevo.id });
    setCreating(false); setTexto(""); setAnguloLabel("");
    notify?.("Concepto creado ✓");
  }

  // Una plantilla sugerida se vuelve un concepto real la primera vez que se elige — desde ahí
  // es editable/borrable como cualquier otro (evita duplicar si ya se usó esa misma plantilla).
  function usarPlantilla(t) {
    const existente = conceptos.find(c => c.concepto === t.label && c.angulo === t.label);
    if (existente) { onChange({ ...data, conceptoId: existente.id }); return; }
    const nuevo = { id: uid(), concepto: t.label, angulo: t.label, descripcion: t.desc, estilo: "", hook: "" };
    updateBrand(b => ({ ...b, conceptos: [...(b.conceptos || []), nuevo] }));
    onChange({ ...data, conceptoId: nuevo.id });
    notify?.(`"${t.label}" agregado a tus conceptos ✓`);
  }

  function toggleHook(id) {
    const next = hookIds.includes(id) ? hookIds.filter(x => x !== id) : [...hookIds, id];
    onChange({ ...data, hookIds: next });
  }

  const hooksByCat = HOOK_FRAMEWORKS.reduce((acc, h) => { (acc[h.cat] = acc[h.cat] || []).push(h); return acc; }, {});

  return (
    <div>
      <div style={{ fontSize: 11.5, color: T.slate, marginBottom: 12 }}>Elegí el concepto/ángulo de este anuncio, arrancá desde una plantilla sugerida, o escribí uno nuevo.</div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.slate, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Ángulos sugeridos</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {ANGULOS_RAPIDO.map(t => (
            <div key={t.id} onClick={() => usarPlantilla(t)} title={t.desc} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: T.radiusPill, fontSize: 11.5, cursor: "pointer", border: `1.5px solid ${T.gray}`, background: T.surface, color: T.navy }}>
              {t.iconKey ? <ChipIcon type={t.iconKey} size={14} /> : <span>{t.emoji}</span>} {t.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, color: T.slate, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Tus conceptos</div>
      {!conceptos.length && <div style={{ fontSize: 12, color: T.slate, padding: "10px 0", marginBottom: 8 }}>Todavía no tenés conceptos guardados — elegí uno sugerido arriba o creá el tuyo.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14, maxHeight: 220, overflowY: "auto" }}>
        {conceptos.map(c => {
          const sel = data.conceptoId === c.id;
          return (
            <div key={c.id} onClick={() => onChange({ ...data, conceptoId: sel ? null : c.id })} style={{ padding: "9px 13px", borderRadius: T.radiusInput, border: `1.5px solid ${sel ? T.purple : T.gray}`, background: sel ? T.purpleBg : T.surface, cursor: "pointer" }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: T.navy }}>{c.concepto}</div>
              {c.angulo && <div style={{ marginTop: 4 }}><Chip>{c.angulo}</Chip></div>}
            </div>
          );
        })}
      </div>
      {!creating ? (
        <Btn variant="soft" full onClick={() => setCreating(true)}>+ Nuevo concepto</Btn>
      ) : (
        <div style={{ marginBottom: 14 }}>
          <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={3} placeholder="Escribí el concepto: la idea central del anuncio…" style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", fontSize: 13, border: `1.5px solid ${T.purple}`, borderRadius: T.radiusInput, fontFamily: font, color: T.navy, resize: "vertical", outline: "none", marginBottom: 8 }} autoFocus />
          <input value={anguloLabel} onChange={e => setAnguloLabel(e.target.value)} placeholder="Etiqueta de ángulo (opcional), ej. 'Contraintuitivo'" style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", fontSize: 12.5, border: `1.5px solid ${T.gray}`, borderRadius: T.radiusInput, fontFamily: font, color: T.navy, outline: "none", marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="primary" small onClick={guardarNuevoConcepto} disabled={!texto.trim()}>Guardar</Btn>
            <Btn variant="ghost" small onClick={() => setCreating(false)}>Cancelar</Btn>
          </div>
        </div>
      )}

      {/* Fórmulas de hook — opcional, se aplica junto con el concepto elegido */}
      <div style={{ borderTop: `1px solid ${T.borderSoft}`, paddingTop: 12 }}>
        <div onClick={() => setShowHooks(v => !v)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: showHooks ? 10 : 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>Fórmulas de hook {hookIds.length > 0 && <span style={{ color: T.purple }}>({hookIds.length})</span>}</div>
          <span style={{ fontSize: 11, color: T.purple }}>{showHooks ? "Ocultar" : "Elegir"}</span>
        </div>
        {showHooks && (
          <div className="nowheel" style={{ maxHeight: 200, overflowY: "auto" }}>
            {Object.entries(hooksByCat).map(([cat, items]) => (
              <div key={cat} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: T.slate, textTransform: "uppercase", marginBottom: 5 }}>{cat}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {items.map(h => (
                    <div key={h.id} onClick={() => toggleHook(h.id)} style={{ padding: "4px 10px", borderRadius: T.radiusPill, fontSize: 11, cursor: "pointer", border: `1.5px solid ${hookIds.includes(h.id) ? T.purple : T.gray}`, background: hookIds.includes(h.id) ? T.purpleBg : T.surface, color: hookIds.includes(h.id) ? T.purple : T.navy }}>{h.label}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
