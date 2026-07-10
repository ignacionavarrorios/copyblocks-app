// ui.jsx — primitives Voltline-purple para el subsistema del Compositor (canvas).
// Espejo minimalista de los primitives locales de App.tsx (Btn/Card/Chip) — App.tsx no los
// exporta, así que este subsistema (archivos aparte) tiene su propia copia liviana.
import { T, font, fontDisplay } from "@/lib/constants";

const VARIANTS = {
  primary: { background: T.purple, color: "#fff", borderColor: T.purple, boxShadow: T.shadowAccent },
  ink:     { background: T.navy, color: "#fff", borderColor: T.navy },
  ghost:   { background: "transparent", color: T.slate, borderColor: "transparent" },
  soft:    { background: T.purpleBg, color: T.purple, borderColor: T.purpleLight },
  danger:  { background: "transparent", color: T.red, borderColor: "#F5BCBC" },
  default: { background: T.surfaceInset, color: T.navy, borderColor: T.gray },
};

export function Btn({ variant = "default", onClick, children, disabled, full, small, style = {}, title, type = "button" }) {
  const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: small ? "0 14px" : "0 20px", height: small ? 34 : 42, fontSize: small ? 12 : 13, fontWeight: 600, borderRadius: T.radiusPill, cursor: disabled ? "not-allowed" : "pointer", border: "1.5px solid", fontFamily: font, opacity: disabled ? 0.45 : 1, transition: "all 0.15s", whiteSpace: "nowrap", width: full ? "100%" : "auto", boxSizing: "border-box", ...style };
  return <button type={type} title={title} style={{ ...base, ...(VARIANTS[variant] || VARIANTS.default) }} onClick={disabled ? undefined : onClick} disabled={disabled}>{children}</button>;
}

export function Card({ children, style = {}, onClick }) {
  return <div onClick={onClick} style={{ background: T.surface, borderRadius: T.radiusCard, border: `1px solid ${T.gray}`, padding: 20, boxShadow: T.shadowCard, ...style }}>{children}</div>;
}

export function Chip({ children, selected, onClick, title, color = T.purple }) {
  return (
    <div onClick={onClick} title={title} style={{ padding: "6px 13px", borderRadius: T.radiusPill, border: `1.5px solid ${selected ? color : T.gray}`, background: selected ? `${color}14` : T.surface, cursor: onClick ? "pointer" : "default", fontSize: 12, fontWeight: selected ? 700 : 500, color: selected ? color : T.navy, transition: "all 0.12s", whiteSpace: "nowrap" }}>
      {children}
    </div>
  );
}

export function Inp({ label, hint, multiline, rows, ...props }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.slate, marginBottom: 6 }}>{label}</div>}
      {multiline
        ? <textarea {...props} rows={rows || 3} style={{ width: "100%", boxSizing: "border-box", padding: "10px 13px", fontSize: 13, border: `1.5px solid ${T.gray}`, borderRadius: T.radiusInput, background: T.surfaceInset, color: T.navy, fontFamily: font, outline: "none", resize: "vertical", lineHeight: 1.55 }} />
        : <input {...props} style={{ width: "100%", boxSizing: "border-box", padding: "9px 13px", fontSize: 13, border: `1.5px solid ${T.gray}`, borderRadius: T.radiusInput, background: T.surfaceInset, color: T.navy, fontFamily: font, outline: "none" }} />}
      {hint && <div style={{ fontSize: 11, color: T.slate, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

export function ModalShell({ title, onClose, children, width = 460 }) {
  return (
    <div className="fade-in" onMouseDown={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(11,16,32,0.72)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9200, padding: 16 }}>
      <div className="card-pop-in" onMouseDown={e => e.stopPropagation()} style={{ background: T.surface, borderRadius: T.radiusCard, padding: 26, width, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto", border: `1px solid ${T.gray}`, boxSizing: "border-box", boxShadow: T.shadowModal }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${T.borderSoft}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, fontFamily: fontDisplay }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.slate, fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Botón "×" para quitar/reiniciar un nodo del canvas — ancla arriba a la derecha de la tarjeta.
export function NodeCloseBtn({ onClick, title = "Quitar" }) {
  return (
    <button onClick={e => { e.stopPropagation(); onClick(); }} title={title} className="nodrag"
      style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: "50%", border: "none", background: T.surfaceInset, color: T.slate, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, lineHeight: 1, zIndex: 4, padding: 0 }}>
      ×
    </button>
  );
}

// Botón "+" para armar una conexión hacia otro bloque (nuevo o ya existente) — ancla al borde
// derecho, sobre el Handle source. Cuando `active` está armado desde este nodo, se resalta.
export function NodeAddBtn({ onClick, active, title = "Conectar a otro paso (nuevo o ya existente)" }) {
  return (
    <button onClick={e => { e.stopPropagation(); onClick(); }} title={title} className="nodrag"
      style={{ position: "absolute", top: "50%", right: -12, transform: `translateY(-50%) scale(${active ? 1.15 : 1})`, width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${active ? T.navy : T.purple}`, background: active ? T.navy : T.purple, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, lineHeight: 1, zIndex: 4, boxShadow: T.shadowAccent, padding: 0, transition: "all 0.12s" }}>
      +
    </button>
  );
}

// Panel deslizante desde la izquierda — para vistas de detalle más espaciosas que un modal
// centrado (ej. el contenido completo del Cerebro, con thumbnails).
export function DrawerShell({ title, onClose, children, footer, width = 420 }) {
  return (
    <div className="fade-in" onMouseDown={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(11,16,32,0.45)", zIndex: 9200 }}>
      <div className="drawer-slide-in" onMouseDown={e => e.stopPropagation()} style={{ position: "absolute", top: 0, left: 0, bottom: 0, width, maxWidth: "92vw", background: T.surface, borderRight: `1px solid ${T.gray}`, boxShadow: "8px 0 28px rgba(24,19,73,0.18)", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${T.borderSoft}`, flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, fontFamily: fontDisplay }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.slate, fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
        </div>
        <div className="nowheel" style={{ flex: 1, overflowY: "auto", padding: 20 }}>{children}</div>
        {footer && <div style={{ flexShrink: 0, borderTop: `1px solid ${T.borderSoft}`, background: T.surface }}>{footer}</div>}
      </div>
    </div>
  );
}

export { T, font, fontDisplay };
