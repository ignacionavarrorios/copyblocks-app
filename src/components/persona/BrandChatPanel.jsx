// BrandChatPanel.jsx — configura EntityChatPanel para el caso del Perfil de marca.
import EntityChatPanel from "./EntityChatPanel.jsx";

const SAVE_TARGETS = [
  { field: "produto", label: "Producto o servicio", emoji: "🏢" },
  { field: "oferta", label: "Oferta completa", emoji: "🎁" },
  { field: "diferenciador", label: "Diferenciador", emoji: "✨" },
  { field: "voz", label: "Voz y tono", emoji: "🎙️" },
  { field: "mercado", label: "Mercado", emoji: "🌎" },
  { field: "ubicacion", label: "Ubicación", emoji: "📍" },
  { field: "mecanismo_nombrado", label: "Nombre del mecanismo", emoji: "⚙️" },
  { field: "mecanismo_descripcion", label: "Cómo funciona", emoji: "⚙️" },
  { field: "mecanismo_diferenciador", label: "Qué lo hace distinto", emoji: "⚙️" },
  { field: "mecanismo_creencia_rebate", label: "Creencia que derriba", emoji: "⚙️" },
  { field: "prueba_n_clientes", label: "Nº de clientes", emoji: "⭐" },
  { field: "prueba_caso", label: "Caso de cliente", emoji: "⭐" },
  { field: "prueba_resultado_clave", label: "Resultado clave", emoji: "⭐" },
  { field: "prueba_autoridad", label: "Autoridad externa", emoji: "⭐" },
  { field: "extra", label: "Contexto extra", emoji: "➕" },
];

function buildSummary(form) {
  const rows = [
    ["Producto", form.produto], ["Oferta", form.oferta], ["Diferenciador", form.diferenciador],
    ["Voz", form.voz], ["Mercado", form.mercado], ["Ubicación", form.ubicacion],
    ["Mecanismo", form.mecanismo_descripcion], ["Prueba social", form.prueba_caso || form.prueba_n_clientes],
  ].filter(([, v]) => v && String(v).trim());
  return rows.length ? rows.map(([k, v]) => `- ${k}: ${v}`).join("\n") : "(todavía no completó ningún campo)";
}

export default function BrandChatPanel(props) {
  return (
    <EntityChatPanel
      {...props}
      saveTargets={SAVE_TARGETS}
      buildSummary={buildSummary}
      systemIntro='Sos un estratega de marca experto en copywriting directo, ayudando a un dueño de negocio a completar el perfil de su marca (producto, oferta, voz, mecanismo único, prueba social). Respondé con texto CONCRETO y ESPECÍFICO listo para pegar directo en el campo correspondiente — nada de placeholders genéricos. NUNCA inventes datos de prueba social, números de clientes ni casos — esos los tiene que dar el usuario. Si falta información, hacé 1-2 preguntas puntuales antes de escribir.'
      emptyHint={'Contale a la IA sobre tu negocio, o subí material con el botón "+" (tu web, una bio, copy que ya tengas). Pedile, por ejemplo: "ayudame a definir mi diferenciador", o usá "Ayudame a crear desde cero".'}
      kickoffMessage="Ayudame a completar el perfil de mi marca desde cero. Andá preguntándome de a una pregunta a la vez, empezando por qué vendo y a quién. Antes de arrancar, preguntame si tengo mi web, una bio o algún documento que pueda subir con el botón de adjuntar."
      costLabel="Marca: chat de construcción"
    />
  );
}
