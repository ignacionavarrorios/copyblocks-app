// ─── LIBRERÍA DE FÓRMULAS COPY BLOCKS (datos) ───────────────────────────────
// Sistema fórmula × posición × block type de LIBRERIA-COPY-BLOCKS-MAESTRA.
// La IA recibe el cerebro (reglas) + estas fórmulas (esqueletos) inyectadas por
// posición/funnel. Referencia humana completa: context/flowi-formula-library.md
import type { Position, CopyBlockType, FunnelStage } from "@/types";

export interface Formula {
  code: string;                 // "A-1", "D-3", "PR-1"...
  name: string;
  section: "estructura" | "posicionamiento" | "dolor" | "promesa" | "prueba" | "curiosidad" | "contrarian" | "oferta" | "condiciones";
  blockTypes: CopyBlockType[];  // a qué block types corresponde
  positions: Position[];        // en qué posiciones funciona (matriz fórmula×posición)
  hook?: string;                // plantilla como HOOK
  template?: string;            // plantilla general / por posición principal
  error?: string;               // el "Error de IA" a evitar
}

// Las 4 posiciones y los 7 block types (para selección/validación)
export const POSITIONS: Position[] = ["hook", "bodyPain", "bodyPromise", "proof", "offer", "cta", "script"];
export const BLOCK_TYPES: CopyBlockType[] = ["dolor", "promesa", "prueba", "curiosidad", "contrarian", "oferta", "condiciones"];

// Combinación recomendada por posición (de las REGLAS DE COMBINACIÓN del doc)
export const RECOMMENDED_BY_POSITION: Record<string, { primary: CopyBlockType; secondary?: CopyBlockType; nota: string }> = {
  hook:        { primary: "dolor",       secondary: "curiosidad",  nota: "DOLOR o CURIOSIDAD; +CONTRARIAN en mercados saturados" },
  bodyPain:    { primary: "dolor",       secondary: "prueba",      nota: "DOLOR o CONSECUENCIAS; +PRUEBA (datos del costo)" },
  bodyPromise: { primary: "promesa",     secondary: "curiosidad",  nota: "PROMESA; +CURIOSIDAD (mecanismo insinuado)" },
  proof:       { primary: "prueba",      nota: "PRUEBA; +Posicionamiento (Maestro/Analizador)" },
  offer:       { primary: "oferta",      secondary: "prueba",      nota: "OFERTA; +PRUEBA (valida el valor)" },
  cta:         { primary: "condiciones", secondary: "promesa",     nota: "CONDICIONES; +PROMESA (recordatorio del resultado)" },
  script:      { primary: "dolor",       secondary: "curiosidad",  nota: "Depende del beat; mismo criterio que las posiciones escritas" },
};

// Reglas que nunca se rompen (validación / guía)
export const COMBINATION_RULES: string[] = [
  "El HOOK nunca hace el trabajo del CTA (no pide la acción).",
  "El CTA nunca hace el trabajo del HOOK (no abre curiosidades).",
  "El OFFER BLOCK nunca viene antes de construir deseo (Pain → Promise primero).",
  "Nunca usar más de 2 block types en la misma posición.",
];

