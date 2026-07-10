// EntityChatPanel.jsx — chat compartido para "construir con IA" (Persona/Oferta): un botón "+"
// estilo Claude/GPT para adjuntar material (en vez de una lista de botones a la izquierda),
// "Ayudame a crear desde cero" para arrancar una entrevista guiada, y botones "Guardar en →"
// en cada respuesta de la IA para mandar el texto directo a un campo del formulario.
import { useRef, useState } from "react";
import { FileText, Mic, Video, Link2, Type, X, Send, Sparkles, ChevronDown, Plus, Wand2 } from "lucide-react";
import { uid } from "@/lib/utils";
import { extractPdfText } from "@/lib/pdf";
import { extractXlsxText, extractDocxText, isSpreadsheet, isWordDoc } from "@/lib/docParse";
import { ingestLink, isBackendSupportedPlatform } from "@/lib/ingest";
import { callClaude } from "@/lib/ai";
import { T, font } from "../compositor/ui.jsx";

const KIND_ICON = { doc: <FileText size={12} />, voz: <Mic size={12} />, video: <Video size={12} />, link: <Link2 size={12} />, texto: <Type size={12} /> };
const OPCIONES = [
  { kind: "doc", label: "Documento", icon: <FileText size={14} /> },
  { kind: "link", label: "Link", icon: <Link2 size={14} /> },
  { kind: "texto", label: "Pegar texto", icon: <Type size={14} /> },
  { kind: "voz", label: "Nota de voz", icon: <Mic size={14} /> },
  { kind: "video", label: "Video", icon: <Video size={14} /> },
];

