// CanvasScreen.jsx — canvas horizontal y dinámico: desde el Cerebro, el usuario va sacando
// pasos (Persona/Ángulo/Oferta/Chat) del menú "Elegir siguiente paso", en el orden que quiera,
// y puede ramificar en múltiples direcciones desde cualquier nodo con el botón "+".
// El Chat es donde se pide el copy — conectado al CLI del usuario. El Ángulo es opcional y
// combina el concepto/ángulo elegido con fórmulas de hook opcionales.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReactFlow, ReactFlowProvider, useReactFlow, Background, BackgroundVariant, Controls, MiniMap, Panel as FlowPanel, applyNodeChanges, applyEdgeChanges, addEdge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, Wand2, Info } from "lucide-react";
import { uid } from "@/lib/utils";
import { perfilCtx } from "@/lib/prompts";
import { extractPdfText } from "@/lib/pdf";
import { T, font, fontDisplay, Btn } from "./ui.jsx";
import { FlowEdge, EdgeDefs } from "./FlowEdge.jsx";
import { CerebroNode, PLATFORM_META, RESOURCE_DRAG_MIME, captureVideoThumbnail, readAsDataURL } from "./nodes/CerebroNode.jsx";
import { RecursoNode } from "./nodes/RecursoNode.jsx";
import { PersonaNode, PersonaPanel } from "./nodes/PersonaNode.jsx";
import { RecetaNode, RecetaPanel, recetaCtx, findReceta } from "./nodes/RecetaNode.jsx";
import { OfertaNode, OfertaPanel } from "./nodes/OfertaNode.jsx";
import { PlaceholderNode, OPCIONES } from "./nodes/PlaceholderNode.jsx";
import { ChatNode } from "./nodes/ChatNode.jsx";
import { PromptNode } from "./nodes/PromptNode.jsx";
import { BlockIcon } from "@/lib/blockIcons.jsx";

// Mismo mecanismo que RESOURCE_DRAG_MIME (ver CerebroNode.jsx) pero para arrastrar un TIPO DE
// NODO nuevo (Cerebro/Persona/Receta/Oferta/Prompt/Chat) desde la barra lateral — no un recurso.
const NODE_DRAG_MIME = "application/x-flowi-node";
const RAIL_WIDTH = 64;

const NODE_META = {
  cerebro: { label: "Cerebro", emoji: "🧠", Panel: null },
  persona: { label: "Persona", emoji: "👤", Panel: PersonaPanel },
  receta: { label: "Receta", emoji: "🏹", Panel: RecetaPanel },
  oferta: { label: "Oferta", emoji: "🎁", Panel: OfertaPanel },
};
const DEFAULT_DATA = {
  cerebro: { sources: [] },
  persona: { personaId: null },
  receta: { recetaId: null },
  oferta: { offerId: null },
  chat: { chats: [] },
  prompt: { text: "" },
};

// edgeTypes también se define una sola vez, misma razón que nodeTypes más abajo.
const edgeTypes = { turbo: FlowEdge };
const defaultEdgeOptions = { type: "turbo" };

// nodeTypes se define UNA sola vez, fuera de cualquier dependencia cambiante — cada componente
// lee todo lo que necesita desde `data` (inyectado abajo en `flowNodes`). Si este objeto cambiara
// de identidad en cada render, React Flow remonta los nodos y se pierde el estado local de cada
// tarjeta (por eso el cuadro de link/texto del Cerebro se cerraba solo al tipear).
const nodeTypes = {
  cerebro: (p) => <CerebroNode {...p} onChange={p.data.onChange} onDelete={p.data.onDelete} onDropResource={p.data.onDropResource} onResize={p.data.onResize} notify={p.data.notify} onAddStep={p.data.onAddStep} connecting={p.data.connecting} />,
  recurso: (p) => <RecursoNode {...p} onChange={p.data.onChange} onDelete={p.data.onDelete} onAddStep={p.data.onAddStep} connecting={p.data.connecting} />,
  persona: (p) => <PersonaNode {...p} brand={p.data.brand} onDelete={p.data.onDelete} onAddStep={p.data.onAddStep} connecting={p.data.connecting} />,
  receta: (p) => <RecetaNode {...p} brand={p.data.brand} onDelete={p.data.onDelete} onAddStep={p.data.onAddStep} connecting={p.data.connecting} />,
  oferta: (p) => <OfertaNode {...p} brand={p.data.brand} onDelete={p.data.onDelete} onAddStep={p.data.onAddStep} connecting={p.data.connecting} />,
  placeholder: (p) => <PlaceholderNode {...p} />,
  prompt: (p) => <PromptNode {...p} onChange={p.data.onChange} onDelete={p.data.onDelete} onAddStep={p.data.onAddStep} connecting={p.data.connecting} brand={p.data.brand} updateBrand={p.data.updateBrand} notify={p.data.notify} />,
  chat: (p) => (
    <ChatNode {...p}
      context={p.data.context}
      apiKey={p.data.apiKey} notify={p.data.notify} busy={p.data.busy} setBusy={p.data.setBusy} updateBrand={p.data.updateBrand}
      proyectoName={p.data.proyectoName}
      onChange={p.data.onChange}
      onDelete={p.data.onDelete}
      onAddStep={p.data.onAddStep}
      connecting={p.data.connecting}
    />
  ),
};

