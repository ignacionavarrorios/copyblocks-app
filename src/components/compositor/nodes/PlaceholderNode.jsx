// PlaceholderNode.jsx — tarjeta punteada "Elegir siguiente paso". Se resuelve en un nodo real
// (Persona/Ángulo/Oferta/Chat) al elegir una opción, y deja un nuevo placeholder después.
import { Handle, Position } from "@xyflow/react";
import { T, font, fontDisplay, NodeCloseBtn } from "../ui.jsx";
import { BlockIcon } from "@/lib/blockIcons.jsx";

const OPCIONES = [
  { group: "Investigación", items: [
    { type: "cerebro", label: "Cerebro" },
  ]},
  { group: "Personalización", items: [
    { type: "persona", label: "Persona" },
    { type: "receta", label: "Receta" },
    { type: "oferta", label: "Oferta" },
  ]},
  { group: "IA", items: [
    { type: "prompt", label: "Prompt" },
    { type: "chat", label: "Abrir chat" },
  ]},
];

export function PlaceholderNode({ data }) {
  return (
    <div style={{ position: "relative", width: 230, background: "rgba(122,90,246,0.03)", borderRadius: T.radiusCard, border: `2px dashed ${T.purpleLight}`, padding: "14px 15px", fontFamily: font }}>
      {data.onDelete && <NodeCloseBtn onClick={data.onDelete} title="Quitar este paso" />}
      <Handle type="target" position={Position.Left} style={{ background: T.purpleLight, width: 8, height: 8 }} />
      <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: fontDisplay, marginBottom: 2 }}>Elegir siguiente paso</div>
      <BlockIcon type="nextStep" size={22} style={{ marginBottom: 10 }} />
      {OPCIONES.map(g => (
        <div key={g.group} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: T.slate, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{g.group}</div>
          {g.items.map(opt => (
            <div key={opt.type} onClick={() => data.onResolve?.(opt.type)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: T.radiusInput, cursor: "pointer", fontSize: 12.5, color: T.navy }}
              onMouseEnter={e => e.currentTarget.style.background = T.purpleBg}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <BlockIcon type={opt.type} size={16} /> {opt.label}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
