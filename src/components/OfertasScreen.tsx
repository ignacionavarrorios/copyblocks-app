// @ts-nocheck
// ─── OFERTAS ───────────────────────────────────────────────────────────────
// Lista de ofertas guardadas (brand.offers) + creación/edición vía OfertaCreator
// (mismo form + chat de IA que usa el nodo Oferta del Compositor) — así hay un
// solo lugar donde vive el modelo de datos de "oferta" en toda la app.
import { useState } from "react";
import { T, font, fontDisplay } from "@/lib/constants";
import OfertaCreator from "@/components/compositor/OfertaCreator.jsx";
import navOfertaIcon from "@/assets/icons/offer-gift-clean.png";

function Btn({ variant = "default", onClick, children, disabled, small, style = {} }) {
  const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: small ? "7px 13px" : "10px 18px", fontSize: small ? 12 : 13, fontWeight: 600, borderRadius: 9, cursor: disabled ? "not-allowed" : "pointer", border: "1.5px solid", fontFamily: font, opacity: disabled ? 0.5 : 1, transition: "all 0.15s", whiteSpace: "nowrap", boxSizing: "border-box", ...style };
  const vs = {
    primary: { background: T.purple, color: "#fff", borderColor: T.purple },
    ghost: { background: "transparent", color: T.slate, borderColor: T.gray },
    soft: { background: T.purpleBg, color: T.purple, borderColor: T.purpleLight },
    danger: { background: "transparent", color: "#D94F4F", borderColor: "#F0C4C4" },
    default: { background: T.grayLight, color: T.navy, borderColor: T.gray },
  };
  return <button style={{ ...base, ...(vs[variant] || vs.default) }} onClick={disabled ? undefined : onClick}>{children}</button>;
}

function OfertaCard({ o, onEdit, onDelete }) {
  return (
    <div style={{ background: T.white, borderRadius: 14, border: `1px solid ${T.gray}`, padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: T.navy, fontFamily: fontDisplay }}>{o.nombre}</div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <Btn variant="ghost" small onClick={onEdit}>Editar</Btn>
          <Btn variant="danger" small onClick={onDelete}>Eliminar</Btn>
        </div>
      </div>
      {o.descripcion && <p style={{ margin: "0 0 10px", fontSize: 13, lineHeight: 1.6, color: T.navy }}>{o.descripcion}</p>}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {o.precio && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: T.purpleBg, color: T.purple }}>{o.precio}</span>}
        {o.tiempo && <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: T.grayLight, color: T.slate }}>⏱ {o.tiempo}</span>}
        {o.garantia && <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: T.grayLight, color: T.slate }}>🛡 {o.garantia}</span>}
      </div>
    </div>
  );
}

export default function OfertasScreen({ brand, updateBrand, notify, busy, setBusy, apiKey }) {
  const offers = brand?.offers || [];
  const [editing, setEditing] = useState(null); // null = list view, {} = nueva, {...} = editando

  const isExisting = !!editing && offers.some(o => o.id === editing.id);

  function guardar(form) {
    updateBrand(b => {
      const existentes = b.offers || [];
      const idx = existentes.findIndex(o => o.id === form.id);
      const next = idx >= 0 ? existentes.map(o => o.id === form.id ? form : o) : [...existentes, form];
      return { ...b, offers: next };
    });
    notify(isExisting ? "Oferta actualizada ✓" : "Oferta creada ✓");
    setEditing(null);
  }

  function eliminar(id) {
    updateBrand(b => ({ ...b, offers: (b.offers || []).filter(o => o.id !== id) }));
    notify("Oferta eliminada");
  }

  if (editing) {
    return (
      <div style={{ width: "100%", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <img src={navOfertaIcon} alt="" style={{ width: 48, height: 48, objectFit: "contain", imageRendering: "pixelated", flexShrink: 0 }} />
          <div style={{ fontSize: 17, fontWeight: 700, color: T.navy, fontFamily: fontDisplay }}>{isExisting ? "Editar oferta" : "Nueva oferta"}</div>
        </div>
        <OfertaCreator initial={editing} onSave={guardar} onCancel={() => setEditing(null)} notify={notify} apiKey={apiKey} busy={busy} setBusy={setBusy} />
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src={navOfertaIcon} alt="" style={{ width: 48, height: 48, objectFit: "contain", imageRendering: "pixelated", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.navy, fontFamily: fontDisplay }}>Ofertas</div>
            <div style={{ fontSize: 12.5, color: T.slate }}>Definí tus ofertas — se usan en el Compositor y al generar copy.</div>
          </div>
        </div>
        <Btn variant="primary" onClick={() => setEditing({})}>+ Nueva oferta</Btn>
      </div>

      {offers.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, border: `1px dashed ${T.gray}`, borderRadius: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 6 }}>Todavía no tenés ofertas</div>
          <div style={{ fontSize: 12.5, color: T.slate, marginBottom: 16 }}>Creá tu primera oferta a mano o conversando con el chat de IA.</div>
          <Btn variant="primary" onClick={() => setEditing({})}>+ Nueva oferta</Btn>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {offers.map(o => <OfertaCard key={o.id} o={o} onEdit={() => setEditing(o)} onDelete={() => eliminar(o.id)} />)}
        </div>
      )}
    </div>
  );
}