// Vive DENTRO de <ReactFlowProvider> para poder usar screenToFlowPosition (necesario para
// ubicar el placeholder nuevo justo donde el usuario clickeó, cuando arma una conexión con "+").
function FlowCanvas({ flowNodes, flowEdges, onNodesChange, onEdgesChange, onConnect, pendingFrom, onNodeClick, onPaneClick, onAutoLayout, onCanvasDropResource, onCanvasDropNode }) {
  const { screenToFlowPosition } = useReactFlow();

  // Soltar un recurso de la barra de abajo, o un tipo de nodo nuevo de la barra lateral, sobre
  // espacio vacío del canvas: queda suelto en la posición exacta donde cayó. Si cae sobre OTRO
  // nodo que ya maneja y detiene su propio drop (Cerebro con recursos), lo ignoramos.
  function handleDragOver(e) {
    if (!e.dataTransfer.types.includes(RESOURCE_DRAG_MIME) && !e.dataTransfer.types.includes(NODE_DRAG_MIME)) return;
    e.preventDefault(); e.dataTransfer.dropEffect = "copy";
  }
  function handleDrop(e) {
    if (e.target.closest(".react-flow__node")) return;
    const nodeType = e.dataTransfer.getData(NODE_DRAG_MIME);
    if (nodeType) {
      e.preventDefault();
      onCanvasDropNode(nodeType, screenToFlowPosition({ x: e.clientX, y: e.clientY }));
      return;
    }
    const kind = e.dataTransfer.getData(RESOURCE_DRAG_MIME);
    if (!kind) return;
    e.preventDefault();
    onCanvasDropResource(kind, screenToFlowPosition({ x: e.clientX, y: e.clientY }));
  }

  return (
    <div onDragOver={handleDragOver} onDrop={handleDrop} style={{ position: "relative", width: "100%", height: "100%", background: `radial-gradient(circle at 18% 12%, ${T.purpleBg} 0%, ${T.canvas} 45%, ${T.canvas} 100%)` }}>
      <EdgeDefs />
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        nodesConnectable={true}
        edgesFocusable={true}
        onNodeClick={(_, n) => onNodeClick(n)}
        onPaneClick={(e) => onPaneClick(screenToFlowPosition({ x: e.clientX, y: e.clientY }))}
        fitView
        fitViewOptions={{ padding: 0.4, maxZoom: 1 }}
        minZoom={0.25}
        proOptions={{ hideAttribution: true }}
        style={{ cursor: pendingFrom ? "crosshair" : "default", background: "transparent" }}
      >
        <Background variant={BackgroundVariant.Dots} color={T.purpleLight} gap={22} size={1.4} style={{ opacity: 0.5 }} />
        <Controls showInteractive={false} />
        {/* bottom-left, no bottom-right — el rail de "Agregar" ocupa todo el borde derecho */}
        <MiniMap position="bottom-left" pannable zoomable style={{ background: T.surface, border: `1px solid ${T.gray}` }} nodeColor={T.purpleLight} maskColor="rgba(24,19,73,0.06)" />
        <FlowPanel position="top-left">
          <button onClick={onAutoLayout} title="Ordenar flujo automáticamente" style={{ width: 38, height: 38, borderRadius: "50%", border: `1px solid ${T.gray}`, background: T.surface, color: T.purple, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: T.shadowCard }}>
            <Wand2 size={17} />
          </button>
        </FlowPanel>
      </ReactFlow>
    </div>
  );
}

