// FlowEdge.jsx — conector custom estilo "Turbo Flow" (patrón oficial de xyflow): línea bezier
// con gradiente morado y trazo punteado animado (fluye hacia el target), más un puntito en cada
// extremo sobre los handles. El gradiente y el keyframe de animación se definen una sola vez
// (ver <EdgeDefs/>, montado una vez en el canvas) para que todos los edges los reusen por id.
import { BaseEdge, getBezierPath } from "@xyflow/react";
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

export function FlowEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, selected }) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        className="flowedge-path"
        style={{ ...style, stroke: "url(#flowedge-gradient)", strokeWidth: selected ? 2.5 : 2 }}
      />
      <circle cx={sourceX} cy={sourceY} r={3} fill={T.purple} />
      <circle cx={targetX} cy={targetY} r={3} fill={T.purple} />
    </>
  );
}
