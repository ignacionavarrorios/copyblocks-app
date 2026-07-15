// @ts-nocheck
// Flowi AI — app principal (sistema Copy Blocks)
import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { Home, Users, Library, Lightbulb, Layers, FileText, Trophy, FileInput, Building2, Tag, MessageCircle, ChevronUp, ChevronDown, Cloud, CreditCard, KeyRound, ShieldCheck, LogOut, Mail, Crown, Rocket, Gem, UserCircle, LockKeyhole, Zap, Eye, EyeOff, Globe2, Camera, ArrowUpCircle, Check } from "lucide-react";
import { PERSONA_AVATAR_OPTIONS, personaAvatarSrc } from "@/lib/personaAvatars";
import { supabase } from "./supabase";
import { uid, extractJSON } from "@/lib/utils"
import { T, font, fontDisplay, fontMono, TIPOS, FUNCIONES, FL, FC, ANGULOS, ESTILOS, BLOCK_FORMATS, HOOK_BLOCK_TYPES, HOOK_TYPE_FORMATS, VIDEO_PROD_FORMATS, AWARENESS_LEVELS, TRAFFIC_TEMPS, SUBCOMPONENTS, STORAGE_KEY, HOOK_FRAMEWORKS, TIPOS_BLOQUE, DEMO_BRAND, CUSTOM_FORMAT, ANGULOS_RAPIDO, ANGULO_HOOK_TIPO, PERSONA_EMOJIS } from "@/lib/constants"
import { COPY_BRAIN, perfilCtx, bancoCtx } from "@/lib/prompts"
import type { Bloque } from "@/lib/prompts"
import { callClaude, BACKEND_URL } from "@/lib/ai"
import { bridgeLoad, bridgeSave } from "@/lib/bridge"
import { ingestLink } from "@/lib/ingest"
import { extractPdfText } from "@/lib/pdf"

// Mapea la industria libre de la marca a un vertical del banco de ejemplos (RAG).
function verticalDeIndustria(s?: string): string | undefined {
  s = (s || "").toLowerCase();
  if (/salud|cl[íi]nic|dental|m[ée]dic|health/.test(s)) return "health";
  if (/inmobil|propiedad|real ?estate|depto/.test(s)) return "real_estate";
  if (/saas|software|app|tecnolog|crm|plataforma/.test(s)) return "saas";
  if (/banc|fintech|finanz|cr[ée]dito|seguro|pago/.test(s)) return "fintech";
  if (/tienda|ecommerce|e-commerce|comercio|retail/.test(s)) return "ecommerce";
  if (/nutri|dieta|fitness|wellness|salud integral/.test(s)) return "nutrition";
  if (/legal|abogad|jur[íi]dic/.test(s)) return "legal";
  if (/curso|infoproduct|coach|mentor|academ|educac/.test(s)) return "infoproductos";
  return undefined;
}
const BLOQUE_DE_PASO: Record<string, Bloque> = {
  hook: "hook", hook_video: "hook", headline: "headline", pain: "pain",
  promise: "promise", proof: "proof", offer: "offer", curiosity: "curiosity",
  constraints: "constraints", conditions: "conditions", cta: "cta",
};
import { storage } from "@/lib/storage"
import OfertasScreen from "@/components/OfertasScreen"
import CompositorApp from "@/components/compositor/CompositorApp.jsx"
import PersonaBuilder, { PersonaAvatarDisplay } from "@/components/persona/PersonaBuilder.jsx"
import BrandChatPanel from "@/components/persona/BrandChatPanel.jsx"
import LandingPage from "@/components/LandingPage.jsx"
import { InfoTooltip } from "@/components/Tooltip.jsx"
import CatChatHelper from "@/components/CatChatHelper.jsx"
import roasAcademyLogo from "@/assets/icons/roas-academy-logo.png"
import homeBg from "@/assets/icons/home-bg-cabin-smoke.gif"
import loginHeroBg from "@/assets/icons/login-cabin-cat-sheep.png"
import loadingAnimation from "@/assets/icons/flowi-loading-animation.gif"
import { ChipIcon } from "@/lib/chipIcons.jsx"
import appLogo from "@/assets/icons/app-logo-v3.png"
import appLogoBlue from "@/assets/icons/app-logo-v3-blue.png"
import appLogoIndigo from "@/assets/icons/app-logo-v3-indigo.png"
import navMarcaIcon from "@/assets/icons/nav-marca-v3.png"
import navCompositorIcon from "@/assets/icons/composer-feather-clean.png"
import navBancoCopiesIcon from "@/assets/icons/nav-banco-copies-v3.png"
import blockPersonaIcon from "@/assets/icons/block-persona.png"
import blockOfertaIcon from "@/assets/icons/offer-gift-clean.png"
import planStarterIcon from "@/assets/icons/plan-starter-paper-plane.png"
import planRecommendedIcon from "@/assets/icons/plan-recommended-wizard-hat.png"
import planAgencyIcon from "@/assets/icons/plan-agency-crown.png"

const tp  = (id) => TIPOS.find(t => t.id === id) || TIPOS[0];

// ─── CUENTA — planes, países, métodos de pago ──────────────────────────────────
// Créditos/marcas acordados en la ficha técnica de precios — ver credit_ledger/user_credits
// en el backend, que usan estos mismos ids (free/early_member/starter/pro/agency).
const PLANS = [
  { id:"free", label:"Gratuito", price:0, credits:200, marcas:0, capacity:"Básico", note:"Probá Flowi con lo esencial — sin Marca, Persona ni Ofertas guardadas" },
  { id:"starter", label:"Starter", price:29, credits:800, marcas:1, capacity:"Medio", note:"Para emprendedores con una sola marca" },
  { id:"pro", label:"Recomendado", price:49, credits:1800, marcas:3, capacity:"Alto", note:"Para media buyers y freelancers con varios clientes" },
  { id:"agency", label:"Agencia", price:99, credits:4000, marcas:Infinity, capacity:"Ilimitado", note:"Marcas ilimitadas para escalar con tus clientes" },
];
// Secciones que la versión gratuita no incluye — se ven con candado en el sidebar y llevan
// a la pantalla de planes en vez de abrir la pantalla real. "reviews" gatea la opción de
// Google Reviews dentro del Cerebro (CerebroNode.jsx la debe consultar por separado, ya que
// no es una sección propia del sidebar).
const LOCKED_ON_FREE = new Set(["perfil", "personas", "ofertas", "prompts", "reviews"]);

const COUNTRIES = [
  { id:"BO", label:"Bolivia" }, { id:"AR", label:"Argentina" }, { id:"CL", label:"Chile" },
  { id:"CO", label:"Colombia" }, { id:"MX", label:"México" }, { id:"PE", label:"Perú" },
  { id:"EC", label:"Ecuador" }, { id:"PY", label:"Paraguay" }, { id:"UY", label:"Uruguay" },
  { id:"ES", label:"España" }, { id:"US", label:"Estados Unidos" }, { id:"OTHER", label:"Otro país" },
];
// Métodos disponibles según el país configurado — Bolivia usa rieles locales, el resto tarjeta.
const PAYMENT_METHODS_BY_COUNTRY = {
  BO: [
    { id:"qr_bo", label:"QR simple (Bolivia)" },
    { id:"tigo_money", label:"Tigo Money" },
    { id:"transferencia_bo", label:"Transferencia bancaria" },
  ],
  DEFAULT: [
    { id:"card", label:"Tarjeta de crédito / débito" },
    { id:"paypal", label:"PayPal" },
  ],
};
function paymentMethodsFor(countryId) {
  return PAYMENT_METHODS_BY_COUNTRY[countryId] || PAYMENT_METHODS_BY_COUNTRY.DEFAULT;
}

// ─── UI PRIMITIVES — Voltline-purple: pill shapes, hairline borders, halo de acento ──
function Btn({ variant="default", onClick, children, disabled, full, small, style={} }) {
  const base = { display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6, padding:small?"0 14px":"0 20px", height:small?34:42, fontSize:small?12:13, fontWeight:600, borderRadius:T.radiusPill, cursor:disabled?"not-allowed":"pointer", border:"1.5px solid", fontFamily:font, opacity:disabled?0.45:1, transition:"all 0.15s", whiteSpace:"nowrap", width:full?"100%":"auto", boxSizing:"border-box", ...style };
  const vs = {
    primary: { background:T.purple, color:"#fff", borderColor:T.purple, boxShadow:T.shadowAccent },
    navy:    { background:T.navy, color:"#fff", borderColor:T.navy },
    ghost:   { background:"transparent", color:T.slate, borderColor:"transparent" },
    outline: { background:"transparent", color:T.purple, borderColor:T.purpleLight },
    soft:    { background:T.purpleBg, color:T.purple, borderColor:T.purpleLight },
    danger:  { background:"transparent", color:T.red, borderColor:"#F5BCBC" },
    default: { background:T.surfaceInset, color:T.navy, borderColor:T.gray },
  };
  return <button style={{...base,...(vs[variant]||vs.default)}} onClick={disabled?undefined:onClick}>{children}</button>;
}

function Card({ children, style={} }) {
  return <div style={{ background:T.surface, borderRadius:T.radiusCard, border:`1px solid ${T.gray}`, padding:20, boxShadow:T.shadowCard, ...style }}>{children}</div>;
}

function Inp({ placeholder, value, onChange, label, hint, type="text", multiline, rows=3, autoFocus }) {
  const s = { width:"100%", boxSizing:"border-box", padding:"10px 14px", fontSize:13, border:`1.5px solid ${T.gray}`, borderRadius:T.radiusInput, background:T.surfaceInset, color:T.navy, fontFamily:font, outline:"none", resize:multiline?"vertical":"none", lineHeight:1.6 };
  return (
    <div style={{ marginBottom:16 }}>
      {label && <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.slate, marginBottom:6 }}>{label}</div>}
      {multiline ? <textarea style={s} placeholder={placeholder} value={value} onChange={onChange} rows={rows} autoFocus={autoFocus}/> : <input style={s} type={type} placeholder={placeholder} value={value} onChange={onChange} autoFocus={autoFocus}/>}
      {hint && <div style={{ fontSize:11, color:T.slate, marginTop:5 }}>{hint}</div>}
    </div>
  );
}

function Toast({ msg }) {
  return msg ? <div style={{ position:"fixed", bottom:24, right:24, background:T.navy, color:"#fff", padding:"12px 20px", borderRadius:T.radiusInput, fontSize:13, fontFamily:font, fontWeight:500, boxShadow:T.shadowModal, zIndex:9999 }}>{msg}</div> : null;
}

function Modal({ title, onClose, children, width=520 }) {
  return (
    <div className="fade-in" onMouseDown={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(11,16,32,0.72)", backdropFilter:"blur(2px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9000, padding:16 }}>
      <div className="card-pop-in" onMouseDown={e => e.stopPropagation()} style={{ background:T.surface, borderRadius:T.radiusCard, padding:28, width, maxWidth:"96vw", maxHeight:"90vh", overflowY:"auto", border:`1px solid ${T.gray}`, boxSizing:"border-box", boxShadow:T.shadowModal }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, paddingBottom:14, borderBottom:`1px solid ${T.borderSoft}` }}>
          <div style={{ fontSize:16, fontWeight:700, color:T.navy, fontFamily:fontDisplay, letterSpacing:"-0.01em" }}>{title}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:T.slate, fontSize:24, lineHeight:1, padding:0 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const TIPO_LABELS_ES = { pain:"Dolor", promise:"Promesa", proof:"Prueba", curiosity:"Curiosidad", constraints:"Frenos", conditions:"Condiciones", offer:"Oferta" };
function BlockBadge({ type, size="sm" }) {
  const t = T[type] || T.curiosity;
  return <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:size==="lg"?"4px 12px":"2px 9px", borderRadius:T.radiusPill, fontSize:size==="lg"?12:10, fontWeight:700, letterSpacing:"0.04em", background:t.bg, color:t.color, border:`1px solid ${t.border}`, whiteSpace:"nowrap", flexShrink:0 }}><span style={{ width:6, height:6, borderRadius:"50%", background:t.color, flexShrink:0 }}/>{TIPO_LABELS_ES[type] || type.charAt(0).toUpperCase()+type.slice(1)}</span>;
}

function FuncTag({ f }) {
  const c = FC[f] || T.slate;
  return <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:T.radiusPill, background:`${c}15`, color:c, border:`1px solid ${c}28`, whiteSpace:"nowrap" }}>{FL[f]||f}</span>;
}

function NavItem({ icon, label, badge, active, locked, onClick, title }) {
  return (
    <button onClick={onClick} title={title} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", padding:"9px 12px", marginBottom:2, border:"none", borderRadius:T.radiusInput, cursor:"pointer", background:active?`linear-gradient(120deg, ${T.purple}, #9B6BFF)`:"transparent", color:active?"#fff":locked?"rgba(255,255,255,0.32)":"rgba(255,255,255,0.55)", fontFamily:font, fontSize:13, fontWeight:active?600:400, textAlign:"left", transition:"all 0.15s", boxShadow:active?"0 4px 14px rgba(122,90,246,0.45)":"none" }}
      onMouseEnter={e=>{ if(!active) e.currentTarget.style.background="rgba(255,255,255,0.06)"; }}
      onMouseLeave={e=>{ if(!active) e.currentTarget.style.background="transparent"; }}>
      <span style={{ display:"flex", alignItems:"center", gap:9 }}>
        <span style={{ display:"flex", alignItems:"center", justifyContent:"center", width:16, flexShrink:0, opacity:active?1:0.75 }}>{icon}</span>
        {label}
      </span>
      {locked
        ? <LockKeyhole size={12} style={{ opacity:0.55, flexShrink:0 }}/>
        : (badge!=null && badge>0 && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:T.radiusPill, background:active?"rgba(255,255,255,0.22)":"rgba(255,255,255,0.12)", color:active?"#fff":"rgba(255,255,255,0.65)" }}>{badge}</span>)}
    </button>
  );
}

function ProgressBar({ value, max=100, color=T.purple }) {
  return <div style={{ height:6, borderRadius:T.radiusPill, background:T.gray, overflow:"hidden" }}><div style={{ height:"100%", width:`${(value/max)*100}%`, background:color, borderRadius:T.radiusPill, transition:"width 0.4s" }}/></div>;
}

function FlowiLoader({ label="Cargando Flowi…", floating=false, show=true }) {
  if (!show) return null;
  const content = (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:floating?"10px 14px":"18px 22px", borderRadius:floating?T.radiusPill:T.radiusCard, background:"rgba(255,255,255,0.88)", border:`1px solid ${T.borderSoft}`, boxShadow:floating?T.shadowHover:T.shadowModal, backdropFilter:"blur(8px)", color:T.navy, fontFamily:font }}>
      <img src={loadingAnimation} alt="" style={{ width:floating?34:56, height:floating?34:56, objectFit:"contain", imageRendering:"pixelated", flexShrink:0 }}/>
      <div>
        <div style={{ fontSize:floating?12:14, fontWeight:800, fontFamily:fontDisplay, letterSpacing:"-0.01em" }}>{label}</div>
        {!floating && <div style={{ fontSize:11.5, color:T.slate, marginTop:3 }}>Preparando tu espacio de copy.</div>}
      </div>
    </div>
  );
  if (floating) {
    return <div style={{ position:"fixed", right:22, bottom:22, zIndex:8500, pointerEvents:"none" }}>{content}</div>;
  }
  return <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:T.canvas, fontFamily:font }}>{content}</div>;
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
      <div>
        <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:T.navy, fontFamily:fontDisplay, letterSpacing:"-0.015em" }}>{title}</h2>
        {subtitle && <p style={{ margin:"5px 0 0", fontSize:13, color:T.slate, lineHeight:1.5 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function StatPill({ label, value, color=T.purple }) {
  return <div style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 13px", borderRadius:T.radiusPill, background:`${color}12`, border:`1px solid ${color}30` }}><span style={{ fontSize:15, fontWeight:700, color, fontFamily:fontMono }}>{value}</span><span style={{ fontSize:11, color:T.slate }}>{label}</span></div>;
}

/** Chip pill — selección de fórmulas/hooks/tags. Nuevo primitive Voltline-purple. */
function Chip({ children, selected, onClick, title, color=T.purple }) {
  return (
    <div onClick={onClick} title={title} style={{ padding:"6px 13px", borderRadius:T.radiusPill, border:`1.5px solid ${selected?color:T.gray}`, background:selected?`${color}14`:T.surface, cursor:onClick?"pointer":"default", fontSize:12, fontWeight:selected?700:500, color:selected?color:T.navy, transition:"all 0.12s", whiteSpace:"nowrap" }}>
      {children}
    </div>
  );
}

/** KPI tile — valor grande + label, con acento opcional. Nuevo primitive Voltline-purple. */
function KpiTile({ label, value, sub, accent }) {
  return (
    <div style={{ background:T.surface, borderRadius:T.radiusCard, border:`1px solid ${T.gray}`, padding:"16px 18px", boxShadow:T.shadowCard }}>
      <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:700, color:accent||T.navy, marginTop:6, fontFamily:fontMono, letterSpacing:"-0.01em" }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:T.slate, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function CopyBtn({ text, small }) {
  const [copied, setCopied] = useState(false);
  return <Btn variant="ghost" small={small} onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),1500); }}>{copied?"✓ Copiado":"Copiar"}</Btn>;
}



// ─── PROMPT CARD ──────────────────────────────────────────────────────────────
function PromptCard({ prompt, onEdit, onDelete }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{ background:hov?T.purpleBg:T.surface, borderTop:`1.5px solid ${hov?T.purpleLight:T.gray}`, borderRight:`1.5px solid ${hov?T.purpleLight:T.gray}`, borderBottom:`1.5px solid ${hov?T.purpleLight:T.gray}`, borderLeft:`4px solid ${T.purple}`, borderRadius:10, padding:"12px 14px", marginBottom:7, transition:"all 0.15s" }}>
      <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:5 }}>{prompt.nombre}</div>
          <p style={{ margin:0, fontSize:12.5, lineHeight:1.6, color:T.slate, whiteSpace:"pre-wrap" }}>{prompt.texto.slice(0,220)}{prompt.texto.length>220?"…":""}</p>
        </div>
        <div style={{ display:"flex", gap:4, flexShrink:0, opacity:hov?1:0.18, transition:"opacity 0.15s" }}>
          <Btn variant="ghost" small onClick={onEdit}>Editar</Btn>
          <Btn variant="danger" small onClick={onDelete}>✕</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── PROMPT FORM ──────────────────────────────────────────────────────────────
function PromptForm({ initial={}, onSave, onClose }) {
  const [form, setForm] = useState({ nombre:"", texto:"", ...initial });
  return (
    <div>
      <Inp label="Nombre" placeholder='ej. "Tono cercano y directo"' value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))} autoFocus />
      <Inp label="Prompt" multiline rows={6} placeholder='Instrucción de sistema — ej. "Siempre respondé en formato de lista." · "Nunca uses la palabra descuento."' value={form.texto} onChange={e=>setForm(p=>({...p,texto:e.target.value}))} />
      <div style={{ display:"flex", gap:8 }}>
        <Btn variant="primary" onClick={()=>onSave(form)} disabled={!form.nombre.trim()||!form.texto.trim()}>Guardar</Btn>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
      </div>
    </div>
  );
}

