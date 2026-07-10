// Tooltip.jsx — tooltip flotante estilo "cyber glass": tarjeta oscura con blur, borde sutil y
// glow morado, con una flechita apuntando al trigger. Se usa para reemplazar bloques largos de
// texto de ayuda (SectionGuide, hints) por un ícono compacto — ahorra espacio en los builders de
// Persona/Marca/Oferta sin perder el contexto, que aparece solo al pasar el mouse.
import { useState } from "react";
import { Info } from "lucide-react";
import { T, font, fontDisplay } from "./compositor/ui.jsx";

export function InfoTooltip({ title, text, size = 14, align = "center" }) {
  const [open, setOpen] = useState(false);
  const alignStyle = align === "left"
    ? { left: 0, transform: "none" }
    : align === "right"
    ? { right: 0, left: "auto", transform: "none" }
    : { left: "50%", transform: "translateX(-50%)" };
  const arrowAlign = align === "left" ? { left: 14 } : align === "right" ? { right: 14, left: "auto" } : { left: "50%", transform: "translateX(-50%)" };

  return (
    <span style={{ position: "relative", display: "inline-flex", verticalAlign: "middle" }}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Info size={size} style={{ color: T.slate, cursor: "help", opacity: 0.65 }} />
      <div style={{
        position: "absolute", bottom: "100%", ...alignStyle, marginBottom: 11, width: 250, zIndex: 60,
        pointerEvents: "none", opacity: open ? 1 : 0, transform: `${alignStyle.transform === "none" ? "" : alignStyle.transform + " "}translateY(${open ? "0" : "4px"})`,
        transition: "opacity 180ms ease, transform 180ms ease",
      }}>
        <div style={{
          position: "relative", padding: "12px 14px", borderRadius: 14, fontFamily: font,
          background: "linear-gradient(160deg, rgba(28,22,80,0.97), rgba(20,16,58,0.98))",
          backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 18px 40px rgba(15,10,50,0.4), 0 0 0 1px rgba(122,90,246,0.1)",
        }}>
          {title && <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: fontDisplay, marginBottom: 4 }}>{title}</div>}
          <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>{text}</div>
          <div style={{ position: "absolute", bottom: -5, ...arrowAlign, width: 10, height: 10, background: "rgb(24,19,68)", transform: `${arrowAlign.transform ? arrowAlign.transform + " " : ""}rotate(45deg)`, borderRight: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)" }} />
        </div>
      </div>
    </span>
  );
}

// Fila compacta: label + tooltip de ayuda — reemplaza los bloques largos de guía por sección.
export function LabelWithHint({ label, hint, hintTitle, required }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: T.slate }}>{label}{required ? " *" : ""}</span>
      {hint && <InfoTooltip title={hintTitle} text={hint} />}
    </div>
  );
}
