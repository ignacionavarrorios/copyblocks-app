// ChatNode.jsx — el chat estilo Poppy AI: pedís copy o preguntás sobre tu contenido, conectado
// al CLI del usuario. Vive como una tarjeta grande directo en el canvas. Los distintos hilos de
// chat del mismo nodo se navegan desde un menú lateral izquierdo (igual que el historial de Claude).
// Cuando la IA genera un copy, marca sus componentes (hook, beneficios, CTA, etc.) con un
// resaltado muy sutil — al pasar el mouse se ve el nombre del componente y un botón para
// guardarlo suelto. El mensaje entero también se puede copiar, guardar o editar en línea.
import { Handle, Position } from "@xyflow/react";
import { useRef, useState } from "react";
import { Sparkles, Plus, Send, Bookmark, X, Copy, Pencil, Check } from "lucide-react";
import { uid } from "@/lib/utils";
import { COPY_BRAIN } from "@/lib/prompts";
import { callClaude } from "@/lib/ai";
import { T, font, fontDisplay, NodeCloseBtn, NodeAddBtn } from "../ui.jsx";
import { BlockIcon } from "@/lib/blockIcons.jsx";

const QUICK_ACTIONS = [
  { label: "Generar copy", prompt: "Generá un anuncio de Facebook completo con todo el contexto disponible." },
  { label: "Resumir contenido", prompt: "Resumí en pocos puntos el contenido que subí en el Cerebro." },
  { label: "Puntos clave", prompt: "Sacá los puntos clave / insights más útiles de mis fuentes para usar en copy." },
];

// Componentes de copy que la IA puede marcar con [[tipo]]texto[[/tipo]] — cada uno con su color
// de resaltado muy sutil. Solo se ven al pasar el mouse (nombre + botón de guardar).
const COPY_COMPONENTS = {
  hook: { label: "Hook", color: "#7A5AF6" },
  benefits: { label: "Beneficios", color: "#2878D4" },
  cta: { label: "CTA", color: "#C44F82" },
  offer: { label: "Oferta", color: "#0E7F8C" },
  proof: { label: "Prueba social", color: "#1A9E6E" },
  guarantee: { label: "Garantía", color: "#D97706" },
  body: { label: "Cuerpo", color: "#64748B" },
};
const TAG_INSTRUCTIONS = `Cuando generes un COPY/ANUNCIO completo (no cuando respondas preguntas, resúmenes o charla), envolvé cada componente identificable así: [[hook]]texto del hook[[/hook]] [[benefits]]lista de beneficios[[/benefits]] [[cta]]llamado a la acción[[/cta]] [[offer]]detalle de la oferta[[/offer]] [[proof]]prueba social[[/proof]] [[guarantee]]garantía[[/guarantee]] [[body]]el resto del cuerpo[[/body]]. Usá solo los tags que apliquen — no hace falta usar los 7. TODO el texto del copy tiene que quedar adentro de algún tag, sin texto suelto afuera. Si NO te piden un copy/anuncio, NO uses tags — respondé en texto plano normal.`;

