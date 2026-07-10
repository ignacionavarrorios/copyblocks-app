// ─── ENSAMBLAJE DE CONTEXTO (6 DOCUMENTOS CEREBRO + CAMPAÑA) ─────────────────
// Serializa los documentos cerebro y el contexto de campaña en el bloque dinámico
// que va DESPUÉS de COPY_BRAIN (nunca dentro, para no romper el prompt caching).
// Todo es tolerante a datos faltantes: cada builder devuelve "" si no hay datos.
import type {
  OfferBrief, PersonaDoc, SocialProofDoc, MechanismDoc, BrandVoiceDoc,
  ProductionAssetsDoc, CampaignContext, BrainDocs, Position, CopyBlockType, FunnelStage,
} from "@/types";
import { formulasForPosition, formulaByCode, RECOMMENDED_BY_POSITION, type Formula } from "@/lib/formulas";

const j = (parts: (string | undefined | false)[]) => parts.filter(Boolean).join("\n");

// ─── DOCUMENTO 1: OFERTA ─────────────────────────────────────────────────────
export function offerCtx(o?: OfferBrief | null): string {
  if (!o) return "";
  const items = o.incluye?.length
    ? "\n  Incluye:\n" + o.incluye.map(i => `   - ${i.nombre}${i.beneficio ? ` → ${i.beneficio}` : ""}${i.valor ? ` (valor ${i.valor})` : ""}`).join("\n")
    : "";
  const tr = o.transformacion;
  const transf = tr && (tr.antes || tr.despues)
    ? `\n  Transformación: ${tr.antes || "?"} → ${tr.despues || "?"}${tr.tiempo ? ` en ${tr.tiempo}` : ""}` : "";
  const g = o.garantia;
  const gar = g && (g.tipo || g.plazo) ? `\n  Garantía: ${[g.tipo, g.plazo, g.condicion].filter(Boolean).join(", ")}` : "";
  return j([
    "DOCUMENTO 1 — OFERTA:",
    `  Producto: ${o.nombre}${o.precio ? ` · Precio: ${o.precio}` : ""}`,
    items, transf, gar,
    o.comparacionPrecio && `  Ancla de precio: ${o.comparacionPrecio}`,
    o.restricciones && `  Restricción real (urgencia): ${o.restricciones}`,
    o.objeciones?.length && `  Objeciones a vencer: ${o.objeciones.join(" · ")}`,
    o.entrada?.trial && `  Entrada: ${o.entrada.trial}${o.entrada.requiereTarjeta === false ? " (sin tarjeta)" : ""}`,
  ]);
}

// ─── DOCUMENTO 2: PERSONA ────────────────────────────────────────────────────
export function personaDocCtx(p?: PersonaDoc | null): string {
  if (!p) return "";
  return j([
    `DOCUMENTO 2 — PERSONA: ${p.nombre}`,
    p.rolSituacion && `  Rol/situación: ${p.rolSituacion}`,
    p.dolorPrincipal && `  Dolor principal (sus palabras): ${p.dolorPrincipal}`,
    p.deseoPrincipal && `  Deseo: ${p.deseoPrincipal}`,
    p.intentosFallidos && `  Ya probó (y falló): ${p.intentosFallidos}`,
    p.creenciasFalsas && `  Creencia falsa (para CONTRARIAN): ${p.creenciasFalsas}`,
    p.objecionesCompra && `  Objeción de compra: ${p.objecionesCompra}`,
    p.vocabulario?.length && `  Vocabulario a usar: ${p.vocabulario.join(" · ")}`,
    p.nivelConciencia && `  Nivel de conciencia: ${p.nivelConciencia}`,
  ]);
}

