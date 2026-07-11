// CerebroNode.jsx — un Cerebro = un grupo de fuentes. El proyecto puede tener varios Cerebros
// (cada uno con su propio conector hacia los siguientes pasos) — para eso, "Cerebro" también es
// una opción del menú "Elegir siguiente paso" Y un botón directo en la barra de abajo del editor
// (ver CanvasScreen), que también deja arrastrar cualquier recurso de la barra hasta un Cerebro
// o hasta cualquier parte vacía del canvas (ahí queda como RecursoNode, suelto).
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { useEffect, useRef, useState } from "react";
import { FileText, Mic, Video, Type, Image as ImageIcon, Clapperboard, Camera, ThumbsUp, Music2, Megaphone, Globe, X, Maximize2, Minimize2 } from "lucide-react";
import { ingestLink, isBackendSupportedPlatform } from "@/lib/ingest";
import { T, font, fontDisplay, NodeCloseBtn, NodeAddBtn } from "../ui.jsx";
import { BlockIcon } from "@/lib/blockIcons.jsx";

export const PLATFORM_META = {
  youtube:        { label: "YouTube & Shorts", color: "#FF0000", Icon: Clapperboard, isLink: true },
  tiktok:         { label: "TikTok",            color: "#000000", Icon: Music2,      isLink: true },
  instagram:      { label: "Instagram",         color: "#C13584", Icon: Camera,      isLink: true },
  facebook_post:  { label: "Facebook Post",     color: "#1877F2", Icon: ThumbsUp,    isLink: true },
  facebook_ad:    { label: "Facebook Ad",       color: "#1877F2", Icon: Megaphone,   isLink: true },
  website:        { label: "Sitio web",         color: "#475569", Icon: Globe,       isLink: true },
  doc:            { label: "Documento",         color: T.slate,   Icon: FileText,    isLink: false },
  voz:            { label: "Nota de voz",       color: T.slate,   Icon: Mic,         isLink: false },
  video:          { label: "Video",             color: T.slate,   Icon: Video,       isLink: false },
  imagen:         { label: "Imagen",            color: T.slate,   Icon: ImageIcon,   isLink: false },
  texto:          { label: "Texto",             color: T.slate,   Icon: Type,        isLink: false },
};

// Tipo MIME custom para el drag & drop de recursos desde la barra de abajo — a un Cerebro
// (se agrupa como fuente) o a cualquier parte vacía del canvas (queda como RecursoNode suelto).
export const RESOURCE_DRAG_MIME = "application/x-flowi-resource";

// Arrastrar una fuente YA EXISTENTE (dentro de un Cerebro expandido) hasta afuera, para que
// quede suelta como su propio RecursoNode — el payload lleva de qué Cerebro sale y cuál fuente,
// así el canvas puede sacarla de `sources` y crear el nodo nuevo en un solo movimiento.
export const EXISTING_SOURCE_DRAG_MIME = "application/x-flowi-existing-source";

const EXPANDED_DEFAULT = { width: 460, height: 320 };
const EXPANDED_MIN = { width: 300, height: 200 };
const EXPANDED_MAX = { width: 1400, height: 1100 };

function youtubeId(url) {
  const m = (url || "").match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}

// Captura un frame del video local como thumbnail (dataURL).
export function captureVideoThumbnail(file) {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url; video.muted = true; video.playsInline = true; video.preload = "metadata";
      const cleanup = () => URL.revokeObjectURL(url);
      video.addEventListener("loadeddata", () => { video.currentTime = Math.min(1, (video.duration || 1) / 2); });
      video.addEventListener("seeked", () => {
        try {
          const canvas = document.createElement("canvas");
          const ratio = (video.videoHeight && video.videoWidth) ? video.videoHeight / video.videoWidth : 0.6;
          canvas.width = 200; canvas.height = Math.round(200 * ratio);
          canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.72));
        } catch { resolve(null); }
        cleanup();
      });
      video.addEventListener("error", () => { resolve(null); cleanup(); });
    } catch { resolve(null); }
  });
}
export function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
export function kindForFile(file) {
  if (file.type.startsWith("image/")) return "imagen";
  if (file.type.startsWith("audio/")) return "voz";
  if (file.type.startsWith("video/")) return "video";
  return "doc";
}

