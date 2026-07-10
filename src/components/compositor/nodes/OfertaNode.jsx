// OfertaNode.jsx — nodo compacto + panel: elegir una oferta guardada o crear una manual.
import { Handle, Position } from "@xyflow/react";
import { useState } from "react";
import { T, font, fontDisplay, Btn, NodeCloseBtn, NodeAddBtn } from "../ui.jsx";
import { BlockIcon } from "@/lib/blockIcons.jsx";
import OfertaCreator from "../OfertaCreator.jsx";

export function OfertaNode({ data, selected, brand, onDelete, onAddStep, connecting }) {
  const offer = (brand?.offers || []).find(o => o.id === data.offerId);
  return (
    <div style={{ position: "relative", width: 220, background: T.surface, borderRadius: T.radiusCard, border: `2px solid ${selected ? T.purple : T.gray}`, boxShadow: selected ? T.shadowAccent : T.shadowCard, overflow: "visible", fontFamily: font }}>
      {onDelete && <NodeCloseBtn onClick={onDelete} title="Quitar Oferta" />}
      {onAddStep && <NodeAddBtn onClick={onAddStep} active={connecting} />}
      <Handle type="target" position={Position.Left} style={{ background: T.purple, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: T.purple, width: 8, height: 8 }} />
      <div style={{ padding: "13px 15px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <BlockIcon type="oferta" size={20} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: fontDisplay }}>Oferta</span>
        </div>
        <div style={{ fontSize: 11, color: T.slate }}>{offer ? (offer.nombre || offer.name) : "Sin elegir — click para configurar"}</div>
      </div>
    </div>
  );
}

export function OfertaPanel({ data, onChange, brand, updateBrand, notify, apiKey, busy, setBusy }) {
  const [creating, setCreating] = useState(false);
  const offers = brand?.offers || [];

  function guardarNuevaOferta(offer) {
    updateBrand(b => ({ ...b, offers: [...(b.offers || []), offer] }));
    onChange({ ...data, offerId: offer.id });
    setCreating(false);
    notify?.("Oferta creada ✓");
  }

  if (creating) return <OfertaCreator onSave={guardarNuevaOferta} onCancel={() => setCreating(false)} notify={notify} apiKey={apiKey} busy={busy} setBusy={setBusy} />;

  return (
    <div>
      <div style={{ fontSize: 11.5, color: T.slate, marginBottom: 12 }}>Elegí la oferta que va en este anuncio.</div>
      {!offers.length && <div style={{ fontSize: 12, color: T.slate, padding: "10px 0", marginBottom: 8 }}>Todavía no tenés ofertas guardadas.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14, maxHeight: 300, overflowY: "auto" }}>
        {offers.map(o => {
          const sel = data.offerId === o.id;
          return (
            <div key={o.id} onClick={() => onChange({ ...data, offerId: sel ? null : o.id })} style={{ padding: "9px 13px", borderRadius: T.radiusInput, border: `1.5px solid ${sel ? T.purple : T.gray}`, background: sel ? T.purpleBg : T.surface, cursor: "pointer" }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: sel ? T.purple : T.navy }}>{o.nombre || o.name}</div>
              {(o.descripcion || o.desc) && <div style={{ fontSize: 11, color: T.slate, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.descripcion || o.desc}</div>}
              {(o.precio || o.price) && <div style={{ fontSize: 11, color: T.purple, fontWeight: 600, marginTop: 2 }}>{o.precio || o.price}</div>}
            </div>
          );
        })}
      </div>
      <Btn variant="soft" full onClick={() => setCreating(true)}>+ Crear oferta</Btn>
    </div>
  );
}