// ─── DOCUMENTO 3: PRUEBA SOCIAL ──────────────────────────────────────────────
export function proofDocCtx(sp?: SocialProofDoc | null): string {
  if (!sp) return "";
  const nc = sp.numeroClientes;
  const casos = sp.casos?.length
    ? "\n  Casos:\n" + sp.casos.map(c => `   - ${c.cliente}: ${c.antes || "?"} → ${c.despues || "?"}${c.tiempo ? ` (${c.tiempo})` : ""}${c.frase ? ` — "${c.frase}"` : ""}`).join("\n")
    : "";
  return j([
    "DOCUMENTO 3 — PRUEBA SOCIAL:",
    nc && (nc.total || nc.ultimos12m || nc.mercado) && `  Clientes: ${[nc.total && `${nc.total} total`, nc.ultimos12m && `${nc.ultimos12m} (12m)`, nc.mercado].filter(Boolean).join(" · ")}`,
    sp.resultadoMasLlamativo && `  Dato más fuerte: ${sp.resultadoMasLlamativo}`,
    casos,
    sp.autoridadExterna?.length && `  Autoridad externa: ${sp.autoridadExterna.join(" · ")}`,
    sp.comparacionMercado && `  Cuota de mercado: ${sp.comparacionMercado}`,
    sp.tiempoOperacion && `  Trayectoria: ${sp.tiempoOperacion}`,
  ]);
}

// ─── DOCUMENTO 4: MECANISMO ÚNICO ────────────────────────────────────────────
export function mechanismCtx(m?: MechanismDoc | null): string {
  if (!m) return "";
  return j([
    "DOCUMENTO 4 — MECANISMO ÚNICO:",
    m.enUnaFrase && `  En una frase: ${m.enUnaFrase}`,
    m.nombreMetodo && `  Nombre del método (úsalo en CURIOSIDAD): ${m.nombreMetodo}`,
    m.porQueDiferente && `  Por qué es diferente: ${m.porQueDiferente}`,
    m.creenciasIncorrectas && `  Creencia incorrecta sobre el cómo: ${m.creenciasIncorrectas}`,
    m.pasos?.length && `  Pasos: ${m.pasos.join(" → ")}`,
    m.pasoClave && `  Paso donde está el cambio: ${m.pasoClave}`,
  ]);
}

// ─── DOCUMENTO 5: MARCA / VOZ ────────────────────────────────────────────────
function tonoLabel(t?: BrandVoiceDoc["tono"]): string {
  if (!t) return "";
  const map: [number | undefined, string, string][] = [
    [t.formalidad, "formal", "conversacional"],
    [t.tecnicidad, "técnico", "simple"],
    [t.aspiracional, "aspiracional", "práctico"],
    [t.energia, "calmo", "energético"],
  ];
  return map.filter(([v]) => typeof v === "number").map(([v, lo, hi]) => (v! >= 50 ? hi : lo)).join(", ");
}
export function voiceCtx(v?: BrandVoiceDoc | null): string {
  if (!v) return "";
  const tono = tonoLabel(v.tono);
  return j([
    "DOCUMENTO 5 — MARCA / VOZ:",
    v.nombre && `  Marca: ${v.nombre}${v.categoria ? ` (${v.categoria})` : ""}`,
    v.mercado && (v.mercado.pais || v.mercado.variante) && `  Mercado: ${[v.mercado.pais, v.mercado.idioma, v.mercado.variante].filter(Boolean).join(" · ")}`,
    tono && `  Tono: ${tono}`,
    v.frasesCaracteristicas?.length && `  Frases de marca: ${v.frasesCaracteristicas.join(" · ")}`,
    v.ejemplosCopy?.length && `  Ejemplos del tono ideal: ${v.ejemplosCopy.map(e => `"${e}"`).join(" / ")}`,
    v.prohibido?.length && `  PROHIBIDO decir: ${v.prohibido.join(" · ")}`,
    v.loQueNoQuiereSonar && `  Evitar sonar como: ${v.loQueNoQuiereSonar}`,
  ]);
}

