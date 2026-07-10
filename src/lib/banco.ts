// ─── BANCO DE EJEMPLOS (RAG runtime) ────────────────────────────────────────
// Subconjunto CURADO del banco maestro (context/flowi-example-bank.md).
// Copy 100% real de Meta Ad Library vía Motion Inspo. Se inyecta SELECTIVAMENTE
// (no va en el system prompt cacheado): bancoCtx() filtra 2–4 ejemplos relevantes
// por bloque/táctica/vertical y los devuelve para el mensaje de usuario.
//
// Por qué runtime aparte: mantener el cerebro (COPY_BRAIN) byte-estable para el
// prompt caching. Los ejemplos cambian según la generación → van fuera del prefijo.

export type Bloque =
  | "hook" | "pain" | "promise" | "proof" | "curiosity"
  | "constraints" | "conditions" | "offer" | "cta" | "headline";

export type Tactic =
  | "question" | "bold_claim" | "problem_statement" | "curiosity_gap"
  | "before_after" | "social_proof" | "direct_address" | "controversy"
  | "urgency" | "if_then" | "prohibition" | "transformation";

export interface BancoEntry {
  id: string;
  marca: string;
  vertical: string;
  idioma: "es" | "en" | "pt" | "it";
  diasActivo: number;
  tactic?: Tactic;
  bloques: Bloque[];
  copy: string;       // ejemplo compacto, listo para mostrar como referencia
  nota?: string;      // por qué funciona (1 línea)
}

// Curado: priorizados los ganadores en español (≥ días activo) que cubren cada bloque.
export const BANCO: BancoEntry[] = [
  { id: "Q1", marca: "Buk Colombia", vertical: "saas", idioma: "es", diasActivo: 137,
    tactic: "question", bloques: ["hook", "pain", "proof"],
    copy: 'HOOK: "¿El ausentismo y el bajo desempeño están afectando tus resultados?" · BODY: "• Evaluá objetivos con facilidad • Medición continua • Feedback constante en una sola plataforma" · CTA: "¿Querés revertir esta tendencia? Agenda ahora tu llamada."',
    nota: "Pregunta específica que filtra a la audiencia exacta. 137 días = ganador." },

  { id: "Q2", marca: "Buk Colombia", vertical: "saas", idioma: "es", diasActivo: 26,
    tactic: "question", bloques: ["hook", "pain"],
    copy: 'HOOK: "¿Cuántas herramientas distintas usa hoy tu equipo de RRHH? Una para nómina. Otra para desempeño. Y así." · BODY: "Buk es una plataforma Integral de RRHH con InteligencIA. 🧠"',
    nota: "Reencuadre: nombra el caos antes de presentar la unificación." },

  { id: "Q3", marca: "RedSalud", vertical: "health", idioma: "es", diasActivo: 91,
    tactic: "question", bloques: ["hook", "offer", "conditions"],
    copy: 'HOOK: "¿Sabías que una sonrisa saludable siempre se ve bien? 😁" · OFFER: "Plan Preventivo: 14 prestaciones a costo $0 + 65% de descuento. ¡No dejes pasar esta oportunidad única!" · CTA: "Completa tus datos y te contactaremos."',
    nota: "Pregunta retórica que genera un 'sí' antes del offer. Ancla de valor por capas." },

  { id: "BC1", marca: "Alegra", vertical: "saas", idioma: "es", diasActivo: 12,
    tactic: "before_after", bloques: ["hook", "promise", "proof"],
    copy: 'HOOK: "Ella también cerraba el mes en 15 días. Hoy lo hace en uno." · BODY: "Cuando la contabilidad manual te roba semanas, algo tiene que cambiar. Con Alegra cerrás más rápido, sin errores."',
    nota: "'15 días → 1 día': el número más específico del análisis." },

  { id: "SP1", marca: "Alegra", vertical: "saas", idioma: "es", diasActivo: 72,
    tactic: "social_proof", bloques: ["hook", "proof"],
    copy: 'HOOK: "+40.000 pymes ya lo están usando." · BODY: "Simplifica todo tu negocio en un solo lugar. Regístrate gratis hoy mismo."',
    nota: "Prueba social numérica como apertura." },

  { id: "PS2", marca: "Tiendanube", vertical: "ecommerce", idioma: "es", diasActivo: 86,
    tactic: "problem_statement", bloques: ["hook", "pain", "offer"],
    copy: 'HOOK: "Dejá de perder ventas 📈" · BODY: "El tráfico está, el interés está... ¿por qué no cierran? Chat Nube: ✅ Centralización total ✅ Automatización inteligente ✅ Reportes de performance." · CTA: "Optimizá tu conversión hoy."',
    nota: "Pain en su lenguaje + value stack con ✅." },

  { id: "PS3", marca: "Legálitas", vertical: "legal", idioma: "es", diasActivo: 18,
    tactic: "problem_statement", bloques: ["hook", "pain"],
    copy: 'HOOK: "No tienes que pasarlo solo." · BODY: "Tu tranquilidad legal es muy importante."',
    nota: "Ataca el dolor EMOCIONAL (sentirse solo), no el técnico." },

  { id: "IT1", marca: "Legálitas", vertical: "legal", idioma: "es", diasActivo: 18,
    tactic: "if_then", bloques: ["hook", "conditions"],
    copy: 'HOOK: "Viajar fuera de la UE sin revisar esto puede arruinarte el viaje." · HEADLINE: "Antes de viajar, revisa"',
    nota: "Gancho de pre-acción: si vas a hacer X, primero esto." },

  { id: "CT1", marca: "Marcela Ávila", vertical: "nutrition", idioma: "es", diasActivo: 14,
    tactic: "controversy", bloques: ["hook", "curiosity", "constraints"],
    copy: 'HOOK: "Todos están bajando de peso con Mounjaro. Pero nadie te dice la verdad completa 🚨" · BODY: "Sí, los resultados son reales. Pero sin entender tu metabolismo hormonal, los kilos VUELVEN." · CTA: "💬 Comentá \'YO\'"',
    nota: "Valida la creencia primero, luego introduce el pero. Constraint = creencia." },

  { id: "LF1", marca: "Siena Inmobiliaria", vertical: "real_estate", idioma: "es", diasActivo: 138,
    tactic: "transformation", bloques: ["promise", "hook"],
    copy: 'PROMISE: "Vive en un departamento con amplitud y diseño pensados para un buen vivir. Amplias terrazas, con ventanales que darán a tus espacios la iluminación que necesitas."',
    nota: "Más longevo en español. Vende estilo de vida; nunca menciona precio ni m²." },

  { id: "UR2", marca: "Siena Inmobiliaria", vertical: "real_estate", idioma: "es", diasActivo: 67,
    tactic: "urgency", bloques: ["conditions", "hook"],
    copy: 'HOOK: "Últimas casas disponibles en etapa 5"',
    nota: "Urgency + scarcity reales en 6 palabras (etapas previas ya se vendieron)." },

  { id: "OF1", marca: "Siena Inmobiliaria", vertical: "real_estate", idioma: "es", diasActivo: 59,
    tactic: "bold_claim", bloques: ["offer", "promise", "cta"],
    copy: 'OFFER: "Deptos 1, 2 y 3 dormitorios. Piscina, quinchos, gimnasio y áreas verdes. Aprovecha el Subsidio a la tasa y sé propietario hoy." · CTA: "¡Agenda tu visita ahora!" · HEADLINE: "Parque interior de 2.000 m²"',
    nota: "Value stack de amenities + condición real (subsidio) + CTA presencial." },

  { id: "OF2", marca: "Buk Colombia", vertical: "saas", idioma: "es", diasActivo: 53,
    tactic: "direct_address", bloques: ["offer", "cta"],
    copy: 'OFFER: "🚀 Kit esencial de RRHH 2025: ✅ Plantillas ✅ Checklists ✅ Guías de mejores prácticas." · CTA: "Descarga gratis y convierte a tu equipo en aliado estratégico."',
    nota: "Lead magnet: lista de ítems concretos + fricción cero." },

  { id: "OF3", marca: "Alegra", vertical: "saas", idioma: "es", diasActivo: 32,
    tactic: "problem_statement", bloques: ["offer", "cta", "proof"],
    copy: 'BODY: "Evita errores y el estrés con la DIAN. Lleva tu contabilidad en orden con Alegra. +40.000 pymes ya lo usan." · OFFER/CTA: "Empieza gratis 15 días."',
    nota: "Pain + prueba social + free trial sin fricción en 3 líneas." },

  { id: "CU1", marca: "Alegra", vertical: "saas", idioma: "es", diasActivo: 18,
    tactic: "question", bloques: ["curiosity", "hook", "offer"],
    copy: 'HOOK: "¿Alguna vez deseaste un asistente que se sepa tus números de memoria?" · BODY: "Conecta tu IA favorita (ChatGPT o Claude) directo con tu contabilidad. Se acabaron las horas buscando reportes." · CTA: "Pruébalo GRATIS 15 días."',
    nota: "Mecanismo nombrado (IA conectada) como puente curiosidad→promesa." },

  { id: "HL1", marca: "Alegra", vertical: "saas", idioma: "es", diasActivo: 12,
    bloques: ["headline"],
    copy: 'HEADLINE: "Cierra el mes en 1 día, no en 15" (beneficio + tiempo, ~31 chars)',
    nota: "Resultado específico con contraste numérico." },

  { id: "HL2", marca: "Buk Colombia", vertical: "saas", idioma: "es", diasActivo: 137,
    bloques: ["headline"],
    copy: 'HEADLINE: "Mejora el desempeño de tu equipo"',
    nota: "Headline-promesa que complementa el hook-pregunta." },
];

