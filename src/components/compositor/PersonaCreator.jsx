// PersonaCreator.jsx — crear un personaje nuevo usando el character builder compartido
// (heads pixel-art + género/edad libres + secciones guiadas). Versión compacta para el panel
// lateral del canvas — sin la pestaña de Chat IA (el canvas ya tiene su propio nodo de Chat).
import { useState } from "react";
import { uid } from "@/lib/utils";
import { Btn } from "./ui.jsx";
import PersonaBuilder from "@/components/persona/PersonaBuilder.jsx";

export default function PersonaCreator({ onSave, onCancel }) {
  const [form, setForm] = useState({ id: uid(), nombre: "", avatarGender: "undefined" });

  function guardar() {
    if (!form.nombre?.trim()) return;
    onSave({ ...form, nombre: form.nombre.trim() });
  }

  return (
    <div>
      <PersonaBuilder form={form} setForm={setForm} compact />
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <Btn variant="primary" onClick={guardar} disabled={!form.nombre?.trim()}>Crear personaje</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
      </div>
    </div>
  );
}
