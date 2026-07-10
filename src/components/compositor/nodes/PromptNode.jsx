// PromptNode.jsx — nodo autocontenido: un bloque de texto libre que se inyecta como instrucción
// de sistema en cualquier Chat conectado río abajo. Sirve para fijar reglas/tono/formato antes
// de que el usuario abra el chat — ej. "siempre respondé en formato de lista", "nunca uses la palabra X".
// Además puede cargar (o guardar) un prompt de la biblioteca "Prompts" del sidebar — así el
// usuario reusa sus prompts guardados en vez de reescribirlos en cada flujo.
import { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { Save, X } from "lucide-react";
import { uid } from "@/lib/utils";
import { T, font, fontDisplay, Btn, NodeAddBtn, NodeCloseBtn } from "../ui.jsx";
import { BlockIcon } from "@/lib/blockIcons.jsx";

export function PromptNode({ data, selected, onChange, onDelete, onAddStep, connecting, brand, updateBrand, notify }) {
  const text = data.text || "";
  const library = brand?.prompts || [];
  const linked = library.find(p => p.id === data.promptId) || null;
  const [savingName, setSavingName] = useState(null); // string mientras se pide nombre para guardar como nuevo

  function pickFromLibrary(id) {
    if (!id) { onChange({ ...data, promptId: null }); return; }
    const p = library.find(x => x.id === id);
    if (!p) return;
    onChange({ ...data, text: p.texto, promptId: p.id });
  }
  function updateLinked() {
    if (!linked) return;
    updateBrand?.(b => ({ ...b, prompts: (b.prompts || []).map(p => p.id === linked.id ? { ...p, texto: text } : p) }));
    notify?.("Prompt actualizado en tu biblioteca ✓");
  }
  function saveAsNew() {
    const nombre = savingName?.trim();
    if (!nombre) return;
    const nuevo = { id: uid(), nombre, texto: text, createdAt: new Date().toISOString() };
    updateBrand?.(b => ({ ...b, prompts: [...(b.prompts || []), nuevo] }));
    onChange({ ...data, promptId: nuevo.id });
    setSavingName(null);
    notify?.("Prompt guardado en tu biblioteca ✓");
  }

  return (
    <div style={{ position: "relative", width: 280, background: T.surface, borderRadius: T.radiusCard, border: `2px solid ${selected ? T.purple : T.gray}`, boxShadow: selected ? T.shadowAccent : T.shadowCard, overflow: "visible", fontFamily: font }}>
      {onDelete && <NodeCloseBtn onClick={onDelete} title="Quitar Prompt" />}
      {onAddStep && <NodeAddBtn onClick={onAddStep} active={connecting} />}
      <Handle type="target" position={Position.Left} style={{ background: T.purple, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: T.purple, width: 8, height: 8 }} />
      <div style={{ padding: "13px 34px 4px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <BlockIcon type="prompt" size={20} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: fontDisplay }}>Prompt</span>
        </div>
        <div style={{ fontSize: 10.5, color: T.slate, lineHeight: 1.4, marginBottom: 8 }}>Instrucción de sistema — se le suma al chat conectado, antes de que el usuario escriba.</div>
      </div>

      {library.length > 0 && (
        <div className="nodrag" style={{ padding: "0 12px 8px" }}>
          <select value={data.promptId || ""} onChange={e => pickFromLibrary(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", fontSize: 11.5, border: `1.5px solid ${T.gray}`, borderRadius: T.radiusInput, background: T.surfaceInset, color: T.navy, fontFamily: font, outline: "none" }}>
            <option value="">— Elegir de tu biblioteca —</option>
            {library.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
      )}

      <div style={{ padding: "0 12px 12px" }}>
        <textarea
          className="nodrag"
          value={text}
          onChange={e => onChange({ ...data, text: e.target.value })}
          rows={5}
          placeholder='ej. "Siempre respondé en formato de lista." · "Nunca uses la palabra descuento."'
          style={{ width: "100%", boxSizing: "border-box", padding: "9px 11px", fontSize: 12, border: `1.5px solid ${T.gray}`, borderRadius: T.radiusInput, background: T.surfaceInset, color: T.navy, fontFamily: font, outline: "none", resize: "vertical", lineHeight: 1.5 }}
        />

        {linked ? (
          <div className="nodrag" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 10.5, color: T.slate }}>
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Vinculado a "{linked.nombre}"</span>
            {text.trim() && text !== linked.texto && (
              <button onClick={updateLinked} title="Guardar los cambios en tu biblioteca" style={{ display: "flex", alignItems: "center", gap: 3, background: "none", border: "none", color: T.purple, cursor: "pointer", fontSize: 10.5, fontWeight: 700, padding: 0 }}>
                <Save size={11} /> Actualizar
              </button>
            )}
            <button onClick={() => onChange({ ...data, promptId: null })} title="Desvincular (no borra el prompt de tu biblioteca)" style={{ display: "flex", background: "none", border: "none", color: T.slate, cursor: "pointer", padding: 0 }}>
              <X size={12} />
            </button>
          </div>
        ) : savingName !== null ? (
          <div className="nodrag" style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <input autoFocus value={savingName} onChange={e => setSavingName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveAsNew()} placeholder="Nombre para tu biblioteca…"
              style={{ flex: 1, minWidth: 0, boxSizing: "border-box", padding: "6px 9px", fontSize: 11.5, border: `1.5px solid ${T.purple}`, borderRadius: T.radiusInput, fontFamily: font, color: T.navy, outline: "none" }} />
            <Btn variant="primary" small onClick={saveAsNew} disabled={!savingName.trim()}>Guardar</Btn>
            <Btn variant="ghost" small onClick={() => setSavingName(null)}>×</Btn>
          </div>
        ) : (
          text.trim() && (
            <button onClick={() => setSavingName("")} title="Guardar este texto como un prompt reusable en tu biblioteca" className="nodrag"
              style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, background: "none", border: "none", color: T.purple, cursor: "pointer", fontSize: 10.5, fontWeight: 700, padding: 0 }}>
              <Save size={11} /> Guardar en tu biblioteca
            </button>
          )
        )}
      </div>
    </div>
  );
}