export const FORMULAS: Formula[] = [
  // ── ESTRUCTURA ──
  { code: "A-1", name: "Dolor + Curiosidad", section: "estructura", blockTypes: ["dolor","curiosidad"], positions: ["hook","bodyPain","script"],
    hook: '"[Dolor específico y verificable]. [Pregunta que no pueden responder solos]."',
    error: "Hacer el dolor genérico para que 'aplique a todos'. La especificidad activa la curiosidad; lo vago la mata." },
  { code: "A-2", name: "Promesa + Curiosidad", section: "estructura", blockTypes: ["promesa","curiosidad"], positions: ["hook","bodyPromise","offer","script"],
    hook: '"[Resultado específico]. [Mecanismo insinuado sin revelar completamente]."',
    error: "Mecanismo tan vago que se vuelve clickbait. Debe sonar real y verificable aunque no se explique del todo." },
  { code: "A-3", name: "Consecuencias / Stakes", section: "estructura", blockTypes: ["dolor","condiciones"], positions: ["hook","bodyPain","cta","script"],
    hook: '"Cada [unidad de tiempo] que [inacción específica], [pérdida concreta y acumulable]."',
    error: "Stakes abstractos o moralizantes. Deben ser concretos, calculables y ligados a algo que ya valora (dinero/tiempo)." },

  // ── POSICIONAMIENTO ──
  { code: "B-1", name: "Maestro (Experto)", section: "posicionamiento", blockTypes: ["prueba","promesa"], positions: ["hook","bodyPromise","proof","offer","script"],
    hook: '"[Acción de análisis con números concretos] + [hallazgo que sorprende]."',
    error: "Declarar autoridad sin demostrarla. '10 años de experiencia' es débil; '847 cuentas, 91% con el mismo error' es autoridad." },
  { code: "B-2", name: "Analizador", section: "posicionamiento", blockTypes: ["curiosidad","contrarian"], positions: ["hook","proof","script"],
    hook: '"Analicé/Revisé [N específico]. Esto es lo que encontré: [hallazgo contraintuitivo]."',
    error: "Inventar datos o números redondos. 847 suena real; 1000 suena fabricado." },
  { code: "B-3", name: "Documentando el camino", section: "posicionamiento", blockTypes: ["prueba","promesa"], positions: ["hook","bodyPain","bodyPromise","proof","script"],
    hook: '"[Hace X empecé Y]. Esto aprendí hasta ahora: [insight honesto, incl. lo que no funcionó]."',
    error: "Fabricar un journey cuando ya tenés el resultado. Si ya lo tenés, usá Maestro." },
  { code: "B-4", name: "Confesión", section: "posicionamiento", blockTypes: ["dolor","prueba"], positions: ["hook","bodyPain","proof","script"],
    hook: '"Durante [tiempo] [yo también cometía el error de la audiencia]. Hasta que [el momento que cambió todo]."',
    error: "El error debe ser uno que cualquiera podría cometer, no el extraordinario que dramatiza de más." },

  // ── DOLOR ──
  { code: "D-1", name: "Costo invisible", section: "dolor", blockTypes: ["dolor"], positions: ["hook","bodyPain","cta","script"],
    hook: '"Cada [tiempo/ciclo] que [situación actual], [pérdida específica que no habían calculado]."',
    error: "Costo abstracto/emocional. Si no hay número, no hay urgencia cognitiva." },
  { code: "D-2", name: "Dolor específico del nicho", section: "dolor", blockTypes: ["dolor"], positions: ["hook","bodyPain","script"],
    hook: '"[Como/Para] [rol muy específico], [dolor único de ese rol que nadie más nombraría]."',
    error: "Nicho tan amplio que no filtra ('para emprendedores'). Cuanto más específico el rol, mayor hook rate." },
  { code: "D-3", name: "Trampa del esfuerzo", section: "dolor", blockTypes: ["dolor"], positions: ["hook","bodyPain","script"],
    hook: '"[Acción correcta 1]. [Acción correcta 2]. Y aún así [resultado que no llega]. Algo pasa antes de lo que ves."',
    error: "Validar el esfuerzo y luego culpar al prospecto. Valida y redirige, nunca señala." },
  { code: "D-4", name: "Problema que se acumula", section: "dolor", blockTypes: ["dolor"], positions: ["hook","bodyPain","cta","script"],
    hook: '"Llevás [X tiempo] con [situación] y cada [ciclo] [se acumula más]."',
    error: "Presentarlo como error del prospecto. Es una limitación del sistema/herramienta, no de él." },
  { code: "D-5", name: "Frustración cotidiana", section: "dolor", blockTypes: ["dolor"], positions: ["hook","bodyPain","script"],
    hook: '"¿Ese momento cuando [situación cotidiana muy específica] y te preguntás si hay una forma mejor?"',
    error: "Hacerla tan extrema que deja de ser cotidiana. Es reconocible por frecuente, no por dramática." },
  { code: "D-6", name: "Diagnóstico inesperado", section: "dolor", blockTypes: ["dolor","contrarian"], positions: ["hook","bodyPain","script"],
    hook: '"Tu problema no es [diagnóstico obvio]. Es [causa real subyacente que no esperaban]."',
    error: "Reencuadre sin evidencia de por qué el diagnóstico original está mal." },
  { code: "D-11", name: "Dolor con número", section: "dolor", blockTypes: ["dolor"], positions: ["hook","bodyPain","script"],
    hook: '"[X% / N días / $Z]: eso es lo que [problema del nicho] cuesta en [unidad]."', error: "Sin número específico no hay impacto." },

  // ── PROMESA ──
  { code: "P-1", name: "De X a Y en tiempo", section: "promesa", blockTypes: ["promesa"], positions: ["hook","bodyPromise","proof","offer","script"],
    hook: '"De [punto A doloroso] a [punto B deseado] en [tiempo concreto]."',
    error: "Transformación genérica ('de mal a bien'). Cada punto debe ser específico y verificable." },
  { code: "P-2", name: "Sin el sacrificio esperado", section: "promesa", blockTypes: ["promesa"], positions: ["hook","bodyPromise","offer","cta","script"],
    hook: '"[Resultado deseado] sin [objeción principal / sacrificio que asumen necesario]."',
    error: "Eliminar demasiadas fricciones a la vez suena imposible. Elegí UNA objeción principal." },
  { code: "P-4", name: "Tiempo ridículo", section: "promesa", blockTypes: ["promesa"], positions: ["hook","bodyPromise","offer","script"],
    hook: '"[Resultado grande] en [tiempo sorprendentemente corto]."', error: "El tiempo debe ser real; si no, destruye credibilidad." },
  { code: "P-5", name: "Transformación de identidad", section: "promesa", blockTypes: ["promesa"], positions: ["hook","bodyPromise","script"],
    hook: '"Dejás de ser [X] y pasás a ser [Y]."', error: "La identidad debe ser concreta para el avatar, no abstracta." },
  { code: "P-6", name: "Resultado con número", section: "promesa", blockTypes: ["promesa"], positions: ["hook","bodyPromise","offer","script"],
    hook: '"[+X% / N días / $Y]: lo que [producto] hace en [contexto]."', error: "Número redondo o sin contexto resta credibilidad." },
  { code: "P-11", name: "Simplificación total", section: "promesa", blockTypes: ["promesa"], positions: ["hook","bodyPromise","offer","cta","script"],
    hook: '"Todo [lo que estaba disperso] en un solo lugar. Sin [fricción 1], sin [fricción 2]."', error: "Listar features en vez de la simplificación real." },

  // ── PRUEBA ──
  { code: "PR-1", name: "Número de usuarios", section: "prueba", blockTypes: ["prueba"], positions: ["hook","proof","offer","cta","script"],
    hook: '"[Número específico no redondo] de [tipo de cliente exacto] ya [resultado / usan el producto]."',
    error: "Números redondos. Lo específico suena medido, no estimado." },
  { code: "PR-2", name: "Resultado de cliente real", section: "prueba", blockTypes: ["prueba"], positions: ["hook","proof","offer","script"],
    hook: '"[Nombre o perfil] logró [resultado con número] en [tiempo]. Sin [objeción principal]."',
    error: "Inventar testimonios o hacerlos genéricos. Necesita nombre/perfil + número + tiempo." },
  { code: "PR-3", name: "Autoridad externa", section: "prueba", blockTypes: ["prueba"], positions: ["hook","proof","script"],
    hook: '\'"[Cita de fuente reconocida]" — [Nombre de la fuente].\'',
    error: "Fuentes genéricas ('según expertos'). Necesita fuente nombrable y verificable." },
  { code: "PR-8", name: "Before/After + personaje", section: "prueba", blockTypes: ["prueba","promesa"], positions: ["hook","bodyPromise","proof","script"],
    hook: '"[Estado antes] → [Estado después]. [Quién]. [Tiempo]."', error: "Sin un personaje concreto el before/after no ancla." },

  // ── CURIOSIDAD ──
  { code: "C-1", name: "La causa inesperada", section: "curiosidad", blockTypes: ["curiosidad"], positions: ["hook","bodyPain","script"],
    hook: '"La razón de [problema] no tiene que ver con [causa obvia]. Tiene que ver con [causa inesperada]."',
    error: "Abrir el loop sin tener un payoff real que lo cierre después." },
  { code: "C-2", name: "Secreto del nicho", section: "curiosidad", blockTypes: ["curiosidad"], positions: ["hook","bodyPain","bodyPromise","script"],
    hook: '"Lo que [autoridad/industria/expertos] no te dicen sobre [tema relevante]."',
    error: "Prometer secreto y entregar algo obvio. El payoff debe sentirse privilegiado." },
  { code: "C-3", name: "Mecanismo insinuado", section: "curiosidad", blockTypes: ["curiosidad"], positions: ["hook","bodyPromise","offer","script"],
    hook: '"[Resultado] gracias a [nombre del mecanismo específico que el lector no conoce]."',
    error: "Insinuar un mecanismo que no existe o no se sostiene. Debe ser real aunque no se explique todo." },

  // ── CONTRARIAN ──
  { code: "CO-1", name: "Mito directo derribado", section: "contrarian", blockTypes: ["contrarian"], positions: ["hook","bodyPain","bodyPromise","script"],
    hook: '"[Creencia más aceptada del nicho] no es [lo que todos asumen]."',
    error: "Afirmación contraria sin la prueba de por qué la creencia común está mal." },
  { code: "CO-4", name: "No necesitás", section: "contrarian", blockTypes: ["contrarian"], positions: ["hook","bodyPromise","offer","cta","script"],
    hook: '"No necesitás [prerrequisito que asumen necesario] para [resultado deseado]."',
    error: "Negar un prerrequisito real. Solo funciona si de verdad es innecesario con tu mecanismo." },

  // ── OFERTA ──
  { code: "OF-1", name: "Stack de valor con ancla", section: "oferta", blockTypes: ["oferta"], positions: ["offer","script"],
    template: '"[Ítem — beneficio concreto] — valor $X (×N) / Si lo compraras por separado: $SUMA / Hoy: $PRECIO"',
    error: "Lista de features genéricas en vez de beneficios con valores que anclen el precio." },
  { code: "OF-2", name: "Acceso gratuito", section: "oferta", blockTypes: ["oferta"], positions: ["hook","offer","cta","script"],
    hook: '"[Resultado de alto valor]. Gratis. [Fricción eliminada]." (Hook solo para audiencias frías/awareness)',
    error: "Decir 'gratis' sin especificar qué, por cuánto tiempo y qué pasa después." },
  { code: "OF-4", name: "Garantía como ancla", section: "oferta", blockTypes: ["oferta"], positions: ["offer","cta","script"],
    template: '"[Resultado prometido]. Si no [condición], [garantía específica sin fricción]."',
    error: "Garantía vaga ('100% satisfacción'). Necesita plazo + condición + razón humana." },
  { code: "OF-5", name: "Lead magnet de alto valor", section: "oferta", blockTypes: ["oferta"], positions: ["hook","offer","cta","script"],
    hook: '"[Nombre del recurso] con [3 ítems específicos]. Gratis en [tiempo corto]."',
    error: "Lead magnet vago. Especificá los ítems y el tiempo de consumo." },
  { code: "OF-7", name: "Tiempo limitado real", section: "oferta", blockTypes: ["oferta","condiciones"], positions: ["offer","cta","script"],
    template: '"[Oferta] hasta [fecha/condición concreta]. Después: [consecuencia real]."',
    error: "Urgencia falsa (contador que se resetea). Debe ser una restricción verificable." },

  // ── CONDICIONES ──
  { code: "CN-1", name: "Si / Entonces", section: "condiciones", blockTypes: ["condiciones"], positions: ["hook","bodyPain","cta","script"],
    hook: '"Si [situación concreta que vive tu avatar], entonces [acción o resultado que puede lograr]."',
    error: "Condición tan amplia que no filtra. Debe calificar a la audiencia exacta." },
  { code: "CN-2", name: "Callout de rol", section: "condiciones", blockTypes: ["condiciones"], positions: ["hook","cta","script"],
    hook: '"[Título/rol/profesión muy específica] — [esto es para vos / lo que necesitás saber]."',
    error: "Rol genérico. Cuanto más específico, mejor filtra." },
  { code: "CN-4", name: "Timing / momento", section: "condiciones", blockTypes: ["condiciones"], positions: ["hook","cta","script"],
    hook: '"Antes de [evento próximo / decisión inminente], hay algo que necesitás saber."',
    error: "Timing inventado sin un evento real próximo." },
  { code: "CN-5", name: "Escasez de cupos", section: "condiciones", blockTypes: ["condiciones"], positions: ["offer","cta","script"],
    template: '"Quedan [N] de [cupos/unidades]. Después: [consecuencia real]."', error: "Escasez falsa destruye la marca." },
  { code: "CN-7", name: "Deadline real", section: "condiciones", blockTypes: ["condiciones"], positions: ["offer","cta","script"],
    template: '"[Oferta] disponible hasta [fecha/condición concreta]. Después: [precio sube/termina]."', error: "Deadline que nunca se cumple." },
];