// Resuelve un link (thumbnail + transcripción vía el backend hosteado) — usado tanto por una
// fuente dentro de un Cerebro como por un RecursoNode suelto. YouTube/TikTok/Instagram/
// Facebook ya tienen ingesta real (Apify, con Groq de respaldo); sitio web y Google Reviews
// todavía no tienen endpoint propio — quedan solo con el thumbnail hasta que se agregue.
export async function resolveSourceLink(source, onUpdate) {
  if (!source.url?.trim()) return;
  // El input dispara esto en cada onBlur — sin este guard, clickear afuera del Cerebro otra vez
  // (sin haber tocado el link) volvía a arrancar todo el procesamiento de cero, cobrando
  // créditos de nuevo por el mismo link ya resuelto. Solo re-procesamos si el link cambió
  // desde la última vez (o si nunca se llegó a procesar).
  if (source.processedUrl === source.url && (source.status === "done" || source.status === "processing")) return;

  const ytId = source.kind === "youtube" ? youtubeId(source.url) : null;
  const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(source.url)}`;

  if (!isBackendSupportedPlatform(source.url)) {
    onUpdate({ label: source.url, thumb, status: undefined, error: undefined, processedUrl: source.url });
    return; // sitio web / Google Reviews: sin transcripción por ahora
  }

  // OJO: esto tiene que ir en UN solo onUpdate — updateSource recalcula el array de fuentes
  // desde el `sources` capturado en el render actual, así que dos llamadas seguidas y
  // sincrónicas (thumb acá, status:"processing" aparte) hacen que la segunda pise a la
  // primera antes de que React vuelva a renderizar, y el thumbnail se pierde al instante.
  onUpdate({ label: source.url, thumb, status: "processing", error: undefined, processedUrl: source.url });
  try {
    const result = await ingestLink(source.url);
    // Para TikTok/Instagram/Facebook, Apify devuelve un thumbnail real del video — reemplaza
    // al favicon genérico que se puso arriba como preview instantánea. YouTube ya tenía uno
    // bueno desde el vamos, así que solo lo pisamos si el backend trajo algo.
    if (result.status === "done") onUpdate({ text: (result.text || "").slice(0, 20000), status: "done", ...(result.thumb ? { thumb: result.thumb } : {}) });
    else onUpdate({ status: "error", error: result.error });
  } catch (e) {
    onUpdate({ status: "error", error: e?.message || "No se pudo procesar este link." });
  }
}

// Tarjeta editable de una fuente — usada en la vista expandida del Cerebro (varias, en grilla)
// y en RecursoNode (una sola, "bare" porque el nodo ya trae su propio marco). `cerebroId` solo
// viene seteado en el primer caso — habilita arrastrar la tarjeta afuera del Cerebro (agarrando
// el header) para que quede suelta como su propio RecursoNode en el canvas.
export function SourceCard({ source, onUpdate, onRemove, bare, cerebroId }) {
  const meta = PLATFORM_META[source.kind] || PLATFORM_META.website;
  const draggableOut = !bare && !!cerebroId;
  return (
    <div style={{ ...(bare ? {} : { border: `1px solid ${T.gray}`, borderRadius: T.radiusCard }), overflow: "hidden", background: bare ? "transparent" : T.surface, display: "flex", flexDirection: "column" }}>
      <div
        draggable={draggableOut}
        onDragStart={draggableOut ? (e => {
          e.dataTransfer.setData(EXISTING_SOURCE_DRAG_MIME, JSON.stringify({ cerebroId, sourceId: source.id }));
          e.dataTransfer.effectAllowed = "move";
        }) : undefined}
        title={draggableOut ? "Arrastrá para sacarla del Cerebro" : undefined}
        style={{ background: meta.color, color: "#fff", padding: "6px 10px", display: "flex", alignItems: "center", gap: 6, cursor: draggableOut ? "grab" : "default" }}
      >
        <meta.Icon size={13} />
        <span style={{ fontSize: 11, fontWeight: 700, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta.label}</span>
        {onRemove && <button onClick={e => { e.stopPropagation(); onRemove(); }} className="nodrag" style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", opacity: 0.85 }}><X size={13} /></button>}
      </div>
      {meta.isLink && (
        <input className="nodrag" value={source.url || ""} onChange={e => onUpdate({ url: e.target.value })}
          onBlur={() => resolveSourceLink(source, onUpdate)} onKeyDown={e => e.key === "Enter" && e.currentTarget.blur()}
          placeholder="https://…" style={{ border: "none", borderBottom: `1px solid ${T.borderSoft}`, padding: "7px 10px", fontSize: 11.5, color: T.navy, fontFamily: font, outline: "none" }} />
      )}
      {source.kind === "texto" ? (
        <textarea className="nodrag" value={source.text || ""} onChange={e => onUpdate({ text: e.target.value, label: e.target.value.trim().slice(0, 40) || "Texto" })} rows={4}
          style={{ border: "none", padding: 10, fontSize: 12, color: T.navy, fontFamily: font, resize: "vertical", outline: "none", background: T.surfaceInset }} />
      ) : (
        <div style={{ height: 100, background: T.surfaceInset, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {source.thumb ? <img src={source.thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <meta.Icon size={26} color={meta.color} style={{ opacity: 0.4 }} />}
        </div>
      )}
      {source.status === "processing" && (
        <div style={{ fontSize: 11, color: T.slate, padding: "8px 10px", borderTop: `1px solid ${T.borderSoft}`, display: "flex", alignItems: "center", gap: 6 }}>
          <span className="cerebro-spin" style={{ width: 10, height: 10, borderRadius: "50%", border: `2px solid ${T.gray}`, borderTopColor: meta.color, display: "inline-block" }} />
          Procesando…
        </div>
      )}
      {source.status === "error" && (
        <div style={{ fontSize: 11, color: "#C0392B", padding: "8px 10px", borderTop: `1px solid ${T.borderSoft}` }}>{source.error || "No se pudo procesar."}</div>
      )}
      {source.text && source.kind !== "texto" && <div style={{ fontSize: 11, color: T.navy, lineHeight: 1.5, whiteSpace: "pre-wrap", maxHeight: 100, overflowY: "auto", padding: "8px 10px", borderTop: `1px solid ${T.borderSoft}` }}>{source.text.slice(0, 300)}{source.text.length > 300 ? "…" : ""}</div>}
    </div>
  );
}

export function CerebroNode({ id, data, selected, onChange, onDelete, onAddStep, connecting, onDropResource, onResize }) {
  const sources = data.sources || [];
  const expanded = !!data.expanded;
  const [size, setSize] = useState(data.size || EXPANDED_DEFAULT);
  // Mientras se arrastra desde el borde/esquina izquierdo o de arriba, el Cerebro tiene que crecer
  // "hacia ese lado" — visualmente se corre con este offset (en vivo) y al soltar se confirma
  // corriendo la posición real del nodo, así el borde opuesto queda anclado donde estaba.
  const [shift, setShift] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const resizeRef = useRef(null);
  const liveRef = useRef({ width: size.width, height: size.height, shiftX: 0, shiftY: 0 });
  const { getZoom } = useReactFlow();

  function removeSource(id) { onChange(prev => ({ ...prev, sources: (prev.sources || []).filter(s => s.id !== id) })); }
  // Con función (no objeto) — resolveSourceLink dispara varios updates a lo largo de un flujo
  // async (thumbnail → processing → done) y cada uno tiene que partir del dato MÁS FRESCO al
  // aplicarse, no de un `sources` cerrado en el render donde arrancó el flujo. Si no, la
  // actualización más tardía pisa a las anteriores con un snapshot viejo (así se perdía el
  // thumbnail apenas terminaba de procesar).
  function updateSource(id, patch) { onChange(prev => ({ ...prev, sources: (prev.sources || []).map(s => s.id === id ? { ...s, ...patch } : s) })); }
  function toggleExpanded() { onChange({ ...data, expanded: !expanded }); }

  // dirX/dirY: -1 (borde izq./de arriba — crece "hacia atrás", corre el nodo), 0 (ese eje no
  // cambia) o 1 (borde der./de abajo — crece "hacia adelante", el nodo no se mueve).
  function onResizeMove(e) {
    if (!resizeRef.current) return;
    const { dirX, dirY, x, y, w, h } = resizeRef.current;
    const zoom = getZoom() || 1;
    const dx = (e.clientX - x) / zoom;
    const dy = (e.clientY - y) / zoom;
    let nextW = w, nextH = h, shiftX = 0, shiftY = 0;
    if (dirX === 1) nextW = Math.min(EXPANDED_MAX.width, Math.max(EXPANDED_MIN.width, w + dx));
    else if (dirX === -1) { nextW = Math.min(EXPANDED_MAX.width, Math.max(EXPANDED_MIN.width, w - dx)); shiftX = w - nextW; }
    if (dirY === 1) nextH = Math.min(EXPANDED_MAX.height, Math.max(EXPANDED_MIN.height, h + dy));
    else if (dirY === -1) { nextH = Math.min(EXPANDED_MAX.height, Math.max(EXPANDED_MIN.height, h - dy)); shiftY = h - nextH; }
    liveRef.current = { width: nextW, height: nextH, shiftX, shiftY };
    setSize({ width: nextW, height: nextH });
    setShift({ x: shiftX, y: shiftY });
  }
  function onResizeUp() {
    resizeRef.current = null;
    setResizing(false);
    window.removeEventListener("pointermove", onResizeMove);
    window.removeEventListener("pointerup", onResizeUp);
    const { width, height, shiftX, shiftY } = liveRef.current;
    setShift({ x: 0, y: 0 });
    if (onResize) onResize({ width, height }, { x: shiftX, y: shiftY });
    else onChange({ ...data, size: { width, height } });
  }
  function onResizeDown(e, dirX, dirY) {
    e.stopPropagation(); e.preventDefault();
    resizeRef.current = { dirX, dirY, x: e.clientX, y: e.clientY, w: size.width, h: size.height };
    liveRef.current = { width: size.width, height: size.height, shiftX: 0, shiftY: 0 };
    setResizing(true);
    window.addEventListener("pointermove", onResizeMove);
    window.addEventListener("pointerup", onResizeUp);
  }
  useEffect(() => () => {
    window.removeEventListener("pointermove", onResizeMove);
    window.removeEventListener("pointerup", onResizeUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onDragOver(e) {
    if (!e.dataTransfer.types.includes(RESOURCE_DRAG_MIME)) return;
    e.preventDefault(); e.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  }
  function onDrop(e) {
    const kind = e.dataTransfer.getData(RESOURCE_DRAG_MIME);
    setDragOver(false);
    if (!kind) return;
    e.preventDefault(); e.stopPropagation();
    onDropResource?.(kind);
  }

  return (
    <div
      onDragOver={onDragOver} onDragLeave={() => setDragOver(false)} onDrop={onDrop}
      className={selected || dragOver ? "cerebro-glow" : undefined}
      style={{
        position: "relative", width: expanded ? size.width : 240, background: T.surface, borderRadius: T.radiusCard,
        border: `2px solid ${dragOver ? T.purple : selected ? T.purple : T.gray}`,
        boxShadow: dragOver || selected ? T.shadowAccent : T.shadowCard, overflow: "visible", fontFamily: font,
        transform: (shift.x || shift.y) ? `translate(${shift.x}px, ${shift.y}px)` : undefined,
        transition: resizing ? "none" : "width 320ms cubic-bezier(0.16,1,0.3,1), border-color 150ms, box-shadow 150ms",
      }}>
      {onDelete && <NodeCloseBtn onClick={onDelete} title="Quitar este Cerebro" />}
      {onAddStep && <NodeAddBtn onClick={onAddStep} active={connecting} />}
      <Handle type="target" position={Position.Left} style={{ background: T.purple, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: T.purple, width: 8, height: 8 }} />

      <div style={{ padding: onDelete ? "13px 34px 13px 14px" : "13px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <BlockIcon type="cerebro" size={20} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: fontDisplay }}>Cerebro</span>
          <button onClick={e => { e.stopPropagation(); toggleExpanded(); }} title={expanded ? "Contraer" : "Expandir para ver todo"} className="nodrag"
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: T.purple, display: "flex", padding: 2, flexShrink: 0 }}>
            {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
        <div style={{ fontSize: 10.5, color: T.slate, lineHeight: 1.4 }}>
          {sources.length ? `${sources.length} recurso${sources.length === 1 ? "" : "s"}` : "Usá la barra de abajo, o arrastrá un recurso hasta aquí."}
        </div>
      </div>

      {(expanded || sources.length > 0) && (
        <div className="nodrag nowheel" style={{
          borderTop: `1px solid ${T.borderSoft}`, overflow: "hidden",
          maxHeight: expanded ? size.height : 130,
          transition: resizing ? "none" : "max-height 320ms cubic-bezier(0.16,1,0.3,1)",
        }}>
          <div key={expanded ? "expanded" : "collapsed"} className="fade-in" style={{ padding: expanded ? 12 : "8px 10px", height: expanded ? size.height : "auto", boxSizing: "border-box", overflowY: "auto" }}>
            {expanded ? (
              sources.length ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, alignItems: "start" }}>
                  {sources.map(s => <SourceCard key={s.id} source={s} onUpdate={p => updateSource(s.id, p)} onRemove={() => removeSource(s.id)} cerebroId={id} />)}
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: T.slate, textAlign: "center", padding: "24px 10px" }}>Todavía no hay nada acá. Usá la barra de abajo del editor (o arrastrá un recurso hasta aquí) para agregar contenido a este Cerebro.</div>
              )
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {sources.map(s => {
                  const meta = PLATFORM_META[s.kind] || PLATFORM_META.website;
                  return (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: T.radiusInput, border: `1px solid ${T.gray}`, background: T.surfaceInset }}>
                      {s.thumb ? <img src={s.thumb} alt="" style={{ width: 16, height: 16, borderRadius: 3, objectFit: "cover", flexShrink: 0 }} /> : <meta.Icon size={12} color={meta.color} style={{ flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0, fontSize: 11, color: T.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label || s.url || meta.label}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {expanded && (
        <>
          {/* Los 4 bordes enteros y las 4 esquinas son agarrables — no hace falta acertarle a un
              puntito. Los bordes de la izquierda y de arriba corren el nodo al crecer, para que
              se sienta como si lo estirases "hacia ese lado". */}
          <div className="nodrag" onPointerDown={e => onResizeDown(e, 1, 0)} title="Arrastrá para ensanchar"
            style={{ position: "absolute", top: 16, bottom: 16, right: -5, width: 10, cursor: "ew-resize", zIndex: 5 }} />
          <div className="nodrag" onPointerDown={e => onResizeDown(e, -1, 0)} title="Arrastrá para ensanchar"
            style={{ position: "absolute", top: 16, bottom: 16, left: -5, width: 10, cursor: "ew-resize", zIndex: 5 }} />
          <div className="nodrag" onPointerDown={e => onResizeDown(e, 0, 1)} title="Arrastrá para alargar"
            style={{ position: "absolute", left: 16, right: 16, bottom: -5, height: 10, cursor: "ns-resize", zIndex: 5 }} />
          <div className="nodrag" onPointerDown={e => onResizeDown(e, 0, -1)} title="Arrastrá para alargar"
            style={{ position: "absolute", left: 16, right: 16, top: -5, height: 10, cursor: "ns-resize", zIndex: 5 }} />

          <div className="nodrag" onPointerDown={e => onResizeDown(e, 1, 1)} title="Arrastrá para cambiar el tamaño"
            style={{
              position: "absolute", right: -5, bottom: -5, width: 26, height: 26, cursor: "nwse-resize", zIndex: 6,
              display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 4, boxSizing: "border-box",
              color: T.purple, opacity: 0.75,
            }}>
            <svg width="12" height="12" viewBox="0 0 11 11"><path d="M9.5 1.5L1.5 9.5M9.5 5.5L5.5 9.5M9.5 9.5L9.5 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </div>
          <div className="nodrag" onPointerDown={e => onResizeDown(e, -1, 1)} title="Arrastrá para cambiar el tamaño"
            style={{ position: "absolute", left: -5, bottom: -5, width: 20, height: 20, cursor: "nesw-resize", zIndex: 6 }} />
          <div className="nodrag" onPointerDown={e => onResizeDown(e, 1, -1)} title="Arrastrá para cambiar el tamaño"
            style={{ position: "absolute", right: -5, top: -5, width: 20, height: 20, cursor: "nesw-resize", zIndex: 6 }} />
          <div className="nodrag" onPointerDown={e => onResizeDown(e, -1, -1)} title="Arrastrá para cambiar el tamaño"
            style={{ position: "absolute", left: -5, top: -5, width: 20, height: 20, cursor: "nwse-resize", zIndex: 6 }} />
        </>
      )}
    </div>
  );
}

export { youtubeId };
