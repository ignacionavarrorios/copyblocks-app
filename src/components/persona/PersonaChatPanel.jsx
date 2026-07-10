// PersonaChatPanel.jsx — configura EntityChatPanel para el caso de Persona.
import EntityChatPanel from "./EntityChatPanel.jsx";
import { PERSONA_SECTIONS } from "@/lib/constants";

const SAVE_TARGETS = [
  ...PERSONA_SECTIONS.filter(s => s.key !== "conciencia").map(s => ({ field: s.key === "creencias" ? "creencia_falsa" : s.key, label: s.label, emoji: s.emoji })),
  { field: "conciencia_detalle", label: "Consciencia", emoji: "🎯" },
];

function buildSummary(form) {
  const rows = [
    ["Nombre", form.nombre], ["Género", form.avatarGender], ["Edad", form.avatarAgeRange],
    ["Comportamiento", form.comportamiento], ["Background", form.background], ["Likes/Dislikes", form.likes_dislikes],
    ["Nivel de consciencia", form.nivel_conciencia], ["Detalle consciencia", form.conciencia_detalle],
    ["Dolores", form.dolores], ["Creencias", form.creencia_falsa],
  ].filter(([, v]) => v && String(v).trim());
  return rows.length ? rows.map(([k, v]) => `- ${k}: ${v}`).join("\n") : "(todavía no completó ninguna sección)";
}

export default function PersonaChatPanel(props) {
  return (
    <EntityChatPanel
      {...props}
      saveTargets={SAVE_TARGETS}
      buildSummary={buildSummary}
      systemIntro='Sos un investigador de mercado experto en copywriting directo, ayudando a un dueño de negocio a construir una buyer persona completa y accionable. Si te piden ayuda con una sección (comportamiento, background, likes/dislikes, nivel de consciencia, dolores, creencias), respondé con texto CONCRETO y ESPECÍFICO listo para pegar directo en esa sección — nada de placeholders genéricos. Si falta información para ser específico, hacé 1-2 preguntas puntuales antes de inventar.'
      emptyHint={'Contale a la IA lo que ya sabés de tu persona, o subí material con el botón "+". Pedile, por ejemplo: "ayudame a definir sus dolores", o usá "Ayudame a crear desde cero".'}
      kickoffMessage="Ayudame a crear esta persona desde cero. Andá preguntándome de a una pregunta a la vez, empezando por quién es y qué le duele. Antes de arrancar, preguntame si tengo documentos, entrevistas o notas que pueda subir con el botón de adjuntar."
      costLabel="Persona: chat de construcción"
    />
  );
}
