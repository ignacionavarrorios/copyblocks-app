// RecursoNode.jsx — un recurso suelto en el flujo, sin agrupar dentro de un Cerebro. Se crea
// arrastrando (o clickeando) un ítem de la barra de abajo sobre un espacio vacío del canvas —
// mismo contenido que una fuente de Cerebro (SourceCard), pero como nodo propio y conectable.
import { Handle, Position } from "@xyflow/react";
import { T, font, NodeAddBtn } from "../ui.jsx";
import { SourceCard } from "./CerebroNode.jsx";

export function RecursoNode({ data, selected, onChange, onDelete, onAddStep, connecting }) {
  return (
    <div style={{ position: "relative", width: 220, borderRadius: T.radiusCard, border: `2px solid ${selected ? T.purple : T.gray}`, boxShadow: selected ? T.shadowAccent : T.shadowCard, overflow: "hidden", fontFamily: font, background: T.surface }}>
      {onAddStep && <NodeAddBtn onClick={onAddStep} active={connecting} />}
      <Handle type="target" position={Position.Left} style={{ background: T.purple, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: T.purple, width: 8, height: 8 }} />
      <SourceCard source={data} onUpdate={p => onChange({ ...data, ...p })} onRemove={onDelete} bare />
    </div>
  );
}
