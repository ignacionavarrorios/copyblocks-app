// RecetaNode.jsx — nodo compacto + panel: elegí una Receta curada (guion de video con
// instrucciones explícitas para la IA) o creá la tuya con tus propias instrucciones+ejemplo.
// Reemplaza el concepto viejo de "Ángulo" — mismo lugar en el canvas, mismo patrón de
// conexión a ChatNode, pero con datos estructurados en vez de un string libre de Concepto.
import { Handle, Position } from "@xyflow/react";
import { useState } from "react";
import { uid } from "@/lib/utils";
import { RECETAS } from "@/lib/recetas";
import { T, font, fontDisplay, Btn, NodeCloseBtn, NodeAddBtn } from "../ui.jsx";
import { BlockIcon } from "@/lib/blockIcons.jsx";

function allRecetas(brand) {
  return [...RECETAS, ...(brand?.customRecetas || [])];
}

export function RecetaNode({ data, selected, brand, onDelete, onAddStep, connecting }) {
  const receta = allRecetas(brand).find(r => r.id === data.recetaId);
  return (
    <div style={{ position: "relative", width: 220, background: T.surface, borderRadius: T.radiusCard, border: `2px solid ${selected ? T.purple : T.gray}`, boxShadow: selected ? T.shadowAccent : T.shadowCard, overflow: "visible", fontFamily: font }}>
      {onDelete && <NodeCloseBtn onClick={onDelete} title="Quitar Receta" />}
      {onAddStep && <NodeAddBtn onClick={onAddStep} active={connecting} />}
      <Handle type="target" position={Position.Left} style={{ background: T.purple, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: T.purple, width: 8, height: 8 }} />
      <div style={{ padding: "13px 15px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <BlockIcon type="receta" size={20} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: fontDisplay }}>Receta</span>
        </div>
        <div style={{ fontSize: 11, color: T.slate, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{receta ? receta.nombre : "Sin elegir — click para configurar"}</div>
        {receta && <div style={{ fontSize: 10, color: T.purple, marginTop: 3 }}>{receta.categoria}</div>}
      </div>
    </div>
  );
}

export function RecetaPanel({ data, onChange, brand, updateBrand, notify }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ nombre: "", descripcion: "", instrucciones: "", ejemplo: "" });
  const custom = brand?.customRecetas || [];
  const byCat = RECETAS.reduce((acc, r) => { (acc[r.categoria] = acc[r.categoria] || []).push(r); return acc; }, {});

  function elegir(id) {
    onChange({ ...data, recetaId: data.recetaId === id ? null : id });
  }

  function guardarPersonalizada() {
    if (!form.nombre.trim() || !form.instrucciones.trim()) return;
    const nueva = { id: uid(), nombre: form.nombre.trim(), categoria: "Personalizada", descripcion: form.descripcion.trim(), instrucciones: form.instrucciones.trim(), ejemplo: form.ejemplo.trim(), esPersonalizada: true };
    updateBrand(b => ({ ...b, customRecetas: [...(b.customRecetas || []), nueva] }));
    onChange({ ...data, recetaId: nueva.id });
    setCreating(false); setForm({ nombre: "", descripcion: "", instrucciones: "", ejemplo: "" });
    notify?.("Receta creada ✓");
  }

  const inputStyle = (borderColor) => ({ width: "100%", boxSizing: "border-box", padding: "8px 12px", fontSize: 12.5, border: `1.5px solid ${borderColor}`, borderRadius: T.radiusInput, fontFamily: font, color: T.navy, outline: "none", marginBottom: 8 });
  const textareaStyle = { ...inputStyle(T.gray), fontSize: 13, resize: "vertical" };

  return (
    <div>
      <div style={{ fontSize: 11.5, color: T.slate, marginBottom: 12 }}>Elegí una receta curada o creá la tuya — la IA va a seguir sus instrucciones cuando generes copy con este nodo conectado a un chat.</div>

      <div className="nowheel" style={{ maxHeight: 320, overflowY: "auto", marginBottom: 12 }}>
        {Object.entries(byCat).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.slate, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{cat}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {items.map(r => {
                const sel = data.recetaId === r.id;
                return (
                  <div key={r.id} onClick={() => elegir(r.id)} title={r.descripcion} style={{ padding: "9px 13px", borderRadius: T.radiusInput, border: `1.5px solid ${sel ? T.purple : T.gray}`, background: sel ? T.purpleBg : T.surface, cursor: "pointer" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: T.navy }}>{r.nombre}</div>
                    <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>{r.descripcion}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {custom.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.slate, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Tus recetas</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {custom.map(r => {
                const sel = data.recetaId === r.id;
                return (
                  <div key={r.id} onClick={() => elegir(r.id)} title={r.descripcion} style={{ padding: "9px 13px", borderRadius: T.radiusInput, border: `1.5px solid ${sel ? T.purple : T.gray}`, background: sel ? T.purpleBg : T.surface, cursor: "pointer" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: T.navy }}>{r.nombre}</div>
                    {r.descripcion && <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>{r.descripcion}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {!creating ? (
        <Btn variant="soft" full onClick={() => setCreating(true)}>+ Crear tu receta</Btn>
      ) : (
        <div style={{ marginTop: 8 }}>
          <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre de la receta" style={inputStyle(T.purple)} autoFocus />
          <input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción corta (opcional)" style={inputStyle(T.gray)} />
          <textarea value={form.instrucciones} onChange={e => setForm(f => ({ ...f, instrucciones: e.target.value }))} rows={3} placeholder="Instrucciones a la IA: cómo escribir con esta estructura…" style={textareaStyle} />
          <textarea value={form.ejemplo} onChange={e => setForm(f => ({ ...f, ejemplo: e.target.value }))} rows={2} placeholder="Ejemplo de copy usando esta receta (opcional)" style={textareaStyle} />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="primary" small onClick={guardarPersonalizada} disabled={!form.nombre.trim() || !form.instrucciones.trim()}>Guardar</Btn>
            <Btn variant="ghost" small onClick={() => setCreating(false)}>Cancelar</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// Formatea una Receta para inyectarla como contexto en el prompt del ChatNode conectado —
// mismo patrón que perfilCtx()/bancoCtx() en src/lib/prompts.ts.
export function recetaCtx(receta) {
  if (!receta) return "";
  return `RECETA A SEGUIR — "${receta.nombre}":\n${receta.instrucciones}\n\nEjemplo de referencia (no copiar literal, es solo guía de tono/estructura): ${receta.ejemplo}`;
}

export function findReceta(brand, recetaId) {
  return allRecetas(brand).find(r => r.id === recetaId);
}
