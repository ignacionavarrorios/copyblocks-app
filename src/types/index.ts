// ─── CORE TYPES ───────────────────────────────────────────────────────────────

export type BlockType =
  | "pain"
  | "promise"
  | "proof"
  | "curiosity"
  | "constraints"
  | "conditions"
  | "offer";

export type FuncType = "hook" | "body" | "headline" | "cta" | "offer";

export type AIProvider = "anthropic" | "openai" | "gemini";

export interface Asset {
  id: string;
  tipo: BlockType;
  funcs: FuncType[];
  tags: string[];
  text: string;
}

export interface Avatar {
  id: string;
  avatarEmoji?: string;        // emoji elegido en el picker de personajes del canvas (legacy / estilo alterno)
  avatarImageKey?: string;     // key del pack de heads pixel-art (ver PERSONA_AVATAR_OPTIONS) — "neutral" si no eligió
  avatarGender?: string;       // "female" | "male" | "undefined" | texto libre
  avatarAgeRange?: string;     // "18-25" | "25-32" | "32-45" | "45-55" | "60-plus" | texto libre
  name?: string;
  nombre?: string;
  desc?: string;
  descripcion?: string;
  pains?: string;
  dolores?: string;
  problema_principal?: string;
  objection?: string;
  objeciones?: string;
  language?: string;
  lenguaje?: string;
  edad?: string;
  rol?: string;
  intentos_fallidos?: string;
  deseo_final?: string;
  nivel_conciencia?: string;
  conciencia_detalle?: string; // elaboración libre del nivel de consciencia
  comportamiento?: string;     // hábitos, forma de decidir, dónde consume contenido
  background?: string;         // trabajo, de dónde viene, etapa de vida
  likes_dislikes?: string;     // qué le atrae/repele — calibra el tono
  // ─ Cerebro V2 (Avatar.*) ─
  vocabulario?: string;       // frases exactas que usa para describir su problema
  solucion_fallida?: string;  // qué intentó antes que no funcionó
  creencia_falsa?: string;    // causa/solución incorrecta que cree — su "creencia"
  antes?: string;             // situación actual cuantificada (con número si posible)
  fuentes?: FuenteCerebro[];  // documentos/links que el usuario subió al chatear con la IA para construirla
  chatHistory?: { id: string; role: "user" | "ai"; text: string }[]; // conversación del chat de construcción
}

export interface Competitor {
  id: string;
  name: string;
  url: string;
  notes: string;
}

export interface Concepto {
  id: string;
  concepto: string;
  angulo: string;
  estilo: string;
  hook: string;
  personaId?: string | null;
  personaDesc?: string;
}

export interface BrandProfile {
  produto?: string;
  producto?: string;
  oferta?: string;
  diferenciador?: string;
  voz?: string;
  mecanismo_nombrado?: string;
  avatar?: string;
  ubicacion?: string;
  extra?: string;
  // ─ Cerebro V2: Marca ─
  mercado?: string;              // país/región + variante de español
  tono?: string;                 // voz definida (ej. "directo, sin superlativos, vos")
  // ─ Cerebro V2: Mecanismo ─
  mecanismo_descripcion?: string;   // por qué funciona (la razón real)
  mecanismo_diferenciador?: string; // qué lo hace distinto a las alternativas
  mecanismo_creencia_rebate?: string; // creencia incorrecta que el mecanismo desmiente
  // ─ Cerebro V2: Prueba social ─
  prueba_n_clientes?: string;    // número real, no redondeado
  prueba_caso?: string;          // caso: perfil + resultado + tiempo
  prueba_resultado_clave?: string; // el resultado más impactante con número
  prueba_autoridad?: string;     // publicación, ranking, premio, certificación
  prueba_cuota_mercado?: string; // "X de cada Y en [mercado]"
}

export interface Offer {
  id: string;
  nombre?: string;
  name?: string;
  descripcion?: string;
  desc?: string;
  precio?: string;
  price?: string;
  urgencia?: string;
  garantia?: string;
  incluye?: string;
  // ─ Cerebro V2: Oferta ─
  resultado?: string;          // la transformación principal que produce
  tiempo?: string;             // tiempo en que ocurre la transformación
  antes?: string;              // situación específica antes (con número)
  despues?: string;            // situación específica después (con número)
  precio_ancla?: string;       // valor total si comprara por separado
  friccion_eliminada?: string; // lo que NO hace falta para empezar (sin tarjeta, etc.)
  restriccion?: string;        // escasez o urgencia real disponible
}

