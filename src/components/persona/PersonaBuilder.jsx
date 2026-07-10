// PersonaBuilder.jsx — character builder de Personas, estilo "chat de Claude": arriba el
// perfil (head + nombre + género + edad), abajo un menú de secciones en texto libre guiadas
// por principios de copywriting directo, y opcionalmente una pestaña de Chat IA para construirla
// conversando (con documentos/links que el usuario ya tenga sobre su persona).
import { useRef, useState } from "react";
import { Camera, MessageCircle, ChevronDown, ChevronUp, Cloud } from "lucide-react";
import { PERSONA_GENDER_OPTIONS, PERSONA_AGE_OPTIONS, PERSONA_SECTIONS, AWARENESS_LEVELS, PERSONA_EMOJIS } from "@/lib/constants";
import { PERSONA_AVATAR_OPTIONS, personaAvatarSrc } from "@/lib/personaAvatars";
import { ChipIcon } from "@/lib/chipIcons.jsx";
import { T, font, fontDisplay } from "../compositor/ui.jsx";
import { InfoTooltip } from "../Tooltip.jsx";
import PersonaChatPanel from "./PersonaChatPanel.jsx";

export function PersonaAvatarDisplay({ avatar, size = 40 }) {
  if (avatar?.avatarImageKey) {
    return <img src={personaAvatarSrc(avatar.avatarImageKey)} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  }
  if (avatar?.avatarEmoji) {
    return <div style={{ width: size, height: size, borderRadius: "50%", background: T.purpleBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.55, flexShrink: 0 }}>{avatar.avatarEmoji}</div>;
  }
  return <img src={personaAvatarSrc("neutral")} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
}

