// OfertaCreator.jsx — crear/editar una oferta con formulario compacto y chat lateral.
import { useRef, useState } from "react";
import { Cloud } from "lucide-react";
import { uid } from "@/lib/utils";
import { Btn, Inp, T, font, fontDisplay } from "./ui.jsx";
import OfertaChatPanel from "@/components/persona/OfertaChatPanel.jsx";
import navOfertaIcon from "@/assets/icons/offer-gift-clean.png";

export default function OfertaCreator({ initial, onSave, onCancel, notify, apiKey, busy, setBusy }) {
  const [form, setForm] = useState({ id: uid(), nombre: "", descripcion: "", precio: "", resultado: "", tiempo: "", antes: "", despues: "", garantia: "", restriccion: "", ...(initial || {}) });
  const [chatOpen, setChatOpen] = useState(false);
  const chatRef = useRef(null);

  function openOfferChat() {
    setChatOpen(true);
    setTimeout(() => chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function setField(key, value) { setForm(p => ({ ...p, [key]: value })); }
  function onApplyToField(field, text) {
    setForm(p => ({ ...p, [field]: p[field]?.trim() ? `${p[field]}\n\n${text}` : text }));
  }
  function guardar() {
    if (!form.nombre.trim()) return;
    onSave({ ...form, nombre: form.nombre.trim() });
  }

  const isEditing = !!initial?.id;

  return (
    <div className="offer-creator-layout" style={{ gridTemplateColumns: chatOpen ? "190px minmax(320px, 1fr) minmax(320px, 400px)" : "190px minmax(0, 760px)", maxWidth: chatOpen ? 1180 : 966 }}>
      <aside style={{ background: T.surface, border: `1px solid ${T.gray}`, borderRadius: T.radiusCard, padding: 12, boxShadow: T.shadowCard, alignSelf: "start", minWidth: 0, position: "sticky", top: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, minWidth: 0 }}>
          <img src={navOfertaIcon} alt="" style={{ width: 52, height: 52, objectFit: "contain", imageRendering: "pixelated", flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: T.navy, fontFamily: fontDisplay, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{form.nombre || (isEditing ? "Editar oferta" : "Nueva oferta")}</div>
            <div style={{ fontSize: 11, color: T.slate }}>{form.precio || "Sin precio"}</div>
          </div>
        </div>

        <button onClick={openOfferChat} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "9px 11px", marginBottom: 12, borderRadius: T.radiusInput, border: `1.5px solid ${T.purpleLight}`, background: chatOpen ? T.purple : T.purpleBg, color: chatOpen ? "#fff" : T.purple, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: font }}>
          <Cloud size={15}/> Chat con tu oferta
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {["Oferta", "Valor", "Prueba", "Urgencia"].map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: T.radiusInput, background: i === 0 ? T.purpleBg : "transparent", color: i === 0 ? T.purple : T.slate, fontSize: 12.5, fontWeight: i === 0 ? 800 : 600 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: i === 0 ? T.purple : T.gray }} /> {label}
            </div>
          ))}
        </div>
      </aside>

      <main style={{ background: T.surface, border: `1px solid ${T.gray}`, borderRadius: T.radiusCard, padding: 18, boxShadow: T.shadowCard, minWidth: 0 }}>
        <Inp label="Nombre de la oferta *" value={form.nombre} onChange={e => setField("nombre", e.target.value)} placeholder="ej. 'Remodelación exprés'" autoFocus />
        <Inp label="Descripción" multiline rows={3} value={form.descripcion} onChange={e => setField("descripcion", e.target.value)} placeholder="Qué es, qué incluye" />
        <div className="offer-creator-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Inp label="Precio" value={form.precio} onChange={e => setField("precio", e.target.value)} placeholder="$1,200" />
          <Inp label="Tiempo al resultado" value={form.tiempo} onChange={e => setField("tiempo", e.target.value)} placeholder="18 días" />
        </div>
        <Inp label="Resultado principal" value={form.resultado} onChange={e => setField("resultado", e.target.value)} placeholder="La transformación" />
        <div className="offer-creator-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Inp label="Antes" value={form.antes} onChange={e => setField("antes", e.target.value)} placeholder="Situación actual (con número)" />
          <Inp label="Después" value={form.despues} onChange={e => setField("despues", e.target.value)} placeholder="Situación con la oferta" />
        </div>
        <Inp label="Garantía" value={form.garantia} onChange={e => setField("garantia", e.target.value)} placeholder="Devolución si no funciona" />
        <Inp label="Restricción / urgencia real" value={form.restriccion} onChange={e => setField("restriccion", e.target.value)} placeholder="Cupos limitados, fecha límite" />

        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <Btn variant="primary" onClick={guardar} disabled={!form.nombre.trim()}>{isEditing ? "Guardar cambios" : "Crear oferta"}</Btn>
          <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
        </div>
      </main>

      {chatOpen && (
        <aside ref={chatRef} style={{ background: T.surface, border: `1px solid ${T.gray}`, borderRadius: T.radiusCard, padding: 14, boxShadow: T.shadowCard, minWidth: 0, alignSelf: "stretch", maxHeight: "calc(100vh - 150px)", overflow: "hidden", display: "flex", flexDirection: "column", position: "sticky", top: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.purple, fontWeight: 800, fontSize: 13 }}><Cloud size={16}/> Chat con tu oferta</div>
            <button onClick={() => setChatOpen(false)} style={{ border: "none", background: "transparent", color: T.slate, cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            <OfertaChatPanel form={form} onApplyToField={onApplyToField} updateFormField={setField} notify={notify} apiKey={apiKey} busy={busy} setBusy={setBusy} />
          </div>
        </aside>
      )}
    </div>
  );
}