export interface CustomAngle {
  id: string;
  label: string;
  desc: string;
  example: string;
  adExample?: string;
}

export interface CustomStyle {
  id: string;
  label: string;
  desc: string;
  example: string;
}

// Estructura de copy personalizada, escrita libre por el usuario en el builder del Compositor
// (ej. "aplicá el estilo del script de Hormozi que puse en el seed"). Distinto de CustomStyle
// (que es un ESTILO de producción de video, ya implementado vía ConceptWizard).
export interface CustomFormula {
  id: string;
  blockId: string;      // BLOCK_ORDER id al que aplica (hook, pain, promise, etc.)
  label: string;        // nombre corto para mostrar en el selector
  text: string;         // instrucción libre, se inyecta tal cual en el prompt
}

// "Receta" — reemplaza el concepto viejo de Ángulo. Es una estructura narrativa/de copy
// con instrucciones explícitas de CÓMO debe escribir la IA (no solo un ejemplo suelto),
// para que el alumno pueda elegir una curada o crear la suya como un mini-prompt propio.
export interface Receta {
  id: string;
  nombre: string;
  categoria: string;     // propósito/agrupación: "Venta" | "Storytelling" | "Viralidad" | "Educación" | etc.
  descripcion: string;   // qué hace y cuándo usarla
  instrucciones: string; // EL PROMPT REAL — cómo debe escribir la IA para esta receta
  ejemplo: string;       // copy de ejemplo real usando esta receta
  esPersonalizada?: boolean; // true si la creó el alumno; false/undefined = curada
}

// Prompt guardado en la biblioteca ("Prompts" en el sidebar) — instrucción de sistema reusable,
// pensada para cargarse después en un nodo Prompt del Compositor.
export interface PromptTemplate {
  id: string;
  nombre: string;
  texto: string;
  createdAt: string;
}

// Config guardada del builder del Compositor (Seed→Persona→Concepto→Formato→Estructura→Hook),
// sin el resultado generado, para poder re-ejecutarla después con otro concepto.
export interface FlowPreset {
  id: string;
  name: string;
  personaId?: string | null;
  conceptoId?: string | null;
  formato: "facebook" | "video";
  prodFormat?: string | null;      // VIDEO_PROD_FORMATS id, si formato==="video"
  estructuras: Record<string, string>; // { [pasoId]: formatId | "custom:<label>" }
  customStyleId?: string | null;   // si la estructura usa un CustomStyle guardado
  hookId?: string | null;          // HOOK_FRAMEWORKS id
  anguloId?: string | null;        // ANGULOS_RAPIDO id (guardarFlow/cargarFlow ya lo usan)
  customEstructura?: string;       // texto libre de estructura (guardarFlow/cargarFlow ya lo usan)
  fecha: string;
}

// ─── Compositor: canvas dinámico de proyectos (Cerebro + pasos libres + Chat) ─
export type ProyectoNodeType = "cerebro" | "persona" | "angulo" | "oferta" | "formato" | "chat" | "prompt" | "placeholder";

export interface FuenteCerebro {
  id: string;
  kind: "doc" | "voz" | "video" | "link" | "texto" | "imagen" | "youtube" | "tiktok" | "instagram" | "facebook_post" | "facebook_ad" | "website";
  label: string;      // nombre de archivo, URL, o "Texto pegado"
  url?: string;        // URL para los tipos basados en link (youtube/tiktok/instagram/facebook_*/website)
  text?: string;       // contenido real si se pudo extraer (doc/texto/transcript de youtube)
  thumb?: string;      // dataURL (video local) o URL de thumbnail (YouTube/favicon) para el link
}

// Un "Cerebro" agrupa sus fuentes en tableros visuales (grupos) — pizarra flexible al estilo
// de un board de research, no una lista plana.
export interface GrupoCerebro {
  id: string;
  name: string;
  items: FuenteCerebro[];
}

export interface ProyectoNode {
  id: string;
  type: ProyectoNodeType;
  position: { x: number; y: number };
  data: any; // forma libre por tipo: {sources:FuenteCerebro[]} | {personaId} | {conceptoId} | {offerId} | {formatoIds} | {chats,activeChatId}
}

