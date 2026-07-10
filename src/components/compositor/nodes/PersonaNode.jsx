// PersonaNode.jsx — nodo compacto + panel: elegir una persona guardada o crear una nueva.
import { Handle, Position } from "@xyflow/react";
import { useState } from "react";
import { T, font, fontDisplay, Btn, NodeCloseBtn, NodeAddBtn } from "../ui.jsx";
import PersonaCreator from "../PersonaCreator.jsx";
import { PersonaAvatarDisplay } from "@/components/persona/PersonaBuilder.jsx";
import { BlockIcon } from "@/lib/blockIcons.jsx";

export function PersonaNode({ data, selected, brand, onDelete, onAddStep, connecting }) {
  const persona = (brand?.avatars || []).find(a => a.id === data.personaId);
  return (
    <div style={{ position: "relative", width: 220, background: T.surface, borderRadius: T.radiusCard, border: `2px solid ${selected ? T.purple : T.gray}`, boxShadow: selected ? T.shadowAccent : T.shadowCard, overflow: "visible", fontFamily: font }}>
      {onDelete && <NodeCloseBtn onClick={onDelete} title="Quitar Persona" />}
      {onAddStep && <NodeAddBtn onClick={onAddStep} active={connecting} />}
      <Handle type="target" position={Position.Left} style={{ background: T.purple, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: T.purple, width: 8, height: 8 }} />
      <div style={{ padding: "13px 15px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          {persona ? <PersonaAvatarDisplay avatar={persona} size={22} /> : <BlockIcon type="persona" size={20} />}
          <span style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: fontDisplay }}>Persona</span>
        </div>
        <div style={{ fontSize: 11, color: T.slate }}>{persona ? (persona.nombre || persona.name) : "Sin elegir — click para configurar"}</div>
      </div>
    </div>
  );
}

export function PersonaPanel({ data, onChange, brand, updateBrand, notify }) {
  const [creating, setCreating] = useState(false);
  const avatars = brand?.avatars || [];

  function guardarNuevaPersona(persona) {
    updateBrand(b => ({ ...b, avatars: [...(b.avatars || []), persona] }));
    onChange({ ...data, personaId: persona.id });
    setCreating(false);
    notify?.("Persona creada ✓");
  }

  if (creating) return <PersonaCreator onSave={guardarNuevaPersona} onCancel={() => setCreating(false)} />;

  return (
    <div>
      <div style={{ fontSize: 11.5, color: T.slate, marginBottom: 12 }}>Elegí a quién le vas a hablar. Si no elegís ninguna, la IA usa el perfil de marca en general.</div>
      <div onClick={() => onChange({ ...data, personaId: null })} style={{ padding: "10px 13px", borderRadius: T.radiusInput, border: `1.5px solid ${!data.personaId ? T.purple : T.gray}`, background: !data.personaId ? T.purpleBg : T.surface, cursor: "pointer", marginBottom: 8, fontSize: 12.5, fontWeight: !data.personaId ? 700 : 500, color: !data.personaId ? T.purple : T.navy }}>
        Sin especificar
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14, maxHeight: 300, overflowY: "auto" }}>
        {avatars.map(a => {
          const sel = data.personaId === a.id;
          return (
            <div key={a.id} onClick={() => onChange({ ...data, personaId: a.id })} style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 13px", borderRadius: T.radiusInput, border: `1.5px solid ${sel ? T.purple : T.gray}`, background: sel ? T.purpleBg : T.surface, cursor: "pointer" }}>
              <PersonaAvatarDisplay avatar={a} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: sel ? T.purple : T.navy }}>{a.nombre || a.name}</div>
                {(a.desc || a.descripcion) && <div style={{ fontSize: 11, color: T.slate, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.desc || a.descripcion}</div>}
              </div>
            </div>
          );
        })}
      </div>
      <Btn variant="soft" full onClick={() => setCreating(true)}>+ Crear personaje</Btn>
    </div>
  );
}