// Mapea las claves del banco/bloques de la app (BlockType) → block type del sistema
export const APP_BLOCK_TO_SYSTEM: Record<string, CopyBlockType> = {
  pain: "dolor", promise: "promesa", proof: "prueba", curiosity: "curiosidad",
  constraints: "contrarian", conditions: "condiciones", offer: "oferta",
};

/** Devuelve las fórmulas que funcionan en una posición dada, opcionalmente filtradas
 *  por block type. Ordena las del block type recomendado primero. */
export function formulasForPosition(
  position: Position,
  opts: { blockType?: CopyBlockType; funnel?: FunnelStage } = {}
): Formula[] {
  const rec = RECOMMENDED_BY_POSITION[position];
  const want = opts.blockType || rec?.primary;
  return FORMULAS
    .filter(f => f.positions.includes(position))
    .sort((a, b) => {
      const aw = want && a.blockTypes.includes(want) ? 1 : 0;
      const bw = want && b.blockTypes.includes(want) ? 1 : 0;
      return bw - aw;
    });
}

/** Busca una fórmula por código (ej. "A-1"). */
export function formulaByCode(code?: string): Formula | undefined {
  if (!code) return undefined;
  return FORMULAS.find(f => f.code.toLowerCase() === code.toLowerCase());
}