export interface ProyectoEdge {
  id: string;
  source: string;
  target: string;
}

export interface Folder {
  id: string;
  name: string;
}

export interface Proyecto {
  id: string;
  name: string;
  description?: string;
  folderId?: string | null;
  nodes: ProyectoNode[];
  edges: ProyectoEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface CopyRecord {
  id: string;
  type: string;
  text: string;
  tag: string;
  rating: "winner" | "testing" | "lost";
  conceptoId?: string;
  conceptoLabel?: string;
  fecha: string;
  blockIds?: string[];
}

export interface HormoziInput {
  offerName: string;             // nombre corto para identificar la oferta y etiquetar bloques
  personaId: string | null;      // referencia a un avatar existente (brand.avatars), o null = genérica
  serviceName: string;
  // Las 4 dimensiones de la ecuación de valor de Hormozi, descritas en texto libre
  dreamOutcome: string;          // Resultado soñado
  likelihood: string;            // Probabilidad percibida (prueba, garantías)
  timeDelay: string;             // Tiempo al resultado
  effort: string;                // Esfuerzo y sacrificio (qué tan fácil)
}

// Un bloque de copy de oferta listo para usar y guardar en el banco
export interface HormoziGeneratedOffer {
  funcs: FuncType[];             // hook | body | headline | cta | offer
  label: string;                 // etiqueta del ángulo, ej. "Headline directo"
  text: string;                  // el copy listo para pegar
}

export interface HormoziOffer {
  id: string;
  fecha: string;
  offerName: string;
  input: HormoziInput;
  blocks: HormoziGeneratedOffer[];
}

export interface Brand {
  id: string;
  name: string;
  industry: string;
  perfil: BrandProfile;
  avatars: Avatar[];
  competitors: Competitor[];
  assets: Asset[];
  conceptos: Concepto[];
  copies: CopyRecord[];
  offers: Offer[];
  customAngles: CustomAngle[];
  customStyles: CustomStyle[];
  hormoziOffers?: HormoziOffer[];
  flows?: FlowPreset[];
  customFormulas?: CustomFormula[];
  customRecetas?: Receta[];
  proyectos?: Proyecto[];
  folders?: Folder[];
  prompts?: PromptTemplate[];
}

// Cuenta del usuario — separada de Brand (una cuenta puede tener varias marcas). Vive en
// AppData.account, aparte de `brands`, porque plan/país/método de pago no son por marca.
export type PlanId = "free" | "starter" | "advanced" | "enterprise";
export interface Account {
  plan: PlanId;
  avatarKey?: string;
  country?: string;
  paymentMethodId?: string;
  renewsAt?: string;
}

export interface AppData {
  brands: Brand[];
  account?: Account;
}

// ─── CONFIG TYPES ─────────────────────────────────────────────────────────────

export interface TipoConfig {
  id: BlockType;
  label: string;
  color: string;
  bg: string;
  border: string;
}

export interface AnguloConfig {
  id: string;
  label: string;
  desc: string;
  example: string;
  adExample?: string;
}

export interface EstiloConfig {
  id: string;
  label: string;
  desc: string;
  example: string;
}

export interface BlockFormat {
  id: string;
  label: string;
  hint?: string;
  cat?: string;
}

export interface HookBlockTypeConfig {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bg: string;
  desc: string;
}

export interface AwarenessLevel {
  id: string;
  label: string;
  short: string;
  color: string;
  bg: string;
  desc: string;
}

export interface TrafficTemp {
  id: string;
  label: string;
  color: string;
  bg: string;
  border: string;
}

export interface SubcomponentDef {
  id: string;
  name: string;
  def: string;
  when: string;
  example: string;
}

export interface HookFramework {
  id: string;
  cat: string;
  label: string;
  desc: string;
  when: string;
  example: string;
  starter: string;
}

export interface TipoBloque {
  id: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  def: string;
  subtypes: string[];
  tip: string;
}

export interface AIProviderConfig {
  id: AIProvider;
  name: string;
  logo: string;
  color: string;
  bg: string;
  border: string;
  placeholder: string;
  hint: string;
  hintUrl: string;
  validate: (k: string) => true | string;
  model: string;
}

export interface ClaudeConf {
  provider: AIProvider;
  apiKey: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SISTEMA COPY BLOCKS — 6 DOCUMENTOS CEREBRO + CONTEXTO DE CAMPAÑA
// Modelo de datos propuesto en LIBRERIA-COPY-BLOCKS-MAESTRA. Todo opcional para
// ser retrocompatible: la UI los irá poblando por niveles (mínimo → completo).
// La capa de ensamblaje vive en src/lib/context.ts; la librería en src/lib/formulas.ts
// ═══════════════════════════════════════════════════════════════════════════

// Las 4 POSICIONES del copy (dónde va cada cosa en el anuncio)
export type Position = "hook" | "bodyPain" | "bodyPromise" | "proof" | "offer" | "cta" | "script";

// Los 7 BLOCK TYPES del sistema (la intención/tono de lo que se dice)
export type CopyBlockType =
  | "dolor" | "promesa" | "prueba" | "curiosidad" | "contrarian" | "oferta" | "condiciones";

// Etapa del funnel y objetivo de una pieza
export type FunnelStage = "TOF" | "MOF" | "BOF";
export type CampaignGoal = "leads" | "ventas" | "demos" | "awareness";
export type PieceFormat = "fb_ad" | "video_15_30" | "video_45_60" | "carousel" | "email";

// ─── DOCUMENTO 1: OFERTA (el más crítico) ───────────────────────────────────
export interface OfferItem {
  nombre: string;        // nombre específico del ítem (no "módulo 1")
  beneficio?: string;    // beneficio concreto de ese ítem
  valor?: string;        // valor de mercado (para el ancla de precio)
}
export interface OfferBrief {
  id: string;
  nombre: string;                 // nombre del producto/servicio
  precio?: string;                // precio real de la oferta
  incluye?: OfferItem[];          // value stack con valores
  transformacion?: {
    antes?: string;               // situación específica antes de comprar
    despues?: string;             // situación específica después
    tiempo?: string;              // en cuánto tiempo ocurre el cambio
  };
  garantia?: {
    tipo?: string;                // devolución / rehacemos / sin costo de entrada
    plazo?: string;               // plazo específico
    condicion?: string;           // sin preguntas / si no ven resultado / etc.
  };
  // Complementario
  comparacionPrecio?: string;     // qué pagaría comprando todo por separado / sin el producto
  restricciones?: string;         // límite de cupos/unidades/tiempo (para urgencia REAL)
  objeciones?: string[];          // las 3 razones principales por las que no compran
  leadMagnets?: { nombre: string; incluye?: string; consumo?: string }[];
  entrada?: {
    trial?: string;               // ¿trial gratuito? ¿cuánto?
    requiereTarjeta?: boolean;    // ¿requiere tarjeta?
    cobro?: string;               // cuándo se cobra
  };
}

// ─── DOCUMENTO 2: AVATAR / PERSONA (extiende Avatar existente) ───────────────
export interface PersonaDoc {
  id: string;
  nombre: string;                 // nombre interno: "El manager de RRHH desbordado"
  rolSituacion?: string;          // rol/contexto/etapa de vida o negocio
  dolorPrincipal?: string;        // problema específico actual (en sus palabras)
  dolorDesdeCuando?: string;      // ¿desde cuándo? ¿empeora?
  deseoPrincipal?: string;        // qué quiere lograr / "después ideal"
  intentosFallidos?: string;      // qué probó antes y por qué no funcionó
  // Complementario
  creenciasFalsas?: string;       // en qué cree que está equivocado (para CONTRARIAN)
  objecionesCompra?: string;      // por qué no compraría ahora / qué necesita ver
  vocabulario?: string[];         // palabras/frases que usa (lo más valioso para el tono)
  nivelConciencia?: "problem_aware" | "solution_aware" | "product_aware" | "most_aware";
}

// ─── DOCUMENTO 3: PRUEBA SOCIAL ─────────────────────────────────────────────
export interface ProofCase {
  cliente: string;                // empresa, rol, contexto o nombre/perfil
  antes?: string;                 // situación antes (con números si es posible)
  despues?: string;               // resultado después (con números)
  tiempo?: string;                // cuánto tardó en ver el resultado
  frase?: string;                 // frase textual del cliente si existe
}
export interface SocialProofDoc {
  numeroClientes?: { total?: string; ultimos12m?: string; mercado?: string };
  casos?: ProofCase[];            // al menos 3-5
  resultadoMasLlamativo?: string; // el mejor caso con el número más específico
  // Complementario
  autoridadExterna?: string[];    // rankings, premios, medios, certificaciones, marcas
  comparacionMercado?: string;    // cuota de mercado / "X de cada Y usa..."
  tiempoOperacion?: string;       // años en el mercado / experiencia
  testimonios?: string[];         // clips/capturas disponibles (referencias)
}

// ─── DOCUMENTO 4: MECANISMO ÚNICO ───────────────────────────────────────────
export interface MechanismDoc {
  enUnaFrase?: string;            // "El [producto] funciona porque [razón específica]."
  porQueDiferente?: string;       // qué hacen las alternativas que no funciona vs. lo tuyo
  creenciasIncorrectas?: string;  // qué cree la gente que necesita y en realidad no
  pasos?: string[];               // 3-5 pasos clave (si aplica)
  pasoClave?: string;             // en qué paso aparece el cambio más grande
  nombreMetodo?: string;          // "Método X" / "Sistema Y" (mecanismo nombrado)
}

// ─── DOCUMENTO 5: MARCA / VOZ ───────────────────────────────────────────────
export interface BrandVoiceDoc {
  nombre?: string;
  categoria?: string;             // tipo de producto/servicio
  mercado?: { pais?: string; idioma?: string; variante?: string }; // vos/tú, etc.
  tono?: {
    formalidad?: number;          // 0 formal ←→ 100 conversacional
    tecnicidad?: number;          // 0 técnico ←→ 100 simple
    aspiracional?: number;        // 0 aspiracional ←→ 100 práctico
    energia?: number;             // 0 calmo ←→ 100 energético
  };
  prohibido?: string[];           // afirmaciones prohibidas, comparaciones, promesas no garantizables
  // Complementario
  ejemplosCopy?: string[];        // 2-3 ejemplos de copy que representan el tono ideal
  frasesCaracteristicas?: string[];
  loQueNoQuiereSonar?: string;
}

// ─── DOCUMENTO 6: ASSETS DISPONIBLES (para scripts/formatos) ─────────────────
export interface ProductionAssetsDoc {
  formatosVideo?: {
    ugc?: boolean;                // creadores/actores para UGC
    produccion?: boolean;         // capacidad de producción media/alta
    testimonials?: boolean;       // video testimonials de clientes
    footageProducto?: boolean;    // footage del producto en uso
    founderCam?: boolean;         // fundador/equipo a cámara
  };
  assetsImagen?: {
    beforeAfter?: boolean;
    screenshotsResultados?: boolean;
    fotosProducto?: boolean;
  };
  plataformas?: string[];         // facebook_feed | instagram_reels | tiktok ...
  idiomas?: string[];             // es-neutro | es-vos | es-tu | en ...
}

// ─── CONTEXTO DE CAMPAÑA (por generación, NO permanente) ─────────────────────
export interface CampaignContext {
  objetivo?: CampaignGoal;
  personaId?: string | null;      // seleccionada del banco de personas
  etapaFunnel?: FunnelStage;
  formato?: PieceFormat;
  bloqueLider?: CopyBlockType;    // block type que lidera el hook
  formulaPreferida?: string;      // código de fórmula (opcional; si no, la IA elige)
}

// ─── AGREGADO: los 6 documentos cerebro de una marca ────────────────────────
export interface BrainDocs {
  offers?: OfferBrief[];
  personas?: PersonaDoc[];
  socialProof?: SocialProofDoc;
  mechanism?: MechanismDoc;
  voice?: BrandVoiceDoc;
  assets?: ProductionAssetsDoc;
}

// Entrada para construir el contexto de una generación (ver src/lib/context.ts)
export interface BrainContextInput {
  docs?: BrainDocs;
  offerId?: string;               // oferta seleccionada (para bloques de oferta)
  campaign?: CampaignContext;
  position?: Position;            // posición que se está generando
}

// Extiende Brand (declaration merging) para alojar los 6 documentos cerebro.
// brandProfile/avatars/offers existentes siguen válidos; brain es la versión estructurada.
export interface Brand {
  brain?: BrainDocs;
}