// Pesos para ordenar relevancia cuando hay match de bloque.
function score(e: BancoEntry, opts: { tactic?: Tactic; vertical?: string }): number {
  let s = e.diasActivo; // longevidad = señal de rendimiento
  if (opts.vertical && e.vertical === opts.vertical) s += 1000;
  if (opts.tactic && e.tactic === opts.tactic) s += 500;
  return s;
}

/**
 * Selector RAG. Devuelve un bloque de texto con 2–4 ejemplos REALES relevantes
 * para inyectar en el mensaje de usuario (no en el system prompt cacheado).
 * Filtra por bloque; prioriza vertical y táctica coincidentes y mayor longevidad.
 * Por defecto solo español, para no contaminar el idioma de salida.
 */
export function bancoCtx(
  bloque: Bloque,
  opts: { tactic?: Tactic; vertical?: string; n?: number; idioma?: BancoEntry["idioma"] } = {}
): string {
  const { tactic, vertical, n = 3, idioma = "es" } = opts;
  const pool = BANCO
    .filter(e => e.bloques.includes(bloque) && e.idioma === idioma)
    .sort((a, b) => score(b, { tactic, vertical }) - score(a, { tactic, vertical }))
    .slice(0, n);

  if (!pool.length) return "";
  const lines = pool.map(e =>
    `• [${e.marca}, ${e.diasActivo}d] ${e.copy}${e.nota ? `\n  ↳ ${e.nota}` : ""}`
  );
  return `\n\nEJEMPLOS REALES DE REFERENCIA (Meta Ad Library — adáptalos al avatar, NO los copies literal):\n${lines.join("\n")}`;
}