function AvatarPicker({ form, setField, onClose }) {
  const [tab, setTab] = useState("heads");
  return (
    <div className="nodrag" style={{ position: "absolute", top: "100%", left: 0, marginTop: 8, zIndex: 20, width: 300, background: T.surface, border: `1px solid ${T.gray}`, borderRadius: T.radiusCard, boxShadow: T.shadowModal, padding: 14 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <button onClick={() => setTab("heads")} style={{ flex: 1, padding: "6px 0", borderRadius: T.radiusPill, border: `1.5px solid ${tab === "heads" ? T.purple : T.gray}`, background: tab === "heads" ? T.purpleBg : "transparent", color: tab === "heads" ? T.purple : T.slate, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>Heads</button>
        <button onClick={() => setTab("emoji")} style={{ flex: 1, padding: "6px 0", borderRadius: T.radiusPill, border: `1.5px solid ${tab === "emoji" ? T.purple : T.gray}`, background: tab === "emoji" ? T.purpleBg : "transparent", color: tab === "emoji" ? T.purple : T.slate, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>Emoji</button>
      </div>
      {tab === "heads" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, maxHeight: 260, overflowY: "auto" }} className="nowheel">
          {PERSONA_AVATAR_OPTIONS.map(o => (
            <div key={o.key} onClick={() => { setField("avatarImageKey", o.key); setField("avatarEmoji", ""); onClose(); }} title={o.label}
              style={{ cursor: "pointer", borderRadius: T.radiusInput, border: `2px solid ${form.avatarImageKey === o.key ? T.purple : "transparent"}`, overflow: "hidden", aspectRatio: "1" }}>
              <img src={personaAvatarSrc(o.key)} alt={o.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6, maxHeight: 260, overflowY: "auto" }} className="nowheel">
          {PERSONA_EMOJIS.map(e => (
            <div key={e} onClick={() => { setField("avatarEmoji", e); setField("avatarImageKey", ""); onClose(); }}
              style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, borderRadius: T.radiusInput, border: `2px solid ${form.avatarEmoji === e ? T.purple : T.gray}`, background: form.avatarEmoji === e ? T.purpleBg : T.surfaceInset, cursor: "pointer" }}>
              {e}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PillGroup({ options, value, onChange, customPlaceholder }) {
  const isCustom = !!value && !options.some(o => o.id === value);
  const [showCustom, setShowCustom] = useState(isCustom);
  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map(o => (
          <button key={o.id} onClick={() => { onChange(o.id); setShowCustom(false); }} style={{ padding: "5px 12px", borderRadius: T.radiusPill, border: `1.5px solid ${value === o.id ? T.purple : T.gray}`, background: value === o.id ? T.purpleBg : "transparent", color: value === o.id ? T.purple : T.slate, fontSize: 11.5, fontWeight: value === o.id ? 700 : 500, cursor: "pointer", fontFamily: font }}>
            {o.label}
          </button>
        ))}
        <button onClick={() => setShowCustom(v => !v)} style={{ padding: "5px 12px", borderRadius: T.radiusPill, border: `1.5px solid ${isCustom || showCustom ? T.purple : T.gray}`, background: isCustom || showCustom ? T.purpleBg : "transparent", color: isCustom || showCustom ? T.purple : T.slate, fontSize: 11.5, fontWeight: isCustom ? 700 : 500, cursor: "pointer", fontFamily: font }}>
            Otro…
        </button>
      </div>
      {(showCustom || isCustom) && (
        <input autoFocus={showCustom && !isCustom} value={isCustom ? value : ""} onChange={e => onChange(e.target.value)} placeholder={customPlaceholder}
          style={{ marginTop: 6, width: "100%", boxSizing: "border-box", padding: "7px 11px", fontSize: 12, border: `1.5px solid ${T.purple}`, borderRadius: T.radiusInput, fontFamily: font, color: T.navy, outline: "none" }} />
      )}
    </div>
  );
}

function SectionGuide({ section }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
      <span style={{ fontSize: 11.5, color: T.slate }}>¿Qué escribir acá?</span>
      <InfoTooltip
        title={section.label}
        align="left"
        text={
          <>
            {section.desc}
            {section.bullets?.length > 0 && (
              <ul style={{ margin: "6px 0 0", paddingLeft: 16 }}>
                {section.bullets.map((b, i) => <li key={i} style={{ marginBottom: 3 }}>{b}</li>)}
              </ul>
            )}
          </>
        }
      />
    </div>
  );
}

function TextArea({ value, onChange, placeholder, rows = 5 }) {
  return (
    <textarea value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width: "100%", boxSizing: "border-box", padding: "10px 13px", fontSize: 13, border: `1.5px solid ${T.gray}`, borderRadius: T.radiusInput, background: T.surfaceInset, color: T.navy, fontFamily: font, outline: "none", resize: "vertical", lineHeight: 1.55 }} />
  );
}

const EXTRA_FIELDS = [
  { key: "problema_principal", label: "Problema principal", ph: "Lo que más le frustra. Específico, no genérico." },
  { key: "antes", label: "Situación actual (con número)", ph: "Su \"antes\" cuantificado. Ej. \"cierra el mes en 15 días\"" },
  { key: "intentos_fallidos", label: "Intentos fallidos", ph: "Lo que ya intentó y no funcionó" },
  { key: "deseo_final", label: "Deseo final / transformación", ph: "En quién quiere convertirse, no qué quiere tener" },
  { key: "objeciones", label: "Principales objeciones", ph: "La razón #1 que la frena de comprar" },
  { key: "lenguaje", label: "Cómo habla de su problema", ph: "Las palabras EXACTAS que usa — no jerga de marketing" },
  { key: "vocabulario", label: "Vocabulario / frases exactas", ph: "Frases textuales que repite sobre su situación" },
  { key: "solucion_fallida", label: "Solución fallida específica", ph: "Qué producto/método ya probó y por qué no funcionó" },
];

export default function PersonaBuilder({ form, setForm, compact = false, apiKey, notify, busy, setBusy }) {
  const [showPicker, setShowPicker] = useState(false);
  const [tab, setTab] = useState("comportamiento");
  const [chatOpen, setChatOpen] = useState(false);
  const chatRef = useRef(null);
  function openPersonaChat() {
    setChatOpen(true);
    setTimeout(() => chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }
  const tabs = [...PERSONA_SECTIONS, { key: "detalles", emoji: "📋", label: "Detalles" }];

  function setField(key, value) { setForm(p => ({ ...p, [key]: value })); }
  function onApplyToField(field, text) {
    setForm(p => ({ ...p, [field]: p[field]?.trim() ? `${p[field]}\n\n${text}` : text }));
    notify?.("Guardado ✓");
  }

  const activeSection = PERSONA_SECTIONS.find(s => s.key === tab);

  return (
    <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : chatOpen ? "190px minmax(320px, 1fr) minmax(320px, 400px)" : "190px minmax(0, 760px)", gap: 16, alignItems: "stretch", width: "100%", maxWidth: chatOpen ? 1180 : 966, boxSizing: "border-box" }}>
      {/* Navegación izquierda */}
      <aside style={{ background: T.surface, border: `1px solid ${T.gray}`, borderRadius: T.radiusCard, padding: 12, boxShadow: T.shadowCard, alignSelf: "start", minWidth: 0, position: compact ? "static" : "sticky", top: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, minWidth: 0 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div onClick={() => setShowPicker(v => !v)} style={{ position: "relative", cursor: "pointer" }} title="Cambiar avatar">
              <PersonaAvatarDisplay avatar={form} size={52} />
              <div style={{ position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderRadius: "50%", background: T.purple, border: `2px solid ${T.surface}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Camera size={10} color="#fff" />
              </div>
            </div>
            {showPicker && <AvatarPicker form={form} setField={setField} onClose={() => setShowPicker(false)} />}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: T.navy, fontFamily: fontDisplay, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{form.nombre || "Nueva persona"}</div>
            <div style={{ fontSize: 11, color: T.slate }}>{form.avatarAgeRange || "Edad"} · {form.avatarGender || "Género"}</div>
          </div>
        </div>

        <button onClick={openPersonaChat} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 11px", marginBottom: 12, borderRadius: T.radiusInput, border: `1.5px solid ${T.purpleLight}`, background: chatOpen ? T.purple : T.purpleBg, color: chatOpen ? "#fff" : T.purple, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: font, justifyContent: "center" }}>
          <Cloud size={15}/> Chat con tu Persona
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 10px", borderRadius: T.radiusInput, border: `1.5px solid ${tab === t.key ? T.purple : "transparent"}`, background: tab === t.key ? T.purpleBg : "transparent", color: tab === t.key ? T.purple : T.slate, fontSize: 12.5, fontWeight: tab === t.key ? 800 : 600, cursor: "pointer", fontFamily: font, textAlign: "left" }}>
              {t.iconKey ? <ChipIcon type={t.iconKey} size={15} /> : <span style={{ width: 15, textAlign: "center" }}>{t.emoji}</span>}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Contenido principal */}
      <main style={{ background: T.surface, border: `1px solid ${T.gray}`, borderRadius: T.radiusCard, padding: 18, boxShadow: T.shadowCard, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input value={form.nombre || ""} onChange={e => setField("nombre", e.target.value)} placeholder="Nombre de la persona — ej. Marcela, dueña de restaurante"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 13px", fontSize: 14.5, fontWeight: 800, border: `1.5px solid ${T.gray}`, borderRadius: T.radiusInput, background: T.surfaceInset, color: T.navy, fontFamily: fontDisplay, outline: "none" }} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: T.slate, marginBottom: 6 }}>Género</div>
            <PillGroup options={PERSONA_GENDER_OPTIONS} value={form.avatarGender} onChange={v => setField("avatarGender", v)} customPlaceholder="Escribí tu propia respuesta…" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: T.slate, marginBottom: 6 }}>Rango de edad</div>
            <PillGroup options={PERSONA_AGE_OPTIONS} value={form.avatarAgeRange} onChange={v => setField("avatarAgeRange", v)} customPlaceholder="Ej. adolescente, 15-17…" />
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${T.borderSoft}`, paddingTop: 14 }}>
          {activeSection && activeSection.key !== "conciencia" && (
            <div>
              <SectionGuide section={activeSection} />
              <TextArea value={form[activeSection.key === "creencias" ? "creencia_falsa" : activeSection.key]} onChange={v => setField(activeSection.key === "creencias" ? "creencia_falsa" : activeSection.key, v)} placeholder={activeSection.placeholder} rows={compact ? 5 : 8} />
            </div>
          )}

          {tab === "conciencia" && (() => {
            const section = PERSONA_SECTIONS.find(s => s.key === "conciencia");
            return (
              <div>
                <SectionGuide section={section} />
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {AWARENESS_LEVELS.map(a => {
                    const sel = form.nivel_conciencia === a.id;
                    return (
                      <button key={a.id} onClick={() => setField("nivel_conciencia", a.id)} style={{ padding: "8px 14px", fontSize: 12, borderRadius: 20, cursor: "pointer", fontFamily: font, border: `2px solid ${sel ? a.color : T.gray}`, background: sel ? a.bg : "transparent", color: sel ? a.color : T.slate, fontWeight: sel ? 700 : 400 }}>
                        {a.label}
                      </button>
                    );
                  })}
                </div>
                <TextArea value={form.conciencia_detalle} onChange={v => setField("conciencia_detalle", v)} placeholder={section.placeholder} rows={compact ? 4 : 6} />
              </div>
            );
          })()}

          {tab === "detalles" && (
            <div>
              <div style={{ fontSize: 12.5, color: T.slate, marginBottom: 12 }}>Campos adicionales para afinar aún más el copy — opcionales, pero suman.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {EXTRA_FIELDS.map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: T.navy, marginBottom: 5 }}>{f.label}</div>
                    <TextArea value={form[f.key]} onChange={v => setField(f.key, v)} placeholder={f.ph} rows={3} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {!compact && chatOpen && (
        <aside ref={chatRef} style={{ background: T.surface, border: `1px solid ${T.gray}`, borderRadius: T.radiusCard, padding: 14, boxShadow: T.shadowCard, minWidth: 0, alignSelf: "stretch", maxHeight: "calc(100vh - 160px)", overflow: "hidden", display: "flex", flexDirection: "column", position: "sticky", top: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.purple, fontWeight: 800, fontSize: 13 }}><Cloud size={16}/> Chat con tu Persona</div>
            <button onClick={() => setChatOpen(false)} style={{ border: "none", background: "transparent", color: T.slate, cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            <PersonaChatPanel form={form} onApplyToField={onApplyToField} updateFormField={setField} notify={notify} apiKey={apiKey} busy={busy} setBusy={setBusy} />
          </div>
        </aside>
      )}
    </div>
  );
}