// ─── DOCUMENTO 6: ASSETS DISPONIBLES (para scripts/formatos) ─────────────────
export function assetsCtx(a?: ProductionAssetsDoc | null): string {
  if (!a) return "";
  const fv = a.formatosVideo, ai = a.assetsImagen;
  const formatos = fv ? Object.entries(fv).filter(([, v]) => v).map(([k]) => k).join(", ") : "";
  const imgs = ai ? Object.entries(ai).filter(([, v]) => v).map(([k]) => k).join(", ") : "";
  return j([
    "DOCUMENTO 6 — ASSETS DISPONIBLES:",
    formatos && `  Video disponible: ${formatos}`,
    imgs && `  Imagen disponible: ${imgs}`,
    a.plataformas?.length && `  Plataformas: ${a.plataformas.join(", ")}`,
    a.idiomas?.length && `  Idiomas: ${a.idiomas.join(", ")}`,
  ]);
}

// ─── CONTEXTO DE CAMPAÑA (por generación) ────────────────────────────────────
export function campaignCtx(c?: CampaignContext | null): string {
  if (!c) return "";
  const goal: Record<string, string> = { leads: "Generar leads", ventas: "Ventas directas", demos: "Demos/consultas", awareness: "Awareness/branding" };
  return j([
    "CONTEXTO DE ESTA PIEZA:",
    c.objetivo && `  Objetivo: ${goal[c.objetivo] || c.objetivo}`,
    c.etapaFunnel && `  Etapa del funnel: ${c.etapaFunnel}`,
    c.formato && `  Formato: ${c.formato}`,
    c.bloqueLider && `  Block type líder del hook: ${c.bloqueLider.toUpperCase()}`,
  ]);
}

// ─── GUÍA DE FÓRMULA (inyecta el esqueleto de la(s) fórmula(s) a aplicar) ─────
export function formulaGuidance(
  position: Position,
  opts: { blockType?: CopyBlockType; funnel?: FunnelStage; formulaPreferida?: string; n?: number } = {}
): string {
  const fixed = formulaByCode(opts.formulaPreferida);
  const list: Formula[] = fixed ? [fixed] : formulasForPosition(position, { blockType: opts.blockType, funnel: opts.funnel }).slice(0, opts.n ?? 3);
  if (!list.length) return "";
  const rec = RECOMMENDED_BY_POSITION[position];
  const lines = list.map(f => `  [${f.code}] ${f.name} — ${f.hook || f.template || ""}${f.error ? `\n     ⚠ ${f.error}` : ""}`);
  return j([
    `FÓRMULAS PARA LA POSICIÓN "${position}"${rec ? ` (recomendado: ${rec.nota})` : ""}:`,
    ...lines,
    fixed ? "Aplica EXACTAMENTE esta fórmula." : "Elegí la más adecuada al avatar y la oferta; varía la fórmula entre variantes.",
  ]);
}

// ─── MASTER: arma todo el contexto dinámico para una generación ──────────────
// Devuelve el bloque que va DESPUÉS de COPY_BRAIN (con \n\n inicial ya incluido por el caller si hace falta).
export function buildBrainContext(input: {
  docs?: BrainDocs;
  offerId?: string;
  campaign?: CampaignContext;
  position?: Position;
}): string {
  const { docs, campaign, position } = input;
  const offer = docs?.offers?.find(o => o.id === input.offerId) || docs?.offers?.[0];
  const persona = campaign?.personaId
    ? docs?.personas?.find(p => p.id === campaign.personaId)
    : docs?.personas?.[0];

  const blocks = [
    voiceCtx(docs?.voice),
    personaDocCtx(persona),
    mechanismCtx(docs?.mechanism),
    proofDocCtx(docs?.socialProof),
    // La oferta solo es necesaria para bloques/posiciones de oferta, pero si existe la incluimos.
    offerCtx(offer),
    assetsCtx(docs?.assets),
    campaignCtx(campaign),
    position && formulaGuidance(position, {
      blockType: campaign?.bloqueLider,
      funnel: campaign?.etapaFunnel,
      formulaPreferida: campaign?.formulaPreferida,
    }),
  ].filter(Boolean);

  return blocks.join("\n\n");
}
