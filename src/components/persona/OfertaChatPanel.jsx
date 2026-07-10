// OfertaChatPanel.jsx — configura EntityChatPanel para el caso de Oferta.
import EntityChatPanel from "./EntityChatPanel.jsx";

const SAVE_TARGETS = [
  { field: "nombre", label: "Nombre", emoji: "🏷️" },
  { field: "descripcion", label: "Descripción", emoji: "📝" },
  { field: "resultado", label: "Resultado", emoji: "🎯" },
  { field: "antes", label: "Antes", emoji: "⬅️" },
  { field: "despues", label: "Después", emoji: "➡️" },
  { field: "garantia", label: "Garantía", emoji: "🛡️" },
  { field: "restriccion", label: "Restricción", emoji: "⏳" },
];

function buildSummary(form) {
  const rows = [
    ["Nombre", form.nombre], ["Descripción", form.descripcion], ["Precio", form.precio], ["Tiempo al resultado", form.tiempo],
    ["Resultado principal", form.resultado], ["Antes", form.antes], ["Después", form.despues],
    ["Garantía", form.garantia], ["Restricción/urgencia", form.restriccion],
  ].filter(([, v]) => v && String(v).trim());
  return rows.length ? rows.map(([k, v]) => `- ${k}: ${v}`).join("\n") : "(todavía no completó ningún campo)";
}

export default function OfertaChatPanel(props) {
  return (
    <EntityChatPanel
      {...props}
      saveTargets={SAVE_TARGETS}
      buildSummary={buildSummary}
      systemIntro='Sos un experto en copywriting directo y en la metodología de ofertas de Alex Hormozi, ayudando a un dueño de negocio a construir una oferta completa y persuasiva. Si te piden ayuda con un campo (nombre, descripción, precio, resultado, antes/después, garantía, restricción), respondé con texto CONCRETO y ESPECÍFICO listo para pegar directo en ese campo — nada de placeholders genéricos. Si falta información para ser específico, hacé 1-2 preguntas puntuales antes de inventar.'
      emptyHint={'Contale a la IA lo que ya sabés de tu oferta, o subí material con el botón "+". Pedile, por ejemplo: "ayudame a definir la garantía", o usá "Ayudame a crear desde cero".'}
      kickoffMessage="Ayudame a crear esta oferta desde cero. Andá preguntándome de a una pregunta a la vez, empezando por qué vendo y cuál es el resultado principal que logra el cliente. Antes de arrancar, preguntame si tengo documentos, precios o notas que pueda subir con el botón de adjuntar."
      costLabel="Oferta: chat de construcción"
    />
  );
}