// ─── CONCEPT FORM ─────────────────────────────────────────────────────────────
function ConceptWizard({ initial={}, brand, onSave, onClose, updateBrand }) {
  const allAngles = [...ANGULOS, ...(brand?.customAngles||[])];
  const avatars = brand?.avatars || [];
  const isEditing = !!initial.id;

  const [step, setStep] = useState(isEditing ? 3 : 1);
  const [personaId, setPersonaId] = useState(initial.personaId || (avatars.length ? avatars[0].id : "custom"));
  const [personaDesc, setPersonaDesc] = useState(initial.personaDesc || "");
  const [angulo, setAngulo] = useState(initial.angulo || "");
  const [concepto, setConcepto] = useState(initial.concepto || "");
  const [showCustomAngle, setShowCustomAngle] = useState(false);
  const [customAngle, setCustomAngle] = useState({ label:"", desc:"", example:"" });

  const selAngle = allAngles.find(a=>(a.id||a.label)===angulo);
  const selAvatar = avatars.find(a=>a.id===personaId);
  const isCustomPersona = personaId === "custom";
  const personaLabel = isCustomPersona
    ? (personaDesc.trim() ? personaDesc.trim().slice(0,38) : "Persona personalizada")
    : (selAvatar?.name || "Selected avatar");

  function saveCustomAngle() {
    if (!customAngle.label.trim()) return;
    const newA = { id:uid(), ...customAngle };
    updateBrand(b=>({...b, customAngles:[...(b.customAngles||[]), newA]}));
    setAngulo(newA.id);
    setShowCustomAngle(false);
    setCustomAngle({ label:"", desc:"", example:"" });
  }

  function handleSave() {
    if (!concepto.trim()) return;
    onSave({
      concepto: concepto.trim(),
      angulo,
      personaId: isCustomPersona ? null : personaId,
      personaDesc: isCustomPersona ? personaDesc : (selAvatar?.name || ""),
      estilo: initial.estilo || "",
      hook: "",
    }, null, null);
  }

  const STEPS = [
    { n:1, label:"Persona" },
    { n:2, label:"Ángulo" },
    { n:3, label:"Idea" },
  ];

  const canNext1 = !isCustomPersona || personaDesc.trim().length > 5;
  const canNext2 = !!angulo;

  return (
    <div style={{ position:"fixed", inset:0, background:T.white, zIndex:9000, display:"flex", flexDirection:"column", fontFamily:font }}>
      {/* ── Top bar ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 28px", borderBottom:`1.5px solid ${T.gray}`, background:T.white, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          {STEPS.map((s,i)=>(
            <div key={s.n} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:26, height:26, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700,
                  background: step>s.n ? T.promise.color : step===s.n ? T.purple : T.gray,
                  color: step>=s.n ? "#fff" : T.slate, flexShrink:0 }}>
                  {step>s.n ? "✓" : s.n}
                </div>
                <span style={{ fontSize:12, fontWeight:step===s.n?700:400, color:step===s.n?T.navy:T.slate }}>{s.label}</span>
              </div>
              {i < STEPS.length-1 && <div style={{ width:28, height:1.5, background:step>s.n?T.promise.border:T.gray, margin:"0 2px" }}/>}
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:T.slate, fontSize:22, lineHeight:1, padding:"2px 8px", borderRadius:6 }}>×</button>
      </div>

      {/* ── Content ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"36px 28px 120px" }}>
        <div style={{ maxWidth:640, margin:"0 auto" }}>

          {/* Context pills shown on steps 2 & 3 */}
          {step > 1 && (
            <div style={{ display:"flex", gap:6, marginBottom:22, flexWrap:"wrap" }}>
              <span style={{ fontSize:11, padding:"4px 12px", borderRadius:20, background:T.purpleBg, color:T.purple, border:`1px solid ${T.purpleLight}`, fontWeight:600 }}>
                👤 {personaLabel}
              </span>
              {step > 2 && angulo && selAngle && (
                <span style={{ fontSize:11, padding:"4px 12px", borderRadius:20, background:T.grayLight, color:T.slate, border:`1px solid ${T.gray}`, fontWeight:600 }}>
                  📐 {selAngle.label}
                </span>
              )}
            </div>
          )}

          {/* ── STEP 1: PERSONA ── */}
          {step===1 && (
            <div>
              <div style={{ fontSize:24, fontWeight:800, color:T.navy, letterSpacing:"-0.03em", marginBottom:8 }}>¿Para quién es este anuncio?</div>
              <div style={{ fontSize:13, color:T.slate, marginBottom:28, lineHeight:1.6, maxWidth:500 }}>
                Cada anuncio habla a <strong>una persona</strong>. Cuanto más específico seas sobre quién es, más efectivo será el copy que generes.
              </div>

              {avatars.length > 0 && (
                <div style={{ marginBottom:24 }}>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.slate, marginBottom:12 }}>Tus personas guardadas</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:10 }}>
                    {avatars.map(av=>{
                      const sel = personaId===av.id;
                      return (
                        <div key={av.id} onClick={()=>{ setPersonaId(av.id); setPersonaDesc(""); }}
                          style={{ padding:"16px", borderRadius:12, cursor:"pointer", border:`2px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:T.white, transition:"all 0.12s" }}>
                          <div style={{ fontSize:13, fontWeight:700, color:sel?T.purple:T.navy, marginBottom:5 }}>{av.name}</div>
                          <div style={{ fontSize:11, color:T.slate, lineHeight:1.5, marginBottom:av.pains?8:0 }}>{av.desc}</div>
                          {av.pains && <div style={{ fontSize:11, color:T.pain.color, padding:"5px 8px", borderRadius:6, background:T.pain.bg, lineHeight:1.45 }}>💔 {av.pains.slice(0,100)}{av.pains.length>100?"…":""}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.slate, marginBottom:10 }}>
                  {avatars.length > 0 ? "O describe una persona rápida" : "Describe tu persona objetivo"}
                </div>
                <div onClick={()=>setPersonaId("custom")}
                  style={{ padding:"12px 16px", borderRadius:10, cursor:"pointer", border:`2px solid ${isCustomPersona?T.purple:T.gray}`, background:isCustomPersona?T.purpleBg:T.white, marginBottom:8, transition:"all 0.12s" }}>
                  <span style={{ fontSize:12, fontWeight:600, color:isCustomPersona?T.purple:T.slate }}>✎ Persona personalizada para este concepto</span>
                </div>
                {isCustomPersona && (
                  <textarea value={personaDesc} onChange={e=>setPersonaDesc(e.target.value)} autoFocus
                    placeholder="ej. Dueño de restaurante local en Cochabamba, 35-50 años, frustrado porque paga 30% de comisión a apps de delivery y los clientes no son suyos…"
                    style={{ width:"100%", boxSizing:"border-box", padding:"12px 14px", fontSize:13, border:`1.5px solid ${T.purple}`, borderRadius:9, fontFamily:font, color:T.navy, lineHeight:1.65, resize:"vertical", minHeight:90, outline:"none" }}
                  />
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2: ANGLE ── */}
          {step===2 && (
            <div>
              <div style={{ fontSize:24, fontWeight:800, color:T.navy, letterSpacing:"-0.03em", marginBottom:8 }}>¿Desde qué ángulo vas a contar esta historia?</div>
              <div style={{ fontSize:13, color:T.slate, marginBottom:28, lineHeight:1.6, maxWidth:500 }}>
                El ángulo es el lente con el que cuentas la idea. <strong>Mismo producto, diferente ángulo = anuncio completamente diferente.</strong>
              </div>

              <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:16 }}>
                {allAngles.map(a=>{
                  const id=a.id||a.label; const sel=angulo===id;
                  return (
                    <button key={id} onClick={()=>setAngulo(sel?"":id)}
                      style={{ padding:"8px 16px", fontSize:13, borderRadius:20, cursor:"pointer", fontFamily:font,
                        border:`1.5px solid ${sel?T.purple:T.gray}`,
                        background:sel?T.purple:"transparent",
                        color:sel?"#fff":T.slate,
                        fontWeight:sel?700:400, transition:"all 0.12s" }}>
                      {a.label}
                    </button>
                  );
                })}
                <button onClick={()=>setShowCustomAngle(v=>!v)}
                  style={{ padding:"8px 16px", fontSize:13, borderRadius:20, cursor:"pointer", fontFamily:font, border:`1.5px dashed ${T.gray}`, background:"transparent", color:T.slate }}>+ Personalizado</button>
              </div>

              {selAngle && (
                <div style={{ padding:"20px 22px", background:T.purpleBg, borderRadius:14, border:`1.5px solid ${T.purpleLight}`, marginBottom:16 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:T.purple, marginBottom:8 }}>{selAngle.label}</div>
                  <div style={{ fontSize:13, color:T.navy, lineHeight:1.65, marginBottom:14 }}>{selAngle.desc}</div>
                  {selAngle.example && (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.purple, opacity:0.7, marginBottom:5 }}>Ejemplo de hook</div>
                      <div style={{ fontSize:12, color:T.navy, fontStyle:"italic", padding:"8px 12px", background:"rgba(255,255,255,0.75)", borderRadius:8, lineHeight:1.6 }}>"{selAngle.example}"</div>
                    </div>
                  )}
                  {selAngle.adExample && (
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.purple, opacity:0.7, marginBottom:5 }}>Ejemplo de anuncio con este ángulo</div>
                      <div style={{ fontSize:12, color:T.navy, lineHeight:1.75, padding:"10px 14px", background:"rgba(255,255,255,0.75)", borderRadius:8, whiteSpace:"pre-wrap" }}>{selAngle.adExample}</div>
                    </div>
                  )}
                </div>
              )}

              {showCustomAngle && (
                <div style={{ padding:"18px", border:`1.5px solid ${T.gray}`, borderRadius:12, background:T.white, marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:14 }}>Crear ángulo personalizado</div>
                  <Inp label="Nombre" placeholder="ej. Revelación interna" value={customAngle.label} onChange={e=>setCustomAngle(p=>({...p,label:e.target.value}))}/>
                  <Inp label="Definición" placeholder="¿Qué es este ángulo?" value={customAngle.desc} onChange={e=>setCustomAngle(p=>({...p,desc:e.target.value}))}/>
                  <Inp label="Ejemplo de hook" placeholder="Una línea de ejemplo" value={customAngle.example} onChange={e=>setCustomAngle(p=>({...p,example:e.target.value}))}/>
                  <div style={{ display:"flex", gap:6 }}>
                    <Btn variant="soft" small onClick={saveCustomAngle} disabled={!customAngle.label.trim()}>Guardar y seleccionar</Btn>
                    <Btn variant="ghost" small onClick={()=>setShowCustomAngle(false)}>Cancelar</Btn>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: IDEA ── */}
          {step===3 && (
            <div>
              <div style={{ fontSize:24, fontWeight:800, color:T.navy, letterSpacing:"-0.03em", marginBottom:8 }}>¿Cuál es la única idea de este anuncio?</div>
              <div style={{ fontSize:13, color:T.slate, marginBottom:28, lineHeight:1.6, maxWidth:500 }}>
                Un concepto = una sola idea. Todo lo demás — hook, cuerpo, CTA — sirve a esta idea. Si no cabe en una oración, es más de uno.
              </div>
              <textarea value={concepto} onChange={e=>setConcepto(e.target.value)} autoFocus
                placeholder={`ej. La mayoría de ${brand?.industry||"negocios"} pierde clientes sin un sistema de pedidos propio — y ni siquiera lo sabe`}
                style={{ width:"100%", boxSizing:"border-box", padding:"16px", fontSize:14, border:`1.5px solid ${concepto.trim()?T.purple:T.gray}`, borderRadius:12, fontFamily:font, color:T.navy, lineHeight:1.75, resize:"vertical", minHeight:130, outline:"none", background:T.white, transition:"border-color 0.15s" }}
              />
              <div style={{ fontSize:11, color:T.slate, marginTop:8, lineHeight:1.5 }}>
                Tip: lo específico gana. "El 80% de clientes que pide por apps no vuelve a pedir directo" es mejor que "la fidelidad importa".
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, padding:"16px 28px", background:T.white, borderTop:`1.5px solid ${T.gray}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div>
          {step > 1 && <Btn variant="ghost" onClick={()=>setStep(s=>s-1)}>← Atrás</Btn>}
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          {step < 3 && (
            <Btn variant="primary" onClick={()=>setStep(s=>s+1)} disabled={step===1?!canNext1:!canNext2}>
              Siguiente →
            </Btn>
          )}
          {step===3 && (
            <Btn variant="primary" onClick={handleSave} disabled={!concepto.trim()}>
              {isEditing ? "Guardar cambios" : "Crear concepto"} ✓
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function PlanIcon({ plan="starter", size=28 }) {
  const cfg = {
    free: { img:null, icon:<Zap size={size}/>, bg:"#EEF5FF", color:"#4B7BFF" },
    starter: { img:planStarterIcon, bg:T.purpleBg, color:T.purple },
    pro: { img:planRecommendedIcon, bg:"#FFF6D8", color:"#C99112" },
    agency: { img:planAgencyIcon, bg:"#EAF8F7", color:"#149884" },
  }[plan] || { img:planStarterIcon, bg:T.purpleBg, color:T.purple };
  return (
    <div style={{ width:size+22, height:size+22, borderRadius:12, background:cfg.bg, color:cfg.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, overflow:"hidden" }}>
      {cfg.img ? <img src={cfg.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : cfg.icon}
    </div>
  );
}

function CreditsPanel({ stats }) {
  const pct = Math.min(100, Math.max(0, stats?.percent || 0));
  const remainingPct = Math.max(0, 100 - pct);
  const hasRealData = stats?.included != null;
  const remainingCredits = hasRealData ? Math.max(0, stats.included - Math.round((pct/100) * stats.included)) : null;
  return (
    <Card style={{ padding:18, minHeight:184 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:800, color:T.navy, fontFamily:fontDisplay }}>Uso de créditos</div>
          <div style={{ fontSize:11.5, color:T.slate, marginTop:2 }}>{hasRealData ? `${stats.balance} de ${stats.included} este mes` : "Porcentaje del periodo actual"}</div>
        </div>
        <div style={{ width:38, height:38, borderRadius:12, background:T.purpleBg, color:T.purple, display:"flex", alignItems:"center", justifyContent:"center" }}><CreditCard size={18}/></div>
      </div>
      <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:10 }}>
        <span style={{ fontSize:34, fontWeight:800, color:T.navy, fontFamily:fontMono }}>{remainingPct}%</span>
        <span style={{ fontSize:12, color:T.slate }}>disponible</span>
      </div>
      <ProgressBar value={pct} color={pct>82?"#D94F4F":pct>62?"#C99112":T.green}/>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:11.5, color:T.slate }}>
        <span>{pct}% usado</span>
        <span>100% mensual</span>
      </div>
    </Card>
  );
}

function DashboardScreen({ brand, assets, conceptos, onNavigate, creditStats }) {
  const completion = brand?.perfil ? Math.round(Object.values(brand.perfil).filter(Boolean).length / 7 * 100) : 0;
  const actions = [
    {icon:navBancoCopiesIcon, iconSize:36, label:"Banco de copies", desc:"Copies guardados", screen:"banco-copies"},
    {icon:navCompositorIcon, iconSize:42, label:"Compositor", desc:"Flujo de anuncio", screen:"meta-ad"},
    {icon:blockPersonaIcon, iconSize:36, label:"Personas", desc:"Avatares y perfiles", screen:"personas"},
    {icon:blockOfertaIcon, iconSize:42, label:"Ofertas", desc:"Oferta irresistible", screen:"ofertas"},
  ];

  return (
    <div style={{ maxWidth:1100 }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:T.navy, letterSpacing:"-0.03em", fontFamily:fontDisplay }}>¿Qué vamos a crear hoy?</h1>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"minmax(500px, 620px) 320px", gap:16, alignItems:"start" }}>
        <div>
          {completion < 80 && (
            <Card style={{ marginBottom:12, padding:"12px 14px", borderLeft:`4px solid ${T.purple}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", gap:12, alignItems:"center", marginBottom:8 }}>
                <div><div style={{ fontSize:12.5, fontWeight:800, color:T.navy }}>Completa tu perfil de marca</div><div style={{ fontSize:11.5, color:T.slate }}>Más contexto = mejores outputs.</div></div>
                <Btn variant="soft" small onClick={()=>onNavigate("perfil")}>Completar</Btn>
              </div>
              <ProgressBar value={completion}/>
            </Card>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))", gap:12 }}>
            {actions.map(a=>(
              <button key={a.label} onClick={()=>onNavigate(a.screen)} style={{ minHeight:118, background:T.surface, borderRadius:T.radiusCard, border:`1px solid ${T.gray}`, padding:"16px 18px", cursor:"pointer", boxShadow:T.shadowCard, transition:"all 0.15s", textAlign:"left", fontFamily:font }} onMouseEnter={e=>{e.currentTarget.style.borderColor=T.purpleLight;e.currentTarget.style.boxShadow=T.shadowHover;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.gray;e.currentTarget.style.boxShadow=T.shadowCard;}}>
                <img src={a.icon} alt="" style={{ width:a.iconSize, height:a.iconSize, marginBottom:9, objectFit:"contain", imageRendering:"pixelated" }}/>
                <div style={{ fontSize:14, fontWeight:800, color:T.navy, marginBottom:3, fontFamily:fontDisplay }}>{a.label}</div>
                <div style={{ fontSize:12, color:T.slate }}>{a.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <CreditsPanel stats={creditStats}/>
      </div>
    </div>
  );
}

// ─── PROMPTS LIBRARY ──────────────────────────────────────────────────────────
// Biblioteca de prompts reusables — se crean/editan acá y después se elijen desde
// cualquier nodo Prompt del Compositor (ver PromptNode.jsx).
function PromptsScreen({ prompts, onAdd, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const filtered = prompts.filter(p => !search || p.nombre.toLowerCase().includes(search.toLowerCase()) || p.texto.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <SectionHeader title="Prompts" subtitle="Tus prompts guardados — elegilos después desde cualquier nodo Prompt del Compositor."
        action={<Btn variant="primary" onClick={()=>onAdd()}>+ Nuevo prompt</Btn>}
      />

      <input placeholder="Buscar prompts…" value={search} onChange={e=>setSearch(e.target.value)} style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", fontSize:13, border:`1.5px solid ${T.gray}`, borderRadius:9, background:T.white, color:T.navy, fontFamily:font, outline:"none", marginBottom:16 }}/>
      {filtered.length===0 && (
        <div style={{ textAlign:"center", padding:50, border:`1px dashed ${T.gray}`, borderRadius:10 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:T.purpleBg, border:`2px dashed ${T.purpleLight}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
            <Library size={18} color={T.purple}/>
          </div>
          <div style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:4 }}>Todavía no guardaste ningún prompt</div>
          <div style={{ fontSize:12, color:T.slate }}>Creá uno acá — después lo vas a poder elegir desde el nodo Prompt en el Compositor.</div>
        </div>
      )}
      {filtered.map(p=><PromptCard key={p.id} prompt={p} onEdit={()=>onEdit(p)} onDelete={()=>onDelete(p.id)}/>)}
    </div>
  );
}

// ─── CONCEPTS SCREEN ──────────────────────────────────────────────────────────
function ConceptsScreen({ conceptos, brand, assets, busy, setBusy, apiKey, perfil, onAdd, onEdit, onDelete, onAiSuggest, onGoCompose, notify, updateBrand, perfCompletion }) {
  const locked = perfCompletion < 80;
  const [expandedId, setExpandedId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroAngulo, setFiltroAngulo] = useState("all");
  const [genType, setGenType] = useState("hook"); // what block type to generate
  const [genBusy, setGenBusy] = useState(false);
  const [genResults, setGenResults] = useState({}); // conceptId → [{text, tipo, funcs}]
  const [savedMap, setSavedMap] = useState({});

  const BLOCK_TYPES = [
    { id:"hook",     label:"Hooks",           funcs:["hook"],      tipo:"curiosity", icon:"🎣", desc:"Patrones de interrupción que detienen el scroll" },
    { id:"body",     label:"Cuerpo / Historia",    funcs:["body"],      tipo:"pain",      icon:"📖", desc:"Amplificadores de dolor, historias, revelaciones de mecanismo" },
    { id:"benefits", label:"Lista de beneficios",   funcs:["body"],      tipo:"promise",   icon:"✅", desc:"Beneficios concretos en formato lista rápida" },
    { id:"proof",    label:"Prueba social",    funcs:["body"],      tipo:"proof",     icon:"⭐", desc:"Testimonios, estadísticas y prueba social" },
    { id:"objection",label:"Objeciones",funcs:["body"],   tipo:"constraints",icon:"🛡", desc:"Respuestas anticipadas a la principal razón para no comprar" },
    { id:"cta",      label:"CTAs",            funcs:["cta"],       tipo:"conditions",icon:"👆", desc:"Urgent, specific calls to action" },
    { id:"headline", label:"Headlines",       funcs:["headline"],  tipo:"offer",     icon:"📰", desc:"40-char max punchy headlines" },
    { id:"video_hook",label:"Hooks de video",    funcs:["hook"],      tipo:"curiosity", icon:"🎬", desc:"Hook hablado + dirección visual + sugerencia de sonido" },
  ];

  async function generateBlocks(concept) {
    if (genBusy) return;
    setGenBusy(true);
    const bt = BLOCK_TYPES.find(b=>b.id===genType);
    const ctx = perfilCtx(perfil, brand?.avatars);
    // RAG: ejemplos reales relevantes al subcomponente que se genera (hook/headline/etc).
    const _gt = genType === "video_hook" ? "hook" : genType === "benefits" ? "promise" : genType;
    const _bloque = (BLOQUE_DE_PASO[_gt] || (bt?.tipo as Bloque)) as Bloque | undefined;
    const ejemplos = _bloque ? bancoCtx(_bloque, { vertical: verticalDeIndustria(brand?.industry) }) : "";
    const conceptCtx = `\nCONCEPT: "${concept.concepto}"${concept.angulo?`\nAngle: ${concept.angulo}`:""}${concept.estilo?`\nStyle: ${concept.estilo}`:""}` + ejemplos;
    try {
      let prompt = "";
      if (genType === "video_hook") {
        prompt = `${COPY_BRAIN}\n\n${ctx}${conceptCtx}\n\nGenerate 5 VIDEO HOOKS for this concept. Apply VIDEO HOOK RULES. One punchy spoken line each (0-3 sec). Include visual direction and sound suggestion.\n\nJSON only:\n[{"text":"...","visual":"...","sound":"..."}]`;
      } else if (genType === "hook") {
        prompt = `${COPY_BRAIN}\n\n${ctx}${conceptCtx}\n\nGenerate 5 HOOKS for this concept. Apply HOOK RULES strictly. Each 1-2 lines max. Use a different hook type per variation. Specific numbers and names when possible.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else if (genType === "headline") {
        prompt = `${COPY_BRAIN}\n\n${ctx}${conceptCtx}\n\nGenerate 5 HEADLINES for this concept. Apply HEADLINE RULES. Max 40 chars each. Different formula per variation.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else if (genType === "benefits") {
        prompt = `${COPY_BRAIN}\n\n${ctx}${conceptCtx}\n\nGenerate 3 BENEFITS LIST blocks for this concept. Apply BODY COPY RULES. Quick-fire lists of 3-5 specific benefits (concrete numbers, not adjectives). Ready to paste.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else {
        prompt = `${COPY_BRAIN}\n\n${ctx}${conceptCtx}\n\nGenerate 4 ${bt.label} blocks for this concept. Apply BODY COPY RULES. Each standalone, specific, talks TO the reader. No vague adjectives.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."}]`;
      }
      const raw = await callClaude(prompt, apiKey, 1600, `Conceptos: generar ${bt.label}`);
      const arr = JSON.parse(raw.replace(/```json|```/g,"").trim());
      setGenResults(p=>({...p,[concept.id]:arr.map(r=>({...r,_id:uid(),tipo:bt.tipo,funcs:bt.funcs,conceptId:concept.id,conceptLabel:concept.concepto.slice(0,40)}))}));
    } catch { notify("Error al generar — intenta de nuevo"); }
    setGenBusy(false);
  }

  function saveBlock(block, conceptId) {
    const key = block._id;
    setSavedMap(p=>({...p,[key]:true}));
    const extra = block.visual ? ` | Visual: ${block.visual} | Sound: ${block.sound}` : "";
    updateBrand(b=>({...b, assets:[...(b.assets||[]),{id:uid(),tipo:block.tipo,funcs:block.funcs,tags:[...block.funcs,"concept:"+conceptId,"ai-generated"],text:block.text+extra}]}));
    notify("Guardado en banco ✓");
  }

  function saveAll(conceptId) {
    const results = genResults[conceptId]||[];
    results.forEach(block => { if (!savedMap[block._id]) saveBlock(block, conceptId); });
    notify(`${results.length} bloques guardados ✓`);
  }

  return (
    <div>
      <SectionHeader title="Conceptos" subtitle="Crea un concepto → genera bloques de copy → envía al Compositor."
        action={<div style={{ display:"flex", gap:8 }}>
          <Btn variant="ghost" onClick={onAiSuggest} disabled={busy}>{busy?"Procesando…":"✨ Sugerir"}</Btn>
          <Btn variant="primary" onClick={()=>onAdd()}>+ Nuevo concepto</Btn>
        </div>}
      />

      {/* Concept list */}
      {/* Búsqueda y filtros */}
      {conceptos.length>0 && (
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
          <input placeholder="Buscar conceptos…" value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={{ flex:1, minWidth:160, padding:"9px 14px", fontSize:13, border:`1.5px solid ${T.gray}`, borderRadius:9, background:T.white, color:T.navy, fontFamily:font, outline:"none" }}/>
          <select value={filtroAngulo} onChange={e=>setFiltroAngulo(e.target.value)} style={{ padding:"9px 12px", fontSize:12, border:`1.5px solid ${T.gray}`, borderRadius:9, background:T.white, fontFamily:font, color:T.navy }}>
            <option value="all">Todos los ángulos</option>
            {[...ANGULOS,...(brand?.customAngles||[])].map(a=><option key={a.id||a.label} value={a.id||a.label}>{a.label}</option>)}
          </select>
        </div>
      )}

      {conceptos.length===0 && (
        <div style={{ textAlign:"center", padding:60, color:T.slate, border:`1px dashed ${T.gray}`, borderRadius:12 }}>
          <div style={{ fontSize:32, marginBottom:10 }}>💡</div>
          <div style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:6 }}>No concepts yet</div>
          <div style={{ fontSize:12, color:T.slate, marginBottom:20 }}>A concept is one clear idea. Every ad revolves around one concept.</div>
          <Btn variant="primary" onClick={()=>onAdd()}>+ Create first concept</Btn>
        </div>
      )}

      {conceptos.filter(c=>(!busqueda||c.concepto.toLowerCase().includes(busqueda.toLowerCase())||(c.hook&&c.hook.toLowerCase().includes(busqueda.toLowerCase())))&&(filtroAngulo==="all"||c.angulo===filtroAngulo)).map(c=>{
        const isOpen = expandedId===c.id;
        const results = genResults[c.id]||[];
        const conceptBlocks = assets.filter(a=>(a.tags||[]).includes("concept:"+c.id));

        return (
          <Card key={c.id} style={{ marginBottom:12, padding:0, overflow:"hidden" }}>
            {/* Concept header */}
            <div style={{ padding:"14px 18px", display:"flex", gap:12, alignItems:"flex-start", cursor:"pointer" }} onClick={()=>setExpandedId(isOpen?null:c.id)}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                  <span style={{ fontSize:16 }}>{isOpen?"▾":"▸"}</span>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{c.concepto}</div>
                </div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap", paddingLeft:24 }}>
                  {c.personaDesc && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:T.grayLight, color:T.slate, border:`1px solid ${T.gray}` }}>👤 {c.personaDesc.slice(0,32)}{c.personaDesc.length>32?"…":""}</span>}
                  {c.angulo && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:T.purpleBg, color:T.purple, border:`1px solid ${T.purpleLight}` }}>{[...ANGULOS,...(brand?.customAngles||[])].find(a=>(a.id||a.label)===c.angulo)?.label||c.angulo}</span>}
                  {conceptBlocks.length>0 && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:"#EDFAF4", color:"#1A9E6E", border:"1px solid #9EE0C6" }}>📦 {conceptBlocks.length} blocks</span>}
                </div>
              </div>
              <div style={{ display:"flex", gap:5, flexShrink:0 }} onClick={e=>e.stopPropagation()}>
                <Btn variant="primary" small onClick={()=>onGoCompose(c)}>→ Compositor</Btn>
                <Btn variant="ghost" small onClick={()=>onEdit(c)}>Editar</Btn>
                <Btn variant="danger" small onClick={()=>onDelete(c.id)}>✕</Btn>
              </div>
            </div>

            {/* Expanded: block generator */}
            {isOpen && (
              <div style={{ borderTop:`1px solid ${T.gray}`, padding:"16px 18px", background:T.grayLight }}>
                {c.hook && <div style={{ padding:"8px 12px", background:T.white, borderRadius:8, border:`1px solid ${T.purpleLight}`, fontSize:13, fontStyle:"italic", color:T.navy, marginBottom:14 }}>"{c.hook}"</div>}

                <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.slate, marginBottom:10 }}>Generar bloques de copy para este concepto</div>

                {/* Block type picker */}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                  {BLOCK_TYPES.map(bt=>(
                    <button key={bt.id} onClick={()=>setGenType(bt.id)} style={{ padding:"7px 12px", fontSize:12, borderRadius:20, cursor:"pointer", fontFamily:font, border:`1.5px solid ${genType===bt.id?T.purple:T.gray}`, background:genType===bt.id?T.purpleBg:T.white, color:genType===bt.id?T.purple:T.slate, fontWeight:genType===bt.id?700:400 }}>
                      {bt.icon} {bt.label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize:11, color:T.slate, marginBottom:12 }}>{BLOCK_TYPES.find(b=>b.id===genType)?.desc}</div>

                <Btn variant="primary" small onClick={()=>generateBlocks(c)} disabled={genBusy}>{genBusy?"Generando…":"✨ Generate"}</Btn>

                {/* Generated results */}
                {results.length>0 && (
                  <div style={{ marginTop:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.06em" }}>{results.length} generated — select to save</div>
                      <Btn variant="soft" small onClick={()=>saveAll(c.id)}>Save all to bank</Btn>
                    </div>
                    {results.map(block=>{
                      const saved = savedMap[block._id];
                      return (
                        <div key={block._id} style={{ background:saved?"#EDFAF4":T.white, border:`1.5px solid ${saved?"#9EE0C6":T.gray}`, borderRadius:10, padding:"12px 14px", marginBottom:8, display:"flex", gap:10, alignItems:"flex-start" }}>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, color:T.navy, lineHeight:1.65 }}>{block.text}</div>
                            {block.visual && <div style={{ fontSize:11, color:T.slate, marginTop:6 }}>📷 {block.visual}</div>}
                            {block.sound && <div style={{ fontSize:11, color:T.slate, marginTop:2 }}>🎵 {block.sound}</div>}
                          </div>
                          <button onClick={()=>!saved&&saveBlock(block,c.id)} style={{ padding:"5px 12px", fontSize:11, borderRadius:20, cursor:saved?"default":"pointer", fontFamily:font, border:`1px solid ${saved?"#1A9E6E":T.purple}`, background:saved?"#EDFAF4":T.purpleBg, color:saved?"#1A9E6E":T.purple, fontWeight:600, flexShrink:0, whiteSpace:"nowrap" }}>{saved?"✓ Saved":"Guardar"}</button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Already saved blocks for this concept */}
                {conceptBlocks.length>0 && results.length===0 && (
                  <div style={{ marginTop:16 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>Saved blocks for this concept</div>
                    {conceptBlocks.slice(0,4).map(b=>(
                      <div key={b.id} style={{ background:T.white, border:`1px solid ${T.gray}`, borderRadius:8, padding:"10px 12px", marginBottom:6, fontSize:12, color:T.navy, lineHeight:1.6 }}>{b.text.slice(0,120)}{b.text.length>120?"…":""}</div>
                    ))}
                    {conceptBlocks.length>4 && <div style={{ fontSize:11, color:T.slate }}>+{conceptBlocks.length-4} more in the Block Bank</div>}
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {/* Go to composer CTA */}
      {conceptos.length>0 && (
        <div style={{ marginTop:20, padding:"16px 20px", borderRadius:12, border:`1.5px solid ${T.purple}`, background:T.purpleBg, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div><div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:3 }}>¿Listo para construir tu anuncio?</div><div style={{ fontSize:12, color:T.slate }}>Ve al Compositor — elige tu concepto y bloques, genera el output final.</div></div>
          <Btn variant="primary" onClick={()=>onGoCompose(null)}>→ Compositor</Btn>
        </div>
      )}
    </div>
  );
}

// ─── COMPOSITOR — block order using the 7 AdBlock types ──────────────────────
const HOOK_TYPE_TO_STEP = { pain:"pain", promise:"promise", proof:"proof", curiosity:"curiosity", contrarian:"curiosity", offer:"offer", conditions:"conditions" };
const BLOCK_ORDER = [
  { id:"hook",        label:"Hook",        emoji:"🎣", tipo:"curiosity", funcs:["hook"],
    hint:"Primera línea. Detiene el scroll antes del 'ver más'. Máx 1-2 líneas. Una sola idea.",
    formats: BLOCK_FORMATS.hook },
  { id:"pain",        label:"Dolor",       emoji:"💔", tipo:"pain",      funcs:["body"],
    hint:"Dónde está tu avatar AHORA MISMO. Dolor vivido, específico, cotidiano. Más visual = más identificación.",
    formats: BLOCK_FORMATS.pain },
  { id:"promise",     label:"Promesa",     emoji:"✨", tipo:"promise",   funcs:["body"],
    hint:"A dónde quiere LLEGAR tu avatar. La tierra prometida. Siempre con número o resultado concreto.",
    formats: BLOCK_FORMATS.promise },
  { id:"proof",       label:"Prueba",      emoji:"⭐", tipo:"proof",     funcs:["body"],
    hint:"El piloto que hace creíble la promesa. Resultado real específico > volumen de clientes > rating.",
    formats: BLOCK_FORMATS.proof },
  { id:"offer",       label:"Oferta",      emoji:"🎁", tipo:"offer",     funcs:["offer"],
    hint:"Tu oferta presentada con claridad. Qué es, qué incluye y por qué el precio es una decisión obvia.",
    formats: BLOCK_FORMATS.offer },
  { id:"curiosity",   label:"Curiosidad",  emoji:"🔮", tipo:"curiosity", funcs:["body"],
    hint:"El mecanismo nombrado — el helicóptero del Dolor a la Promesa. Debe ser único y tener su propio nombre.",
    formats: BLOCK_FORMATS.curiosity },
  { id:"constraints", label:"Frenos",      emoji:"🛡", tipo:"constraints",funcs:["body"],
    hint:"Todo lo que frena a tu avatar de actuar. Más profundo que las objeciones — identidad, creencias, recursos.",
    formats: BLOCK_FORMATS.constraints },
  { id:"conditions",  label:"Condiciones", emoji:"⏰", tipo:"conditions", funcs:["cta"],
    hint:"Urgencia real, escasez real, o call-out de audiencia. La urgencia falsa destruye la confianza — nunca usarla.",
    formats: BLOCK_FORMATS.conditions },
  { id:"cta",        label:"CTA",         emoji:"🎯", tipo:"conditions", funcs:["cta"],
    hint:"Llama a la acción. Exactamente qué hacer, por qué ahora, qué pasa después. Específico > genérico.",
    formats: BLOCK_FORMATS.cta },
  { id:"headline",    label:"Headline",    emoji:"📰", tipo:"offer",      funcs:["headline"],
    hint:"Máx 40 caracteres. Funciona solo bajo la imagen. UVP comprimido.",
    formats:[
      { id:"how_without",   label:"Cómo [resultado] sin [obstáculo]",        hint:"'Come bien sin salir de la oficina'" },
      { id:"for_who",       label:"Para [avatar específico]",                hint:"'Para los que almuerzan en la zona norte'" },
      { id:"number",        label:"[N] [resultado] en [tiempo]",             hint:"'47 domicilios en 1 mes'" },
      { id:"why_q",         label:"¿Por qué [situación intrigante]?",        hint:"'¿Por qué siempre hay cola aquí?'" },
      { id:"secret",        label:"El secreto de [grupo] para [resultado]",  hint:"'El secreto de los locales siempre llenos'" },
      { id:"self_interest", label:"Interés propio directo",                  hint:"Beneficio inmediato. 'Almuerzo listo en 15 min'" },
      { id:"pure_curiosity",label:"Pura curiosidad",                         hint:"Genera una pregunta. Ideal para tráfico frío." },
      { id:"news",          label:"Novedad / Lanzamiento",                   hint:"Algo nuevo. 'Nuevo menú de temporada'" },
      CUSTOM_FORMAT,
    ]
  },
  { id:"hook_video",  label:"Hook Video",  emoji:"🎬", tipo:"curiosity", funcs:["hook"],
    hint:"0-3 segundos hablados. Funciona sin sonido. La primera palabra decide si siguen viendo.",
    formats: BLOCK_FORMATS.hook },
];


// Extrae JSON de forma robusta: tolera markdown/prosa alrededor y texto extra DESPUÉS del
// objeto (la causa de "Unexpected non-whitespace after JSON"). Recorta el primer objeto/array
// balanceado contando llaves, respetando strings y escapes.
function CompositorScreen({ assets, conceptos, perfil, brand, busy, setBusy, apiKey, notify, updateBrand, initialConcept }) {
  const [formato, setFormato] = useState("facebook");
  const [concepto, setConcepto] = useState(initialConcept||null);
  const [pasoActual, setPasoActual] = useState(0);
  const [bloques, setBloques] = useState({});
  const [resultados, setResultados] = useState([]);
  const [genBusy, setGenBusy] = useState(false);
  const [formatSel, setFormatSel] = useState(null);
  const [formatCustom, setFormatCustom] = useState("");
  const [hookBlockType, setHookBlockType] = useState(null);
  const [prodFormat, setProdFormat] = useState(null);
  const [anguloRap, setAnguloRap] = useState(null);
  const [tempRap, setTempRap] = useState("fria");
  const [hookFmtRap, setHookFmtRap] = useState(null);
  const [rapStep, setRapStep] = useState("seed"); // tarjeta expandida del rail: seed|persona|concepto|formato|estructura|hook
  const [showAllProdsRap, setShowAllProdsRap] = useState(false);
  const [showAllHooksRap, setShowAllHooksRap] = useState(false);
  const [personaId, setPersonaId] = useState(null);        // persona elegida para el rail (null = todas)
  const [seedText, setSeedText] = useState("");             // texto/transcript/doc pegado en el seed
  const [customEstructura, setCustomEstructura] = useState(""); // "crear la mía": instrucción libre de estructura
  const [showCustomEstructura, setShowCustomEstructura] = useState(false);
  const [personaSuggestions, setPersonaSuggestions] = useState(null);
  const [conceptoSuggestions, setConceptoSuggestions] = useState(null);
  const [suggestBusy, setSuggestBusy] = useState(false);
  const [quickPersona, setQuickPersona] = useState(false); // toggle del form rápido "+ Nueva persona"
  const [qpName, setQpName] = useState(""); const [qpPain, setQpPain] = useState("");
  const [flowName, setFlowName] = useState("");
  const [showSaveFlow, setShowSaveFlow] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [seedBusy, setSeedBusy] = useState(false);
  const [buildReady, setBuildReady] = useState(false); // gate de formato para el compositor paso a paso
  const [editRapKey, setEditRapKey] = useState(null); // bloque del output rápido en edición inline
  const [armando, setArmando] = useState(false); // vista del armador (copy unido) para el output rápido
  const [copyGuardado, setCopyGuardado] = useState(false); // confirmación de guardado en banco de copies
  const [proofData, setProofData] = useState("");
  const [offerSel, setOfferSel] = useState(null);
  const [editando, setEditando] = useState(null);
  const [ctaContext,    setCtaContext]    = useState("");
  const [editandoOutput, setEditandoOutput] = useState(false);
  const [outputEditado,  setOutputEditado]  = useState("");
  const [output, setOutput] = useState(null);
  const [outputEmoji, setOutputEmoji] = useState("");
  const [fase, setFase] = useState("setup");

  const PASOS_FB_BASE    = ["hook","pain","promise","proof","offer","curiosity","constraints","conditions","cta","headline"];
  const PASOS_VIDEO_BASE = ["hook_video","pain","promise","proof","curiosity","conditions","cta"];
  const hookSkipStep = hookBlockType ? (HOOK_TYPE_TO_STEP[hookBlockType]||null) : null;
  const pasos = (formato==="facebook" ? PASOS_FB_BASE : PASOS_VIDEO_BASE).filter(p=>p!==hookSkipStep);
  const pasoInfo = BLOCK_ORDER.find(b=>b.id===pasos[pasoActual]);
  const bloquesSeleccionados = pasos.filter(p=>bloques[p]);
  const progreso = Math.round(bloquesSeleccionados.length / pasos.length * 100);
  const offers = brand?.offers || [];
  const isHookStep  = pasoInfo?.id==="hook" || pasoInfo?.id==="hook_video";
  const isProofStep = pasoInfo?.id==="proof";
  const isOfferStep = pasoInfo?.id==="offer";
  const isCTAStep   = pasoInfo?.id==="cta";

  function resetStep() { setResultados([]); setFormatSel(null); setFormatCustom(""); setHookBlockType(null); setProofData(""); setOfferSel(null); setEditando(null); setCtaContext(""); }
  function goToStep(i) { setPasoActual(i); resetStep(); }

  // Guía sobre el mecanismo nombrado: usar el nombre real SOLO si la marca lo definió; nunca inventarlo.
  function mecGuide() {
    const mec = perfil?.mecanismo_nombrado?.trim();
    const marca = brand?.name || "la marca";
    return mec
      ? ` Cuando menciones el método o proceso, usá EXACTAMENTE "${mec}" — no inventes otro nombre.`
      : ` NUNCA le pongas nombre propio/comercial al método, sistema o mecanismo (ej. "El Método X", "El Sistema Y"): suena forzado y falso si la marca no lo nombró. Para diferenciarte usá lenguaje natural: "nosotros lo hacemos distinto", "en ${marca} no trabajamos así", "la mayoría hace X — nosotros hacemos Y".`;
  }

  async function generarBloque() {
    if (!pasoInfo) return;
    setGenBusy(true); setResultados([]);
    const ctx = perfilCtx(perfil, brand?.avatars);
    // RAG: inyecta 2–4 ejemplos reales relevantes al bloque (fuera del system cacheado).
    const _bloque = BLOQUE_DE_PASO[pasoInfo.id];
    const ejemplos = _bloque ? bancoCtx(_bloque, { vertical: verticalDeIndustria(brand?.industry) }) : "";
    const conceptCtx = (concepto ? `\nCONCEPT: "${concepto.concepto}"${concepto.angulo?`\nAngle: ${concepto.angulo}`:""}` : "") + ejemplos;
    const fmt = pasoInfo.formats.find(f=>f.id===formatSel) || pasoInfo.formats[0];
    const fmtLabel = fmt.id==="custom" ? (formatCustom.trim()||"Formato libre") : fmt.label;
    try {
      let prompt;
      const noInvent = mecGuide();
      const lang = `IMPORTANTE: Genera TODO en español. SEGUNDA PERSONA DIRECTA: háblale al lector de TÚ/VOS según el mercado. PROHIBIDO usar 'su', 'su cocina', tercera persona — di 'tu cocina', 'tu negocio'. Directo, natural, copy conversacional.${noInvent}\n`;
      const fmtGuide = `${fmt.hint?`\nGuía de fórmula: ${fmt.hint}`:""}${fmt.ej?`\nEjemplo de referencia (adapta a ESTA marca, NO lo copies literal): "${fmt.ej}"`:""}`;
      const prodInfo = formato==="video" && prodFormat ? VIDEO_PROD_FORMATS.find(f=>f.id===prodFormat) : null;
      const prodCtx = prodInfo ? `\nFORMATO DE PRODUCCIÓN (cómo se grabará el video): "${prodInfo.label}" — ${prodInfo.hint}. Adapta la dirección visual a esto.` : "";
      if (pasoInfo.id==="hook" || pasoInfo.id==="hook_video") {
        const esVideo = pasoInfo.id==="hook_video";
        const ht = hookBlockType ? HOOK_BLOCK_TYPES.find(h=>h.id===hookBlockType) : null;
        const hookTypeCtx = ht ? `\nTIPO DE BLOQUE QUE LIDERA EL HOOK: ${ht.label} — ${ht.desc}` : "";
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}${hookTypeCtx}${prodCtx}\n\nFórmula: "${fmtLabel}"${fmtGuide}\n\nGenera 3 ${esVideo?"HOOKS DE VIDEO (1 línea hablada, 0-3 seg)":"HOOKS"} con esta fórmula. Aplica las REGLAS DE HOOK. Máx 1-2 líneas, específico, sin adjetivos vacíos, usa números cuando puedas.${esVideo?" Para cada uno incluye dirección visual (qué se ve, según el formato de producción) y sugerencia de sonido.":""}\n\nJSON only:\n${esVideo?'[{"text":"...","visual":"...","sound":"..."},{"text":"...","visual":"...","sound":"..."},{"text":"...","visual":"...","sound":"..."}]':'[{"text":"..."},{"text":"..."},{"text":"..."}]'}`;
      } else if (pasoInfo.id==="headline") {
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}\n\nFórmula: "${fmtLabel}"${fmtGuide}\n\nGenera 3 HEADLINES. REGLA DURA: máx 40 caracteres cada uno (Meta corta después). Funciona solo, sin el texto principal.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else if (pasoInfo.id==="pain") {
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}${prodCtx}\n\nBloque: DOLOR — Fórmula: "${fmtLabel}"${fmtGuide}\n\nGenera 3 bloques de DOLOR. Describe dónde está el avatar AHORA: su situación, frustración, momento de dolor. Cuanto más específico y visual, más se identifica. Háblale al lector (tú/vos). Sin adjetivos vacíos.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else if (pasoInfo.id==="promise") {
        const selOffer = offerSel || offers[0];
        const offerCtx = selOffer ? `\n\nOFERTA DE LA MARCA (saca los beneficios de SUS datos reales — no inventes características que no estén aquí):\n${(selOffer.nombre||selOffer.name)?`Nombre: ${selOffer.nombre||selOffer.name}`:""}${(selOffer.descripcion||selOffer.desc)?`\nDescripción: ${selOffer.descripcion||selOffer.desc}`:""}${selOffer.incluye?`\nIncluye: ${selOffer.incluye}`:""}${(selOffer.precio||selOffer.price)?`\nPrecio: ${selOffer.precio||selOffer.price}`:""}` : "";
        const benefitsRule = formatSel==="benefits" ? "\nESTE ES UN BLOQUE DE LISTA DE BENEFICIOS: cada beneficio debe derivarse de lo que incluye la oferta de arriba. No inventes beneficios que no se desprendan de sus datos." : "";
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}${offerCtx}${prodCtx}\n\nBloque: PROMESA — Fórmula: "${fmtLabel}"${fmtGuide}${benefitsRule}\n\nGenera 3 bloques de PROMESA: a dónde quiere LLEGAR el avatar. Siempre con número + tiempo si aplica. Transformación de identidad o resultado concreto. Háblale al lector.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else if (pasoInfo.id==="proof") {
        const proofCtx = proofData.trim() ? `\n\nDATOS DE PRUEBA REALES DEL DUEÑO (úsalos textuales, no inventes):\n${proofData.trim()}` : "";
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}${proofCtx}${prodCtx}\n\nBloque: PRUEBA — Fórmula: "${fmtLabel}"${fmtGuide}\n\nGenera 3 bloques de PRUEBA. Jerarquía: resultado específico+nombre+número > caso > testimonio > dato > credencial. Siempre específico. NUNCA inventes números, nombres ni resultados: si no hay dato real, usa placeholder visible entre [corchetes].\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else if (pasoInfo.id==="offer") {
        const o = offerSel || offers[0];
        const offerCtx = o ? `\n\nDOC 1 · OFERTA:\n- Oferta.nombre: ${o.nombre||o.name||""}\n- Oferta.descripcion: ${o.descripcion||o.desc||""}${o.incluye?`\n- Oferta.items: ${o.incluye}`:""}${o.resultado?`\n- Oferta.resultado: ${o.resultado}`:""}${o.antes?`\n- Oferta.antes: ${o.antes}`:""}${o.despues?`\n- Oferta.despues: ${o.despues}`:""}${o.tiempo?`\n- Oferta.tiempo: ${o.tiempo}`:""}${(o.precio||o.price)?`\n- Oferta.precio: ${o.precio||o.price}`:""}${o.precio_ancla?`\n- Oferta.precio_ancla: ${o.precio_ancla}`:""}${o.garantia?`\n- Oferta.garantia: ${o.garantia}`:""}${o.friccion_eliminada?`\n- Oferta.friccion_eliminada: ${o.friccion_eliminada}`:""}${(o.urgencia||o.restriccion)?`\n- Oferta.restriccion: ${o.urgencia||o.restriccion}`:""}` : "";
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}${offerCtx}${prodCtx}\n\nBloque: OFERTA — Fórmula: "${fmtLabel}"${fmtGuide}\n\nGenera 3 bloques de OFERTA. Presenta el valor con claridad: qué es, qué incluye y por qué el precio es una decisión obvia. Usa SOLO los datos reales de la oferta de arriba.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else if (pasoInfo.id==="curiosity") {
        const mec = perfil?.mecanismo_nombrado?.trim();
        const mecCtx = mec
          ? `\n\nMECANISMO NOMBRADO DE LA MARCA: "${mec}" — usa EXACTAMENTE este nombre, no inventes otro.`
          : `\n\nLA MARCA NO DEFINIÓ UN MECANISMO NOMBRADO. NO inventes nombres de sistemas, métodos ni fórmulas (suenan forzados y poco creíbles). En su lugar genera curiosidad con bucles abiertos, preguntas intrigantes o un proceso descriptivo SIN nombre propio, usando detalles reales del producto/servicio.`;
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}${mecCtx}${prodCtx}\n\nBloque: CURIOSIDAD — Fórmula: "${fmtLabel}"${fmtGuide}\n\nGenera 3 bloques de CURIOSIDAD (bucle abierto, pregunta intrigante o método único que lleva del Dolor a la Promesa). Cada uno debe crear la pregunta '¿qué es eso?' usando detalles reales del producto. ${mec?`Cuando menciones el mecanismo, usa "${mec}".`:"NO inventes un nombre de mecanismo."}\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else if (pasoInfo.id==="constraints") {
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}${prodCtx}\n\nBloque: FRENOS — Fórmula: "${fmtLabel}"${fmtGuide}\n\nGenera 3 bloques de FRENOS/OBJECIONES. Nombra la fricción real del avatar (identidad, creencias, recursos, experiencias pasadas) y reencuádrala. Háblale al lector.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else if (pasoInfo.id==="conditions") {
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}${prodCtx}\n\nBloque: CONDICIONES — Fórmula: "${fmtLabel}"${fmtGuide}\n\nGenera 3 bloques de CONDICIONES. Urgencia REAL, escasez REAL, deadline específico o call-out de audiencia. NUNCA urgencia falsa. Sin urgencia legítima, escribe un call-out de audiencia específico en su lugar.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else if (pasoInfo.id==="cta") {
        const ctaGoalCtx = ctaContext.trim() ? `\n\nACCIÓN DESEADA: "${ctaContext.trim()}"` : "";
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}${ctaGoalCtx}${prodCtx}\n\nBloque: CTA — Fórmula: "${fmtLabel}"${fmtGuide}\n\nGenera 3 CTAs. Deben decir exactamente: QUÉ hacer + POR QUÉ ahora + QUÉ pasa después. Sin 'Haz clic aquí' genérico — acción específica con resultado específico. Máx 2-3 líneas.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else {
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}${prodCtx}\n\nFórmula: "${fmtLabel}"${fmtGuide}\n\nGenera 3 bloques de tipo "${pasoInfo.label}" con esta fórmula. Aplica las REGLAS DE CUERPO. Específico, háblale al lector.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."}]`;
      }
      const raw = await callClaude(prompt, apiKey, 1600, `Compositor: bloque ${pasoInfo.label}`);
      const arr = JSON.parse(raw.replace(/```json|```/g,"").trim());
      setResultados(arr.map(r=>({...r,_id:uid(),tipo:pasoInfo.tipo,funcs:pasoInfo.funcs})));
    } catch(e) { console.error("gen error:", e); notify("Error: " + (e?.message || "intenta de nuevo")); }
    setGenBusy(false);
  }

  // Avatares a usar en el prompt: si hay persona elegida en el rail, solo esa; si no, todas.
  function avatarsParaPrompt() {
    const all = brand?.avatars||[];
    return personaId ? all.filter(a=>a.id===personaId) : all;
  }

  async function generarRapido() {
    const angInfo = ANGULOS_RAPIDO.find(a=>a.id===anguloRap) || (customEstructura.trim() ? { id:"custom", label:"Estructura personalizada", desc:customEstructura.trim(), prods:[], hooks:[] } : null);
    if (!angInfo) { notify("Elige una estructura (o escribí la tuya) primero"); return; }
    setBusy(true); setOutput(null); setArmando(false); setCopyGuardado(false); setOutputEditado(""); setOutputEmoji(""); setEditandoOutput(false); setEditRapKey(null);
    const ctx = perfilCtx(perfil, avatarsParaPrompt());
    const seedCtx = seedText.trim() ? `\n\nCONTEXTO ADICIONAL (seed — documento/transcript/referencia que subió el usuario):\n${seedText.trim().slice(0,4000)}` : "";
    const estructuraLibreCtx = (angInfo.id==="custom" || customEstructura.trim())
      ? `\nESTRUCTURA PERSONALIZADA (instrucción del usuario, seguila de cerca — puede referenciar el seed de arriba): ${customEstructura.trim()}`
      : "";
    const conceptCtx = (concepto ? `\nCONCEPT: "${concepto.concepto}"${concepto.angulo?`\nAngle: ${concepto.angulo}`:""}` : "") + seedCtx;
    const noInvent = mecGuide();
    const prodInfo = formato==="video" && prodFormat ? VIDEO_PROD_FORMATS.find(f=>f.id===prodFormat) : null;
    const prodCtx = prodInfo ? `\nFORMATO DE PRODUCCIÓN: "${prodInfo.label}" — ${prodInfo.hint}. El guion hablado debe encajar con este estilo de grabación.` : "";
    const tempsMap = { fria:"Tráfico FRÍO — primera impresión, no te conocen. Interrumpe, conecta con el dolor, genera curiosidad. No des por sentado que saben nada de la marca.", tibia:"Tráfico TIBIO — ya te conocen, evaluando opciones. Diferénciate, reduce riesgo percibido, muestra prueba social.", caliente:"Tráfico CALIENTE — retargeting/BOF. Listos para decidir. Directo a la oferta, urgencia real, CTA concreto." };
    const isVideo = formato==="video";
    const hookFwInfo = hookFmtRap ? HOOK_FRAMEWORKS.find(f=>f.id===hookFmtRap) : null;
    const hookFwCtx = hookFwInfo ? `\nFÓRMULA DE HOOK: "${hookFwInfo.label}" — ${hookFwInfo.desc}\nEstructura sugerida: "${hookFwInfo.starter}"\nUSA esta fórmula exacta para el hook de apertura (primeros 1-2 segundos o primera línea del texto).` : "";
    const tiposDisp = "pain (Dolor), promise (Promesa/transformación), proof (Prueba/credibilidad), curiosity (Curiosidad/mecanismo), constraints (Frenos/objeción), conditions (Condiciones/urgencia), offer (Oferta)";
    const bloquesSpec = `"bloques": un ARRAY en orden de lectura. El PRIMER bloque es el hook (func:"hook"). Luego 1 a 3 bloques de CUERPO (func:"body"), cada uno con el "tipo" MÁS RELEVANTE para este anuncio — NO los uses todos, solo los que aporten al ángulo y al concepto. El ÚLTIMO bloque es el cierre (func:"cta"). Cada objeto: {"tipo":"<uno de: pain|promise|proof|curiosity|constraints|conditions|offer>","func":"hook|body|cta","text":"el copy de ese bloque"}`;
    const jsonSpec = isVideo
      ? `JSON: {${bloquesSpec}, "instrucciones":"UN solo párrafo corto de cómo grabar este formato (${prodInfo?.label||"el video"}): encuadre, tono y ritmo. NADA de dirección beat a beat, SFX ni música — solo cómo encararlo en palabras simples"}`
      : `JSON: {${bloquesSpec}, "headline":"título máx 40 chars"}`;
    const prompt = `${COPY_BRAIN}\n\nIMPORTANTE: Genera TODO en español. SEGUNDA PERSONA DIRECTA: tú/vos según el mercado (NUNCA 'su', NUNCA tercera persona — di 'tu cocina', 'tu negocio').${noInvent}\n${ctx}${conceptCtx}${prodCtx}${hookFwCtx}${estructuraLibreCtx}\n\nÁNGULO: ${angInfo.label} — ${angInfo.desc}\nTEMPERATURA: ${tempsMap[tempRap]||tempsMap.fria}\nFORMATO: ${isVideo?"Script de Video (hablado)":"Facebook Ad"}\n\nGenera un anuncio COMPLETO dividido en BLOQUES, y para cada bloque IDENTIFICÁ su tipo entre: ${tiposDisp}. Usá los tipos MÁS RELEVANTES para este ángulo y concepto (no todos). Directo, específico, segunda persona directa. Usa SOLO datos reales del perfil. Sin adjetivos vacíos, sin urgencia falsa. Si falta un dato crítico usa [placeholder entre corchetes].\n\n${jsonSpec}`;
    try {
      const raw = await callClaude(prompt, apiKey, 2400, `Modo Rápido: ${angInfo.label}`);
      const parsed = extractJSON(raw);
      const validTipos = ["pain","promise","proof","curiosity","constraints","conditions","offer"];
      const angTipo = ANGULO_HOOK_TIPO[angInfo.id] || "curiosity";
      let bloques = (Array.isArray(parsed.bloques)?parsed.bloques:[]).map((b,i)=>{
        const func = ["hook","body","cta"].includes(b.func) ? b.func : "body";
        const tipo = validTipos.includes(b.tipo) ? b.tipo : (func==="hook"?angTipo:func==="cta"?(isVideo?"conditions":"offer"):"promise");
        return { key:`b${i}`, func, tipo, label:(FL[func]||"Bloque"), text:String(b.text||"").trim() };
      }).filter(b=>b.text);
      // Fallback si la IA devolvió el formato viejo (hook/body/cta sueltos)
      if (!bloques.length) {
        if (parsed.hook) bloques.push({ key:"b0", func:"hook", tipo:angTipo, label:"Hook", text:String(parsed.hook).trim() });
        if (parsed.body) bloques.push({ key:"b1", func:"body", tipo:"promise", label:"Body", text:String(parsed.body).trim() });
        if (parsed.cta)  bloques.push({ key:"b2", func:"cta",  tipo:isVideo?"conditions":"offer", label:"CTA", text:String(parsed.cta).trim() });
      }
      const headline = !isVideo && parsed.headline ? String(parsed.headline).trim() : "";
      const instrucciones = isVideo && parsed.instrucciones ? String(parsed.instrucciones).trim() : "";
      const raw2 = [...bloques.map(b=>b.text), headline?`📰 Headline: ${headline}`:"", instrucciones?`🎬 Cómo grabar:\n${instrucciones}`:""].filter(Boolean).join("\n\n");
      setOutput({ tag:`rapido:${angInfo.id}:${tempRap}`, type:formato, raw:raw2, isRapido:true, bloques, headline, instrucciones });
      setFase("output");
    } catch(e) { console.error(e); notify("Error: " + (e?.message||"intenta de nuevo")); }
    setBusy(false);
  }

  // Edita inline un bloque del output rápido y mantiene output.raw sincronizado para copiar todo.
  function updateRapBloque(key, text) {
    setOutput(o=>{
      if (!o?.bloques) return o;
      const bloques = o.bloques.map(b=>b.key===key?{...b,text}:b);
      const raw = [...bloques.map(b=>b.text), o.headline?`📰 Headline: ${o.headline}`:"", o.instrucciones?`🎬 Cómo grabar:\n${o.instrucciones}`:""].filter(Boolean).join("\n\n");
      return { ...o, bloques, raw };
    });
  }

  function seleccionarBloque(r) {
    const fmt = pasoInfo.formats.find(f=>f.id===formatSel)||pasoInfo.formats[0];
    const fLabel = fmt.id==="custom" ? (formatCustom.trim()||"Formato libre") : fmt.label;
    setBloques(p=>({...p,[pasoInfo.id]:{...r,formatId:fmt.id,formatLabel:fLabel}}));
    notify(`${pasoInfo.label} elegido ✓`);
  }

  function guardarEnBanco(r) {
    const extra = r.visual ? ` | 📷 ${r.visual} | 🎵 ${r.sound}` : "";
    const tags = [...new Set([...(r.funcs||[]), r.tipo, ...(r.tags||[]), "generated", ...(concepto?["concept:"+concepto.id]:[])].filter(Boolean))];
    updateBrand(b=>({...b,assets:[...(b.assets||[]),{id:uid(),tipo:r.tipo,funcs:r.funcs,tags,text:r.text+extra}]}));
    notify("Guardado en banco ✓");
  }

  // Guarda TODOS los bloques del output rápido en el banco, ya categorizados por tipo + tags.
  function guardarBloquesRap() {
    if (!output?.bloques?.length) return;
    const extraT = [anguloRap?("angulo:"+anguloRap):null, hookFmtRap?("hook:"+hookFmtRap):null, concepto?("concept:"+concepto.id):null, "generated"].filter(Boolean);
    const nuevos = output.bloques.map(b=>({ id:uid(), tipo:b.tipo, funcs:[b.func], tags:[...new Set([b.func, b.tipo, ...extraT])], text:b.text }));
    updateBrand(b=>({...b, assets:[...(b.assets||[]), ...nuevos]}));
    notify(`${nuevos.length} bloques guardados ✓`);
  }

  // Guarda el copy ARMADO (unido) en el banco de copies.
  function guardarCopyRap(rating) {
    if (!output) return;
    const textFinal = outputEditado || outputEmoji || output.raw;
    updateBrand(b=>({...b, copies:[...(b.copies||[]), {
      id:uid(), type:output.type, text:textFinal, tag:output.tag, rating:rating||"testing",
      conceptoId:concepto?.id||null, conceptoLabel:concepto?.concepto?.slice(0,40)||"Sin concepto",
      fecha:new Date().toISOString().split("T")[0], blockIds:[],
    }]}));
    setCopyGuardado(true);
    notify(rating==="winner"?"🏆 Guardado como ganador":"💾 Guardado en banco de copies");
  }

  async function ensamblar() {
    setBusy(true); setOutput(null); setOutputEmoji("");
    const ctx = perfilCtx(perfil, brand?.avatars);
    const conceptCtx = concepto ? `\nCONCEPT: "${concepto.concepto}"${concepto.angulo?`\nAngle: ${concepto.angulo}`:""}` : "";
    const bloquesList = pasos.filter(p=>bloques[p]).map((p,i)=>{
      const b=bloques[p]; const info=BLOCK_ORDER.find(x=>x.id===p);
      return `${i+1}. [${info?.label||p}] ${b.text}`;
    }).join("\n");
    const tag = `[Concepto: ${concepto?.concepto?.slice(0,30)||"—"} | Formato: ${formato==="facebook"?"Facebook Ad":"Script de Video"} | Ángulo: ${concepto?.angulo||"—"}]`;
    try {
      let prompt;
      const noInvent = mecGuide();
      const lang = "IMPORTANTE: Genera TODO en español. Natural, conversacional, directo." + noInvent + "\n";
      if (formato==="facebook") {
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}\n\nCombina estos bloques en un Facebook Ad completo y pulido. Únelos con gramática fluida — no los listes. Listo para pegar en Ads Manager.\n\nBLOQUES:\n${bloquesList}\n\nFORMATO EXACTO:\nTEXTO PRINCIPAL:\n[copy completo — primera línea es el hook, ~125 chars visibles antes de "ver más"]\n\nTÍTULO:\n[máx 40 caracteres]\n\nETIQUETA DE PRODUCCIÓN:\n${tag}`;
      } else {
        const prodInfo = prodFormat ? VIDEO_PROD_FORMATS.find(f=>f.id===prodFormat) : null;
        const prodCtx = prodInfo ? `\n\nFORMATO DE PRODUCCIÓN (cómo se grabará): "${prodInfo.label}" — ${prodInfo.hint}. Escribe la dirección visual y el guion ADAPTADOS a este estilo de grabación.` : "";
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}${prodCtx}\n\nCombina estos bloques en un script de video completo (20-45 seg), listo para producción. Aplica las REGLAS DE VIDEO HOOK al inicio.\n\nBLOQUES:\n${bloquesList}\n\nFORMATO EXACTO:\nHOOK (0-3s):\n[1 línea hablada]\n\nDIRECCIÓN VISUAL:\n[qué se ve en pantalla, según el formato de producción]\n\nSUGERENCIA DE SONIDO:\n[audio/música]\n\nSCRIPT:\n[script completo hablado]\n\nETIQUETA DE PRODUCCIÓN:\n${tag}`;
      }
      const raw = await callClaude(prompt, apiKey, 2000, `Compositor: ensamblar ${formato==="facebook"?"Facebook Ad":"Script de Video"}`);
      setOutput({ type:formato, raw, tag });
      setFase("output");
    } catch(e) { console.error("assemble error:", e); notify("Error: " + (e?.message || "intenta de nuevo")); }
    setBusy(false);
  }

  async function agregarEmojis() {
    if (!output) return; setBusy(true);
    try {
      const raw = await callClaude(`Add emojis strategically to this Facebook Ad copy. Max 6 emojis total. Only where they add visual value — not decorative. Return only the text with emojis, no comments.\n\n${output.raw}`, apiKey, 1200, "Compositor: agregar emojis", null, "suggest");
      setOutputEmoji(raw);
    } catch(e) { console.error("emoji error:", e); notify("Error al agregar emojis"); }
    setBusy(false);
  }

  // ✨ Sugerir personas — solo sugerencias, el usuario elige manualmente qué guardar.
  async function sugerirPersonas() {
    setSuggestBusy(true); setPersonaSuggestions(null);
    try {
      const existentes = (brand?.avatars||[]).map(a=>`- ${a.name||a.nombre}: ${a.desc||a.descripcion||""}`).join("\n") || "(ninguna aún)";
      const raw = await callClaude(`${COPY_BRAIN}\n\nMarca: ${brand?.name||""} (${brand?.industry||"sin industria definida"}).\nPerfil: ${JSON.stringify(perfil||{}).slice(0,1200)}\nPersonas existentes:\n${existentes}\n${seedText.trim()?`\nContexto adicional (seed):\n${seedText.trim().slice(0,1500)}`:""}\n\nSugerí 3 personas/avatares NUEVOS y distintos entre sí para esta marca. JSON only:\n[{"name":"","desc":"","pains":"","objection":""}]`, apiKey, 900, "Compositor: sugerir personas", null, "suggest");
      setPersonaSuggestions(extractJSON(raw));
    } catch(e) { notify("Error al sugerir: " + (e?.message||"")); }
    setSuggestBusy(false);
  }
  function aceptarPersonaSugerida(p) {
    const nueva = { id:uid(), name:p.name, desc:p.desc, pains:p.pains, objection:p.objection };
    updateBrand(b=>({...b, avatars:[...(b.avatars||[]), nueva]}));
    setPersonaId(nueva.id); setPersonaSuggestions(null);
    notify("Persona agregada ✓");
  }

  // ✨ Sugerir conceptos — mismo patrón que ConceptsScreen, autocontenido para no depender del padre.
  async function sugerirConceptosRail() {
    setSuggestBusy(true); setConceptoSuggestions(null);
    try {
      const ctx = perfilCtx(perfil, avatarsParaPrompt());
      const existentes = conceptos.map(c=>`- ${c.concepto}`).join("\n") || "(ninguno aún)";
      const raw = await callClaude(`${COPY_BRAIN}\n\n${ctx}\nConceptos existentes:\n${existentes}\n${seedText.trim()?`\nContexto adicional (seed):\n${seedText.trim().slice(0,1500)}`:""}\n\nSugerí 3 ideas de concepto NUEVAS para un anuncio. JSON only:\n[{"concepto":"","angulo":""}]`, apiKey, 900, "Compositor: sugerir conceptos", null, "suggest");
      setConceptoSuggestions(extractJSON(raw));
    } catch(e) { notify("Error al sugerir: " + (e?.message||"")); }
    setSuggestBusy(false);
  }
  function aceptarConceptoSugerido(c) {
    const nuevo = { id:uid(), concepto:c.concepto, angulo:c.angulo||"", estilo:"", hook:"" };
    updateBrand(b=>({...b, conceptos:[...(b.conceptos||[]), nuevo]}));
    setConcepto(nuevo); setConceptoSuggestions(null);
    notify("Concepto agregado ✓");
  }

  // Guarda la config del rail (sin el resultado) para reusarla después con otro concepto.
  function guardarFlow() {
    if (!flowName.trim()) { notify("Ponle un nombre al flow"); return; }
    const nuevo = { id:uid(), name:flowName.trim(), personaId, conceptoId:concepto?.id||null, formato, prodFormat,
      estructuras:{}, customStyleId:null, hookId:hookFmtRap, anguloId:anguloRap, customEstructura, fecha:new Date().toISOString().split("T")[0] };
    updateBrand(b=>({...b, flows:[...(b.flows||[]), nuevo]}));
    setShowSaveFlow(false); setFlowName("");
    notify("Flow guardado ✓");
  }
  function cargarFlow(f) {
    setPersonaId(f.personaId||null);
    const c = conceptos.find(x=>x.id===f.conceptoId); if (c) setConcepto(c);
    setFormato(f.formato||"facebook"); setProdFormat(f.prodFormat||null);
    setAnguloRap(f.anguloId||null); setCustomEstructura(f.customEstructura||""); setHookFmtRap(f.hookId||null);
    notify(`Flow "${f.name}" cargado ✓`);
  }

  // Seed: subir documento — .txt vía FileReader, .pdf vía pdfjs (todo en el navegador, sin backend).
  async function handleSeedFile(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    try {
      if (isPdf) {
        setSeedBusy(true);
        const text = await extractPdfText(file);
        setSeedText(p => (p ? p+"\n\n" : "") + text.slice(0,20000));
      } else {
        const text = await file.text();
        setSeedText(p => (p ? p+"\n\n" : "") + text.slice(0,20000));
      }
      notify(`"${file.name}" agregado al seed ✓`);
    } catch (err) {
      notify("No se pudo leer el archivo: " + (err?.message||""));
    }
    setSeedBusy(false);
    e.target.value = "";
  }

  // Seed: link de YouTube → transcript (vía el backend hosteado — Apify, con Groq de respaldo).
  async function handleSeedYoutube() {
    if (!youtubeUrl.trim()) return;
    setSeedBusy(true);
    try {
      const result = await ingestLink(youtubeUrl.trim());
      if (result.status !== "done") throw new Error(result.error || "no se pudo traer la transcripción");
      setSeedText(p => (p ? p+"\n\n" : "") + (result.text || ""));
      setYoutubeUrl("");
      notify("Transcripción agregada al seed ✓");
    } catch (e) { notify("Error: " + (e?.message||"no se pudo traer la transcripción")); }
    setSeedBusy(false);
  }

  // ── Rail fase (builder visual: Seed→Persona→Concepto→Formato→Estructura→Hook) ──
  if (fase==="setup") {
    const angInfo = ANGULOS_RAPIDO.find(a=>a.id===anguloRap);
    const isVideoRail = formato==="video";
    const CARDS = [
      { id:"seed",       label:"Seed",       emoji:"🌱", done: !!seedText.trim() },
      { id:"persona",    label:"Persona",    emoji:"👤", done: !!personaId },
      { id:"concepto",   label:"Concepto",   emoji:"💡", done: !!concepto?.concepto },
      { id:"formato",    label:"Formato",    emoji:"📐", done: isVideoRail ? !!prodFormat : true },
      { id:"estructura", label:"Estructura", emoji:"🧱", done: !!anguloRap || !!customEstructura.trim() },
      { id:"hook",       label:"Hook",       emoji:"🎣", done: true },
    ];
    const recProds = anguloRap && angInfo ? angInfo.prods.map(id=>VIDEO_PROD_FORMATS.find(f=>f.id===id)).filter(Boolean) : [];
    const restProds = VIDEO_PROD_FORMATS.filter(f=>f.id!=="custom" && !(anguloRap && angInfo?.prods.includes(f.id)));
    const prodPool = anguloRap ? (showAllProdsRap ? [...recProds, ...restProds] : recProds) : VIDEO_PROD_FORMATS.filter(f=>f.id!=="custom");
    const recHooks = anguloRap && angInfo ? angInfo.hooks.map(id=>HOOK_FRAMEWORKS.find(f=>f.id===id)).filter(Boolean) : [];
    const recHookIds = new Set(recHooks.map(h=>h.id));
    const hookPool = anguloRap ? (showAllHooksRap ? HOOK_FRAMEWORKS : recHooks) : HOOK_FRAMEWORKS;
    const hooksByCat = hookPool.reduce((acc,h)=>{ (acc[h.cat]=acc[h.cat]||[]).push(h); return acc; },{});
    const readyToGenerate = !!concepto?.concepto && (!isVideoRail || !!prodFormat) && (!!anguloRap || !!customEstructura.trim());

    return (
      <div style={{ maxWidth:760 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:8, flexWrap:"wrap" }}>
          <SectionHeader title="Compositor" subtitle="Armá tu anuncio como un flujo: configurá cada tarjeta y generá."/>
          <div style={{ display:"flex", gap:8, flexShrink:0 }}>
            {(brand?.flows||[]).length>0 && (
              <select onChange={e=>{ const f=(brand?.flows||[]).find(x=>x.id===e.target.value); if(f) cargarFlow(f); e.target.value=""; }} defaultValue="" style={{ padding:"0 12px", height:34, fontSize:12, border:`1.5px solid ${T.gray}`, borderRadius:T.radiusPill, color:T.navy, background:T.surface, fontFamily:font }}>
                <option value="" disabled>Cargar flow…</option>
                {(brand?.flows||[]).map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            )}
            <Btn variant="ghost" small onClick={()=>setShowSaveFlow(v=>!v)}>💾 Guardar flow</Btn>
          </div>
        </div>
        {showSaveFlow && (
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            <input value={flowName} onChange={e=>setFlowName(e.target.value)} placeholder="Nombre del flow, ej. 'WhatsApp frío — Cocinas'" style={{ flex:1, padding:"9px 12px", fontSize:13, border:`1.5px solid ${T.purple}`, borderRadius:T.radiusInput, fontFamily:font, color:T.navy, outline:"none" }} autoFocus/>
            <Btn variant="primary" small onClick={guardarFlow}>Guardar</Btn>
          </div>
        )}

        {/* Rail: tarjetas conectadas */}
        <div style={{ display:"flex", alignItems:"flex-start", marginBottom:6, padding:"4px 0" }}>
          {CARDS.map((c,i)=>{
            const expanded = rapStep===c.id;
            return <Fragment key={c.id}>
              <div onClick={()=>setRapStep(expanded?null:c.id)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, cursor:"pointer", flexShrink:0 }}>
                <span style={{ width:34, height:34, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, background:expanded?T.purple:(c.done?T.purpleBg:T.surfaceInset), color:expanded?"#fff":(c.done?T.purple:T.slate), border:`2px solid ${expanded?T.purple:(c.done?T.purpleLight:T.gray)}`, boxShadow:expanded?T.shadowAccent:"none", transition:"all 0.15s" }}>{c.done && !expanded ? "✓" : c.emoji}</span>
                <span style={{ fontSize:10.5, fontWeight:expanded?700:500, color:expanded?T.purple:T.slate, whiteSpace:"nowrap" }}>{c.label}</span>
              </div>
              {i<CARDS.length-1 && <div style={{ height:2, flex:1, background:T.gray, marginTop:17, borderRadius:1 }}/>}
            </Fragment>;
          })}
        </div>

        {/* Panel de la tarjeta expandida */}
        <Card style={{ marginTop:18, marginBottom:20 }}>
          {!rapStep && <div style={{ fontSize:12, color:T.slate, textAlign:"center", padding:"14px 0" }}>Tocá una tarjeta arriba para configurarla.</div>}

          {rapStep==="seed" && (
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:4 }}>🌱 Seed — contexto extra (opcional)</div>
              <div style={{ fontSize:11.5, color:T.slate, marginBottom:10, lineHeight:1.5 }}>La marca, personas y bloques ya se usan automáticamente. Acá podés sumar texto libre, un documento o una transcripción para que la IA lo tenga en cuenta (ej. referenciar el estilo de un script que te gustó).</div>
              <textarea value={seedText} onChange={e=>setSeedText(e.target.value)} placeholder="Pegá texto, una transcripción, o instrucciones de referencia…" rows={4} style={{ width:"100%", boxSizing:"border-box", padding:"11px 13px", fontSize:13, border:`1.5px solid ${seedText.trim()?T.purple:T.gray}`, borderRadius:T.radiusInput, fontFamily:font, color:T.navy, lineHeight:1.6, resize:"vertical", outline:"none" }}/>
              <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap", alignItems:"center" }}>
                <label style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 13px", borderRadius:T.radiusPill, border:`1.5px solid ${T.gray}`, fontSize:12, color:seedBusy?T.slate:T.navy, cursor:seedBusy?"not-allowed":"pointer", opacity:seedBusy?0.6:1 }}>
                  📄 {seedBusy?"Leyendo…":"Subir documento (.txt/.pdf)"}
                  <input type="file" accept=".txt,.pdf" style={{ display:"none" }} onChange={handleSeedFile} disabled={seedBusy}/>
                </label>
                <input value={youtubeUrl} onChange={e=>setYoutubeUrl(e.target.value)} placeholder="Link de YouTube…" style={{ padding:"7px 11px", fontSize:12, border:`1.5px solid ${T.gray}`, borderRadius:T.radiusPill, fontFamily:font, color:T.navy, outline:"none", width:200 }}/>
                <Btn variant="ghost" small onClick={handleSeedYoutube} disabled={!youtubeUrl.trim()||seedBusy}>{seedBusy?"Trayendo…":"▶ Traer"}</Btn>
              </div>
              {seedText.trim() && <div style={{ fontSize:10.5, color:T.slate, marginTop:6 }}>{seedText.trim().length.toLocaleString()} caracteres en el seed.</div>}
            </div>
          )}

          {rapStep==="persona" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>👤 Persona (opcional)</div>
                <Btn variant="ghost" small onClick={sugerirPersonas} disabled={suggestBusy}>{suggestBusy?"…":"✨ Sugerir"}</Btn>
              </div>
              <div style={{ fontSize:11.5, color:T.slate, marginBottom:10 }}>Elegí a quién le hablás. Si no elegís ninguna, se usan todas tus personas guardadas.</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:10 }}>
                <div onClick={()=>setPersonaId(null)} style={{ padding:"9px 13px", borderRadius:T.radiusInput, border:`1.5px solid ${!personaId?T.purple:T.gray}`, background:!personaId?T.purpleBg:T.surface, cursor:"pointer", fontSize:12.5, fontWeight:!personaId?700:500, color:!personaId?T.purple:T.navy }}>Todas / sin especificar</div>
                {(brand?.avatars||[]).map(a=>(
                  <div key={a.id} onClick={()=>setPersonaId(personaId===a.id?null:a.id)} style={{ padding:"9px 13px", borderRadius:T.radiusInput, border:`1.5px solid ${personaId===a.id?T.purple:T.gray}`, background:personaId===a.id?T.purpleBg:T.surface, cursor:"pointer" }}>
                    <div style={{ fontSize:12.5, fontWeight:700, color:personaId===a.id?T.purple:T.navy }}>{a.name||a.nombre}</div>
                    {(a.desc||a.descripcion) && <div style={{ fontSize:11, color:T.slate, marginTop:2 }}>{(a.desc||a.descripcion).slice(0,90)}</div>}
                  </div>
                ))}
              </div>
              {personaSuggestions && (
                <div style={{ marginBottom:10, display:"flex", flexDirection:"column", gap:6 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:T.purple, textTransform:"uppercase", letterSpacing:"0.06em" }}>Sugerencias — click para agregar</div>
                  {personaSuggestions.map((p,i)=>(
                    <div key={i} onClick={()=>aceptarPersonaSugerida(p)} style={{ padding:"9px 13px", borderRadius:T.radiusInput, border:`1.5px dashed ${T.purpleLight}`, background:T.purpleBg, cursor:"pointer" }}>
                      <div style={{ fontSize:12.5, fontWeight:700, color:T.purple }}>+ {p.name}</div>
                      <div style={{ fontSize:11, color:T.slate, marginTop:2 }}>{p.desc}</div>
                    </div>
                  ))}
                </div>
              )}
              {!quickPersona ? (
                <Btn variant="ghost" small onClick={()=>setQuickPersona(true)}>+ Nueva persona rápida</Btn>
              ) : (
                <div style={{ padding:"10px 13px", background:T.surfaceInset, borderRadius:T.radiusInput, display:"flex", flexDirection:"column", gap:8 }}>
                  <input value={qpName} onChange={e=>setQpName(e.target.value)} placeholder="Nombre, ej. 'Dueña de restaurante, 35-45'" style={{ padding:"8px 11px", fontSize:12.5, border:`1.5px solid ${T.gray}`, borderRadius:T.radiusInput, fontFamily:font, color:T.navy, outline:"none" }}/>
                  <input value={qpPain} onChange={e=>setQpPain(e.target.value)} placeholder="Dolor principal" style={{ padding:"8px 11px", fontSize:12.5, border:`1.5px solid ${T.gray}`, borderRadius:T.radiusInput, fontFamily:font, color:T.navy, outline:"none" }}/>
                  <div style={{ display:"flex", gap:6 }}>
                    <Btn variant="primary" small onClick={()=>{ if(!qpName.trim())return; const nueva={id:uid(),name:qpName.trim(),desc:qpPain.trim(),pains:qpPain.trim()}; updateBrand(b=>({...b,avatars:[...(b.avatars||[]),nueva]})); setPersonaId(nueva.id); setQuickPersona(false); setQpName(""); setQpPain(""); notify("Persona agregada ✓"); }}>Guardar</Btn>
                    <Btn variant="ghost" small onClick={()=>setQuickPersona(false)}>Cancelar</Btn>
                  </div>
                </div>
              )}
            </div>
          )}

          {rapStep==="concepto" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>💡 Concepto <span style={{ color:T.red }}>*</span></div>
                <Btn variant="ghost" small onClick={sugerirConceptosRail} disabled={suggestBusy}>{suggestBusy?"…":"✨ Sugerir"}</Btn>
              </div>
              {conceptos.length===0 ? (
                <div>
                  <div style={{ fontSize:11.5, color:T.slate, marginBottom:8 }}>Todavía no tenés conceptos guardados. Escribí la idea central de este anuncio:</div>
                  <textarea value={concepto?.concepto||""} onChange={e=>setConcepto(e.target.value ? { id:"tmp_"+Date.now(), concepto:e.target.value, angulo:"", estilo:"" } : null)} placeholder="ej. La mayoría de dueños de restaurante pierde 30 min al día buscando dónde conseguir clientes nuevos…" rows={3} style={{ width:"100%", boxSizing:"border-box", padding:"11px 13px", fontSize:13, border:`1.5px solid ${concepto?.concepto?T.purple:T.gray}`, borderRadius:T.radiusInput, fontFamily:font, color:T.navy, lineHeight:1.6, resize:"vertical", outline:"none" }}/>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {conceptos.map(c=>{
                    const sel=concepto?.id===c.id;
                    return <div key={c.id} onClick={()=>setConcepto(sel?null:c)} style={{ padding:"9px 13px", borderRadius:T.radiusInput, border:`1.5px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:T.surface, cursor:"pointer" }}>
                      <div style={{ fontSize:12.5, fontWeight:600, color:T.navy }}>{c.concepto}</div>
                      {c.angulo && <div style={{ marginTop:4 }}><Chip>{c.angulo}</Chip></div>}
                    </div>;
                  })}
                  <Btn variant="ghost" small onClick={()=>setConcepto({ id:"tmp_"+Date.now(), concepto:"", angulo:"", estilo:"" })}>+ Escribir uno nuevo</Btn>
                  {concepto?.id?.toString().startsWith("tmp_") && (
                    <textarea value={concepto.concepto} onChange={e=>setConcepto(p=>({...p,concepto:e.target.value}))} placeholder="Escribí el concepto…" rows={2} autoFocus style={{ width:"100%", boxSizing:"border-box", padding:"9px 12px", fontSize:13, border:`1.5px solid ${T.purple}`, borderRadius:T.radiusInput, fontFamily:font, color:T.navy, resize:"vertical", outline:"none" }}/>
                  )}
                </div>
              )}
              {conceptoSuggestions && (
                <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:6 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:T.purple, textTransform:"uppercase", letterSpacing:"0.06em" }}>Sugerencias — click para agregar</div>
                  {conceptoSuggestions.map((c,i)=>(
                    <div key={i} onClick={()=>aceptarConceptoSugerido(c)} style={{ padding:"9px 13px", borderRadius:T.radiusInput, border:`1.5px dashed ${T.purpleLight}`, background:T.purpleBg, cursor:"pointer" }}>
                      <div style={{ fontSize:12.5, color:T.purple, fontWeight:700 }}>+ {c.concepto}</div>
                      {c.angulo && <div style={{ fontSize:11, color:T.slate, marginTop:2 }}>{c.angulo}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {rapStep==="formato" && (
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:10 }}>📐 Formato</div>
              <div style={{ display:"flex", gap:10, marginBottom:16 }}>
                {[{id:"facebook",emoji:"📘",label:"Facebook Ad Copy",desc:"Texto + titular."},{id:"video",emoji:"🎬",label:"Script de Video",desc:"Hook + guion hablado."}].map(f=>{
                  const sel=formato===f.id;
                  return <div key={f.id} onClick={()=>{ setFormato(f.id); if(f.id==="facebook") setProdFormat(null); }} style={{ flex:1, padding:"11px 13px", borderRadius:T.radiusInput, border:`1.5px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:T.surface, cursor:"pointer" }}>
                    <div style={{ fontSize:16, marginBottom:3 }}>{f.emoji}</div>
                    <div style={{ fontSize:12.5, fontWeight:700, color:sel?T.purple:T.navy }}>{f.label}</div>
                    <div style={{ fontSize:10.5, color:T.slate, marginTop:1 }}>{f.desc}</div>
                  </div>;
                })}
              </div>
              {isVideoRail && (
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:T.navy, marginBottom:3 }}>¿Cómo vas a grabar?</div>
                  <div style={{ fontSize:11, color:T.slate, marginBottom:10 }}>{anguloRap?<>Recomendados para <b style={{ color:T.purple }}>{angInfo?.label}</b>.</>:"Elegí un formato de grabación (o definí primero la Estructura para ver recomendaciones)."}</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {prodPool.map(f=>{
                      const sel=prodFormat===f.id;
                      return <div key={f.id} title={f.hint} onClick={()=>setProdFormat(sel?null:f.id)} style={{ padding:"9px 13px", borderRadius:T.radiusInput, border:`1.5px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:T.surface, cursor:"pointer", maxWidth:210 }}>
                        <div style={{ fontSize:11.5, fontWeight:700, color:sel?T.purple:T.navy }}>{f.label}</div>
                        <div style={{ fontSize:10, color:T.slate, marginTop:1, lineHeight:1.4 }}>{f.hint}</div>
                      </div>;
                    })}
                  </div>
                  {anguloRap && <div onClick={()=>setShowAllProdsRap(v=>!v)} style={{ fontSize:11, color:T.purple, fontWeight:600, cursor:"pointer", marginTop:8 }}>{showAllProdsRap?"− Ver solo los recomendados":"+ Ver todos los formatos"}</div>}
                </div>
              )}
            </div>
          )}

          {rapStep==="estructura" && (
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:4 }}>🧱 Estructura <span style={{ color:T.red }}>*</span></div>
              <div style={{ fontSize:11.5, color:T.slate, marginBottom:12 }}>Define el enfoque estratégico del anuncio — de ahí cuelga todo lo demás.</div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Temperatura del tráfico</div>
                <div style={{ display:"flex", gap:6 }}>
                  {[{id:"fria",label:"❄️ Fría"},{id:"tibia",label:"🌤 Tibia"},{id:"caliente",label:"🔥 Caliente"}].map(t=>(
                    <Chip key={t.id} selected={tempRap===t.id} onClick={()=>setTempRap(t.id)}>{t.label}</Chip>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12 }}>
                {ANGULOS_RAPIDO.map(a=>{
                  const sel=anguloRap===a.id;
                  return <div key={a.id} onClick={()=>{ setAnguloRap(sel?null:a.id); if(!sel){ setShowAllProdsRap(false); setShowAllHooksRap(false); } }} style={{ padding:"10px 13px", borderRadius:T.radiusInput, border:`1.5px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:T.surface, cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start" }}>
                    <span style={{ fontSize:16, flexShrink:0 }}>{a.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12.5, fontWeight:700, color:sel?T.purple:T.navy }}>{a.label}</div>
                      <div style={{ fontSize:11, color:T.slate, marginTop:2, lineHeight:1.45 }}>{a.desc}</div>
                    </div>
                    {sel && <span style={{ color:T.purple }}>✓</span>}
                  </div>;
                })}
              </div>
              {!showCustomEstructura ? (
                <Btn variant="ghost" small onClick={()=>setShowCustomEstructura(true)}>+ Crear la mía</Btn>
              ) : (
                <div>
                  <textarea value={customEstructura} onChange={e=>setCustomEstructura(e.target.value)} placeholder='ej. "Aplicá el estilo del script que puse en el Seed — hook de pregunta, 3 beneficios en bullet, cierre urgente"' rows={3} style={{ width:"100%", boxSizing:"border-box", padding:"10px 13px", fontSize:13, border:`1.5px solid ${customEstructura.trim()?T.purple:T.gray}`, borderRadius:T.radiusInput, fontFamily:font, color:T.navy, lineHeight:1.55, resize:"vertical", outline:"none" }}/>
                  <div style={{ fontSize:10.5, color:T.slate, marginTop:4 }}>Podés referenciar lo que pegaste en el Seed (ej. "copiá el estilo del script de Hormozi de ahí arriba").</div>
                </div>
              )}
            </div>
          )}

          {rapStep==="hook" && (
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:4 }}>🎣 Fórmula de hook (opcional)</div>
              <div style={{ fontSize:11.5, color:T.slate, marginBottom:12 }}>{anguloRap?<>Recomendadas para <b style={{ color:T.purple }}>{angInfo?.label}</b>.</>:"Definí la Estructura primero para ver recomendaciones, o elegí una fórmula igual."}</div>
              <div onClick={()=>setHookFmtRap(null)} style={{ padding:"10px 13px", borderRadius:T.radiusInput, border:`1.5px solid ${hookFmtRap===null?T.purple:T.gray}`, background:hookFmtRap===null?T.purpleBg:T.surface, cursor:"pointer", marginBottom:12, display:"flex", gap:9, alignItems:"center" }}>
                <span>✨</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:hookFmtRap===null?T.purple:T.navy }}>Auto — la IA elige el mejor hook</div>
                </div>
                {hookFmtRap===null && <span style={{ color:T.purple }}>✓</span>}
              </div>
              {Object.entries(hooksByCat).map(([cat,fws])=>(
                <div key={cat} style={{ marginBottom:12 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>{cat}</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {fws.map(fw=>(
                      <Chip key={fw.id} title={fw.desc} selected={hookFmtRap===fw.id} onClick={()=>setHookFmtRap(hookFmtRap===fw.id?null:fw.id)}>{recHookIds.has(fw.id) && showAllHooksRap && <span style={{ color:T.purple }}>★ </span>}{fw.label}</Chip>
                    ))}
                  </div>
                </div>
              ))}
              {anguloRap && <div onClick={()=>setShowAllHooksRap(v=>!v)} style={{ fontSize:11, color:T.purple, fontWeight:600, cursor:"pointer" }}>{showAllHooksRap?"− Ver solo las recomendadas":"+ Ver todas las fórmulas"}</div>}
            </div>
          )}
        </Card>

        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          <Btn variant="primary" onClick={generarRapido} disabled={busy||!readyToGenerate}>{busy?"Generando…":"⚡ Generar anuncio completo"}</Btn>
          <Btn variant="ghost" onClick={()=>{ if(!concepto?.concepto){ notify("Elegí o escribí un concepto primero"); return; } setBuildReady(false); setFase("build"); }}>🧩 Prefiero armarlo bloque por bloque</Btn>
        </div>
        {!readyToGenerate && <div style={{ fontSize:11, color:T.slate, marginTop:8 }}>Completá Concepto{isVideoRail?" y Formato de grabación":""} y una Estructura para poder generar.</div>}
      </div>
    );
  }

  // ── Build: gate de formato (se elige antes de entrar al compositor) ──
  if (fase==="build" && !buildReady) return (
    <div style={{ maxWidth:700 }}>
      <SectionHeader title="Compositor paso a paso" subtitle="Primero, ¿qué vas a crear?"/>
      {concepto && <div style={{ padding:"8px 14px", background:T.purpleBg, borderRadius:10, fontSize:12, color:T.purple, fontWeight:600, marginBottom:20 }}>💡 {concepto.concepto.slice(0,80)}{concepto.concepto.length>80?"…":""}</div>}
      <div style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:12 }}>¿Qué formato vas a crear?</div>
      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
        {[{id:"facebook",emoji:"📘",label:"Facebook Ad Copy",desc:"Texto + titular para Ads Manager."},{id:"video",emoji:"🎬",label:"Script de Video",desc:"Hook, dirección visual y script."}].map(f=>{
          const sel=formato===f.id;
          return <div key={f.id} onClick={()=>setFormato(f.id)} style={{ flex:1, padding:"12px 14px", borderRadius:10, border:`2px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:T.white, cursor:"pointer" }}>
            <div style={{ fontSize:18, marginBottom:4 }}>{f.emoji}</div>
            <div style={{ fontSize:13, fontWeight:700, color:sel?T.purple:T.navy }}>{f.label}</div>
            <div style={{ fontSize:11, color:T.slate, marginTop:2, lineHeight:1.5 }}>{f.desc}</div>
          </div>;
        })}
      </div>
      {formato==="video" && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:4 }}>¿Cómo vas a grabar el video?</div>
          <div style={{ fontSize:12, color:T.slate, marginBottom:12 }}>El formato de producción. La IA adaptará el guion y la dirección visual a esto.</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {VIDEO_PROD_FORMATS.filter(f=>f.id!=="custom").map(f=>{
              const sel=prodFormat===f.id;
              return <div key={f.id} title={f.hint} onClick={()=>setProdFormat(sel?null:f.id)} style={{ padding:"10px 14px", borderRadius:10, border:`2px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:T.white, cursor:"pointer", maxWidth:220 }}>
                <div style={{ fontSize:12, fontWeight:700, color:sel?T.purple:T.navy, marginBottom:2 }}>{f.label}</div>
                <div style={{ fontSize:10, color:T.slate, lineHeight:1.45 }}>{f.hint}</div>
              </div>;
            })}
          </div>
        </div>
      )}
      <div style={{ display:"flex", gap:8 }}>
        <Btn variant="ghost" onClick={()=>setFase("setup")}>← Volver</Btn>
        <Btn variant="primary" onClick={()=>setBuildReady(true)} disabled={formato==="video"&&!prodFormat}>Empezar a construir →</Btn>
      </div>
      {formato==="video"&&!prodFormat && <div style={{ fontSize:11, color:T.slate, marginTop:8 }}>Elige cómo grabarás el video para continuar.</div>}
    </div>
  );

  // ── Build fase ──
  if (fase==="build") return (
    <div style={{ position:"fixed", inset:0, zIndex:8000, background:"#F5F7FF", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Top bar */}
      <div style={{ background:T.white, borderBottom:`1px solid ${T.gray}`, padding:"0 20px", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, height:52 }}>
          <button onClick={()=>setBuildReady(false)} style={{ padding:"5px 12px", border:`1px solid ${T.gray}`, borderRadius:8, background:"transparent", cursor:"pointer", fontSize:12, fontFamily:font, color:T.slate, flexShrink:0 }}>← Configurar</button>
          <div style={{ flex:1, minWidth:0, fontSize:13, fontWeight:700, color:T.navy, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            Compositor · {formato==="facebook"?"📘 Facebook Ad":"🎬 Script de Video"}
            {concepto && <span style={{ fontWeight:400, color:T.purple, marginLeft:8 }}>💡 {concepto.concepto.slice(0,50)}{concepto.concepto.length>50?"…":""}</span>}
          </div>
          <div style={{ flexShrink:0, fontSize:11, color:T.slate, fontWeight:600 }}>{bloquesSeleccionados.length}/{pasos.length} bloques</div>
        </div>
      </div>

      {/* Contenido (una sola columna) */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* Generador */}
        <div style={{ flex:1, overflowY:"auto", padding:"28px 24px 140px" }}>
          <div style={{ maxWidth:600, margin:"0 auto" }}>
            {pasoInfo && (
              <>
                {/* Block header */}
                <div style={{ marginBottom:24 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <BlockBadge type={pasoInfo.tipo}/>
                    <div style={{ fontSize:11, color:T.slate, fontWeight:600 }}>Paso {pasoActual+1} de {pasos.length}</div>
                    <div style={{ flex:1, height:3, borderRadius:2, background:T.gray, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${Math.round((pasoActual+1)/pasos.length*100)}%`, background:T.purple, borderRadius:2, transition:"width 0.3s" }}/>
                    </div>
                  </div>
                  <div style={{ fontSize:22, fontWeight:800, color:T.navy, marginBottom:6 }}>{pasoInfo.label}</div>
                  <div style={{ fontSize:13, color:T.slate, lineHeight:1.65 }}>{pasoInfo.hint}</div>
                </div>

                {/* Concept context pill */}
                {concepto && <div style={{ padding:"7px 14px", background:T.purpleBg, borderRadius:10, fontSize:12, color:T.purple, fontWeight:600, marginBottom:22, textAlign:"center" }}>💡 {concepto.concepto.slice(0,70)}{concepto.concepto.length>70?"…":""}</div>}

                {/* HOOK STEP: selector tipo de bloque */}
                {isHookStep && (
                  <div style={{ marginBottom:24 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>¿Qué tipo de bloque lidera tu hook?</div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:8 }}>
                      {HOOK_BLOCK_TYPES.map(ht=>{
                        const sel=hookBlockType===ht.id;
                        return <div key={ht.id} onClick={()=>setHookBlockType(sel?null:ht.id)} style={{ padding:"11px 13px", borderRadius:12, border:`2px solid ${sel?ht.color:"#E5E7F0"}`, background:sel?ht.bg:T.white, cursor:"pointer", transition:"all 0.15s" }}>
                          <div style={{ fontSize:18, marginBottom:5 }}>{ht.emoji}</div>
                          <div style={{ fontSize:12, fontWeight:700, color:sel?ht.color:T.navy, marginBottom:3 }}>{ht.label}</div>
                          <div style={{ fontSize:10, color:T.slate, lineHeight:1.45 }}>{ht.desc}</div>
                        </div>;
                      })}
                    </div>
                    {hookBlockType && <div style={{ marginTop:8, fontSize:11, color:T.purple, fontWeight:600 }}>✓ Fórmulas sugeridas para este tipo activadas abajo</div>}
                  </div>
                )}

                {/* PROOF STEP: datos de prueba reales */}
                {isProofStep && (
                  <div style={{ marginBottom:24 }}>
                    {!proofData.trim() && !(perfil?.prueba_n_clientes||perfil?.prueba_caso||perfil?.prueba_resultado_clave||perfil?.prueba_autoridad) && (
                      <div style={{ padding:"11px 14px", background:"#FFF8EA", border:"1px solid #F0D080", borderRadius:10, fontSize:12, color:"#8a6212", lineHeight:1.55, marginBottom:12 }}>
                        ⚠ La prueba social necesita datos reales para no sonar genérica. Llénalos en <b>Marca → Prueba social</b>, o pégalos aquí abajo. Sin datos, la IA dejará espacios <span style={{ fontFamily:"monospace" }}>[entre corchetes]</span> para que los completes.
                      </div>
                    )}
                    <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>Datos de prueba reales (opcional si ya los tienes en Marca)</div>
                    <div style={{ fontSize:11, color:T.slate, marginBottom:10, lineHeight:1.55 }}>Ejemplos: "127 pedidos el mes pasado", "4.9 estrellas en Google (284 reseñas)", "Ana M. bajó 12 kg en 8 semanas"</div>
                    <textarea value={proofData} onChange={e=>setProofData(e.target.value)} placeholder="Tus números reales, reseñas, certificaciones, o resultados de clientes específicos…" rows={3} style={{ width:"100%", boxSizing:"border-box", padding:"12px 14px", fontSize:13, border:`1.5px solid ${proofData.trim()?T.purple:T.gray}`, borderRadius:10, fontFamily:font, color:T.navy, lineHeight:1.6, resize:"vertical", outline:"none", background:T.white }}/>
                  </div>
                )}

                {/* OFFER STEP: selector de oferta */}
                {isOfferStep && (
                  <div style={{ marginBottom:24 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>Selecciona la oferta de tu marca</div>
                    {offers.length===0
                      ? <div style={{ padding:"14px 16px", border:`1px dashed ${T.gray}`, borderRadius:10, fontSize:12, color:T.slate }}>Sin ofertas guardadas — agrégalas en tu Perfil de Marca para activar esta función.</div>
                      : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                          {offers.map(o=>{
                            const sel=offerSel?.id===o.id;
                            return <div key={o.id} onClick={()=>setOfferSel(sel?null:o)} style={{ padding:"12px 16px", borderRadius:10, border:`2px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:T.white, cursor:"pointer", display:"flex", gap:12, alignItems:"center" }}>
                              <span style={{ width:16,height:16,borderRadius:"50%",border:`2px solid ${sel?T.purple:"#ddd"}`,background:sel?T.purple:"transparent",flexShrink:0 }}/>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:13, fontWeight:600, color:T.navy }}>{o.nombre||o.name||"Oferta sin nombre"}</div>
                                {(o.descripcion||o.desc)&&<div style={{ fontSize:11, color:T.slate, marginTop:2 }}>{(o.descripcion||o.desc).slice(0,80)}{(o.descripcion||o.desc).length>80?"…":""}</div>}
                                {(o.precio||o.price)&&<div style={{ fontSize:11, color:T.purple, fontWeight:600, marginTop:2 }}>{o.precio||o.price}</div>}
                              </div>
                            </div>;
                          })}
                        </div>
                    }
                  </div>
                )}

                {/* CTA STEP: contexto de acción deseada */}
                {isCTAStep && (
                  <div style={{ marginBottom:24 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>¿Qué acción quieres que tome el usuario?</div>
                    <div style={{ fontSize:11, color:T.slate, marginBottom:10, lineHeight:1.55 }}>Ej: "Que agenden una consulta gratis", "Que hagan clic para pedir", "Que descarguen la guía", "Que envíen mensaje por WhatsApp"</div>
                    <textarea value={ctaContext} onChange={e=>setCtaContext(e.target.value)} placeholder="Describe la acción que quieres que realice el usuario…" rows={2} style={{ width:"100%", boxSizing:"border-box", padding:"12px 14px", fontSize:13, border:`1.5px solid ${ctaContext.trim()?T.purple:T.gray}`, borderRadius:10, fontFamily:font, color:T.navy, lineHeight:1.6, resize:"vertical", outline:"none", background:T.white }}/>
                  </div>
                )}

                {/* Selector de fórmula */}
                <div style={{ marginBottom:22 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>Elige una fórmula</div>
                  {(() => {
                    const customFmt = pasoInfo.formats.find(f=>f.id==="custom");
                    const Chip = (fmt) => {
                      const sel=formatSel===fmt.id;
                      return <div key={fmt.id} title={fmt.hint||""} onClick={()=>{setFormatSel(sel?null:fmt.id);if(fmt.id!=="custom")setFormatCustom("");}} style={{ padding:"7px 12px", borderRadius:20, border:`1.5px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:T.white, cursor:"pointer", fontSize:12, fontWeight:sel?700:400, color:sel?T.purple:T.navy, transition:"all 0.15s" }}>{fmt.label}</div>;
                    };
                    if (isHookStep) {
                      // El cerebro filtra: el tipo de bloque elegido activa SOLO sus fórmulas (HOOK_TYPE_FORMATS). Sin categorías.
                      if (!hookBlockType) {
                        return <div style={{ fontSize:12, color:T.slate, padding:"10px 14px", borderRadius:9, background:T.grayLight, border:`1px dashed ${T.gray}`, lineHeight:1.55 }}>Elige arriba el tipo de bloque que lidera tu hook y verás solo las fórmulas que tienen sentido para él.</div>;
                      }
                      const recIds = HOOK_TYPE_FORMATS[hookBlockType]||[];
                      const recFmts = recIds.map(id=>pasoInfo.formats.find(f=>f.id===id)).filter(Boolean);
                      return <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{recFmts.map(Chip)}{customFmt && Chip(customFmt)}</div>;
                    }
                    // No-hook: fórmulas del bloque. Oculta "Mecanismo insinuado" si la marca no definió un mecanismo.
                    const fmts = pasoInfo.formats.filter(f=>!(pasoInfo.id==="curiosity" && f.id==="mechanism" && !perfil?.mecanismo_nombrado?.trim()));
                    return <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{fmts.map(Chip)}</div>;
                  })()}
                  {formatSel && formatSel!=="custom" && (() => {
                    const f=pasoInfo.formats.find(x=>x.id===formatSel); if(!f) return null;
                    return <div style={{ marginTop:10, background:"#F8F9FF", border:`1px solid ${T.purpleLight}`, borderRadius:10, padding:"11px 14px" }}>
                      {f.ej && <div style={{ fontSize:13, color:T.navy, lineHeight:1.6 }}><span style={{ fontSize:10, fontWeight:700, color:T.purple, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:3 }}>Así se verá tu copy</span>"{f.ej}"</div>}
                      {f.hint && <div style={{ fontSize:11, color:T.slate, lineHeight:1.5, marginTop:f.ej?7:0, paddingTop:f.ej?7:0, borderTop:f.ej?`1px solid ${T.gray}`:"none" }}>💡 {f.hint}</div>}
                    </div>;
                  })()}
                  {formatSel==="custom" && (
                    <div style={{ marginTop:8 }}>
                      <input value={formatCustom} onChange={e=>setFormatCustom(e.target.value)} placeholder='Describe tu formato, ej. "Lista de 3 puntos con emoji, cada uno empezando con un número de impacto"' style={{ width:"100%",boxSizing:"border-box",padding:"10px 14px",fontSize:13,border:`1.5px solid ${T.purple}`,borderRadius:10,fontFamily:font,color:T.navy,outline:"none" }}/>
                    </div>
                  )}
                </div>

                {/* Botón generar */}
                <div style={{ marginBottom:22 }}>
                  <Btn variant="primary" onClick={generarBloque} disabled={genBusy||(formatSel==="custom"&&!formatCustom.trim())} full>{genBusy?"Generando…":"✨ Generar opciones"}</Btn>
                </div>

                {/* Resultados */}
                {resultados.length>0 && (
                  <div>
                    <div style={{ fontSize:11,fontWeight:700,color:T.slate,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12 }}>{resultados.length} opciones — elige la mejor</div>
                    {resultados.map(r=>{
                      const selected=bloques[pasoInfo.id]?._id===r._id;
                      return <div key={r._id} style={{ background:selected?"#EDFAF4":T.white,border:`1.5px solid ${selected?"#1A9E6E":T.gray}`,borderLeft:`4px solid ${tp(r.tipo).color}`,borderRadius:12,padding:"14px 16px",marginBottom:10 }}>
                        <div style={{ display:"flex",gap:10,alignItems:"flex-start" }}>
                          <div style={{ flex:1 }}>
                            {editando===r._id
                              ? <textarea value={r.text} onChange={e=>setResultados(resultados.map(x=>x._id===r._id?{...x,text:e.target.value}:x))} style={{ width:"100%",boxSizing:"border-box",padding:"8px",fontSize:13,border:`1.5px solid ${T.purple}`,borderRadius:8,fontFamily:font,color:T.navy,lineHeight:1.65,resize:"vertical",minHeight:70 }} autoFocus onBlur={()=>setEditando(null)}/>
                              : <div style={{ fontSize:14,color:T.navy,lineHeight:1.7 }}>{r.text}</div>}
                            {r.visual&&<div style={{ fontSize:11,color:T.slate,marginTop:5 }}>📷 {r.visual}</div>}
                            {r.sound&&<div style={{ fontSize:11,color:T.slate,marginTop:2 }}>🎵 {r.sound}</div>}
                            {pasoInfo.id==="headline"&&<div style={{ fontSize:10,color:r.text.length>40?"#D94F4F":T.slate,marginTop:4 }}>{r.text.length} caracteres {r.text.length>40?"⚠ muy largo":""}</div>}
                          </div>
                          <div style={{ display:"flex",flexDirection:"column",gap:5,flexShrink:0 }}>
                            <button onClick={()=>seleccionarBloque(r)} style={{ padding:"7px 14px",fontSize:11,borderRadius:16,cursor:"pointer",fontFamily:font,border:`1px solid ${selected?"#1A9E6E":T.purple}`,background:selected?"#EDFAF4":T.purpleBg,color:selected?"#1A9E6E":T.purple,fontWeight:700,whiteSpace:"nowrap" }}>{selected?"✓ Elegido":"Usar este"}</button>
                            <button onClick={()=>setEditando(r._id)} style={{ padding:"5px 10px",fontSize:11,borderRadius:16,border:`1px solid ${T.gray}`,background:"transparent",color:T.slate,cursor:"pointer",fontFamily:font }}>Editar</button>
                            <button onClick={()=>guardarEnBanco(r)} style={{ padding:"5px 10px",fontSize:11,borderRadius:16,border:`1px solid ${T.gray}`,background:"transparent",color:T.slate,cursor:"pointer",fontFamily:font }}>Al banco</button>
                          </div>
                        </div>
                      </div>;
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {/* Barra de milestones (gamificada) + navegación */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, background:T.white, borderTop:`1px solid ${T.gray}`, padding:"12px 20px 14px", display:"flex", flexDirection:"column", gap:10, boxShadow:"0 -4px 16px rgba(24,19,73,0.05)" }}>
        {/* Track de milestones */}
        <div style={{ display:"flex", alignItems:"center", maxWidth:760, margin:"0 auto", width:"100%" }}>
          {pasos.map((p,i)=>{
            const info=BLOCK_ORDER.find(x=>x.id===p); const done=!!bloques[p]; const active=pasoActual===i;
            const c = active?T.purple:done?"#1A9E6E":"#CBD0E0";
            return (
              <div key={p} style={{ display:"flex", alignItems:"center", flex:i<pasos.length-1?1:"0 0 auto" }}>
                <button onClick={()=>goToStep(i)} title={info?.label} style={{ width:26, height:26, borderRadius:"50%", border:`2px solid ${c}`, background:done||active?c:"transparent", color:done||active?"#fff":T.slate, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0, fontFamily:font, boxShadow:active?`0 0 0 4px ${T.purpleBg}`:"none", transition:"all 0.2s" }}>
                  {done&&!active?"✓":i+1}
                </button>
                {i<pasos.length-1 && <div style={{ flex:1, height:3, background:done?"#1A9E6E":"#E5E7F0", margin:"0 4px", borderRadius:2, transition:"background 0.3s" }}/>}
              </div>
            );
          })}
        </div>
        {/* Microcopy + navegación */}
        <div style={{ display:"flex", alignItems:"center", gap:10, maxWidth:760, margin:"0 auto", width:"100%" }}>
          <Btn variant="ghost" onClick={()=>{ if(pasoActual>0) goToStep(pasoActual-1); else setFase("setup"); }}>← Atrás</Btn>
          <div style={{ flex:1, textAlign:"center", fontSize:12, fontWeight:600, color:progreso===100?"#1A9E6E":T.slate }}>
            {progreso===100 ? "🎉 ¡Todos los bloques listos!" : `${bloquesSeleccionados.length}/${pasos.length} bloques · ${progreso}%`}
          </div>
          {bloquesSeleccionados.length>=2 && <Btn variant="soft" onClick={()=>setFase("assemble")}>Previsualizar →</Btn>}
          {bloques[pasoInfo?.id]
            ? <Btn variant="primary" onClick={()=>{ const nxt=pasoActual+1; if(nxt<pasos.length) goToStep(nxt); else setFase("assemble"); }}>Siguiente →</Btn>
            : <Btn variant="ghost" onClick={()=>{ const nxt=pasoActual+1; if(nxt<pasos.length) goToStep(nxt); else setFase("assemble"); }}>Saltar →</Btn>
          }
        </div>
      </div>
    </div>
  );

  // ── Previsualización (antes de unir) ──
  if (fase==="assemble"&&!output) return (
    <div style={{ position:"fixed", inset:0, zIndex:8000, background:"#F5F7FF", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Top bar */}
      <div style={{ background:T.white, borderBottom:`1px solid ${T.gray}`, padding:"0 20px", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, height:52 }}>
          <button onClick={()=>setFase("build")} style={{ padding:"5px 12px", border:`1px solid ${T.gray}`, borderRadius:8, background:"transparent", cursor:"pointer", fontSize:12, fontFamily:font, color:T.slate, flexShrink:0 }}>← Seguir construyendo</button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>Previsualización · {formato==="facebook"?"📘 Facebook Ad":"🎬 Script de Video"}</div>
            {concepto&&<div style={{ fontSize:11, color:T.purple, marginTop:1 }}>💡 {concepto.concepto}</div>}
          </div>
        </div>
      </div>
      {/* Contenido: borrador del anuncio (una columna) */}
      <div style={{ flex:1, overflowY:"auto", padding:"28px 24px 120px" }}>
        <div style={{ maxWidth:600, margin:"0 auto" }}>
          <div style={{ fontSize:13, color:T.slate, lineHeight:1.6, marginBottom:18 }}>Así se leerá tu anuncio bloque por bloque. Revisa el orden y el contenido antes de unirlo. Toca <b>Editar</b> para volver a generar cualquier bloque.</div>
          {/* Borrador: bloques en orden de lectura */}
          <div style={{ background:T.white, borderRadius:14, border:`1.5px solid ${T.gray}`, padding:"8px 4px", marginBottom:18 }}>
            {pasos.filter(p=>bloques[p]).map((p,i)=>{
              const info=BLOCK_ORDER.find(x=>x.id===p); const b=bloques[p]; const tc=tp(b.tipo);
              return <div key={p} style={{ padding:"14px 18px", borderBottom: i<bloquesSeleccionados.length-1?`1px solid ${T.grayLight}`:"none", display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ width:4, alignSelf:"stretch", borderRadius:2, background:tc.color, flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", gap:6, marginBottom:6, alignItems:"center" }}><BlockBadge type={b.tipo}/><FuncTag f={b.funcs?.[0]||"body"}/></div>
                  <div style={{ fontSize:14, color:T.navy, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{b.text}</div>
                  {b.visual&&<div style={{ fontSize:11, color:T.slate, marginTop:4 }}>📷 {b.visual}</div>}
                  {b.sound&&<div style={{ fontSize:11, color:T.slate, marginTop:2 }}>🎵 {b.sound}</div>}
                </div>
                <button onClick={()=>{setPasoActual(pasos.indexOf(p));setFase("build");setResultados([]);setFormatSel(null);setFormatCustom("");}} style={{ fontSize:11, padding:"4px 10px", border:`1px solid ${T.gray}`, borderRadius:8, background:"transparent", color:T.slate, cursor:"pointer", fontFamily:font, flexShrink:0 }}>Editar</button>
              </div>;
            })}
          </div>
          {pasos.filter(p=>!bloques[p]).length>0&&<div style={{ padding:"10px 14px", background:"#FFF8EA", borderRadius:10, border:"1px solid #F0D080", fontSize:12, color:"#C07C10", lineHeight:1.5 }}>Pasos sin bloque (se omitirán): {pasos.filter(p=>!bloques[p]).map(p=>BLOCK_ORDER.find(x=>x.id===p)?.label).join(", ")}</div>}
        </div>
      </div>
      {/* Barra inferior: unir */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, background:T.white, borderTop:`1px solid ${T.gray}`, padding:"14px 20px", boxShadow:"0 -4px 16px rgba(24,19,73,0.05)" }}>
        <div style={{ maxWidth:600, margin:"0 auto", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ flex:1, fontSize:12, color:T.slate }}>{bloquesSeleccionados.length} bloques listos para unir</div>
          <Btn variant="primary" onClick={ensamblar} disabled={busy||bloquesSeleccionados.length<2}>{busy?"Uniendo…":"✨ Unir y generar copy final"}</Btn>
        </div>
        {bloquesSeleccionados.length<2&&<div style={{ fontSize:11, color:T.slate, marginTop:8, textAlign:"center" }}>Necesitas al menos 2 bloques para unir.</div>}
      </div>
    </div>
  );

  // ── Armador: copy rápido unido en una sola pieza, lista para copiar y guardar ──
  if (output && armando) {
    const finalText = outputEditado || outputEmoji || output.raw;
    return (
      <div style={{ maxWidth:720 }}>
      <SectionHeader title="Copy armado" subtitle="Todos los bloques unidos en un copy completo, listo para copiar y guardar."/>
        <div style={{ fontSize:11, fontFamily:"monospace", color:T.slate, marginBottom:14, padding:"6px 12px", background:T.grayLight, borderRadius:7, display:"inline-block" }}>{output.tag}</div>
        <div style={{ background:T.white, borderRadius:14, border:`1.5px solid ${T.gray}`, overflow:"hidden", marginBottom:16, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ padding:"13px 18px", borderBottom:`1px solid ${T.gray}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:output.type==="facebook"?"#EEF4FF":"#F0F8FF" }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.navy, textTransform:"uppercase", letterSpacing:"0.08em" }}>{output.type==="facebook"?"📘 Facebook Ad Copy":"🎬 Script de Video"}</div>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={()=>{ setEditandoOutput(v=>!v); if(!outputEditado) setOutputEditado(outputEmoji||output.raw); }} style={{ padding:"5px 12px", fontSize:11, border:`1px solid ${T.gray}`, borderRadius:8, background:"transparent", cursor:"pointer", fontFamily:font, color:T.slate }}>{editandoOutput?"✓ Listo":"Editar"}</button>
              <CopyBtn text={finalText} small/>
            </div>
          </div>
          <div style={{ padding:"22px 24px" }}>
            {editandoOutput
              ? <textarea value={outputEditado} onChange={e=>setOutputEditado(e.target.value)} style={{ width:"100%", boxSizing:"border-box", fontSize:14, lineHeight:1.9, border:`1.5px solid ${T.purple}`, borderRadius:10, padding:"14px 16px", fontFamily:font, color:T.navy, resize:"vertical", minHeight:300, outline:"none" }} autoFocus/>
              : <div style={{ fontSize:14, lineHeight:1.95, color:T.navy, whiteSpace:"pre-wrap" }}>{finalText}</div>
            }
          </div>
        </div>
        {output.type==="facebook"&&!outputEmoji&&!editandoOutput&&(
          <div style={{ marginBottom:16 }}>
            <Btn variant="ghost" onClick={agregarEmojis} disabled={busy}>{busy?"Agregando emojis…":"✨ Agregar emojis"}</Btn>
          </div>
        )}
        {outputEmoji&&!editandoOutput&&<div style={{ marginBottom:16,padding:"10px 14px",background:"#EDFAF4",borderRadius:10,border:"1px solid #9EE0C6",fontSize:12,color:"#1A9E6E" }}>✓ Versión con emojis lista</div>}
        {copyGuardado && <div style={{ marginBottom:16, padding:"12px 16px", background:"#EDFAF4", borderRadius:10, border:"1px solid #9EE0C6", fontSize:12, color:"#1A9E6E", fontWeight:600 }}>✓ Guardado en tu banco de copies</div>}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <Btn variant="primary" onClick={()=>guardarCopyRap("winner")}>🏆 Guardar como ganador</Btn>
          <Btn variant="soft" onClick={()=>guardarCopyRap("testing")}>💾 Guardar en banco de copies</Btn>
          <Btn variant="ghost" onClick={()=>{ setArmando(false); setEditandoOutput(false); }}>← Volver a los bloques</Btn>
        </div>
      </div>
    );
  }

  // ── Output fase ──
  if (output) return (
    <div style={{ maxWidth:720 }}>
      <SectionHeader title="Copy final" subtitle="Listo para copiar y usar."/>
      <div style={{ fontSize:11, fontFamily:"monospace", color:T.slate, marginBottom:14, padding:"6px 12px", background:T.grayLight, borderRadius:7, display:"inline-block" }}>{output.tag}</div>
      {(output.isRapido && output.bloques?.length) ? (
        /* ── Output rápido: bloques separados (hook / cuerpo / cta), editables y guardables ── */
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.navy, textTransform:"uppercase", letterSpacing:"0.08em" }}>{output.type==="facebook"?"📘 Facebook Ad Copy":"🎬 Script de Video"}</div>
            <CopyBtn text={output.raw} small/>
          </div>
          <div style={{ fontSize:11, color:T.slate, marginBottom:12, lineHeight:1.5 }}>La IA dividió el anuncio en bloques y los clasificó por tipo. Editalos inline o guardalos al banco para reusarlos.</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {output.bloques.map(b=>{
              const tc=tp(b.tipo); const editing=editRapKey===b.key;
              return <div key={b.key} style={{ background:T.white, borderRadius:12, border:`1.5px solid ${tc.border}`, overflow:"hidden", boxShadow:"0 1px 6px rgba(0,0,0,0.04)" }}>
                <div style={{ padding:"9px 14px", background:tc.bg, display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}><BlockBadge type={b.tipo}/><FuncTag f={b.func}/></div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={()=>setEditRapKey(editing?null:b.key)} style={{ padding:"4px 11px", fontSize:11, border:`1px solid ${editing?T.purple:T.gray}`, borderRadius:14, background:editing?T.purpleBg:"transparent", cursor:"pointer", fontFamily:font, color:editing?T.purple:T.slate, fontWeight:editing?700:400 }}>{editing?"✓ Listo":"Editar"}</button>
                    <button onClick={()=>guardarEnBanco({tipo:b.tipo,funcs:[b.func],text:b.text,tags:[anguloRap&&("angulo:"+anguloRap),hookFmtRap&&("hook:"+hookFmtRap)].filter(Boolean)})} style={{ padding:"4px 11px", fontSize:11, border:`1px solid ${T.gray}`, borderRadius:14, background:"transparent", cursor:"pointer", fontFamily:font, color:T.slate }}>Al banco</button>
                    <CopyBtn text={b.text} small/>
                  </div>
                </div>
                <div style={{ padding:"13px 16px" }}>
                  {editing
                    ? <textarea value={b.text} onChange={e=>updateRapBloque(b.key,e.target.value)} style={{ width:"100%", boxSizing:"border-box", fontSize:14, lineHeight:1.75, border:`1.5px solid ${T.purple}`, borderRadius:9, padding:"10px 12px", fontFamily:font, color:T.navy, resize:"vertical", minHeight:90, outline:"none" }} autoFocus/>
                    : <div style={{ fontSize:14, lineHeight:1.8, color:T.navy, whiteSpace:"pre-wrap" }}>{b.text}</div>}
                </div>
              </div>;
            })}
          </div>
          {output.headline && <div style={{ marginTop:10, padding:"10px 14px", background:"#EEF5FF", borderRadius:10, border:"1px solid #A8CCFA", fontSize:12, color:T.navy }}><b style={{ color:T.proof.color }}>📰 Headline:</b> {output.headline}</div>}
          {output.instrucciones && (
            <div style={{ marginTop:10, padding:"12px 16px", background:"#F0F8FF", borderRadius:10, border:`1px solid #BfE0E8` }}>
              <div style={{ fontSize:10, fontWeight:700, color:T.offer.color, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:5 }}>🎬 Cómo grabar este video</div>
              <div style={{ fontSize:13, color:T.navy, lineHeight:1.7 }}>{output.instrucciones}</div>
            </div>
          )}
          <div style={{ marginTop:14, display:"flex", gap:8, flexWrap:"wrap" }}>
            <Btn variant="primary" onClick={()=>{ setOutputEditado(""); setOutputEmoji(""); setCopyGuardado(false); setArmando(true); }}>🧩 Armar copy final →</Btn>
            <Btn variant="soft" onClick={guardarBloquesRap}>💾 Guardar bloques al banco</Btn>
          </div>
        </div>
      ) : (
      <div style={{ background:T.white, borderRadius:14, border:`1.5px solid ${T.gray}`, overflow:"hidden", marginBottom:16, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ padding:"13px 18px", borderBottom:`1px solid ${T.gray}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:output.type==="facebook"?"#EEF4FF":"#F0F8FF" }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.navy, textTransform:"uppercase", letterSpacing:"0.08em" }}>{output.type==="facebook"?"📘 Facebook Ad Copy":"🎬 Script de Video"}</div>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={()=>{ setEditandoOutput(v=>!v); if(!outputEditado) setOutputEditado(outputEmoji||output.raw); }} style={{ padding:"5px 12px", fontSize:11, border:`1px solid ${T.gray}`, borderRadius:8, background:"transparent", cursor:"pointer", fontFamily:font, color:T.slate }}>Editar</button>
            <CopyBtn text={outputEditado||outputEmoji||output.raw} small/>
          </div>
        </div>
        <div style={{ padding:"22px 24px" }}>
          {editandoOutput
            ? <textarea value={outputEditado} onChange={e=>setOutputEditado(e.target.value)} style={{ width:"100%", boxSizing:"border-box", fontSize:14, lineHeight:1.9, border:`1.5px solid ${T.purple}`, borderRadius:10, padding:"14px 16px", fontFamily:font, color:T.navy, resize:"vertical", minHeight:300, outline:"none" }} autoFocus/>
            : <div style={{ fontSize:14, lineHeight:1.95, color:T.navy, whiteSpace:"pre-wrap" }}>{outputEditado||outputEmoji||output.raw}</div>
          }
        </div>
      </div>
      )}
      {output.type==="facebook"&&!output.isRapido&&!outputEmoji&&!outputEditado&&(
        <div style={{ marginBottom:16 }}>
          <Btn variant="ghost" onClick={agregarEmojis} disabled={busy}>{busy?"Agregando emojis…":"✨ Agregar emojis"}</Btn>
        </div>
      )}
      {outputEmoji&&!outputEditado&&<div style={{ marginBottom:16,padding:"10px 14px",background:"#EDFAF4",borderRadius:10,border:"1px solid #9EE0C6",fontSize:12,color:"#1A9E6E" }}>✓ Versión con emojis lista</div>}
      {/* Source blocks — solo para compositor paso a paso */}
      {!output.isRapido && bloquesSeleccionados.length>0 && (
        <div style={{ background:T.white, borderRadius:12, border:`1px solid ${T.gray}`, padding:"14px 16px", marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>Bloques usados ({bloquesSeleccionados.length})</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {pasos.filter(p=>bloques[p]).map(p=>{
              const info=BLOCK_ORDER.find(x=>x.id===p); const b=bloques[p]; const tc=tp(b.tipo);
              return <div key={p} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"9px 12px", borderRadius:8, background:tc.bg, border:`1px solid ${tc.border}` }}>
                <span style={{ fontSize:13, flexShrink:0 }}>{info?.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:9, fontWeight:700, color:tc.color, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:3 }}>{info?.label}</div>
                  <div style={{ fontSize:12, color:T.navy, lineHeight:1.6 }}>{b.text}</div>
                </div>
              </div>;
            })}
          </div>
        </div>
      )}
      <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
        <Btn variant="primary" onClick={()=>{setOutput(null);setBloques({});setPasoActual(0);setResultados([]);setConcepto(null);setFase("setup");setOutputEditado("");setOutputEmoji("");setEditandoOutput(false);setAnguloRap(null);setHookFmtRap(null);setProdFormat(null);setRapStep("seed");setBuildReady(false);setEditRapKey(null);setArmando(false);setCopyGuardado(false);}}>Crear otro</Btn>
        {!output.isRapido && <Btn variant="ghost" onClick={()=>{setOutput(null);setFase("assemble");setOutputEditado("");setEditandoOutput(false);}}>← Editar bloques</Btn>}
        {output.isRapido && <Btn variant="ghost" onClick={()=>{setOutput(null);setFase("setup");setRapStep("estructura");setOutputEditado("");setOutputEmoji("");setEditandoOutput(false);setEditRapKey(null);setArmando(false);setCopyGuardado(false);}}>← Cambiar estructura</Btn>}
        <Btn variant="ghost" onClick={output.isRapido?generarRapido:ensamblar} disabled={busy}>{busy?"Regenerando…":"↻ Regenerar"}</Btn>
      </div>
    </div>
  );

  return null;
}

// ─── OFFER GENERATOR ──────────────────────────────────────────────────────────
function OfferScreen({ assets, perfil, busy, setBusy, apiKey, notify, updateBrand }) {
  const [ofText, setOfText] = useState("");
  const [ofFw,   setOfFw]   = useState("pain_curiosity");
  const [ofRes,  setOfRes]  = useState(null);
  const [ofSel,  setOfSel]  = useState([]);

  async function generate(more=false) {
    if (!ofText.trim()) { notify("Describe tu oferta primero"); return; }
    setBusy(true); if (!more) { setOfRes(null); setOfSel([]); }
    try {
      const fw = HOOK_FRAMEWORKS.find(f=>f.id===ofFw);
      const ctx = perfilCtx(perfil, brand?.avatars);
      // RAG: ejemplos reales de hooks y headlines ganadores para esta oferta.
      const ej = bancoCtx("hook", { vertical: verticalDeIndustria(brand?.industry) }) + bancoCtx("headline", { vertical: verticalDeIndustria(brand?.industry), n: 2 });
      const raw = await callClaude(`${COPY_BRAIN}\n\n${ctx}${ej}\n\nOffer: "${ofText}"\n\nFramework to apply: ${fw?.label} — ${fw?.desc}\nExample: "${fw?.example}"\n\nGenerate ${more?"NEW (different from before)":"variations"} applying this framework + HOOK RULES:\n- 3 HEADLINES (max 40 chars, apply HEADLINE RULES)\n- 3 HOOKS (1-2 lines max, specific, punchy)\n\nJSON only:\n{"headlines":["..."],"hooks":["..."]}`, apiKey, 1400, `Armar copy: ${fw?.label||"oferta"}`);
      const parsed = JSON.parse(raw.replace(/```json|```/g,"").trim());
      setOfRes(parsed); if (!more) setOfSel([]);
    } catch(e) { console.error("offer error:", e); notify("Error: " + (e?.message || "intenta de nuevo")); }
    setBusy(false);
  }

  function saveSel() {
    if (!ofSel.length||!ofRes) return;
    const toSave = ofSel.map(key=>{
      const [type,i] = key.split("-");
      const text = type==="h"?ofRes.headlines[i]:ofRes.hooks[i];
      return { id:uid(), tipo:type==="h"?"offer":"curiosity", funcs:type==="h"?["headline"]:["hook"], tags:type==="h"?["headline","offer-generated"]:["hook","offer-generated"], text };
    });
    updateBrand(b=>({...b, assets:[...(b.assets||[]),...toSave]}));
    notify(`${toSave.length} block(s) saved to bank`); setOfSel([]);
  }

  return (
    <div style={{ maxWidth:780 }}>
      <SectionHeader title="Generador rápido" subtitle="Describe tu oferta → elige un framework → genera hooks y headlines → guarda los mejores."/>
      <Inp label="Tu oferta" multiline rows={3} placeholder="e.g. 6-week Meta Ads bootcamp, 1:1 mentorship, real projects, verifiable portfolio. For LATAM entrepreneurs." value={ofText} onChange={e=>setOfText(e.target.value)}/>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.slate, marginBottom:10 }}>Hook framework</div>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {HOOK_FRAMEWORKS.map(fw=>(
            <div key={fw.id} onClick={()=>setOfFw(fw.id)} style={{ padding:"10px 14px", borderRadius:9, border:`1.5px solid ${ofFw===fw.id?T.purple:T.gray}`, background:ofFw===fw.id?T.purpleBg:T.white, cursor:"pointer" }}>
              <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                <span style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${ofFw===fw.id?T.purple:T.gray}`, background:ofFw===fw.id?T.purple:"transparent", flexShrink:0, marginTop:2 }}/>
                <div><div style={{ fontSize:12, fontWeight:700, color:ofFw===fw.id?T.purple:T.navy, marginBottom:2 }}>{fw.label}</div><div style={{ fontSize:11, color:T.slate }}>{fw.desc}</div>{ofFw===fw.id && <div style={{ fontSize:11, color:T.purple, marginTop:3, fontStyle:"italic" }}>"{fw.example}"</div>}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        <Btn variant="primary" onClick={()=>generate(false)} disabled={busy}>{busy?"Generando…":"✨ Generate 3+3"}</Btn>
        {ofRes && <Btn variant="ghost" onClick={()=>generate(true)} disabled={busy}>3 more variations</Btn>}
      </div>
      {ofRes && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:FC.headline, marginBottom:8 }}>Headlines</div>
              {ofRes.headlines.map((h,i)=>{const key=`h-${i}`;const sel=ofSel.includes(key);return(
                <div key={key} onClick={()=>setOfSel(p=>sel?p.filter(x=>x!==key):[...p,key])} style={{ padding:"10px 12px", marginBottom:6, borderRadius:9, border:`1.5px solid ${sel?"#2878D4":T.gray}`, background:sel?"#EEF5FF":T.white, cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start" }}>
                  <span style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${sel?"#2878D4":T.gray}`, background:sel?"#2878D4":"transparent", flexShrink:0, marginTop:1 }}/>
                  <div><div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{h}</div><div style={{ fontSize:10, color:h.length>40?"#D94F4F":T.slate, marginTop:2 }}>{h.length} chars {h.length>40?"⚠ demasiado largo":""}</div></div>
                </div>
              );})}
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:FC.hook, marginBottom:8 }}>Hooks</div>
              {ofRes.hooks.map((h,i)=>{const key=`k-${i}`;const sel=ofSel.includes(key);return(
                <div key={key} onClick={()=>setOfSel(p=>sel?p.filter(x=>x!==key):[...p,key])} style={{ padding:"10px 12px", marginBottom:6, borderRadius:9, border:`1.5px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:T.white, cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start" }}>
                  <span style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${sel?T.purple:T.gray}`, background:sel?T.purple:"transparent", flexShrink:0, marginTop:1 }}/>
                  <div style={{ fontSize:13, color:T.navy, lineHeight:1.5 }}>{h}</div>
                </div>
              );})}
            </div>
          </div>
          {ofSel.length>0 && <div style={{ marginTop:14 }}><Btn variant="primary" onClick={saveSel}>💾 Save {ofSel.length} to block bank</Btn></div>}
        </div>
      )}
    </div>
  );
}

// ─── TRANSCRIPT ───────────────────────────────────────────────────────────────
function TranscriptScreen({ busy, setBusy, apiKey, notify, updateBrand }) {
  const [trText, setTrText] = useState("");
  const [trRes,  setTrRes]  = useState([]);
  const [trSel,  setTrSel]  = useState([]);

  async function importTranscript() {
    if (!trText.trim()) return; setBusy(true); setTrRes([]); setTrSel([]);
    try {
      const raw = await callClaude(`${COPY_BRAIN}\n\nAnaliza esta transcripción y extrae bloques de copy reutilizables para Meta Ads en español.\n\nREGLAS:\n- Cada bloque: COMPLETO y autocontenido, mínimo 15 palabras, 1-3 oraciones con contexto\n- Preserva el lenguaje real y detalles específicos del hablante (fechas, números, nombres)\n- Prioriza: dolores específicos, transformaciones con datos, objeciones reales, prueba social\n- 6-10 bloques — pocos y buenos, no fragmentos sueltos\n- TIPOS: pain (situación actual), promise (transformación), proof (resultado real+dato), curiosity (mecanismo único), constraints (freno/objeción), conditions (urgencia)\n- FUNCS: hook (primera línea), body (desarrollo), headline (<40 chars)\n\nIMPORTANTE: Responde SOLO JSON, sin markdown:\n[{"tipo":"pain","funcs":["hook"],"tags":["pain"],"text":"bloque completo listo para usar en copy"}]\n\nTRANSCRIPCIÓN:\n${trText.slice(0,4000)}`, apiKey, 1400, "Importar transcripción", null, "doc");
      const arr = JSON.parse(raw.replace(/```json|```/g,"").trim());
      setTrRes(arr);
    } catch { notify("Error al extraer bloques"); }
    setBusy(false);
  }

  function saveSel() {
    if (!trSel.length) return;
    const toSave = trRes.filter((_,i)=>trSel.includes(i)).map(a=>({...a, id:uid(), tags:[...(a.funcs||[]),...(a.tags||[])].filter((v,i2,arr)=>arr.indexOf(v)===i2)}));
    updateBrand(b=>({...b, assets:[...(b.assets||[]),...toSave]}));
    notify(`${toSave.length} block(s) saved`); setTrRes([]); setTrSel([]); setTrText("");
  }

  return (
    <div style={{ maxWidth:780 }}>
      <SectionHeader title="Importar transcripción" subtitle="Pega un testimonio o tu propio video → la IA extrae bloques → tú eliges cuáles guardar."/>
      <Inp label="Transcripción" multiline rows={8} placeholder="Pega aquí…" value={trText} onChange={e=>setTrText(e.target.value)}/>
      <Btn variant="primary" onClick={importTranscript} disabled={busy||!trText.trim()}>{busy?"Analizando…":"✨ Extraer bloques"}</Btn>
      {trRes.length>0 && (
        <div style={{ marginTop:20 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:10 }}>Selecciona los que quieres guardar:</div>
          {trRes.map((a,i)=>(
            <div key={i} onClick={()=>setTrSel(p=>p.includes(i)?p.filter(x=>x!==i):[...p,i])} style={{ padding:"10px 12px", marginBottom:6, borderRadius:9, border:`1.5px solid ${trSel.includes(i)?T.purple:tp(a.tipo).border}`, background:trSel.includes(i)?T.purpleBg:T.white, cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start", borderLeft:`4px solid ${tp(a.tipo).color}` }}>
              <span style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${trSel.includes(i)?T.purple:T.gray}`, background:trSel.includes(i)?T.purple:"transparent", flexShrink:0, marginTop:2 }}/>
              <div style={{ flex:1 }}><div style={{ display:"flex", gap:4, marginBottom:5 }}><BlockBadge type={a.tipo}/>{(a.funcs||[]).map(f=><FuncTag key={f} f={f}/>)}</div><div style={{ fontSize:13, color:T.navy, lineHeight:1.6 }}>{a.text}</div></div>
            </div>
          ))}
          {trSel.length>0 && <div style={{ marginTop:12 }}><Btn variant="primary" onClick={saveSel}>💾 Guardar {trSel.length} bloque(s)</Btn></div>}
        </div>
      )}
    </div>
  );
}

// ─── PERSONAS SCREEN ─────────────────────────────────────────────────────────
function PersonasScreen({ brand, updateBrand, notify, busy, setBusy, apiKey }) {
  const personas = brand?.avatars || [];
  const [editing, setEditing] = useState(null); // null | "new" | persona object
  const [form, setForm] = useState({});

  const awarInfo = (id) => AWARENESS_LEVELS.find(a=>a.id===id) || AWARENESS_LEVELS[1];

  function openNew() {
    setForm({ id:uid(), nombre:"", edad:"", rol:"", descripcion:"", problema_principal:"", dolores:"", intentos_fallidos:"", objeciones:"", deseo_final:"", lenguaje:"", nivel_conciencia:"problem", avatarGender:"undefined" });
    setEditing("new");
  }

  function openEdit(p) {
    setForm({ nivel_conciencia:"problem", ...p });
    setEditing(p.id);
  }

  function savePersona() {
    if (!form.nombre?.trim()) { notify("Dale un nombre a la persona"); return; }
    if (editing==="new") {
      updateBrand(b=>({...b, avatars:[...(b.avatars||[]), form]}));
      notify("Persona creada ✓");
    } else {
      updateBrand(b=>({...b, avatars:(b.avatars||[]).map(a=>a.id===form.id?form:a)}));
      notify("Persona actualizada ✓");
    }
    setEditing(null);
  }

  function deletePersona(id) {
    updateBrand(b=>({...b, avatars:(b.avatars||[]).filter(a=>a.id!==id)}));
    notify("Persona eliminada");
  }

  function F(key, label, ph, multi=false) {
    return <Inp key={key} label={label} placeholder={ph} multiline={multi} rows={multi?3:1} value={form[key]||""} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}/>;
  }

  if (editing) {
    return (
      <div style={{ width:"100%", maxWidth:1280, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
          <button onClick={()=>setEditing(null)} style={{ background:"none", border:"none", cursor:"pointer", color:T.slate, fontSize:14, fontFamily:font, padding:0 }}>← Volver</button>
          <span style={{ color:T.gray }}>|</span>
          <span style={{ fontSize:16, fontWeight:700, color:T.navy }}>{editing==="new"?"Nueva persona":form.nombre||"Editar persona"}</span>
        </div>

        <div style={{ marginBottom:16, width:"100%" }}>
          <PersonaBuilder form={form} setForm={setForm} apiKey={apiKey} notify={notify} busy={busy} setBusy={setBusy} />
        </div>

        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="primary" onClick={savePersona} disabled={!form.nombre?.trim()}>{editing==="new"?"Crear persona":"Guardar cambios"} ✓</Btn>
          <Btn variant="ghost" onClick={()=>setEditing(null)}>Cancelar</Btn>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Personas" subtitle="Define a quién le estás hablando. Cada persona = un avatar para el que puedes generar copy específico."
        action={<Btn variant="primary" onClick={openNew}>+ Nueva persona</Btn>}
      />

      {personas.length === 0 && (
        <div style={{ textAlign:"center", padding:60, border:`1px dashed ${T.gray}`, borderRadius:14 }}>
          <div style={{ width:52, height:52, borderRadius:12, background:T.purpleBg, border:`2px dashed ${T.purpleLight}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
            <Users size={22} color={T.purple}/>
          </div>
          <div style={{ fontSize:16, fontWeight:700, color:T.navy, marginBottom:6 }}>Sin personas todavía</div>
          <div style={{ fontSize:13, color:T.slate, marginBottom:20, maxWidth:360, margin:"0 auto 20px" }}>Crea avatares detallados para que la IA genere copy que realmente le hable a cada persona.</div>
          <Btn variant="primary" onClick={openNew}>+ Crear primera persona</Btn>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
        {personas.map(p=>{
          const awar = awarInfo(p.nivel_conciencia);
          return (
            <div key={p.id} style={{ background:T.white, borderRadius:14, border:`1px solid ${T.gray}`, overflow:"hidden", cursor:"pointer", transition:"all 0.15s", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}
              onClick={()=>openEdit(p)}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.purpleLight;e.currentTarget.style.boxShadow=`0 4px 20px rgba(122,90,246,0.1)`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.gray;e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.04)";}}>
              {/* Card header — colored by awareness level */}
              <div style={{ background:`linear-gradient(135deg, ${awar.color}20, ${awar.bg})`, padding:"14px 16px 12px", borderBottom:`1px solid ${awar.color}30` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                    <PersonaAvatarDisplay avatar={p} size={38} />
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:3 }}>{p.nombre||"Sin nombre"}</div>
                      <div style={{ fontSize:11, color:T.slate }}>{[p.avatarAgeRange||p.edad,p.rol].filter(Boolean).join(" · ")}</div>
                    </div>
                  </div>
                  <span style={{ fontSize:10, padding:"3px 9px", borderRadius:20, background:awar.bg, color:awar.color, border:`1px solid ${awar.color}40`, fontWeight:700, flexShrink:0 }}>{awar.short}</span>
                </div>
              </div>
              <div style={{ padding:"12px 16px 14px" }}>
                {p.problema_principal && <div style={{ fontSize:12, color:T.slate, lineHeight:1.55, marginBottom:10 }}>"{p.problema_principal.slice(0,100)}{p.problema_principal.length>100?"…":""}"</div>}
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  <span style={{ fontSize:10, padding:"3px 8px", borderRadius:20, background:awar.bg, color:awar.color, border:`1px solid ${awar.color}40`, fontWeight:600 }}>{awar.label}</span>
                </div>
                <div style={{ marginTop:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:11, color:T.purple, fontWeight:600 }}>Editar →</span>
                  <button onClick={e=>{e.stopPropagation();deletePersona(p.id);}} style={{ fontSize:11, color:T.slate, background:"none", border:`1px solid ${T.gray}`, borderRadius:6, cursor:"pointer", padding:"3px 8px", fontFamily:font }}>✕</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── BRAND PROFILE (Launchpad) ────────────────────────────────────────────────
function BrandProfileScreen({ brand, onSave, notify, apiKey, updateBrand, busy, setBusy }) {
  const [p, setP] = useState({ produto:"", oferta:"", diferenciador:"", voz:"", ubicacion:"", extra:"", ...(brand?.perfil||{}) });
  const [competitors, setCompetitors] = useState(brand?.competitors||[]);
  const [offers, setOffers] = useState(brand?.offers||[]);
  const [tab, setTab] = useState("negocio");

  const PROFILE_SECTIONS = [
    { key:"negocio", emoji:"🏢", label:"Negocio y oferta", desc:"Qué vendés y por qué sos distinto — la base de todo el copy.", fields:[
      { k:"produto",       l:"Producto o servicio",     ph:"ej. Bootcamp intensivo de Meta Ads", req:true },
      { k:"oferta",        l:"Oferta completa",          ph:"Qué incluye, duración, formato, rango de precio…", multi:true, req:true },
      { k:"diferenciador", l:"Diferenciador principal", ph:"Por qué eres diferente a la competencia…", req:true },
    ]},
    { key:"voz", emoji:"🎙️", label:"Marca y voz", desc:"Cómo suena tu marca al hablarle a tu audiencia.", fields:[
      { k:"voz",       l:"Voz y tono de marca", ph:"ej. Directo, experto, sin clichés, sin promesas de ingresos…", req:true },
      { k:"mercado",   l:"Mercado (país + variante de español)", ph:"ej. México — español neutro · Argentina — voseo" },
      { k:"ubicacion", l:"Ubicación / área de servicio", ph:"ej. Bolivia — o en blanco si es global" },
    ]},
    { key:"mecanismo", emoji:"⚙️", label:"Mecanismo único", desc:"El 'cómo funciona' real detrás de tu resultado — no lo inventes, la IA tampoco lo hará.", fields:[
      { k:"mecanismo_nombrado",        l:"Nombre del mecanismo (opcional)", ph:"ej. 'Sistema Local-First', 'Triángulo ROAS' — déjalo vacío si no tienes uno" },
      { k:"mecanismo_descripcion",     l:"Cómo funciona", ph:"La razón real por la que tu producto produce el resultado", multi:true },
      { k:"mecanismo_diferenciador",   l:"Qué lo hace distinto", ph:"Qué hace diferente al resto de alternativas" },
      { k:"mecanismo_creencia_rebate", l:"Creencia que derriba", ph:"La creencia incorrecta que tu mecanismo desmiente" },
    ]},
    { key:"prueba", emoji:"⭐", label:"Prueba social", desc:"Solo datos REALES — la IA nunca inventa números ni casos.", fields:[
      { k:"prueba_n_clientes",     l:"Nº de clientes / escala",  ph:"Número real, no redondeado. ej. +1.240 negocios" },
      { k:"prueba_caso",           l:"Caso de cliente",          ph:"Perfil + resultado + tiempo. ej. 'Don Beto: de 3 a 47 pedidos/día en 30 días'", multi:true },
      { k:"prueba_resultado_clave",l:"Resultado clave",          ph:"El resultado más impactante con número" },
      { k:"prueba_autoridad",      l:"Autoridad externa",        ph:"Publicación, ranking, premio o certificación real" },
      { k:"prueba_cuota_mercado",  l:"Cuota de mercado",         ph:"ej. '1 de cada 3 restaurantes de la zona'" },
    ]},
    { key:"extra", emoji:"➕", label:"Extra", desc:"Cualquier otra cosa que la IA deba saber al escribir para tu marca.", fields:[
      { k:"extra", l:"Contexto extra para la IA", ph:"Precios, objeciones, cualquier cosa que la IA deba saber…", multi:true },
    ]},
  ];
  const profileFields = PROFILE_SECTIONS.flatMap(s=>s.fields);
  const activeSection = PROFILE_SECTIONS.find(s=>s.key===tab);
  const tabItems = [...PROFILE_SECTIONS, {key:"offers",emoji:"🎁",label:`Ofertas (${offers.length})`}, {key:"competitors",emoji:"⚔️",label:`Competidores (${competitors.length})`}];

  const completion = Math.round(profileFields.filter(f=>p[f.k]?.trim()).length / profileFields.filter(f=>f.req).length * 100);
  const clampedCompletion = Math.min(completion, 100);

  function saveAll() {
    onSave(p, brand?.avatars||[], competitors, offers);
  }

  const completionColor = clampedCompletion >= 80 ? "#1A9E6E" : clampedCompletion >= 50 ? T.purple : "#C07C10";
  const [chatOpen, setChatOpen] = useState(false);
  const chatRef = useRef(null);
  function openBrandChat() {
    setChatOpen(true);
    setTimeout(() => chatRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 50);
  }

  return (
    <div style={{ width:"100%", maxWidth:1280, margin:"0 auto" }}>
      {/* Identidad de marca */}
      <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
        <img src={navMarcaIcon} alt="" style={{ width:52, height:52, flexShrink:0 }}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:19, fontWeight:700, color:T.navy, fontFamily:fontDisplay, letterSpacing:"-0.02em" }}>{brand?.name || "Tu marca"}</div>
          <div style={{ fontSize:12.5, color:T.slate }}>Cuanto más completo, mejores serán todos los outputs de IA.</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginLeft:"auto" }}>
          <Btn variant="soft" onClick={openBrandChat} style={{ padding:"0 16px" }}><Cloud size={16}/> Chat con tu marca</Btn>
          <Btn variant="primary" onClick={saveAll}>Guardar perfil</Btn>
        </div>
      </div>

      <div className="brand-profile-layout" style={{ gridTemplateColumns: chatOpen ? "minmax(520px, 1fr) minmax(340px, 420px)" : "minmax(0, 980px)", maxWidth: chatOpen ? 1240 : 980 }}>
        <div className="brand-profile-main" style={{ minWidth:0 }}>
          {/* Gamification progress */}
          <Card style={{ marginBottom:16, padding:"14px 18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <span style={{ fontSize:14, fontWeight:700, color:T.navy }}>Fuerza del perfil</span>
              <span style={{ fontSize:20, fontWeight:700, color:completionColor }}>{clampedCompletion}%</span>
            </div>
            <div style={{ height:10, borderRadius:5, background:T.gray, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${clampedCompletion}%`, background:`linear-gradient(90deg, ${T.purple}, ${completionColor})`, borderRadius:5, transition:"width 0.5s" }}/>
            </div>
          </Card>

          {/* Tabs — pill style, igual al creador de Personas */}
          <div className="nowheel" style={{ display:"flex", gap:8, flexWrap:"wrap", overflow:"visible", paddingBottom:10, marginBottom:14, borderBottom:`1px solid ${T.borderSoft}` }}>
            {tabItems.map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key)} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:T.radiusPill, border:`1.5px solid ${tab===t.key?T.purple:T.gray}`, background:tab===t.key?T.purpleBg:"rgba(255,255,255,0.55)", color:tab===t.key?T.purple:T.slate, fontSize:12, fontWeight:tab===t.key?700:500, cursor:"pointer", whiteSpace:"nowrap", fontFamily:font, boxShadow:tab===t.key?"0 6px 18px rgba(122,90,246,0.12)":"none" }}>
                <span>{t.emoji}</span> {t.label}
              </button>
            ))}
          </div>

          {/* Profile section tabs */}
          {activeSection && (
            <Card style={{ padding:24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:18 }}>
                <span style={{ fontSize:12, fontWeight:600, color:T.slate }}>{activeSection.label}</span>
                <InfoTooltip title={activeSection.label} text={activeSection.desc} align="left"/>
              </div>
              {activeSection.fields.map(x=>
                <Inp key={x.k} label={x.l+(x.req?" *":"")} placeholder={x.ph} multiline={x.multi} rows={x.multi?4:3} value={p[x.k]||""} onChange={e=>setP(prev=>({...prev,[x.k]:e.target.value}))}/>
              )}
              <Btn variant="primary" onClick={saveAll}>Guardar perfil</Btn>
            </Card>
          )}

          {/* Offers tab */}
          {tab==="offers" && (
            <div>
              <div style={{ fontSize:12, color:T.slate, marginBottom:16 }}>Define tus ofertas. Puedes seleccionarlas al generar bloques Offer para que la IA tenga contexto específico.</div>
              {offers.map((o,i)=>(
                <Card key={o.id} style={{ marginBottom:12, padding:24 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>Oferta {i+1}</div>
                    <Btn variant="danger" small onClick={()=>setOffers(offers.filter(x=>x.id!==o.id))}>Eliminar</Btn>
                  </div>
                  <Inp label="Nombre de la oferta *" placeholder="ej. Bootcamp Meta Ads 6 semanas" value={o.nombre||""} onChange={e=>setOffers(offers.map((x,j)=>j===i?{...x,nombre:e.target.value}:x))}/>
                  <Inp label="Descripción / qué incluye" multiline rows={4} placeholder="Qué reciben, duración, cómo funciona…" value={o.descripcion||""} onChange={e=>setOffers(offers.map((x,j)=>j===i?{...x,descripcion:e.target.value}:x))}/>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))", gap:12 }}>
                    <Inp label="Precio" placeholder="ej. $297 o Bs. 1.800" value={o.precio||""} onChange={e=>setOffers(offers.map((x,j)=>j===i?{...x,precio:e.target.value}:x))}/>
                    <Inp label="Urgencia / escasez" placeholder="ej. Solo 20 cupos disponibles" value={o.urgencia||""} onChange={e=>setOffers(offers.map((x,j)=>j===i?{...x,urgencia:e.target.value}:x))}/>
                  </div>
                  <Inp label="Garantía" placeholder="ej. 30 días de devolución sin preguntas" value={o.garantia||""} onChange={e=>setOffers(offers.map((x,j)=>j===i?{...x,garantia:e.target.value}:x))}/>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:T.purple, margin:"6px 0 12px", paddingTop:12, borderTop:`1px solid ${T.gray}` }}>Transformación y valor (para fórmulas de Promesa y Oferta)</div>
                  <Inp label="Resultado principal" placeholder="La transformación que produce. ej. 'cerrar el mes en 1 día'" value={o.resultado||""} onChange={e=>setOffers(offers.map((x,j)=>j===i?{...x,resultado:e.target.value}:x))}/>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))", gap:12 }}>
                    <Inp label="Antes (con número)" placeholder="ej. 15 días de cierre contable" value={o.antes||""} onChange={e=>setOffers(offers.map((x,j)=>j===i?{...x,antes:e.target.value}:x))}/>
                    <Inp label="Después (con número)" placeholder="ej. 1 día, el primer hábil" value={o.despues||""} onChange={e=>setOffers(offers.map((x,j)=>j===i?{...x,despues:e.target.value}:x))}/>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))", gap:12 }}>
                    <Inp label="Tiempo al resultado" placeholder="ej. en 30 días" value={o.tiempo||""} onChange={e=>setOffers(offers.map((x,j)=>j===i?{...x,tiempo:e.target.value}:x))}/>
                    <Inp label="Precio ancla" placeholder="Valor total por separado. ej. $1.200" value={o.precio_ancla||""} onChange={e=>setOffers(offers.map((x,j)=>j===i?{...x,precio_ancla:e.target.value}:x))}/>
                  </div>
                  <Inp label="Fricción eliminada" placeholder="Lo que NO hace falta para empezar. ej. sin tarjeta, sin permanencia" value={o.friccion_eliminada||""} onChange={e=>setOffers(offers.map((x,j)=>j===i?{...x,friccion_eliminada:e.target.value}:x))}/>
                </Card>
              ))}
              <Btn variant="outline" onClick={()=>setOffers([...offers,{id:uid(),nombre:"",descripcion:"",precio:"",urgencia:"",garantia:""}])}>+ Agregar oferta</Btn>
              <div style={{ marginTop:16 }}><Btn variant="primary" onClick={saveAll}>Guardar ofertas</Btn></div>
            </div>
          )}

          {/* Competitors tab */}
          {tab==="competitors" && (
            <div>
              <div style={{ fontSize:12, color:T.slate, marginBottom:16 }}>Agrega competidores o soluciones alternativas. Se usan en Investigación de Mercado y ángulos de comparación.</div>
              {competitors.map((c,i)=>(
                <Card key={c.id} style={{ marginBottom:12, padding:24 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>Competidor {i+1}</div>
                    <Btn variant="danger" small onClick={()=>setCompetitors(competitors.filter(x=>x.id!==c.id))}>Eliminar</Btn>
                  </div>
                  <Inp label="Nombre" placeholder="ej. Agencia de Marketing Genérica" value={c.name||""} onChange={e=>setCompetitors(competitors.map((x,j)=>j===i?{...x,name:e.target.value}:x))}/>
                  <Inp label="Web (opcional)" placeholder="https://competidor.com" value={c.url||""} onChange={e=>setCompetitors(competitors.map((x,j)=>j===i?{...x,url:e.target.value}:x))}/>
                  <Inp label="Por qué los clientes los eligen (y por qué tú eres mejor)" multiline rows={4} placeholder="Su atractivo principal, donde se quedan cortos…" value={c.notes||""} onChange={e=>setCompetitors(competitors.map((x,j)=>j===i?{...x,notes:e.target.value}:x))}/>
                </Card>
              ))}
              <Btn variant="outline" onClick={()=>setCompetitors([...competitors,{id:uid(),name:"",url:"",notes:""}])}>+ Agregar competidor</Btn>
              <div style={{ marginTop:16 }}><Btn variant="primary" onClick={saveAll}>Guardar competidores</Btn></div>
            </div>
          )}
        </div>
        {chatOpen && (
          <aside ref={chatRef} style={{ background:T.surface, border:`1px solid ${T.gray}`, borderRadius:T.radiusCard, padding:14, boxShadow:T.shadowCard, minWidth:0, alignSelf:"start", maxHeight:"calc(100vh - 150px)", overflow:"hidden", display:"flex", flexDirection:"column", position:"sticky", top:12 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, color:T.purple, fontWeight:800, fontSize:13 }}><Cloud size={16}/> Chat con tu Marca</div>
              <button onClick={()=>setChatOpen(false)} style={{ border:"none", background:"transparent", color:T.slate, cursor:"pointer", fontSize:20, lineHeight:1 }}>×</button>
            </div>
            <div style={{ flex:1, minHeight:0, overflow:"auto" }}>
              <BrandChatPanel form={p} onApplyToField={(field,text)=>setP(prev=>({...prev,[field]:prev[field]?.trim()?`${prev[field]}\n\n${text}`:text}))} updateFormField={(key,value)=>setP(prev=>({...prev,[key]:value}))} notify={notify} apiKey={apiKey} busy={busy} setBusy={setBusy}/>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

// ─── SCRIPT COMPOSER ──────────────────────────────────────────────────────────
// ─── GENERADOR DE COPIES ─────────────────────────────────────────────────────
// Seleccionas bloques del banco → tipo de output → Claude los une → output listo
function GeneradorCopiesScreen({ assets, conceptos, perfil, brand, busy, setBusy, apiKey, notify, updateBrand }) {
  const [outputType, setOutputType] = useState("facebook");
  const [conceptoSel, setConceptoSel] = useState(null);
  const [blocksSeleccionados, setBlocksSel] = useState([]);
  const [fFunc, setFFunc] = useState("all");
  const [output, setOutput] = useState(null);
  const [conEmojis, setConEmojis] = useState(false);
  const [outputEmoji, setOutputEmoji] = useState("");
  const [guardadoEnBanco, setGuardadoEnBanco] = useState(false);
  const [editandoOutput, setEditandoOutput] = useState(false);
  const [outputEditado, setOutputEditado] = useState("");

  const conceptBlocks = assets.filter(a =>
    conceptoSel ? (a.tags||[]).includes("concept:"+conceptoSel.id) : true
  );
  const filteredBlocks = fFunc==="all" ? conceptBlocks : conceptBlocks.filter(a=>(a.funcs||[]).includes(fFunc));

  async function generar() {
    if (!blocksSeleccionados.length) { notify("Selecciona al menos un bloque"); return; }
    setBusy(true); setOutput(null); setOutputEmoji(""); setGuardadoEnBanco(false);
    const ctx = perfilCtx(perfil, brand?.avatars);
    const conceptCtx = conceptoSel ? `\nCONCEPT: "${conceptoSel.concepto}"${conceptoSel.angulo?`\nAngle: ${conceptoSel.angulo}`:""}` : "";
    const bloquesList = blocksSeleccionados.map((b,i)=>{
      const tipoInfo = TIPOS_BLOQUE.find(t=>t.id===b.tipo);
      return `${i+1}. [${tipoInfo?.label||b.tipo}] ${b.text}`;
    }).join("\n");
    const tag = `[Concepto: ${conceptoSel?.concepto?.slice(0,30)||"Sin concepto"} | Formato: ${outputType==="facebook"?"Facebook Ad Copy":"Script de Video"} | ${new Date().toLocaleDateString("es-ES")}]`;
    try {
      let prompt;
      if (outputType==="facebook") {
        prompt = `${COPY_BRAIN}\n\nIMPORTANTE: Genera TODO en español. Natural, directo.\n${ctx}${conceptCtx}\n\nCombina estos bloques en un Facebook Ad completo y pulido. Únelos con gramática fluida — no los listes. Listo para pegar en Ads Manager.\n\nBLOQUES:\n${bloquesList}\n\nFORMATO EXACTO:\nTEXTO PRINCIPAL:\n[copy completo — primera línea es el hook, ~125 chars visibles antes de "ver más"]\n\nTÍTULO:\n[máx 40 caracteres]\n\nETIQUETA:\n${tag}`;
      } else {
        prompt = `${COPY_BRAIN}\n\nIMPORTANTE: Genera TODO en español. Natural, directo.\n${ctx}${conceptCtx}\n\nCombina estos bloques en un Script de Video completo (20-45 seg), listo para producción.\n\nBLOQUES:\n${bloquesList}\n\nFORMATO EXACTO:\nHOOK (0-3s):\n[1 línea hablada — aplica REGLAS DE VIDEO HOOK]\n\nDIRECCIÓN VISUAL:\n[qué se ve en pantalla, específico]\n\nSUGERENCIA DE SONIDO:\n[audio/música que amplifica el hook]\n\nSCRIPT:\n[script completo hablado, natural]\n\nETIQUETA:\n${tag}`;
      }
      const raw = await callClaude(prompt, apiKey, 2000, `Armar copy: ensamblar ${outputType==="facebook"?"Facebook Ad":"Script de Video"}`);
      setOutput({ type:outputType, raw, tag, blocks:blocksSeleccionados, conceptoId:conceptoSel?.id });
    } catch(e) { console.error("gen copy error:", e); notify("Error: " + (e?.message || "intenta de nuevo")); }
    setBusy(false);
  }

  async function agregarEmojis() {
    if (!output) return; setBusy(true);
    try {
      const raw = await callClaude(`Add emojis strategically to this Facebook Ad copy. Max 6 emojis. Only where they add real visual value — not decorative. Return only the text with emojis.\n\n${output.raw}`, apiKey, 1200, "Armar copy: agregar emojis", null, "suggest");
      setOutputEmoji(raw);
    } catch(e) { console.error("emoji error:", e); notify("Error al agregar emojis"); }
    setBusy(false);
  }

  function guardarCopy(resultado, rating) {
    const textFinal = editandoOutput ? outputEditado : (outputEmoji || output.raw);
    updateBrand(b=>({
      ...b,
      copies:[...(b.copies||[]),{
        id:uid(), type:output.type, text:textFinal, tag:output.tag,
        rating, conceptoId:output.conceptoId,
        conceptoLabel:conceptos.find(c=>c.id===output.conceptoId)?.concepto?.slice(0,40)||"No concept",
        fecha:new Date().toISOString().split("T")[0],
        blockIds:(output.blocks||[]).map(b=>b.id),
      }]
    }));
    setGuardadoEnBanco(true);
    notify(rating==="winner"?"🏆 Guardado como ganador":"📝 Guardado en banco");
  }

  return (
    <div style={{ maxWidth:860 }}>
      <SectionHeader title="Armar copy" subtitle="Selecciona bloques → elige formato → Claude ensambla → guarda en tu banco."/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
        {[{id:"facebook",icon:"✍️",label:"Facebook Ad Copy",desc:"Texto principal + headline listo para Ads Manager"},{id:"video",icon:"🎬",label:"Script de Video",desc:"Hook + dirección visual + script listo para grabar"}].map(t=>(
          <div key={t.id} onClick={()=>setOutputType(t.id)} style={{ padding:"16px", borderRadius:12, border:`2px solid ${outputType===t.id?T.purple:T.gray}`, background:outputType===t.id?T.purpleBg:T.white, cursor:"pointer" }}>
            <span style={{ fontSize:22 }}>{t.icon}</span>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginTop:8, marginBottom:3 }}>{t.label}</div>
            <div style={{ fontSize:11, color:T.slate }}>{t.desc}</div>
          </div>
        ))}
      </div>

      {/* Concepto filter */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Filtrar por concepto (opcional)</div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          <button onClick={()=>setConceptoSel(null)} style={{ padding:"6px 12px", fontSize:12, borderRadius:20, cursor:"pointer", fontFamily:font, border:`1.5px solid ${!conceptoSel?T.navy:T.gray}`, background:!conceptoSel?T.navy:"transparent", color:!conceptoSel?"#fff":T.slate }}>Todos los bloques</button>
          {conceptos.map(c=>{
            const sel=conceptoSel?.id===c.id;
            return <button key={c.id} onClick={()=>setConceptoSel(sel?null:c)} style={{ padding:"6px 12px", fontSize:12, borderRadius:20, cursor:"pointer", fontFamily:font, border:`1.5px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:"transparent", color:sel?T.purple:T.slate }}>{c.concepto.slice(0,35)}</button>;
          })}
        </div>
      </div>

      {/* Block picker */}
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:12 }}>
        {["all",...FUNCIONES].map(f=>(
          <button key={f} onClick={()=>setFFunc(f)} style={{ padding:"4px 10px", fontSize:11, borderRadius:20, cursor:"pointer", fontFamily:font, border:`1px solid ${fFunc===f?(f==="all"?T.navy:FC[f]):T.gray}`, background:fFunc===f?(f==="all"?T.navy:`${FC[f]}15`):"transparent", color:fFunc===f?(f==="all"?"#fff":(FC[f]||T.navy)):T.slate }}>{f==="all"?"Todos":FL[f]}</button>
        ))}
        {blocksSeleccionados.length>0 && <span style={{ fontSize:12, fontWeight:700, color:T.purple, marginLeft:8, alignSelf:"center" }}>{blocksSeleccionados.length} seleccionados</span>}
      </div>

      {filteredBlocks.length===0 ? (
        <div style={{ padding:"24px", textAlign:"center", border:`1px dashed ${T.gray}`, borderRadius:10, color:T.slate, marginBottom:16 }}>
          {conceptoSel?"Sin bloques para este concepto — crea algunos en el Compositor.":"Sin bloques todavía — crea algunos en el Compositor o el Banco de bloques."}
        </div>
      ) : (
        <div style={{ maxHeight:360, overflowY:"auto", marginBottom:16, border:`1px solid ${T.gray}`, borderRadius:10, padding:8 }}>
          {filteredBlocks.map(a=>{
            const sel=blocksSeleccionados.some(b=>b.id===a.id);
            const tInfo = TIPOS_BLOQUE.find(t=>t.id===a.tipo)||{color:T.slate,label:a.tipo};
            return (
              <div key={a.id} onClick={()=>setBlocksSel(sel?blocksSeleccionados.filter(b=>b.id!==a.id):[...blocksSeleccionados,a])}
                style={{ padding:"9px 12px", marginBottom:5, borderRadius:9, border:`1.5px solid ${sel?T.purple:tInfo.border||T.gray}`, borderLeft:`4px solid ${tInfo.color}`, background:sel?T.purpleBg:T.white, cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start" }}>
                <span style={{ width:14,height:14,borderRadius:"50%",border:`2px solid ${sel?T.purple:"#ddd"}`,background:sel?T.purple:"transparent",flexShrink:0,marginTop:2 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",gap:4,marginBottom:4 }}><BlockBadge type={a.tipo}/>{(a.funcs||[]).map(f=><FuncTag key={f} f={f}/>)}</div>
                  <div style={{ fontSize:12, color:T.navy, lineHeight:1.55 }}>{a.text.slice(0,120)}{a.text.length>120?"…":""}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Btn variant="primary" onClick={generar} disabled={busy||!blocksSeleccionados.length} style={{ marginBottom:20 }}>
        {busy?"Generando…":"✨ Generar "+(outputType==="facebook"?"Facebook Ad Copy":"Script de Video")}
      </Btn>

      {/* Output */}
      {output && (
        <div>
          <div style={{ padding:"8px 14px", background:T.navy, borderRadius:8, fontSize:11, color:"rgba(255,255,255,0.5)", fontFamily:"monospace", marginBottom:12 }}>{output.tag}</div>
          <div style={{ background:"#1a1f36", borderRadius:14, padding:"22px 24px", marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(255,255,255,0.4)", fontWeight:700 }}>{output.type==="facebook"?"Facebook Ad Copy":"Script de Video"}</div>
              <div style={{ display:"flex", gap:6 }}>
                {outputEmoji && <CopyBtn text={outputEmoji} small/>}
                <CopyBtn text={editandoOutput?outputEditado:(outputEmoji||output.raw)} small/>
                <button onClick={()=>{ setEditandoOutput(!editandoOutput); setOutputEditado(outputEmoji||output.raw); }} style={{ padding:"5px 10px",fontSize:11,borderRadius:8,border:"1px solid rgba(255,255,255,0.2)",background:"transparent",color:"#ccc",cursor:"pointer",fontFamily:font }}>
                  {editandoOutput?"Listo":"Editar"}
                </button>
              </div>
            </div>
            {editandoOutput
              ? <textarea value={outputEditado} onChange={e=>setOutputEditado(e.target.value)} style={{ width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"12px",fontSize:13,color:"#f0f0f0",lineHeight:1.9,fontFamily:font,resize:"vertical",minHeight:200 }}/>
              : <div style={{ fontSize:13, lineHeight:1.95, whiteSpace:"pre-wrap", color:outputEmoji?"#fff":"#e0e0e0" }}>{outputEmoji||output.raw}</div>
            }
          </div>

          {output.type==="facebook" && !outputEmoji && (
            <Btn variant="ghost" onClick={agregarEmojis} disabled={busy} style={{ marginBottom:12 }}>{busy?"Agregando emojis…":"✨ Agregar emojis"}</Btn>
          )}

          {/* Save to copy bank */}
          {!guardadoEnBanco ? (
            <div style={{ padding:"16px 20px", background:T.grayLight, borderRadius:12, border:`1px solid ${T.gray}` }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:12 }}>¿Cómo calificarías este copy?</div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>guardarCopy(output,"winner")} style={{ padding:"9px 18px", fontSize:12, borderRadius:9, cursor:"pointer", fontFamily:font, border:"2px solid #1A9E6E", background:"#EDFAF4", color:"#1A9E6E", fontWeight:700 }}>🏆 Ganador — guardar</button>
                <button onClick={()=>guardarCopy(output,"testing")} style={{ padding:"9px 18px", fontSize:12, borderRadius:9, cursor:"pointer", fontFamily:font, border:`1.5px solid ${T.gray}`, background:T.white, color:T.slate }}>📋 Guardar para testing</button>
                <button onClick={()=>guardarCopy(output,"lost")} style={{ padding:"9px 18px", fontSize:12, borderRadius:9, cursor:"pointer", fontFamily:font, border:"1.5px solid #F5BCBC", background:"#FFF2F2", color:"#D94F4F" }}>✗ No funcionó</button>
              </div>
            </div>
          ) : (
            <div style={{ padding:"12px 16px", background:"#EDFAF4", borderRadius:10, border:"1px solid #9EE0C6", fontSize:12, color:"#1A9E6E", fontWeight:600 }}>✓ Guardado en tu banco de copies</div>
          )}

          <div style={{ display:"flex", gap:8, marginTop:16, flexWrap:"wrap" }}>
            <Btn variant="primary" onClick={()=>{ setOutput(null); setBlocksSel([]); setOutputEmoji(""); setGuardadoEnBanco(false); setEditandoOutput(false); }}>Crear otro</Btn>
            <Btn variant="ghost" onClick={generar} disabled={busy}>{busy?"Regenerando…":"↻ Regenerar"}</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BANCO DE COPIES ──────────────────────────────────────────────────────────
function BancoCopiesScreen({ copies, conceptos, onDelete, onUpdateRating }) {
  const [filtroRating, setFiltroRating] = useState("all");
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [busqueda, setBusqueda] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const RATINGS = [
    { id:"all", label:"Todos", color:T.slate },
    { id:"winner", label:"🏆 Ganadores", color:"#1A9E6E" },
    { id:"testing", label:"📋 Testing", color:T.purple },
    { id:"lost", label:"✗ No funcionó", color:"#D94F4F" },
  ];

  const filtered = (copies||[]).filter(c=>{
    if (filtroRating!=="all" && c.rating!==filtroRating) return false;
    if (filtroTipo!=="all" && c.type!==filtroTipo) return false;
    if (busqueda && !c.text.toLowerCase().includes(busqueda.toLowerCase()) && !c.conceptoLabel?.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  }).sort((a,b)=>new Date(b.fecha)-new Date(a.fecha));

  const stats = { winner:(copies||[]).filter(c=>c.rating==="winner").length, testing:(copies||[]).filter(c=>c.rating==="testing").length, lost:(copies||[]).filter(c=>c.rating==="lost").length };

  return (
    <div>
      <SectionHeader title="Banco de copies" subtitle="Historial de todos tus copies generados. Aprende de los ganadores."/>

      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        <StatPill label="ganadores" value={stats.winner} color="#1A9E6E"/>
        <StatPill label="testing" value={stats.testing} color={T.purple}/>
        <StatPill label="no funcionó" value={stats.lost} color="#D94F4F"/>
        <StatPill label="total" value={(copies||[]).length} color={T.slate}/>
      </div>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
        {RATINGS.map(r=>(
          <button key={r.id} onClick={()=>setFiltroRating(r.id)} style={{ padding:"6px 14px",fontSize:12,borderRadius:20,cursor:"pointer",fontFamily:font,border:`1.5px solid ${filtroRating===r.id?r.color:T.gray}`,background:filtroRating===r.id?`${r.color}15`:"transparent",color:filtroRating===r.id?r.color:T.slate,fontWeight:filtroRating===r.id?700:400 }}>{r.label}</button>
        ))}
        {["all","facebook","video"].map(t=>(
          <button key={t} onClick={()=>setFiltroTipo(t)} style={{ padding:"6px 14px",fontSize:12,borderRadius:20,cursor:"pointer",fontFamily:font,border:`1.5px solid ${filtroTipo===t?T.navy:T.gray}`,background:filtroTipo===t?T.navy:"transparent",color:filtroTipo===t?"#fff":T.slate }}>{t==="all"?"Todos":t==="facebook"?"✍️ FB Ads":"🎬 Scripts"}</button>
        ))}
      </div>
      <input placeholder="Buscar en copies o conceptos…" value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={{ width:"100%",boxSizing:"border-box",padding:"10px 14px",fontSize:13,border:`1.5px solid ${T.gray}`,borderRadius:9,background:T.white,color:T.navy,fontFamily:font,outline:"none",marginBottom:16 }}/>

      {filtered.length===0 && <div style={{ textAlign:"center",padding:60,color:T.slate,border:`1px dashed ${T.gray}`,borderRadius:12 }}><div style={{ fontSize:28,marginBottom:10 }}>📭</div><div style={{ fontSize:13 }}>Sin copies encontrados</div></div>}

      {filtered.map(copy=>{
        const isOpen=expandedId===copy.id;
        const ratingInfo={winner:{color:"#1A9E6E",bg:"#EDFAF4",border:"#9EE0C6",label:"🏆 Ganador"},testing:{color:T.purple,bg:T.purpleBg,border:T.purpleLight,label:"📋 Testing"},lost:{color:"#D94F4F",bg:"#FFF2F2",border:"#F5BCBC",label:"✗ No funcionó"}}[copy.rating]||{color:T.slate,bg:T.grayLight,border:T.gray,label:"Sin calificar"};
        return (
          <Card key={copy.id} style={{ marginBottom:10, padding:0, overflow:"hidden" }}>
            <div style={{ padding:"12px 16px", display:"flex", gap:10, alignItems:"flex-start", cursor:"pointer" }} onClick={()=>setExpandedId(isOpen?null:copy.id)}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:5 }}>
                  <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:ratingInfo.bg, color:ratingInfo.color, border:`1px solid ${ratingInfo.border}`, fontWeight:700 }}>{ratingInfo.label}</span>
                  <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:T.grayLight, color:T.slate, border:`1px solid ${T.gray}` }}>{copy.type==="facebook"?"✍️ FB Ad":"🎬 Script"}</span>
                  {copy.conceptoLabel && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:T.purpleBg, color:T.purple, border:`1px solid ${T.purpleLight}` }}>💡 {copy.conceptoLabel}</span>}
                  <span style={{ fontSize:10, color:T.slate, alignSelf:"center" }}>{copy.fecha}</span>
                </div>
                <div style={{ fontSize:13, color:T.navy, lineHeight:1.5 }}>{copy.text.split("\n")[0].slice(0,100)}…</div>
              </div>
              <span style={{ color:T.slate, fontSize:16 }}>{isOpen?"▾":"▸"}</span>
            </div>
            {isOpen && (
              <div style={{ borderTop:`1px solid ${T.gray}`, padding:"16px 18px", background:T.grayLight }}>
                <div style={{ background:T.white, borderRadius:10, padding:"14px 16px", fontSize:13, lineHeight:1.9, whiteSpace:"pre-wrap", color:T.navy, marginBottom:14 }}>{copy.text}</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  <CopyBtn text={copy.text}/>
                  <button onClick={()=>onUpdateRating(copy.id,"winner")} style={{ padding:"5px 12px",fontSize:11,borderRadius:16,cursor:"pointer",fontFamily:font,border:"1px solid #1A9E6E",background:"#EDFAF4",color:"#1A9E6E" }}>🏆 Ganador</button>
                  <button onClick={()=>onUpdateRating(copy.id,"testing")} style={{ padding:"5px 12px",fontSize:11,borderRadius:16,cursor:"pointer",fontFamily:font,border:`1px solid ${T.gray}`,background:T.white,color:T.slate }}>📋 Testing</button>
                  <button onClick={()=>onUpdateRating(copy.id,"lost")} style={{ padding:"5px 12px",fontSize:11,borderRadius:16,cursor:"pointer",fontFamily:font,border:"1px solid #F5BCBC",background:"#FFF2F2",color:"#D94F4F" }}>✗ No funcionó</button>
                  <button onClick={()=>onDelete(copy.id)} style={{ padding:"5px 12px",fontSize:11,borderRadius:16,cursor:"pointer",fontFamily:font,border:"1px solid #F5BCBC",background:"transparent",color:"#D94F4F" }}>Eliminar</button>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth, initialTab="login", onBack }) {
  const [tab, setTab] = useState(initialTab);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [country, setCountry] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function submit(e) {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
      } else {
        if (!country) throw new Error("Elegí tu país para crear la cuenta");
        const { error } = await supabase.auth.signUp({ email, password: pass, options: { data: { country } } });
        if (error) throw error;
        setErr("✓ Revisa tu email para confirmar tu cuenta"); setBusy(false); return;
      }
      onAuth?.();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  async function googleAuth() {
    setErr("");
    setBusy(true);
    try {
      if (tab === "signup" && !country) throw new Error("Elegí tu país para crear la cuenta");
      if (tab === "signup") localStorage.setItem("flowi_signup_country", country);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  const inputStyle = {
    width:"100%", boxSizing:"border-box", height:44, padding:"0 13px", fontSize:13,
    border:`1.5px solid ${T.gray}`, borderRadius:T.radiusInput, fontFamily:font,
    outline:"none", color:T.navy, background:T.surfaceInset
  };

  return (
    <div className="auth-shell" style={{ minHeight:"100vh", background:`linear-gradient(135deg, #F6F4FF 0%, ${T.canvas} 48%, #EEF7F2 100%)`, display:"flex", alignItems:"center", justifyContent:"center", padding:28, fontFamily:font, boxSizing:"border-box" }}>
      <div className="auth-card" style={{ width:"100%", maxWidth:1120, minHeight:640, display:"grid", gridTemplateColumns:"minmax(360px, 440px) minmax(0, 1fr)", background:"rgba(255,255,255,0.88)", border:`1px solid ${T.gray}`, borderRadius:24, boxShadow:"0 24px 80px rgba(31,24,73,0.14)", overflow:"hidden" }}>
        <section style={{ padding:"42px 44px", display:"flex", flexDirection:"column", justifyContent:"center", minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:34 }}>
            {onBack && <button type="button" onClick={onBack} style={{ border:"none", background:"transparent", color:T.slate, cursor:"pointer", fontFamily:font, fontSize:12, fontWeight:700, padding:0, marginRight:2 }}>← Volver al inicio</button>}
            <img src={appLogoIndigo} alt="Flowi" style={{ height:30, width:"auto", display:"block" }}/>
            <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase", color:T.purple, background:T.purpleBg, border:`1px solid ${T.purpleLight}`, borderRadius:T.radiusPill, padding:"4px 9px" }}>Beta</span>
          </div>

          <div style={{ marginBottom:22, fontSize:13.5, lineHeight:1.65, color:T.slate }}>
            Organizá marcas, personas, ofertas y anuncios con una IA que se siente más como un asistente creativo que como una hoja vacía.
          </div>

          <div style={{ display:"flex", gap:6, marginBottom:16, padding:4, border:`1px solid ${T.gray}`, borderRadius:T.radiusPill, background:T.surfaceInset }}>
            {[
              ["login", "Iniciar sesión"],
              ["signup", "Crear cuenta"],
            ].map(([key, label])=>(
              <button key={key} type="button" onClick={()=>{ setTab(key); setErr(""); }} style={{ flex:1, height:34, border:"none", borderRadius:T.radiusPill, background:tab===key?T.navy:"transparent", color:tab===key?"#fff":T.slate, fontSize:12.5, fontWeight:800, cursor:"pointer", fontFamily:font }}>{label}</button>
            ))}
          </div>

          <button type="button" onClick={googleAuth} disabled={busy} style={{ width:"100%", height:44, display:"flex", alignItems:"center", justifyContent:"center", gap:10, border:`1.5px solid ${T.gray}`, borderRadius:T.radiusInput, background:"#fff", color:T.navy, fontFamily:font, fontSize:13, fontWeight:800, cursor:busy?"not-allowed":"pointer", boxShadow:"0 1px 2px rgba(24,19,73,0.04)", marginBottom:16 }}>
            <span style={{ width:22, height:22, borderRadius:"50%", display:"inline-flex", alignItems:"center", justifyContent:"center", background:"#fff", border:`1px solid ${T.gray}`, fontSize:14, fontWeight:900, color:"#4285F4", fontFamily:"Arial, sans-serif" }}>G</span>
            {tab==="login" ? "Iniciar sesión con Google" : "Crear cuenta con Google"}
          </button>

          <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:10, color:T.slate, fontSize:11.5, marginBottom:16 }}>
            <span style={{ height:1, background:T.gray }}/>
            <span>o usá tu email</span>
            <span style={{ height:1, background:T.gray }}/>
          </div>

          <form onSubmit={submit}>
            {tab==="signup" && (
              <div style={{ marginBottom:13 }}>
                <div style={{ fontSize:11, fontWeight:800, color:T.navy, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.04em" }}>País</div>
                <select value={country} onChange={e=>setCountry(e.target.value)} required style={{ ...inputStyle, appearance:"none", cursor:"pointer" }}>
                  <option value="">Elegí tu país</option>
                  {COUNTRIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            )}
            <div style={{ marginBottom:13 }}>
              <div style={{ fontSize:11, fontWeight:800, color:T.navy, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.04em" }}>Email</div>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="tu@email.com" style={inputStyle}/>
            </div>
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:11, fontWeight:800, color:T.navy, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.04em" }}>Contraseña</div>
              <div style={{ position:"relative" }}>
                <input type={showPass?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} required minLength={6} placeholder="••••••••" style={{ ...inputStyle, paddingRight:42 }}/>
                <button type="button" onClick={()=>setShowPass(v=>!v)} title={showPass?"Ocultar":"Mostrar"} style={{ position:"absolute", right:11, top:"50%", transform:"translateY(-50%)", border:"none", background:"transparent", color:T.slate, cursor:"pointer", display:"flex" }}>{showPass?<EyeOff size={16}/>:<Eye size={16}/>}</button>
              </div>
            </div>
            {err && <div style={{ fontSize:12, color:err.startsWith("✓")?"#1A9E6E":"#D94F4F", marginBottom:14, padding:"9px 12px", background:err.startsWith("✓")?"#EDFAF4":"#FFF2F2", borderRadius:T.radiusInput, lineHeight:1.45 }}>{err}</div>}
            <Btn variant="primary" style={{ width:"100%" }} disabled={busy}>{busy?"Cargando…":tab==="login"?"Entrar a Flowi":"Crear mi cuenta"}</Btn>
          </form>

          <div style={{ marginTop:18, display:"flex", gap:8, flexWrap:"wrap", color:T.slate, fontSize:11.5 }}>
            <span style={{ display:"inline-flex", alignItems:"center", gap:5 }}><ShieldCheck size={13} color={T.purple}/> Datos protegidos</span>
            <span style={{ display:"inline-flex", alignItems:"center", gap:5 }}><Zap size={13} color={T.purple}/> Workspace listo en minutos</span>
          </div>
        </section>

        <section className="auth-visual" style={{ position:"relative", minHeight:640, background:`linear-gradient(180deg, rgba(31,24,73,0.08), rgba(31,24,73,0.22)), url(${loginHeroBg})`, backgroundSize:"cover", backgroundPosition:"center", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 34%), linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(31,24,73,0.18) 100%)" }}/>
          <div style={{ position:"absolute", left:28, right:28, bottom:28, color:"#fff", textShadow:"0 2px 16px rgba(31,24,73,0.42)" }}>
            <div style={{ fontSize:12, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.12em", opacity:0.82, marginBottom:8 }}>Asistente para equipos creativos</div>
            <div style={{ fontSize:24, lineHeight:1.15, fontWeight:900, fontFamily:fontDisplay, maxWidth:420 }}>Convertí ideas sueltas en anuncios listos para publicar.</div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── CUENTA — foto de perfil (mismo pack de heads que Personas) ────────────────
function AccountAvatarPicker({ value, onPick, onClose }) {
  return (
    <div className="fade-in" onMouseDown={e=>e.stopPropagation()} style={{ position:"absolute", top:"100%", left:0, marginTop:8, zIndex:20, width:280, background:T.surface, border:`1px solid ${T.gray}`, borderRadius:T.radiusCard, boxShadow:T.shadowModal, padding:14 }}>
      <div style={{ fontSize:10.5, fontWeight:700, color:T.slate, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>Elegí tu foto</div>
      <div className="nowheel" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, maxHeight:240, overflowY:"auto" }}>
        {PERSONA_AVATAR_OPTIONS.map(o=>(
          <div key={o.key} onClick={()=>{ onPick(o.key); onClose(); }} title={o.label}
            style={{ cursor:"pointer", borderRadius:T.radiusInput, border:`2px solid ${value===o.key?T.purple:"transparent"}`, overflow:"hidden", aspectRatio:"1" }}>
            <img src={personaAvatarSrc(o.key)} alt={o.label} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CUENTA — pantalla completa: foto, email, contraseña, país, plan, pago ────
function AccountScreen({ account, updateAccount, currentUser, onResetPassword, onSignOut, notify, onUpgrade }) {
  const [tab, setTab] = useState("general");
  const [showPicker, setShowPicker] = useState(false);
  const [email, setEmail] = useState(currentUser?.email || "");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const plan = PLANS.find(p=>p.id===(account?.plan||"free")) || PLANS[0];
  const country = COUNTRIES.find(c=>c.id===account?.country) || null;
  const methods = paymentMethodsFor(account?.country);

  async function saveEmail() {
    if (!email.trim() || email===currentUser?.email) return;
    setSavingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: email.trim() });
      notify(error ? "No se pudo cambiar el email" : "Revisá tu correo para confirmar el cambio");
    } finally { setSavingEmail(false); }
  }
  async function savePassword() {
    if (newPass.length < 6) { notify("La contraseña necesita al menos 6 caracteres"); return; }
    if (newPass !== confirmPass) { notify("Las contraseñas no coinciden"); return; }
    setSavingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      notify(error ? "No se pudo actualizar la contraseña" : "Contraseña actualizada ✓");
      if (!error) { setNewPass(""); setConfirmPass(""); }
    } finally { setSavingPass(false); }
  }

  const TABS = [
    { id:"general", label:"General", icon:<UserCircle size={15}/> },
    { id:"pago", label:"Método de pago", icon:<CreditCard size={15}/> },
  ];
  const inputStyle = { width:"100%", boxSizing:"border-box", padding:"9px 13px", fontSize:13, border:`1.5px solid ${T.gray}`, borderRadius:T.radiusInput, background:T.surfaceInset, color:T.navy, fontFamily:font, outline:"none" };

  return (
    <div>
      <SectionHeader title="Tu cuenta" subtitle="Tu foto, tus datos de acceso, tu plan y tu método de pago." />
      <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:16, alignItems:"start" }}>
        <Card style={{ padding:20 }}>
          <div style={{ position:"relative", width:76, height:76, margin:"0 auto 12px" }}>
            <img src={personaAvatarSrc(account?.avatarKey)} alt="" style={{ width:76, height:76, borderRadius:"50%", objectFit:"cover", border:`2px solid ${T.purpleLight}` }}/>
            <button onClick={()=>setShowPicker(s=>!s)} title="Cambiar foto" style={{ position:"absolute", right:-2, bottom:-2, width:28, height:28, borderRadius:"50%", background:T.purple, border:`2px solid ${T.surface}`, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <Camera size={13}/>
            </button>
            {showPicker && <AccountAvatarPicker value={account?.avatarKey} onPick={key=>updateAccount(a=>({...a, avatarKey:key}))} onClose={()=>setShowPicker(false)}/>}
          </div>
          <div style={{ textAlign:"center", fontSize:12.5, fontWeight:700, color:T.navy, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{currentUser?.email || "—"}</div>
          <div style={{ textAlign:"center", marginTop:6, marginBottom:16 }}>
            <span style={{ fontSize:11, fontWeight:700, color:T.purple, background:T.purpleBg, padding:"3px 10px", borderRadius:T.radiusPill }}>Plan {plan.label}</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px", borderRadius:T.radiusInput, border:"none", cursor:"pointer", textAlign:"left", fontFamily:font, fontSize:13, fontWeight:tab===t.id?700:500, background:tab===t.id?T.purpleBg:"transparent", color:tab===t.id?T.purple:T.navy }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </Card>

        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {tab==="general" ? (
            <>
              <Card style={{ padding:20 }}>
                <div style={{ fontSize:13, fontWeight:800, color:T.navy, marginBottom:12, fontFamily:fontDisplay }}>Email</div>
                <div style={{ display:"flex", gap:8 }}>
                  <input value={email} onChange={e=>setEmail(e.target.value)} style={{ ...inputStyle, flex:1 }}/>
                  <Btn variant="primary" onClick={saveEmail} disabled={savingEmail || !email.trim() || email===currentUser?.email}>{savingEmail?"Guardando…":"Guardar"}</Btn>
                </div>
                <div style={{ fontSize:11, color:T.slate, marginTop:6 }}>Si lo cambiás, te mandamos un email para confirmarlo.</div>
              </Card>

              <Card style={{ padding:20 }}>
                <div style={{ fontSize:13, fontWeight:800, color:T.navy, marginBottom:12, fontFamily:fontDisplay }}>Contraseña</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:10 }}>
                  <div style={{ position:"relative" }}>
                    <input type={showPass?"text":"password"} value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Nueva contraseña" style={{ ...inputStyle, paddingRight:40 }}/>
                    <button onClick={()=>setShowPass(s=>!s)} type="button" title={showPass?"Ocultar":"Mostrar"} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:T.slate, cursor:"pointer", display:"flex" }}>{showPass?<EyeOff size={15}/>:<Eye size={15}/>}</button>
                  </div>
                  <input type={showPass?"text":"password"} value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Confirmar contraseña" style={inputStyle}/>
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <Btn variant="primary" small onClick={savePassword} disabled={savingPass || !newPass}>{savingPass?"Actualizando…":"Actualizar contraseña"}</Btn>
                  <Btn variant="ghost" small onClick={onResetPassword}><KeyRound size={13}/> Mandarme un email para resetearla</Btn>
                </div>
              </Card>

              <Card style={{ padding:20 }}>
                <div style={{ fontSize:13, fontWeight:800, color:T.navy, marginBottom:4, fontFamily:fontDisplay }}>País</div>
                <div style={{ fontSize:11.5, color:T.slate, marginBottom:10 }}>Define qué métodos de pago te mostramos en la otra pestaña.</div>
                <select value={account?.country||""} onChange={e=>updateAccount(a=>({...a, country:e.target.value}))} style={inputStyle}>
                  <option value="">— Elegir país —</option>
                  {COUNTRIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </Card>

              <Card style={{ padding:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                  <PlanIcon plan={plan.id} size={22}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:T.navy, fontFamily:fontDisplay }}>Plan {plan.label}</div>
                    <div style={{ fontSize:12, color:T.slate }}>{plan.note}</div>
                  </div>
                </div>
                <div style={{ fontSize:12, color:T.slate, marginBottom:14 }}>
                  Fecha de renovación: <strong style={{ color:T.navy }}>{plan.id==="free" ? "No aplica (plan gratuito)" : (account?.renewsAt ? new Date(account.renewsAt).toLocaleDateString("es-BO",{day:"2-digit",month:"long",year:"numeric"}) : "—")}</strong>
                </div>
                <Btn variant="primary" onClick={onUpgrade}><ArrowUpCircle size={15}/> Subir de nivel</Btn>
              </Card>
            </>
          ) : (
            <Card style={{ padding:20 }}>
              <div style={{ fontSize:13, fontWeight:800, color:T.navy, marginBottom:4, fontFamily:fontDisplay }}>Método de pago</div>
              <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11.5, color:T.slate, marginBottom:16 }}>
                <Globe2 size={13}/> {country ? `Según tu país: ${country.label}` : "Elegí tu país en General para ver métodos locales"}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {methods.map(m=>{
                  const sel = account?.paymentMethodId===m.id;
                  return (
                    <div key={m.id} onClick={()=>updateAccount(a=>({...a, paymentMethodId:m.id}))} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:T.radiusInput, border:`1.5px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:T.surface, cursor:"pointer" }}>
                      <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${sel?T.purple:T.gray}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{sel && <Check size={12} color={T.purple}/>}</div>
                      <span style={{ fontSize:13, color:T.navy, fontWeight:sel?700:400 }}>{m.label}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
      <div style={{ marginTop:20 }}>
        <Btn variant="ghost" onClick={onSignOut}><LogOut size={14}/> Cerrar sesión</Btn>
      </div>
    </div>
  );
}

// ─── CUENTA — subir de nivel (venta de planes) ─────────────────────────────────
function UpgradeScreen({ account, onChoose, onBack }) {
  const current = account?.plan || "free";
  return (
    <div>
      <SectionHeader title="Subí de nivel" subtitle="Elegí el plan que mejor se ajuste a lo que necesitás." action={<Btn variant="ghost" onClick={onBack}>← Volver a tu cuenta</Btn>}/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:14 }}>
        {PLANS.map(p=>{
          const isCurrent = p.id===current;
          return (
            <Card key={p.id} style={{ padding:20, border:`1.5px solid ${isCurrent?T.purple:T.gray}`, background:isCurrent?T.purpleBg:T.surface, display:"flex", flexDirection:"column" }}>
              <PlanIcon plan={p.id} size={26}/>
              <div style={{ fontSize:15, fontWeight:800, color:T.navy, marginTop:12, fontFamily:fontDisplay }}>{p.label}</div>
              <div style={{ fontSize:12, color:T.slate, marginTop:4, marginBottom:16, flex:1 }}>{p.note}</div>
              <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:14 }}>Capacidad: {p.capacity}</div>
              {isCurrent
                ? <Btn variant="soft" full disabled>Plan actual</Btn>
                : <Btn variant="primary" full onClick={()=>onChoose(p.id)}>Elegir este plan</Btn>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  // Acceso local de prueba: solo existe en Vite dev y se activa desde .env.local.
  // Nunca se habilita en un build de producción ni crea usuarios en Supabase.
  const localDevAuth = import.meta.env.DEV && import.meta.env.VITE_LOCAL_AUTH_BYPASS === "true";
  const localTestUser = { id:"local-test-user", email:"test@test.com", user_metadata:{ name:"Usuario de prueba" } };
  const [data,        setData]       = useState(null);
  const [brandId,     setBrandId]    = useState(null);
  const [view,        setView]       = useState("dashboard");
  const [modal,       setModal]      = useState(null);
  const [md,          setMd]         = useState({});
  const [toast,       setToast]      = useState("");
  const [busy,        setBusy]       = useState(false);
  const [initialConcept, setInitialConcept] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authView, setAuthView] = useState(null);
  const isAppRoute = window.location.pathname.startsWith("/app");

  // Vestigial: callClaude() todavía acepta este parámetro por compatibilidad con ~15 call
  // sites existentes, pero src/lib/ai.ts lo ignora — la IA corre en el backend con su propia
  // key server-side, facturada vía créditos, no con una key que traiga el usuario.
  const apiKey = null;

  useEffect(() => {
    if (localDevAuth) {
      setCurrentUser(localTestUser);
      setAuthReady(true);
      return;
    }
    let alive = true;
    supabase.auth.getUser()
      .then(({ data: { user } }) => { if (alive) setCurrentUser(user || null); })
      .catch(() => {})
      .finally(() => { if (alive) setAuthReady(true); });
    const { data: authSub } = supabase.auth.onAuthStateChange?.((_, session) => {
      setCurrentUser(session?.user || null);
      setAuthReady(true);
    }) || { data: {} };
    return () => { alive = false; authSub?.subscription?.unsubscribe?.(); };
  }, [localDevAuth]);

  useEffect(() => {
    // Cargar datos: primero del puente local (archivo JSON que el agente puede editar),
    // si no, de localStorage, si no, marca demo.
    (async () => {
      const fromBridge = await bridgeLoad();
      if (fromBridge && fromBridge.brands?.length) { setData(fromBridge); setBrandId(fromBridge.brands[0].id); return; }
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (saved && saved.brands?.length) { setData(saved); setBrandId(saved.brands[0].id); }
        else { setData({ brands: [DEMO_BRAND] }); setBrandId(DEMO_BRAND.id); }
      } catch { setData({ brands: [DEMO_BRAND] }); setBrandId(DEMO_BRAND.id); }
    })();
  }, []);

  // Persiste en localStorage (offline) y en el archivo JSON del puente (para el agente/MCP).
  const save = useCallback((next) => { setData(next); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {} bridgeSave(next); }, []);
  const notify = (m) => { setToast(m); setTimeout(()=>setToast(""),2500); };
  const closeModal = () => { setModal(null); setMd({}); };

  const brand     = data?.brands?.find(b=>b.id===brandId)||null;
  const assets    = brand?.assets||[];
  const prompts   = brand?.prompts||[];
  const conceptos = brand?.conceptos||[];
  const perfil    = brand?.perfil||{};

  const updateBrand = useCallback((fn) => {
    setData(prev => {
      const next = {...prev, brands:prev.brands.map(b=>b.id===brandId?fn(b):b)};
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      bridgeSave(next);
      return next;
    });
  }, [brandId]);

  // Cuenta: separada de las marcas — plan, foto, país y método de pago no son por marca.
  const updateAccount = useCallback((fn) => {
    setData(prev => {
      const next = {...prev, account: fn(prev.account || { plan:"free" })};
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      bridgeSave(next);
      return next;
    });
  }, []);
  function choosePlan(planId) {
    updateAccount(a => ({ ...a, plan:planId, renewsAt: planId==="free" ? null : new Date(Date.now()+30*24*60*60*1000).toISOString() }));
    notify(planId==="free" ? "Volviste al plan Gratuito" : "¡Listo! Ya tenés el plan " + (PLANS.find(p=>p.id===planId)?.label||planId));
    setView("account");
  }

  // Prompt library ops
  function savePrompt(form) {
    const p = { id:md.id||uid(), nombre:form.nombre.trim(), texto:form.texto.trim(), createdAt: md.createdAt || new Date().toISOString() };
    if (md.id) { updateBrand(b=>({...b, prompts:(b.prompts||[]).map(x=>x.id===md.id?p:x)})); notify("Guardado ✓"); }
    else { updateBrand(b=>({...b, prompts:[...(b.prompts||[]),p]})); notify("Prompt creado ✓"); }
    closeModal();
  }
  function deletePrompt(id) { updateBrand(b=>({...b, prompts:(b.prompts||[]).filter(p=>p.id!==id)})); notify("Eliminado"); }

  // Concept ops
  function saveConcepto(form, customAngle, customStyle) {
    if (customAngle?.label) { updateBrand(b=>({...b, customAngles:[...(b.customAngles||[]),{id:uid(),...customAngle}]})); notify("Ángulo guardado"); return; }
    if (customStyle?.label) { updateBrand(b=>({...b, customStyles:[...(b.customStyles||[]),{id:uid(),...customStyle}]})); notify("Estilo guardado"); return; }
    const c = { id:md.id||uid(), concepto:form.concepto, angulo:form.angulo,
      personaId:form.personaId||null, personaDesc:form.personaDesc||"",
      estilo:form.estilo||"", hook:"" };
    if (md.id) { updateBrand(b=>({...b, conceptos:(b.conceptos||[]).map(x=>x.id===md.id?c:x)})); notify("Concepto actualizado"); }
    else { updateBrand(b=>({...b, conceptos:[...(b.conceptos||[]),c]})); notify("Concepto creado ✓"); }
    closeModal();
  }
  function deleteConcepto(id) { updateBrand(b=>({...b, conceptos:(b.conceptos||[]).filter(c=>c.id!==id)})); notify("Eliminado"); }

  // Concept → Ad Composer flow
  function goCompose(concept) {
    setInitialConcept(concept);
    setView("meta-ad");
  }

  // AI ops
  async function aiSuggestConceptos() {
    if (!brand||busy) return; setBusy(true); notify("IA procesando…");
    try {
      const ctx = perfilCtx(perfil, brand?.avatars);
      const blist = assets.slice(0,8).map(a=>`[${tp(a.tipo).label}] ${a.text}`).join("\n");
      // RAG: ejemplos reales de hooks ganadores para inspirar los conceptos.
      const ej = bancoCtx("hook", { vertical: verticalDeIndustria(brand?.industry), n: 4 });
      const raw = await callClaude(`${COPY_BRAIN}\n\nIMPORTANTE: Genera TODO en español.\n\n${ctx}${ej}\n\nBloques para "${brand.name}":\n${blist}\n\nGenera 4 ideas de concepto para anuncios. Para cada concepto, encuentra una idea central clara y el ángulo que más resonará con el avatar. La línea de hook debe aplicar las REGLAS DE HOOK — específico, directo, máx 1-2 líneas.\nJSON only:\n[{"concepto":"","angulo":"","estilo":"","hook":""}]`, apiKey, 1400, "Sugerir conceptos", null, "suggest");
      const arr = JSON.parse(raw.replace(/```json|```/g,"").trim());
      updateBrand(b=>({...b, conceptos:[...(b.conceptos||[]),...arr.map(c=>({id:uid(),...c}))]}));
      notify(`${arr.length} conceptos añadidos`);
    } catch(e) { console.error("ai concepts error:", e); notify("Error: " + (e?.message || "intenta de nuevo")); }
    setBusy(false);
  }

  const perfFields = brand?.perfil ? Object.values(brand.perfil).filter(Boolean).length : 0;
  const perfCompletion = Math.min(Math.round(perfFields / 6 * 100), 100);
  const account = data?.account || null;
  const accountPlan = account?.plan || "free";

  // Balance real de créditos — viene de user_credits en Supabase vía el backend, no una
  // fórmula local inventada. Se refresca al cambiar de usuario; DashboardScreen puede pasar
  // `onNavigate` para forzar un refetch después de una generación si hace falta más adelante.
  const [creditsInfo, setCreditsInfo] = useState(null);
  useEffect(() => {
    let cancelled = false;
    if (!currentUser) { setCreditsInfo(null); return; }
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const r = await fetch(`${BACKEND_URL}/credits`, { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (!r.ok) return;
        const d = await r.json();
        if (!cancelled) setCreditsInfo(d);
      } catch { /* silencioso — el panel simplemente muestra 0% hasta que ande */ }
    })();
    return () => { cancelled = true; };
  }, [currentUser?.id]);
  const creditStats = creditsInfo
    ? {
        percent: Math.min(100, Math.max(0, Math.round(100 - (creditsInfo.credits_balance / Math.max(1, creditsInfo.credits_included)) * 100))),
        balance: creditsInfo.credits_balance,
        included: creditsInfo.credits_included,
      }
    : { percent: 0, balance: null, included: null };

  async function handleResetPassword() {
    const email = currentUser?.email;
    if (!email) { notify("No encontré un email de sesión"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    notify(error ? "No se pudo enviar el reset" : "Email de reset enviado");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setCurrentUser(null);
    notify("Sesión cerrada");
  }

  const NAV = [
    { id:"dashboard",    icon:<Home size={15}/>,       label:"Inicio",            badge:null,                                     group:"setup" },
    { id:"perfil",       icon:<Building2 size={15}/>,  label:"Marca",             badge:null,                                     group:"setup" },
    { id:"personas",     icon:<Users size={15}/>,       label:"Personas",          badge:(brand?.avatars||[]).length||null,         group:"setup" },
    { id:"ofertas",      icon:<Tag size={15}/>,         label:"Ofertas",           badge:(brand?.offers||[]).length||null,         group:"setup" },
    { id:"meta-ad",      icon:<Layers size={15}/>,      label:"Compositor",        badge:null,                                     group:"generate" },
    { id:"prompts",      icon:<Library size={15}/>,     label:"Prompts",           badge:prompts.length||null,                     group:"library" },
    { id:"banco-copies", icon:<Trophy size={15}/>,      label:"Banco de copies",   badge:(brand?.copies||[]).length||null,         group:"library" },
  ];

  if (!authReady) return <FlowiLoader label="Cargando Flowi…" />;
  if (!isAppRoute && !authView) {
    return <LandingPage onLogin={()=>currentUser ? window.location.assign("/app") : setAuthView("login")} onSignup={()=>currentUser ? window.location.assign("/app") : setAuthView("signup")} />;
  }
  if (!currentUser || authView) {
    return <AuthScreen initialTab={authView || "login"} onBack={()=>setAuthView(null)} onAuth={async()=>{ const { data: { user } } = await supabase.auth.getUser(); setCurrentUser(user || null); window.location.assign("/app"); }} />;
  }
  if (!data) return <FlowiLoader label="Cargando Flowi…" />;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.canvas, fontFamily:font, fontSize:13 }}>
      <Toast msg={toast}/>

      {/* SIDEBAR — rail de tinta (ink), acento morado, con degradé para más vibrancia */}
      <div style={{ width:224, flexShrink:0, position:"relative", background:`linear-gradient(165deg, #241C5E 0%, ${T.navy} 45%, #120D33 100%)`, boxShadow:"1px 0 0 rgba(122,90,246,0.25), 4px 0 24px rgba(122,90,246,0.08)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.5, backgroundImage:"linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)", backgroundSize:"22px 22px" }}/>
        <div style={{ position:"absolute", top:-80, right:-80, width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle, rgba(155,107,255,0.28) 0%, transparent 70%)", pointerEvents:"none" }}/>
        <div style={{ padding:"22px 18px 16px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          <img src={appLogo} alt="Flowi" style={{ height:26, width:"auto", display:"block", marginBottom:5 }}/>
          <div style={{ fontSize:9, color:T.purpleLight, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:700 }}>Beta</div>
        </div>

        <div style={{ padding:"12px 10px", flex:1, overflowY:"auto" }}>
          {[
            { key:"setup",    label:"Configurar",  items: NAV.filter(n=>n.group==="setup") },
            { key:"generate", label:"Generar",    items: NAV.filter(n=>n.group==="generate") },
            { key:"library",  label:"Biblioteca", items: NAV.filter(n=>n.group==="library") },
          ].map(grp=>(
            <div key={grp.key} style={{ marginBottom:6 }}>
              <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.11em", color:"rgba(255,255,255,0.28)", padding:"8px 12px 4px" }}>{grp.label}</div>
              {grp.items.map(n=>{
                const locked = accountPlan==="free" && LOCKED_ON_FREE.has(n.id);
                return <NavItem key={n.id} icon={n.icon} label={n.label} badge={n.badge} active={view===n.id} locked={locked}
                  title={locked?"Disponible desde el plan Starter — subí de nivel para desbloquear":undefined}
                  onClick={locked ? ()=>{ notify("🔒 Esa sección se desbloquea desde el plan Starter"); setView("upgrade"); } : ()=>setView(n.id)}/>;
              })}
            </div>
          ))}
        </div>

        {/* Brand selector */}
        <div style={{ padding:"12px 16px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(255,255,255,0.3)", marginBottom:6 }}>Marca activa</div>
          {(data.brands||[]).map(b=>(
            <button key={b.id} onClick={()=>setBrandId(b.id)} style={{ display:"block", width:"100%", padding:"6px 9px", marginBottom:2, border:"none", borderRadius:T.radiusInput, cursor:"pointer", background:brandId===b.id?`linear-gradient(120deg, rgba(122,90,246,0.5), rgba(155,107,255,0.35))`:"transparent", color:brandId===b.id?"#fff":"rgba(255,255,255,0.42)", fontFamily:font, fontSize:12, fontWeight:brandId===b.id?600:400, textAlign:"left", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.name}</button>
          ))}
          <button onClick={()=>{ setModal("addBrand"); setMd({}); }} style={{ display:"block", width:"100%", padding:"6px 9px", border:"none", borderRadius:T.radiusInput, cursor:"pointer", background:"transparent", color:"rgba(255,255,255,0.3)", fontFamily:font, fontSize:11, textAlign:"left" }}>+ Nueva marca</button>
        </div>

        {/* Account */}
        <div style={{ padding:"10px 16px 16px" }}>
          <button onClick={()=>setView("account")} style={{ width:"100%", border:`1px solid ${view==="account"?"rgba(122,90,246,0.5)":"rgba(255,255,255,0.1)"}`, borderRadius:14, padding:"10px 11px", background:view==="account"?"rgba(122,90,246,0.18)":"rgba(255,255,255,0.06)", color:"#fff", cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", gap:10, textAlign:"left" }}>
            <UserCircle size={18} style={{ color:T.purpleLight, flexShrink:0 }}/>
            <span style={{ flex:1, minWidth:0 }}>
              <span style={{ display:"block", fontSize:12.5, fontWeight:800 }}>Tu Perfil</span>
              <span style={{ display:"block", fontSize:10.5, color:"rgba(255,255,255,0.42)" }}>{(PLANS.find(p=>p.id===accountPlan)||PLANS[0]).label}</span>
            </span>
          </button>
        </div>

        {/* Marca ROAS Academy */}
        <div style={{ padding:"14px 16px 16px", borderTop:"1px solid rgba(255,255,255,0.08)", display:"flex", justifyContent:"center" }}>
          <img src={roasAcademyLogo} alt="ROAS Academy" style={{ height:22, width:"auto", opacity:0.7 }}/>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Screen */}
        <div style={{ flex:1, overflow:"auto", padding:28, ...(view==="dashboard" ? { backgroundColor:T.canvas, backgroundImage:`linear-gradient(180deg, rgba(241,240,248,0) 38%, rgba(241,240,248,0.45) 64%, rgba(241,240,248,0.12) 100%), url(${homeBg})`, backgroundRepeat:"no-repeat, no-repeat", backgroundPosition:"bottom center, bottom center", backgroundSize:"100% 56%, 100% auto" } : {}) }}>
          {view==="dashboard"  && <DashboardScreen brand={brand} assets={assets} conceptos={conceptos} onNavigate={setView} creditStats={creditStats}/>}
          {view==="personas"   && brand && <PersonasScreen brand={brand} updateBrand={updateBrand} notify={notify} busy={busy} setBusy={setBusy} apiKey={apiKey}/>}
          {view==="prompts"    && <PromptsScreen prompts={prompts} onAdd={()=>{setModal("addPrompt");setMd({});}} onEdit={p=>{setModal("editPrompt");setMd({...p});}} onDelete={deletePrompt}/>}
          {view==="meta-ad"    && brand && <CompositorApp brand={brand} updateBrand={updateBrand} apiKey={apiKey} notify={notify} busy={busy} setBusy={setBusy} onExit={()=>setView("dashboard")}/>}
          {view==="ofertas"    && brand && <OfertasScreen brand={brand} updateBrand={updateBrand} notify={notify} busy={busy} setBusy={setBusy} apiKey={apiKey}/>}
          {view==="banco-copies" && brand && <BancoCopiesScreen copies={brand?.copies||[]} conceptos={conceptos} onDelete={id=>updateBrand(b=>({...b,copies:(b.copies||[]).filter(c=>c.id!==id)}))} onUpdateRating={(id,r)=>updateBrand(b=>({...b,copies:(b.copies||[]).map(c=>c.id===id?{...c,rating:r}:c)}))}/>}
          {view==="perfil"     && brand && <BrandProfileScreen brand={brand} notify={notify} apiKey={apiKey} updateBrand={updateBrand} busy={busy} setBusy={setBusy} onSave={(p,avatars,competitors,offers)=>{updateBrand(b=>({...b,perfil:p,avatars:avatars||b.avatars||[],competitors:competitors||b.competitors||[],offers:offers||b.offers||[]}));notify("Perfil guardado ✓");}}/>}
          {view==="account"    && <AccountScreen account={account} updateAccount={updateAccount} currentUser={currentUser} notify={notify} onResetPassword={handleResetPassword} onSignOut={handleSignOut} onUpgrade={()=>setView("upgrade")}/>}
          {view==="upgrade"    && <UpgradeScreen account={account} onChoose={choosePlan} onBack={()=>setView("account")}/>}
          {!brand && (
            <div style={{ textAlign:"center", padding:80, color:T.slate }}>
              <div style={{ fontSize:36, marginBottom:14 }}>+</div>
              <div style={{ fontSize:14, marginBottom:18 }}>Sin marca seleccionada</div>
              <Btn variant="primary" onClick={()=>{setModal("addBrand");setMd({});}}>Crear primera marca</Btn>
            </div>
          )}
        </div>
      </div>

      <CatChatHelper brandName={brand?.name || "tu marca"} currentView={view} onNavigate={setView} />

      <FlowiLoader show={busy} floating label="Flowi está pensando…" />

      {/* MODALS */}
      {modal==="addBrand" && (
        <Modal title="Nueva marca" onClose={closeModal}>
          <Inp label="Nombre" placeholder="e.g. ROAS Academy" value={md.name||""} onChange={e=>setMd(p=>({...p,name:e.target.value}))} autoFocus/>
          <Inp label="Industria" placeholder="e.g. Marketing Education" value={md.industry||""} onChange={e=>setMd(p=>({...p,industry:e.target.value}))}/>
          <div style={{ display:"flex", gap:8 }}>
            <Btn variant="primary" onClick={()=>{ if(!md.name?.trim()) return; const nb={id:uid(),name:md.name.trim(),industry:md.industry?.trim()||"",assets:[],conceptos:[],copies:[],customAngles:[],customStyles:[],perfil:{}}; save({...data,brands:[...(data.brands||[]),nb]}); setBrandId(nb.id); closeModal(); }} disabled={!md.name?.trim()}>Crear</Btn>
            <Btn variant="ghost" onClick={closeModal}>Cancelar</Btn>
          </div>
        </Modal>
      )}
      {(modal==="addPrompt"||modal==="editPrompt") && (
        <Modal title={modal==="addPrompt"?"Nuevo prompt":"Editar prompt"} onClose={closeModal} width={540}>
          <PromptForm initial={md.id?md:{}} onSave={savePrompt} onClose={closeModal}/>
        </Modal>
      )}
    </div>
  );
}


























