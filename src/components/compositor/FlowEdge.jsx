// FlowEdge.jsx — conector custom estilo "Turbo Flow" (patrón oficial de xyflow): línea bezier
// con gradiente morado y trazo punteado animado (fluye hacia el target), más un puntito en cada
// extremo sobre los handles. El gradiente y el keyframe de animación se definen una sola vez
// (ver <EdgeDefs/>, montado una vez en el canvas) para que todos los edges los reusen por id.
import { useState } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";
import { T } from "./ui.jsx";

export function EdgeDefs() {
  return (
    <svg style={{ position: "absolute", top: 0, left: 0, width: 0, height: 0 }}>
      <defs>
        <linearGradient id="flowedge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={T.purpleLight} />
          <stop offset="100%" stopColor={T.purple} />
        </linearGradient>
      </defs>
      <style>{`
        @keyframes flowedge-dash { to { stroke-dashoffset: -16; } }
        .flowedge-path { stroke-dasharray: 5 5; animation: flowedge-dash 0.8s linear infinite; }
      `}</style>
    </svg>
  );
}

// Botón "×" para desconectar dos nodos sin borrar ninguno — aparece al pasar el mouse sobre
// la conexión (o si queda seleccionada, por si se conecta un teclado/lector de pantalla).
// `data.onDelete` lo inyecta CanvasScreen (ver `flowEdges` allá) — un solo callback estable,
// no hace falta que cada edge lo redefina.
export function FlowEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, selected, data }) {
  const [hovered, setHovered] = useState(false);
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const showDelete = hovered || selected;
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        className="flowedge-path"
        style={{ ...style, stroke: "url(#flowedge-gradient)", strokeWidth: selected ? 2.5 : 2 }}
      />
      {/* Path invisible más ancho — el visible es muy fino para hacerle hover/click cómodo */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={18}
        style={{ cursor: "pointer" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => data?.onDelete?.(id)}
      />
      <circle cx={sourceX} cy={sourceY} r={3} fill={T.purple} />
      <circle cx={targetX} cy={targetY} r={3} fill={T.purple} />
      {showDelete && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{ position: "absolute", pointerEvents: "all", transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, zIndex: 1000 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <button
              onClick={() => data?.onDelete?.(id)}
              title="Quitar esta conexión"
              style={{ width: 20, height: 20, borderRadius: "50%", border: `1.5px solid ${T.purple}`, background: "#fff", color: T.purple, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, lineHeight: 1, padding: 0, boxShadow: T.shadowCard }}
            >
              ×
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