// Barra lateral fija a la derecha del canvas: arrastrá (o clickeá) cualquier tipo de paso para
// agregarlo suelto, sin necesidad de conectarlo desde otro nodo. Mismos tipos/labels que el menú
// "Elegir siguiente paso" (ver OPCIONES en PlaceholderNode.jsx) — un solo lugar de verdad.
function NodePickerRail({ onAdd }) {
  const [draggingType, setDraggingType] = useState(null);
  function handleDragStart(e, type) {
    e.dataTransfer.setData(NODE_DRAG_MIME, type);
    e.dataTransfer.effectAllowed = "copy";
    setDraggingType(type);
  }
  return (
    <div style={{
      position: "absolute", top: 0, right: 0, bottom: 0, width: RAIL_WIDTH, zIndex: 5,
      background: T.surface, borderLeft: `1px solid ${T.gray}`, boxShadow: "-6px 0 16px rgba(24,19,73,0.05)",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "14px 0", overflowY: "auto",
    }}>
      <div title="Arrastrá cualquier paso al canvas para agregarlo suelto, sin conectarlo a nada todavía" style={{ fontSize: 9, fontWeight: 700, color: T.slate, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center", cursor: "help" }}>Agregar</div>
      {OPCIONES.flatMap(g => g.items).map(opt => {
        const dragging = draggingType === opt.type;
        return (
          <button
            key={opt.type}
            draggable
            onDragStart={e => handleDragStart(e, opt.type)}
            onDragEnd={() => setDraggingType(null)}
            onClick={() => onAdd(opt.type)}
            title={`${opt.label} — click, o arrastrá al canvas`}
            style={{
              width: 46, height: 46, borderRadius: T.radiusInput, border: `1.5px solid ${dragging ? T.purple : T.gray}`,
              background: dragging ? T.purpleBg : T.surfaceInset, color: T.navy, cursor: "grab",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              boxShadow: dragging ? T.shadowAccent : "none", transform: dragging ? "scale(1.08)" : "scale(1)", transition: "all 0.12s",
            }}
          >
            <BlockIcon type={opt.type} size={17} />
            <span style={{ fontSize: 8, fontWeight: 600, lineHeight: 1 }}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Barra fija abajo del editor: crea Cerebros nuevos y agrega recursos — al Cerebro seleccionado
// si hay uno, o suelto en el canvas si no (click), o exactamente donde el usuario lo suelte
// (drag & drop, sobre un Cerebro o sobre cualquier parte vacía del proyecto).
const TOOLBAR_KINDS = ["youtube", "tiktok", "instagram", "facebook_post", "facebook_ad", "website", "doc", "voz", "video", "imagen", "texto"];
const TOOLBAR_TIP = "Arrastrá un recurso hasta un Cerebro para agruparlo ahí, o soltalo en cualquier parte vacía del canvas para que quede suelto. También podés simplemente clickearlo: va al Cerebro activo (el que brilla), o queda suelto si no hay ninguno seleccionado.";
function ResourceToolbar({ selected, onRequestAdd, onAddCerebro }) {
  const isCerebro = selected?.type === "cerebro";
  const [draggingKind, setDraggingKind] = useState(null);

  function handleClick(kind) {
    onRequestAdd(kind, isCerebro ? { type: "cerebro", id: selected.id } : { type: "canvas" });
  }
  function handleDragStart(e, kind) {
    e.dataTransfer.setData(RESOURCE_DRAG_MIME, kind);
    e.dataTransfer.effectAllowed = "copy";
    setDraggingKind(kind);
  }

  return (
    <div style={{ flexShrink: 0, background: T.surface, borderTop: `1px solid ${T.gray}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
      <button onClick={onAddCerebro} title="Agregar un nuevo Cerebro al flujo" style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: T.radiusPill, border: `1.5px solid ${T.purple}`, background: T.purple, color: "#fff", fontSize: 11.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
        <BlockIcon type="cerebro" size={14} /> Nuevo Cerebro
      </button>
      <div style={{ width: 1, height: 20, background: T.borderSoft, flexShrink: 0 }} />
      <Info size={15} title={TOOLBAR_TIP} style={{ color: T.slate, cursor: "help", flexShrink: 0 }} />
      <div style={{ width: 1, height: 20, background: T.borderSoft, flexShrink: 0 }} />
      <div className="nowheel" style={{ display: "flex", gap: 6, overflowX: "auto" }}>
        {TOOLBAR_KINDS.map(kind => {
          const meta = PLATFORM_META[kind];
          const dragging = draggingKind === kind;
          return (
            <button key={kind} draggable onDragStart={e => handleDragStart(e, kind)} onDragEnd={() => setDraggingKind(null)} onClick={() => handleClick(kind)} title={`${meta.label} — click, o arrastrá hasta un Cerebro / el canvas`}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: T.radiusPill, border: `1.5px solid ${dragging ? T.purple : T.gray}`, background: dragging ? T.purpleBg : T.surface, color: T.navy, fontSize: 11, fontWeight: 600, cursor: "grab", whiteSpace: "nowrap", flexShrink: 0, boxShadow: dragging ? T.shadowAccent : "none", transform: dragging ? "scale(1.06)" : "scale(1)", transition: "all 0.12s" }}>
              <meta.Icon size={13} color={meta.color} /> {meta.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CanvasScreen({ proyecto, brand, updateBrand, apiKey, notify, busy, setBusy, onBack }) {
  const [nodes, setNodes] = useState(proyecto.nodes);
  const [edges, setEdges] = useState(proyecto.edges);
  const [selectedId, setSelectedId] = useState(null);
  // Nodo desde el que se armó una conexión con "+" — mientras esté activo, el próximo click
  // en OTRO nodo lo conecta ahí, y un click en espacio vacío crea un paso nuevo justo ahí.
  const [pendingFrom, setPendingFrom] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const saveTimer = useRef(null);
  const fileInputRef = useRef(null);
  // A qué target (Cerebro o canvas) va el archivo que el usuario está por elegir en el picker
  // del sistema — se define en requestAddResource y se consume en handleFilePicked.
  const pendingFileTarget = useRef(null);
  // Snapshot de cómo estaba el proyecto al abrirlo — para poder "Descartar cambios" al salir.
  const initialSnapshot = useRef({ nodes: proyecto.nodes, edges: proyecto.edges });

  const nodeById = useMemo(() => Object.fromEntries(nodes.map(n => [n.id, n])), [nodes]);
  const selected = selectedId ? nodeById[selectedId] : null;
  // Nodos que muestran su UI completa directo en el canvas (sin panel lateral aparte).
  const SELF_CONTAINED = new Set(["placeholder", "chat", "cerebro", "prompt", "recurso"]);

  useEffect(() => {
    if (!pendingFrom) return;
    function onKey(e) { if (e.key === "Escape") setPendingFrom(null); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingFrom]);

  function persist(nextNodes, nextEdges) {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateBrand(b => ({
        ...b,
        proyectos: (b.proyectos || []).map(p => p.id === proyecto.id ? { ...p, nodes: nextNodes, edges: nextEdges || p.edges, updatedAt: new Date().toISOString() } : p),
      }));
    }, 400);
  }

  const onNodesChange = useCallback((changes) => {
    setNodes(nds => { const next = applyNodeChanges(changes, nds); persist(next); return next; });
  }, []);

  // dataOrFn puede ser el objeto de datos ya armado, o una función que lo arma a partir del
  // dato MÁS FRESCO (n.data acá, dentro del updater de setNodes) — esto último lo necesitan
  // flujos async de varios pasos (ver CerebroNode.updateSource) para no pisarse entre updates
  // que parten de un snapshot cerrado en un render anterior.
  function updateNodeData(id, dataOrFn) {
    setNodes(nds => {
      const next = nds.map(n => n.id === id ? { ...n, data: typeof dataOrFn === "function" ? dataOrFn(n.data) : dataOrFn } : n);
      persist(next);
      return next;
    });
  }

  // Resuelve un placeholder en el nodo real elegido. Ya no encadena automáticamente un placeholder
  // después — ahora el usuario decide cuándo y hacia dónde ramificar con el botón "+" de cada nodo.
  function resolvePlaceholder(placeholderId, chosenType) {
    setNodes(nds => {
      const ph = nds.find(n => n.id === placeholderId);
      if (!ph) return nds;
      const resolved = { ...ph, type: chosenType, data: { ...(DEFAULT_DATA[chosenType] || {}) } };
      const next = nds.map(n => n.id === placeholderId ? resolved : n);
      persist(next, edges);
      return next;
    });
    setSelectedId(chosenType === "chat" ? null : placeholderId);
  }

  // Arma una conexión desde cualquier nodo (incluído el Cerebro) — el siguiente click resuelve
  // adónde va: a un nodo existente, o a un paso nuevo si cae en espacio vacío del canvas.
  // OJO: usa el valor de `pendingFrom` ya cerrado en este render (no un updater funcional) —
  // StrictMode invoca los updaters funcionales dos veces en desarrollo, lo que anulaba el toggle.
  function armConnection(fromId) {
    setPendingFrom(pendingFrom === fromId ? null : fromId);
  }

  function connectToNode(targetId) {
    if (targetId === pendingFrom) { setPendingFrom(null); return; }
    setEdges(eds => {
      if (eds.some(e => e.source === pendingFrom && e.target === targetId)) return eds;
      const next = [...eds, { id: uid(), source: pendingFrom, target: targetId }];
      persist(nodes, next);
      return next;
    });
    setPendingFrom(null);
  }

  function connectToNewStep(flowPos) {
    setNodes(nds => {
      const newPh = { id: uid(), type: "placeholder", position: flowPos, data: {} };
      const next = [...nds, newPh];
      const nextEdges = [...edges, { id: uid(), source: pendingFrom, target: newPh.id }];
      setEdges(nextEdges);
      persist(next, nextEdges);
      return next;
    });
    setPendingFrom(null);
  }

  function handleNodeClick(n) {
    if (pendingFrom) { connectToNode(n.id); return; }
    if (!SELF_CONTAINED.has(n.type) || n.type === "cerebro") setSelectedId(n.id);
  }
  function handlePaneClick(flowPos) {
    if (pendingFrom) { connectToNewStep(flowPos); return; }
    setSelectedId(null);
  }

  // Conexión manual arrastrando desde un Handle — sigue disponible además del flujo con "+".
  function onConnect(connection) {
    setEdges(eds => {
      if (!connection.source || !connection.target || connection.source === connection.target) return eds;
      if (eds.some(e => e.source === connection.source && e.target === connection.target)) return eds;
      const next = addEdge({ ...connection, id: uid() }, eds);
      persist(nodes, next);
      return next;
    });
  }

  // Desconecta dos nodos sin borrar ninguno — botón "×" al pasar el mouse sobre la conexión
  // (ver FlowEdge.jsx) y/o seleccionarla + Backspace/Delete (edgesFocusable habilitado abajo).
  function removeEdge(edgeId) {
    setEdges(eds => {
      const next = eds.filter(e => e.id !== edgeId);
      persist(nodes, next);
      return next;
    });
  }
  function onEdgesChange(changes) {
    setEdges(eds => { const next = applyEdgeChanges(changes, eds); persist(nodes, next); return next; });
  }

  // Quita un paso ya elegido para que el usuario pueda volver a crearlo. Un placeholder, o un nodo
  // suelto al que nada apunta (un Cerebro nuevo del botón de abajo, un recurso arrastrado al
  // canvas), se borra directo — no tiene sentido dejar un "Elegir siguiente paso" fantasma ahí.
  // Un nodo que SÍ vino de resolver un "Elegir siguiente paso" conectado desde otro paso vuelve a
  // serlo (para poder elegir otro ahí mismo), y se eliminan los nodos construidos a partir de él.
  function deleteNode(id) {
    setNodes(nds => {
      const node = nds.find(n => n.id === id);
      if (!node) return nds;
      const forward = {};
      edges.forEach(e => { (forward[e.source] = forward[e.source] || []).push(e.target); });
      const toRemove = new Set(); const stack = [id];
      while (stack.length) {
        const cur = stack.pop();
        (forward[cur] || []).forEach(t => { if (!toRemove.has(t)) { toRemove.add(t); stack.push(t); } });
      }
      const hadIncoming = edges.some(e => e.target === id);
      if (node.type === "placeholder" || !hadIncoming) {
        const next = nds.filter(n => n.id !== id && !toRemove.has(n.id));
        const nextEdges = edges.filter(e => e.source !== id && e.target !== id && !toRemove.has(e.source) && !toRemove.has(e.target));
        setEdges(nextEdges);
        persist(next, nextEdges);
        return next;
      }
      const next = nds.filter(n => !toRemove.has(n.id)).map(n => n.id === id ? { ...n, type: "placeholder", data: {} } : n);
      const nextEdges = edges.filter(e => !toRemove.has(e.source) && !toRemove.has(e.target));
      setEdges(nextEdges);
      persist(next, nextEdges);
      return next;
    });
    setSelectedId(null);
  }

  // Reordena todo el flujo automáticamente: columnas por profundidad desde la raíz (BFS),
  // filas por orden vertical actual dentro de cada columna — deja el flujo prolijo con un click.
  function autoLayout() {
    const COL_W = 300, ROW_H = 190;
    const forward = {};
    edges.forEach(e => { (forward[e.source] = forward[e.source] || []).push(e.target); });
    const incoming = new Set(edges.map(e => e.target));
    const roots = nodes.filter(n => !incoming.has(n.id));
    const depth = {};
    const queue = roots.map(r => r.id);
    roots.forEach(r => { depth[r.id] = 0; });
    while (queue.length) {
      const id = queue.shift();
      (forward[id] || []).forEach(childId => {
        const d = depth[id] + 1;
        if (depth[childId] === undefined || depth[childId] < d) {
          depth[childId] = d;
          queue.push(childId);
        }
      });
    }
    nodes.forEach(n => { if (depth[n.id] === undefined) depth[n.id] = 0; });
    const byDepth = {};
    nodes.forEach(n => { (byDepth[depth[n.id]] = byDepth[depth[n.id]] || []).push(n); });
    Object.values(byDepth).forEach(group => group.sort((a, b) => a.position.y - b.position.y));
    const next = nodes.map(n => {
      const group = byDepth[depth[n.id]];
      const idx = group.indexOf(n);
      return { ...n, position: { x: depth[n.id] * COL_W + 60, y: idx * ROW_H + 60 } };
    });
    setNodes(next);
    persist(next, edges);
    notify?.("Flujo ordenado ✓");
  }

  // Posición razonable para un nodo nuevo cuando no hay coordenadas exactas (click, no drag) —
  // al lado del último nodo agregado.
  function defaultDropPosition() {
    const last = nodes[nodes.length - 1];
    return last ? { x: last.position.x + 40, y: last.position.y + 220 } : { x: 400, y: 260 };
  }

  // Crea cualquier tipo de paso (Cerebro/Persona/Receta/Oferta/Prompt/Chat) suelto, sin pasar
  // por el flujo de "Elegir siguiente paso" ni requerir una conexión desde otro nodo — usado
  // por la barra lateral (arrastrar o click) y por "Nuevo Cerebro" de la barra de abajo.
  function addStandaloneNode(type, position) {
    const id = uid();
    const node = { id, type, position: position || defaultDropPosition(), data: { ...(DEFAULT_DATA[type] || {}) } };
    setNodes(nds => { const next = [...nds, node]; persist(next, edges); return next; });
    // El Chat maneja su propio foco al abrirse — seleccionar el nodo de flow encima no aporta
    // nada y puede pisar ese foco (mismo criterio que resolvePlaceholder).
    setSelectedId(type === "chat" ? null : id);
  }
  // Cerebro nuevo desde la barra de abajo — mantenido con su propio nombre porque es el punto
  // de entrada más usado (botón dedicado "Nuevo Cerebro"), pero ahora es solo un caso de lo de arriba.
  function addCerebro(position) {
    addStandaloneNode("cerebro", position);
  }

  // Confirma un resize del Cerebro: guarda el tamaño nuevo y, si se estiró desde el borde
  // izquierdo o de arriba, corre la posición del nodo para que el borde opuesto quede fijo.
  function resizeCerebro(id, size, positionDelta) {
    setNodes(nds => {
      const next = nds.map(n => {
        if (n.id !== id) return n;
        const position = (positionDelta.x || positionDelta.y)
          ? { x: n.position.x + positionDelta.x, y: n.position.y + positionDelta.y }
          : n.position;
        return { ...n, position, data: { ...n.data, size } };
      });
      persist(next, edges);
      return next;
    });
  }

  function addResourceToCerebro(cerebroId, kind, extra = {}) {
    setNodes(nds => {
      const next = nds.map(n => {
        if (n.id !== cerebroId || n.type !== "cerebro") return n;
        const sources = n.data.sources || [];
        const nuevo = { id: uid(), kind, label: "", createdAt: new Date().toISOString(), ...extra };
        return { ...n, data: { ...n.data, sources: [...sources, nuevo] } };
      });
      persist(next, edges);
      return next;
    });
  }

  // Un recurso soltado sin Cerebro (fuera de uno, o directo en el canvas) queda como su propio
  // nodo conectable — igual forma parte del flujo, solo que no agrupado.
  function addStandaloneResource(kind, extra = {}, position) {
    const node = { id: uid(), type: "recurso", position: position || defaultDropPosition(), data: { kind, label: "", createdAt: new Date().toISOString(), ...extra } };
    setNodes(nds => { const next = [...nds, node]; persist(next, edges); return next; });
  }

  // Punto de entrada único para agregar un recurso — desde el click de la barra de abajo o
  // desde un drag & drop (con target explícito: un Cerebro puntual, o una posición del canvas).
  // Los tipos basados en archivo necesitan abrir el picker del sistema antes de poder crearse.
  function requestAddResource(kind, target) {
    const meta = PLATFORM_META[kind];
    if (meta.isLink) { (target.type === "cerebro" ? addResourceToCerebro(target.id, kind, { url: "" }) : addStandaloneResource(kind, { url: "" }, target.position)); return; }
    if (kind === "texto") { (target.type === "cerebro" ? addResourceToCerebro(target.id, kind, { text: "" }) : addStandaloneResource(kind, { text: "" }, target.position)); return; }
    pendingFileTarget.current = { kind, target };
    fileInputRef.current?.click();
  }

  async function handleFilePicked(file) {
    const pending = pendingFileTarget.current;
    pendingFileTarget.current = null;
    if (!file || !pending) return;
    const { kind, target } = pending;
    let extra;
    if (kind === "doc") {
      try {
        const text = file.name.toLowerCase().endsWith(".pdf") ? await extractPdfText(file) : await file.text();
        extra = { label: file.name, text: text.slice(0, 20000) };
      } catch { notify?.("No se pudo leer el archivo"); return; }
    } else if (kind === "imagen") {
      extra = { label: file.name, thumb: await readAsDataURL(file) };
    } else if (kind === "video") {
      extra = { label: file.name, thumb: await captureVideoThumbnail(file) };
    } else {
      extra = { label: file.name };
    }
    if (target.type === "cerebro") addResourceToCerebro(target.id, kind, extra);
    else addStandaloneResource(kind, extra, target.position);
  }

  function handleCanvasDropResource(kind, position) {
    requestAddResource(kind, { type: "canvas", position });
  }
  function handleCanvasDropNode(type, position) {
    addStandaloneNode(type, position);
  }

  const isDirty = JSON.stringify({ nodes, edges }) !== JSON.stringify(initialSnapshot.current);

  function handleBackClick() {
    if (isDirty) { setShowLeaveConfirm(true); return; }
    onBack();
  }
  function confirmSave() {
    clearTimeout(saveTimer.current);
    updateBrand(b => ({
      ...b,
      proyectos: (b.proyectos || []).map(p => p.id === proyecto.id ? { ...p, nodes, edges, updatedAt: new Date().toISOString() } : p),
    }));
    setShowLeaveConfirm(false);
    onBack();
  }
  function confirmDiscard() {
    clearTimeout(saveTimer.current);
    updateBrand(b => ({
      ...b,
      proyectos: (b.proyectos || []).map(p => p.id === proyecto.id ? { ...p, nodes: initialSnapshot.current.nodes, edges: initialSnapshot.current.edges } : p),
    }));
    setShowLeaveConfirm(false);
    onBack();
  }

  // Contexto de un nodo Chat: recorre el grafo hacia atrás y junta Cerebro/Persona/Ángulo/Oferta.
  function buildContextFor(chatId) {
    const reverse = {};
    edges.forEach(e => { (reverse[e.target] = reverse[e.target] || []).push(e.source); });
    const seen = new Set(); const stack = [chatId]; const ancestors = [];
    while (stack.length) {
      const cur = stack.pop();
      (reverse[cur] || []).forEach(src => { if (!seen.has(src)) { seen.add(src); ancestors.push(src); stack.push(src); } });
    }
    const ancNodes = ancestors.map(id => nodeById[id]).filter(Boolean);
    // Puede haber varios Cerebros (y/o recursos sueltos) como ancestros — se juntan todas sus
    // fuentes, no solo las del primero que aparezca.
    const cerebroSources = ancNodes.filter(n => n.type === "cerebro").flatMap(n => n.data?.sources || []);
    const recursoSources = ancNodes.filter(n => n.type === "recurso").map(n => n.data).filter(Boolean);
    const personaId = ancNodes.find(n => n.type === "persona")?.data?.personaId || null;
    const recetaData = ancNodes.find(n => n.type === "receta")?.data || null;
    const offerId = ancNodes.find(n => n.type === "oferta")?.data?.offerId || null;
    const promptTexts = ancNodes.filter(n => n.type === "prompt").map(n => n.data?.text).filter(t => t?.trim());

    const avatars = brand?.avatars || [];
    const avatarsParaPrompt = personaId ? avatars.filter(a => a.id === personaId) : avatars;
    const ctx = perfilCtx(brand?.perfil, avatarsParaPrompt);

    const sources = [...cerebroSources, ...recursoSources];
    const seedCtx = sources.filter(s => s.text).length
      ? `\n\nFUENTES DEL CEREBRO:\n${sources.filter(s => s.text).map(s => `[${s.label}]\n${s.text}`).join("\n\n").slice(0, 6000)}`
      : "";
    const receta = recetaData?.recetaId ? findReceta(brand, recetaData.recetaId) : null;
    const recetaCtxStr = receta ? `\n\n${recetaCtx(receta)}` : "";
    const offer = offerId ? (brand?.offers || []).find(o => o.id === offerId) : null;
    const offerCtx = offer
      ? `\n\nOFERTA:\n- Nombre: ${offer.nombre || offer.name || ""}\n- Descripción: ${offer.descripcion || ""}\n- Precio: ${offer.precio || ""}\n- Resultado: ${offer.resultado || ""}\n- Tiempo: ${offer.tiempo || ""}\n- Antes: ${offer.antes || ""}\n- Después: ${offer.despues || ""}\n- Garantía: ${offer.garantia || ""}\n- Restricción: ${offer.restriccion || ""}`
      : "";
    const mec = brand?.perfil?.mecanismo_nombrado?.trim();
    const noInvent = mec
      ? ` Cuando menciones el método, usá EXACTAMENTE "${mec}".`
      : ` NUNCA le pongas nombre propio al método/sistema — lenguaje natural: "nosotros lo hacemos distinto".`;
    const promptCtx = promptTexts.length
      ? `INSTRUCCIONES DE SISTEMA (nodo Prompt conectado — seguilas siempre):\n${promptTexts.map(t => `- ${t}`).join("\n")}\n\n`
      : "";
    return `${promptCtx}${ctx}${seedCtx}${recetaCtxStr}${offerCtx}\n\n${noInvent}`;
  }

  // Los nodos que le pasamos a <ReactFlow> llevan todo lo dinámico metido en `data` — así
  // `nodeTypes` (arriba) puede quedar 100% estático sin perder reactividad.
  const flowNodes = useMemo(() => nodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      brand, busy, setBusy, apiKey, updateBrand, notify,
      proyectoName: proyecto.name,
      onChange: (d) => updateNodeData(n.id, d),
      onDelete: () => deleteNode(n.id),
      onAddStep: () => armConnection(n.id),
      connecting: pendingFrom === n.id,
      onResolve: n.type === "placeholder" ? (type) => resolvePlaceholder(n.id, type) : undefined,
      onDropResource: n.type === "cerebro" ? (kind) => requestAddResource(kind, { type: "cerebro", id: n.id }) : undefined,
      onResize: n.type === "cerebro" ? (size, positionDelta) => resizeCerebro(n.id, size, positionDelta) : undefined,
      context: n.type === "chat" ? buildContextFor(n.id) : undefined,
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  })), [nodes, edges, brand, busy, apiKey, notify, proyecto.name, pendingFrom]);

  // Mismo patrón que flowNodes: le inyectamos a cada edge el callback de borrado (ver
  // FlowEdge.jsx) sin que React Flow tenga que remontar nada — un solo callback estable.
  const flowEdges = useMemo(() => edges.map(e => ({ ...e, data: { ...e.data, onDelete: removeEdge } })), [edges]);

  const Panel = selected && !SELF_CONTAINED.has(selected.type) ? NODE_META[selected.type]?.Panel : null;

  // Línea punteada que sigue el mouse mientras hay una conexión armada — sale del handle derecho
  // del nodo de origen (se recalcula en cada render, así sigue siendo correcta si el canvas pancea).
  const pendingLine = (() => {
    if (!pendingFrom || !mousePos) return null;
    const rect = document.querySelector(`.react-flow__node[data-id="${pendingFrom}"] .react-flow__handle-right`)?.getBoundingClientRect()
      || document.querySelector(`.react-flow__node[data-id="${pendingFrom}"]`)?.getBoundingClientRect();
    if (!rect) return null;
    const sx = rect.right ?? (rect.left + rect.width);
    const sy = rect.top + rect.height / 2;
    return { sx, sy };
  })();

  return (
    <div className="screen-slide-in" style={{ position: "fixed", inset: 0, zIndex: 8000, background: T.canvas, display: "flex", flexDirection: "column", fontFamily: font }}>
      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.gray}`, padding: "0 20px", height: 56, flexShrink: 0, display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={handleBackClick} title="Volver a Proyectos" style={{ width: 34, height: 34, borderRadius: T.radiusPill, border: `1px solid ${T.gray}`, background: T.surfaceInset, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.navy, flexShrink: 0 }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, fontFamily: fontDisplay, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          Compositor <span style={{ color: T.slate, fontWeight: 400 }}>/ {proyecto.name}</span>
        </div>
      </div>

      {/* Aviso de conexión armada */}
      {pendingFrom && (
        <div style={{ position: "absolute", top: 68, left: "50%", transform: "translateX(-50%)", zIndex: 9300, display: "flex", alignItems: "center", gap: 10, background: T.navy, color: "#fff", padding: "8px 16px", borderRadius: T.radiusPill, fontSize: 12.5, boxShadow: T.shadowModal }}>
          Click en otro nodo para conectarlo, o en un espacio vacío para crear un paso nuevo ahí
          <button onClick={() => setPendingFrom(null)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: T.radiusPill, padding: "3px 10px", fontSize: 11, cursor: "pointer" }}>Cancelar (Esc)</button>
        </div>
      )}

      {/* Canvas */}
      <div style={{ flex: 1, position: "relative" }} onMouseMove={pendingFrom ? (e) => setMousePos({ x: e.clientX, y: e.clientY }) : undefined}>
        <ReactFlowProvider>
          <FlowCanvas
            flowNodes={flowNodes}
            flowEdges={flowEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            pendingFrom={pendingFrom}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            onAutoLayout={autoLayout}
            onCanvasDropResource={handleCanvasDropResource}
            onCanvasDropNode={handleCanvasDropNode}
          />
        </ReactFlowProvider>
        <NodePickerRail onAdd={(type) => addStandaloneNode(type)} />
      </div>

      {/* Barra global: crear Cerebros y cargar recursos (al seleccionado, sueltos, o por drag & drop) */}
      <ResourceToolbar selected={selected} onRequestAdd={requestAddResource} onAddCerebro={() => addCerebro()} />
      <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handleFilePicked(f); }} />

      {pendingLine && mousePos && (
        <svg style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 9250 }}>
          <line x1={pendingLine.sx} y1={pendingLine.sy} x2={mousePos.x} y2={mousePos.y} stroke={T.purple} strokeWidth={2} strokeDasharray="6 5" />
          <circle cx={mousePos.x} cy={mousePos.y} r={4} fill={T.purple} />
        </svg>
      )}

      {/* Panel de configuración del nodo seleccionado (Persona/Ángulo/Oferta) — corrido a la
          izquierda del ancho de la barra lateral de "Agregar" (RAIL_WIDTH) para que convivan
          sin taparse, ambos anclados al borde derecho del canvas. */}
      {selected && Panel && (
        <div style={{ position: "absolute", top: 56, right: RAIL_WIDTH, bottom: 0, width: 380, background: T.surface, borderLeft: `1px solid ${T.gray}`, boxShadow: "-8px 0 24px rgba(24,19,73,0.08)", overflowY: "auto", padding: 20, zIndex: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, fontFamily: fontDisplay, display: "flex", alignItems: "center", gap: 8 }}>
              <span>{NODE_META[selected.type].emoji}</span> {NODE_META[selected.type].label}
            </div>
            <button onClick={() => setSelectedId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.slate, fontSize: 20 }}>×</button>
          </div>
          <Panel data={selected.data} onChange={(d) => updateNodeData(selected.id, d)} brand={brand} updateBrand={updateBrand} notify={notify} apiKey={apiKey} busy={busy} setBusy={setBusy} />
        </div>
      )}

      {/* Confirmación al salir con cambios sin decidir qué hacer */}
      {showLeaveConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(11,16,32,0.55)", zIndex: 9400, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: T.surface, borderRadius: T.radiusCard, padding: 24, width: 380, maxWidth: "90vw", boxShadow: T.shadowModal }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, fontFamily: fontDisplay, marginBottom: 8 }}>¿Guardar los cambios?</div>
            <div style={{ fontSize: 12.5, color: T.slate, lineHeight: 1.6, marginBottom: 18 }}>Hiciste cambios en este proyecto desde que lo abriste. ¿Querés guardarlos o descartarlos?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Btn variant="primary" full onClick={confirmSave}>Guardar y salir</Btn>
              <Btn variant="danger" full onClick={confirmDiscard}>Descartar cambios</Btn>
              <Btn variant="ghost" full onClick={() => setShowLeaveConfirm(false)}>Cancelar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