function parseCopyTags(text) {
  const regex = /\[\[(\w+)\]\]([\s\S]*?)\[\[\/\1\]\]/g;
  const segments = [];
  let lastIndex = 0, match, found = false;
  while ((match = regex.exec(text))) {
    found = true;
    if (match.index > lastIndex) segments.push({ type: null, text: text.slice(lastIndex, match.index) });
    segments.push({ type: match[1], text: match[2] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) segments.push({ type: null, text: text.slice(lastIndex) });
  return { segments, hasTags: found };
}
function stripTags(text) { return text.replace(/\[\[\/?\w+\]\]/g, ""); }

// Normaliza data vieja (un solo hilo en data.messages) a la forma nueva (data.chats[]).
function normalize(data) {
  if (data.chats?.length) return data;
  const first = { id: uid(), name: "Chat 1", messages: data.messages || [] };
  return { chats: [first], activeChatId: first.id };
}

const ghostBtnStyle = { display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: T.slate, fontSize: 10.5, padding: 0, fontFamily: font };

function AiMessage({ msg, onSaveFull, onSaveSnippet, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [hoverIdx, setHoverIdx] = useState(null);
  const [copied, setCopied] = useState(false);
  const { segments } = parseCopyTags(msg.text);
  const plain = stripTags(msg.text);

  function startEdit() { setDraft(plain); setEditing(true); }
  function saveEdit() { onEdit(draft); setEditing(false); }
  function copyAll() { navigator.clipboard.writeText(plain); setCopied(true); setTimeout(() => setCopied(false), 1500); }

  if (editing) {
    return (
      <div style={{ width: "100%" }}>
        <textarea className="nodrag" value={draft} onChange={e => setDraft(e.target.value)} rows={6}
          style={{ width: "100%", boxSizing: "border-box", padding: "9px 13px", fontSize: 12.5, lineHeight: 1.6, border: `1.5px solid ${T.purple}`, borderRadius: T.radiusInput, fontFamily: font, color: T.navy, resize: "vertical", outline: "none" }} />
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <button onClick={saveEdit} style={{ ...ghostBtnStyle, color: T.purple, fontWeight: 700 }}><Check size={11} /> Guardar edición</button>
          <button onClick={() => setEditing(false)} style={ghostBtnStyle}>Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: T.surfaceInset, color: T.navy, padding: "9px 13px", borderRadius: T.radiusInput, fontSize: 12.5, lineHeight: 1.8, whiteSpace: "pre-wrap" }} onMouseLeave={() => setHoverIdx(null)}>
        {segments.map((s, i) => {
          if (!s.type || !COPY_COMPONENTS[s.type]) return <span key={i}>{s.text}</span>;
          const c = COPY_COMPONENTS[s.type];
          return (
            <span key={i} onMouseEnter={() => setHoverIdx(i)} style={{ position: "relative", background: `${c.color}17`, borderRadius: 4 }}>
              {hoverIdx === i && (
                <span onMouseDown={e => e.preventDefault()} style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: 3, display: "inline-flex", alignItems: "center", gap: 5, background: c.color, color: "#fff", padding: "2px 8px", borderRadius: T.radiusPill, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", zIndex: 5 }}>
                  {c.label}
                  <Bookmark size={10} style={{ cursor: "pointer" }} onClick={() => onSaveSnippet(s.type, s.text.trim())} />
                </span>
              )}
              {s.text}
            </span>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 5 }}>
        <button onClick={copyAll} style={copied ? { ...ghostBtnStyle, color: T.purple, fontWeight: 700 } : ghostBtnStyle}>{copied ? <Check size={11} /> : <Copy size={11} />} {copied ? "Copiado" : "Copiar"}</button>
        <button onClick={() => onSaveFull(plain)} style={ghostBtnStyle}><Bookmark size={11} /> Guardar como copy</button>
        <button onClick={startEdit} style={ghostBtnStyle}><Pencil size={11} /> Editar</button>
      </div>
    </div>
  );
}

export function ChatNode({ data: rawData, selected, context, apiKey, notify, busy, setBusy, updateBrand, onChange, proyectoName, onDelete, onAddStep, connecting }) {
  const data = normalize(rawData);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const activeChat = data.chats.find(c => c.id === data.activeChatId) || data.chats[0];
  const messages = activeChat?.messages || [];
  // `busy` es global (compartido por todos los nodos del canvas) — esto lo acota a "de verdad
  // estamos esperando una respuesta EN ESTE hilo" (el último mensaje visible es del usuario).
  const waitingReply = busy && messages.length > 0 && messages[messages.length - 1].role === "user";

  function setMessages(nextMsgs) {
    onChange({ ...data, chats: data.chats.map(c => c.id === activeChat.id ? { ...c, messages: nextMsgs } : c) });
  }
  function nuevoChat() {
    const nc = { id: uid(), name: `Chat ${data.chats.length + 1}`, messages: [] };
    onChange({ ...data, chats: [...data.chats, nc], activeChatId: nc.id });
  }
  function borrarChat(id, e) {
    e.stopPropagation();
    if (data.chats.length <= 1) return;
    const next = data.chats.filter(c => c.id !== id);
    onChange({ ...data, chats: next, activeChatId: id === data.activeChatId ? next[0].id : data.activeChatId });
  }

  async function enviar(texto) {
    const t = (texto ?? input).trim();
    if (!t || busy) return;
    const nextMsgs = [...messages, { id: uid(), role: "user", text: t }];
    setMessages(nextMsgs);
    setInput("");
    setBusy(true);
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
    try {
      const historial = messages.map(m => `${m.role === "user" ? "Usuario" : "IA"}: ${stripTags(m.text)}`).join("\n\n");
      const prompt = `${COPY_BRAIN}\n\nIMPORTANTE: Respondé en español, segunda persona directa (tú/vos) cuando generes copy. ${TAG_INSTRUCTIONS}\n${context || "(sin fuentes ni personalización conectada todavía)"}\n\n${historial ? `HISTORIAL DEL CHAT:\n${historial}\n\n` : ""}MENSAJE NUEVO DEL USUARIO: "${t}"\n\nRespondé de forma natural y directa: si te piden un copy/anuncio, generalo COMPLETO listo para pegar aplicando las reglas del cerebro. Si te preguntan sobre las fuentes o piden un resumen, respondé eso directamente.`;
      const raw = await callClaude(prompt, apiKey, 2200, `Chat: ${proyectoName || "proyecto"}`);
      setMessages([...nextMsgs, { id: uid(), role: "ai", text: raw }]);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
    } catch (e) { notify?.("Error: " + (e?.message || "intentá de nuevo")); }
    setBusy(false);
  }

  function guardarComoCopy(text) {
    updateBrand(b => ({ ...b, copies: [...(b.copies || []), { id: uid(), type: "facebook", text, tag: `[Chat: ${proyectoName || "proyecto"}]`, rating: "testing", fecha: new Date().toISOString().split("T")[0] }] }));
    notify?.("Guardado en banco de copies ✓");
  }
  function guardarSnippet(tipo, text) {
    const label = COPY_COMPONENTS[tipo]?.label || tipo;
    updateBrand(b => ({ ...b, copies: [...(b.copies || []), { id: uid(), type: "facebook", text, tag: `[${label}]`, rating: "testing", fecha: new Date().toISOString().split("T")[0] }] }));
    notify?.(`${label} guardado ✓`);
  }
  function editarMensaje(msgId, newText) {
    setMessages(messages.map(m => m.id === msgId ? { ...m, text: newText } : m));
  }

  return (
    <div style={{ position: "relative", width: 780, height: 560, background: T.surface, borderRadius: T.radiusCard, border: `2px solid ${selected ? T.purple : T.gray}`, boxShadow: selected ? T.shadowAccent : T.shadowCard, overflow: "visible", fontFamily: font, display: "flex" }}>
      {onDelete && <NodeCloseBtn onClick={onDelete} title="Quitar Chat" />}
      {onAddStep && <NodeAddBtn onClick={onAddStep} active={connecting} />}
      <Handle type="target" position={Position.Left} style={{ background: T.purple, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: T.purple, width: 8, height: 8 }} />

      {/* Menú lateral de hilos — estilo historial de Claude */}
      <div className="nowheel" style={{ width: 160, flexShrink: 0, borderRight: `1px solid ${T.borderSoft}`, display: "flex", flexDirection: "column", borderRadius: `${T.radiusCard}px 0 0 ${T.radiusCard}px`, overflow: "hidden", background: T.surfaceInset }}>
        <div style={{ padding: "10px 10px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: T.slate, textTransform: "uppercase", letterSpacing: "0.05em" }}>Chats</span>
          <button onClick={nuevoChat} title="Nuevo chat" style={{ width: 18, height: 18, borderRadius: "50%", border: "none", background: T.purple, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}><Plus size={11} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "2px 6px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {data.chats.map(c => (
            <div key={c.id} onClick={() => onChange({ ...data, activeChatId: c.id })} style={{ position: "relative", padding: "6px 22px 6px 9px", borderRadius: T.radiusInput, fontSize: 11.5, fontWeight: c.id === activeChat.id ? 700 : 500, cursor: "pointer", background: c.id === activeChat.id ? T.purpleBg : "transparent", color: c.id === activeChat.id ? T.purple : T.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.name}
              {data.chats.length > 1 && (
                <X size={11} onClick={e => borrarChat(c.id, e)} style={{ position: "absolute", top: 7, right: 6, color: T.slate, cursor: "pointer" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Panel principal del hilo activo */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.borderSoft}`, flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <BlockIcon type="chat" size={18} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: fontDisplay, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeChat.name}</span>
          <span style={{ marginLeft: "auto", fontSize: 10.5, color: T.slate }}>Conectá un bloque Ángulo para aplicar hooks</span>
        </div>

        {/* Mensajes */}
        <div ref={scrollRef} className="nowheel" style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          {!messages.length && (
            <div style={{ fontSize: 12, color: T.slate, textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
              Pedime un copy, o preguntame sobre lo que subiste en el Cerebro.
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: m.role === "user" ? "75%" : "92%" }}>
              {m.role === "ai" && <div style={{ fontSize: 10, fontWeight: 700, color: T.purple, marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}><Sparkles size={10} /> IA</div>}
              {m.role === "user"
                ? <div style={{ background: T.purple, color: "#fff", padding: "9px 13px", borderRadius: T.radiusInput, fontSize: 12.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{m.text}</div>
                : <AiMessage msg={m} onSaveFull={guardarComoCopy} onSaveSnippet={guardarSnippet} onEdit={(text) => editarMensaje(m.id, text)} />}
            </div>
          ))}
          {waitingReply && (
            <div style={{ alignSelf: "flex-start", maxWidth: "92%" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.purple, marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}><Sparkles size={10} /> IA</div>
              <div style={{ background: T.surfaceInset, padding: "9px 13px", borderRadius: T.radiusInput, display: "flex", alignItems: "center", gap: 4 }}>
                {[0, 1, 2].map(i => <span key={i} className="chat-typing-dot" style={{ width: 5, height: 5, borderRadius: "50%", background: T.purple, display: "inline-block" }} />)}
              </div>
            </div>
          )}
        </div>

        {/* Quick actions + input */}
        <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.borderSoft}`, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {QUICK_ACTIONS.map(qa => (
              <button key={qa.label} onClick={() => enviar(qa.prompt)} disabled={busy} style={{ padding: "5px 10px", borderRadius: T.radiusPill, border: `1px solid ${T.purpleLight}`, background: T.purpleBg, color: T.purple, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{qa.label}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input className="nodrag" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && enviar()} placeholder="Escribí tu mensaje…" style={{ flex: 1, padding: "9px 12px", fontSize: 12.5, border: `1.5px solid ${T.gray}`, borderRadius: T.radiusPill, fontFamily: font, color: T.navy, outline: "none" }} />
            <button onClick={() => enviar()} disabled={busy || !input.trim()} style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: T.purple, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: busy || !input.trim() ? 0.5 : 1, flexShrink: 0 }}><Send size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