export default function EntityChatPanel({ form, onApplyToField, updateFormField, notify, apiKey, busy, setBusy, saveTargets, buildSummary, systemIntro, emptyHint, kickoffMessage, costLabel }) {
  const [input, setInput] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [open, setOpen] = useState(null);
  const [textDraft, setTextDraft] = useState("");
  const [linkDraft, setLinkDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef(null);
  const docRef = useRef(null), voiceRef = useRef(null), videoRef = useRef(null);
  const messages = form.chatHistory || [];
  const fuentes = form.fuentes || [];

  function setMessages(next) { updateFormField("chatHistory", next); }
  function addFuente(s) { updateFormField("fuentes", [...fuentes, { id: uid(), ...s }]); }
  function removeFuente(id) { updateFormField("fuentes", fuentes.filter(f => f.id !== id)); }

  // Documentos largos (o textos pegados a mano) se resumen con Haiku antes de guardarse como
  // fuente — si el original quedara pegado tal cual, se reenviaría completo en cada mensaje
  // futuro del chat (el "riesgo silencioso" de contexto que se infla sin que se note).
  const DISTILL_THRESHOLD = 3000;
  async function distillIfLong(text, sourceLabel) {
    if (text.length <= DISTILL_THRESHOLD) return text;
    try {
      return await callClaude(
        `Leé el siguiente documento y extraé SOLO la información puntual y más importante para completar un perfil de marca/negocio (qué hace, a quién le vende, propuesta de valor, tono, datos concretos). Sé conciso — no más de ~800 palabras, sin relleno ni repetir el original.\n\nDOCUMENTO:\n${text.slice(0, 60000)}`,
        apiKey, 900, `Resumir: ${sourceLabel}`, null, "doc",
      );
    } catch {
      return text.slice(0, DISTILL_THRESHOLD); // si falla el resumen, al menos no mandamos todo
    }
  }

  async function handleDoc(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const name = file.name.toLowerCase();
      const rawText = name.endsWith(".pdf") ? await extractPdfText(file)
        : isSpreadsheet(name) ? await extractXlsxText(file)
        : isWordDoc(name) ? await extractDocxText(file)
        : await file.text();
      const text = await distillIfLong(rawText, file.name);
      addFuente({ kind: "doc", label: file.name, text });
      notify?.(`"${file.name}" agregado ✓`);
    } catch (err) { notify?.("No se pudo leer el archivo: " + (err?.message || "")); }
    setUploading(false); e.target.value = ""; setShowUpload(false);
  }
  function handleMediaFile(e, kind) {
    const file = e.target.files?.[0]; if (!file) return;
    addFuente({ kind, label: file.name });
    notify?.(`"${file.name}" agregado ✓ (sin transcribir todavía)`);
    e.target.value = ""; setShowUpload(false);
  }
  async function handleLink() {
    if (!linkDraft.trim()) return;
    const url = linkDraft.trim();
    if (isBackendSupportedPlatform(url)) {
      setUploading(true);
      try {
        const result = await ingestLink(url);
        if (result.status === "done") {
          const text = await distillIfLong(result.text || "", url);
          addFuente({ kind: "link", label: url, text });
          notify?.("Transcripción agregada ✓");
        } else {
          addFuente({ kind: "link", label: url });
          notify?.("No se pudo traer la transcripción — el link quedó como referencia. " + (result.error || ""));
        }
      } catch (err) {
        addFuente({ kind: "link", label: url });
        notify?.("No se pudo traer la transcripción — el link quedó como referencia. " + (err?.message || ""));
      }
      setUploading(false);
    } else {
      addFuente({ kind: "link", label: url });
      notify?.("Link agregado ✓");
    }
    setLinkDraft(""); setOpen(null); setShowUpload(false);
  }
  async function handleText() {
    if (!textDraft.trim()) return;
    const raw = textDraft.trim();
    const label = raw.slice(0, 40) + (raw.length > 40 ? "…" : "");
    setUploading(true);
    const text = await distillIfLong(raw, label);
    setUploading(false);
    addFuente({ kind: "texto", label, text });
    setTextDraft(""); setOpen(null); setShowUpload(false);
  }
  function handleOptionClick(kind) {
    if (kind === "doc") docRef.current?.click();
    else if (kind === "voz") voiceRef.current?.click();
    else if (kind === "video") videoRef.current?.click();
    else setOpen(open === kind ? null : kind);
  }

  async function enviar(texto) {
    const t = (texto ?? input).trim();
    if (!t || busy) return;
    const nextMsgs = [...messages, { id: uid(), role: "user", text: t }];
    setMessages(nextMsgs);
    setInput("");
    setBusy(true);
    try {
      const fuentesCtx = fuentes.filter(f => f.text).length
        ? `\n\nMATERIAL QUE EL USUARIO YA TIENE:\n${fuentes.filter(f => f.text).map(f => `[${f.label}]\n${f.text}`).join("\n\n").slice(0, 6000)}`
        : "";
      const historial = messages.map(m => `${m.role === "user" ? "Usuario" : "IA"}: ${m.text}`).join("\n\n");
      const prompt = `${systemIntro}\n\nESTADO ACTUAL (lo que ya está completado):\n${buildSummary(form)}${fuentesCtx}\n\n${historial ? `HISTORIAL DEL CHAT:\n${historial}\n\n` : ""}MENSAJE NUEVO DEL USUARIO: "${t}"\n\nRespondé siempre en español, texto plano sin JSON, puede tener viñetas cortas.`;
      // "setup" -> Haiku en el backend (más barato, es una conversación guiada para llenar
      // campos, no la redacción final del anuncio).
      const raw = await callClaude(prompt, apiKey, 1800, costLabel, null, "setup");
      setMessages([...nextMsgs, { id: uid(), role: "ai", text: raw }]);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
    } catch (e) { notify?.("Error: " + (e?.message || "intentá de nuevo")); }
    setBusy(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 480, background: T.surface, border: `1.5px solid ${T.gray}`, borderRadius: T.radiusCard, boxShadow: T.shadowCard, overflow: "hidden", fontFamily: font }}>
      {/* Ayudame a crear desde cero */}
      <div style={{ padding: "10px 14px", background: T.surfaceInset, borderBottom: `1px solid ${T.borderSoft}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: T.navy, fontWeight: 500 }}>Chateá para completar los campos, o adjuntá con "+"</span>
        <button onClick={() => enviar(kickoffMessage)} disabled={busy} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: T.radiusPill, border: "none", background: T.purple, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}>
          <Wand2 size={12} /> Ayudame a crear desde cero
        </button>
      </div>

      {/* Mensajes */}
      <div ref={scrollRef} className="nowheel" style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {!messages.length && (
          <div style={{ fontSize: 12.5, color: T.navy, opacity: 0.65, textAlign: "center", marginTop: 30, lineHeight: 1.6, maxWidth: 340, marginLeft: "auto", marginRight: "auto" }}>
            {emptyHint}
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%" }}>
            {m.role === "ai" && <div style={{ fontSize: 10, fontWeight: 700, color: T.purple, marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}><Sparkles size={10} /> IA</div>}
            <div style={{ background: m.role === "user" ? T.purple : T.surfaceInset, color: m.role === "user" ? "#fff" : T.navy, padding: "9px 13px", borderRadius: T.radiusInput, fontSize: 12.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{m.text}</div>
            {m.role === "ai" && <SaveToSection text={m.text} onApplyToField={onApplyToField} saveTargets={saveTargets} />}
          </div>
        ))}
      </div>

      {/* Fuentes adjuntas */}
      {fuentes.length > 0 && (
        <div className="nowheel" style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "8px 14px 0", flexShrink: 0 }}>
          {fuentes.map(f => (
            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: T.radiusPill, border: `1px solid ${T.gray}`, background: T.surfaceInset, fontSize: 10.5, color: T.navy }}>
              <span style={{ color: T.purple, display: "flex" }}>{KIND_ICON[f.kind]}</span>
              <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.label}</span>
              <X size={10} style={{ cursor: "pointer", color: T.slate }} onClick={() => removeFuente(f.id)} />
            </div>
          ))}
        </div>
      )}

      {/* Input + "+" para adjuntar (estilo Claude/GPT) */}
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.borderSoft}`, flexShrink: 0, position: "relative" }}>
        {showUpload && (
          <div className="nodrag" style={{ position: "absolute", bottom: "100%", left: 14, marginBottom: 8, width: 220, background: T.surface, border: `1px solid ${T.gray}`, borderRadius: T.radiusCard, boxShadow: T.shadowModal, padding: 8, zIndex: 30 }}>
            {OPCIONES.map(o => (
              <div key={o.kind}>
                <div onClick={() => handleOptionClick(o.kind)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: T.radiusInput, cursor: "pointer", fontSize: 12.5, color: T.navy }}
                  onMouseEnter={e => e.currentTarget.style.background = T.purpleBg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ color: T.purple, display: "flex" }}>{o.icon}</span>
                  {uploading && o.kind === "doc" ? "Leyendo…" : o.label}
                </div>
                {o.kind === "link" && open === "link" && (
                  <div style={{ display: "flex", gap: 5, padding: "0 8px 8px" }}>
                    <input value={linkDraft} onChange={e => setLinkDraft(e.target.value)} placeholder="URL…" style={{ flex: 1, minWidth: 0, padding: "6px 8px", fontSize: 11, border: `1.5px solid ${T.gray}`, borderRadius: T.radiusInput, fontFamily: font, color: T.navy, outline: "none" }} />
                    <button onClick={handleLink} disabled={uploading || !linkDraft.trim()} style={{ padding: "0 9px", borderRadius: T.radiusInput, border: "none", background: T.purple, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+</button>
                  </div>
                )}
                {o.kind === "texto" && open === "texto" && (
                  <div style={{ padding: "0 8px 8px" }}>
                    <textarea value={textDraft} onChange={e => setTextDraft(e.target.value)} rows={3} placeholder="Pegá notas, entrevistas…" style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", fontSize: 11, border: `1.5px solid ${T.purple}`, borderRadius: T.radiusInput, fontFamily: font, color: T.navy, resize: "vertical", outline: "none", marginBottom: 5 }} />
                    <button onClick={handleText} disabled={!textDraft.trim()} style={{ width: "100%", padding: "5px 0", borderRadius: T.radiusInput, border: "none", background: T.purple, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Agregar</button>
                  </div>
                )}
              </div>
            ))}
            <input ref={docRef} type="file" accept=".txt,.pdf,.xlsx,.xls,.docx" style={{ display: "none" }} onChange={handleDoc} />
            <input ref={voiceRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={e => handleMediaFile(e, "voz")} />
            <input ref={videoRef} type="file" accept="video/*" style={{ display: "none" }} onChange={e => handleMediaFile(e, "video")} />
          </div>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setShowUpload(v => !v)} title="Adjuntar" className="nodrag" style={{ width: 34, height: 34, borderRadius: "50%", border: `1.5px solid ${T.gray}`, background: T.surfaceInset, color: T.navy, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><Plus size={16} /></button>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && enviar()} placeholder="Escribí tu mensaje…" style={{ flex: 1, padding: "9px 12px", fontSize: 12.5, border: `1.5px solid ${T.gray}`, borderRadius: T.radiusPill, fontFamily: font, color: T.navy, outline: "none" }} />
          <button onClick={() => enviar()} disabled={busy || !input.trim()} style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: T.purple, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: busy || !input.trim() ? 0.5 : 1, flexShrink: 0 }}><Send size={14} /></button>
        </div>
      </div>
    </div>
  );
}

function SaveToSection({ text, onApplyToField, saveTargets }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 5, position: "relative" }}>
      <button onClick={() => setOpen(v => !v)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: T.slate, fontSize: 10.5, padding: 0 }}>
        Guardar en… <ChevronDown size={11} />
      </button>
      {open && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
          {saveTargets.map(s => (
            <button key={s.field} onClick={() => { onApplyToField(s.field, text); setOpen(false); }} style={{ padding: "4px 9px", borderRadius: T.radiusPill, border: `1px solid ${T.purpleLight}`, background: T.purpleBg, color: T.purple, fontSize: 10.5, fontWeight: 600, cursor: "pointer" }}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
