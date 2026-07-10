import type { BrandProfile, Avatar } from "@/types";
import coreBrain from "@/lib/core-brain.md?raw";
export { bancoCtx, BANCO } from "@/lib/banco";
export type { Bloque, Tactic, BancoEntry } from "@/lib/banco";

// ─── COPY BRAIN (FLOWI AI CORE BRAIN v1) ────────────────────────────────────
// Fuente de verdad: src/lib/core-brain.md (también publicado en context/flowi-core-brain.md).
// Se importa como string (?raw) y se usa como system prompt CACHEADO. Mantenerlo
// byte-estable entre llamadas hace que el prompt caching acierte (ver src/lib/ai.ts).
// El contexto dinámico (persona/marca/oferta) + instrucción van DESPUÉS, en el mensaje
// de usuario — nunca dentro de este bloque.
export const COPY_BRAIN: string = coreBrain.trim();

// ─── PERFIL CONTEXT ───────────────────────────────────────────────────────────
export function perfilCtx(p: BrandProfile | null | undefined, avatars?: Avatar[]): string {
  if (!p) return "";
  const line = (label: string, v?: string) => (v && v.trim() ? `\n- ${label}: ${v.trim()}` : "");

  // DOC 2 PERSONA — un avatar por línea con sus campos del cerebro V2
  const avatarCtx = avatars?.length
    ? "\n\nDOC 2 · PERSONA(S):" + avatars.map(a => {
        const quien = [a.avatarGender, a.avatarAgeRange].filter(Boolean).join(", ");
        const parts = [
          `${a.nombre || a.name || "Avatar"}${a.rol ? ` (${a.rol})` : ""}${quien ? ` [${quien}]` : ""}: ${a.descripcion || a.desc || ""}`,
          a.background ? `Avatar.background: ${a.background}` : "",
          a.comportamiento ? `Avatar.comportamiento: ${a.comportamiento}` : "",
          a.likes_dislikes ? `Avatar.likes_dislikes: ${a.likes_dislikes}` : "",
          (a.problema_principal || a.pains || a.dolores) ? `Avatar.dolor: ${a.problema_principal || a.pains || a.dolores}` : "",
          (a.vocabulario || a.lenguaje || a.language) ? `Avatar.vocabulario (sus palabras): ${a.vocabulario || a.lenguaje || a.language}` : "",
          a.antes ? `Avatar.antes: ${a.antes}` : "",
          (a.solucion_fallida || a.intentos_fallidos) ? `Avatar.solucion_fallida: ${a.solucion_fallida || a.intentos_fallidos}` : "",
          a.creencia_falsa ? `Avatar.creencia_falsa: ${a.creencia_falsa}` : "",
          (a.objeciones || a.objection) ? `Avatar.objection: ${a.objeciones || a.objection}` : "",
          a.deseo_final ? `Avatar.deseo: ${a.deseo_final}` : "",
          (a.nivel_conciencia || a.conciencia_detalle) ? `Avatar.nivel_conciencia: ${a.nivel_conciencia || ""}${a.conciencia_detalle ? ` — ${a.conciencia_detalle}` : ""}` : "",
        ].filter(Boolean);
        return "\n  • " + parts.join(" | ");
      }).join("")
    : (p.avatar ? `\n\nDOC 2 · PERSONA: ${p.avatar}` : "");

  // DOC 4 MECANISMO
  const mecanismoCtx = (p.mecanismo_nombrado || p.mecanismo_descripcion || p.mecanismo_diferenciador || p.mecanismo_creencia_rebate)
    ? "\n\nDOC 4 · MECANISMO:" + line("Mecanismo.nombre", p.mecanismo_nombrado) + line("Mecanismo.descripcion", p.mecanismo_descripcion) + line("Mecanismo.diferenciador", p.mecanismo_diferenciador) + line("Mecanismo.creencia_rebate", p.mecanismo_creencia_rebate)
    : "";

  // DOC 3 PRUEBA SOCIAL
  const pruebaCtx = (p.prueba_n_clientes || p.prueba_caso || p.prueba_resultado_clave || p.prueba_autoridad || p.prueba_cuota_mercado)
    ? "\n\nDOC 3 · PRUEBA SOCIAL (usa SOLO estos datos reales, nunca inventes números/nombres):" + line("Prueba.n_clientes", p.prueba_n_clientes) + line("Prueba.caso", p.prueba_caso) + line("Prueba.resultado_clave", p.prueba_resultado_clave) + line("Prueba.cuota_mercado", p.prueba_cuota_mercado) + line("Prueba.autoridad", p.prueba_autoridad)
    : "";

  return `CONTEXTO DE MARCA (DOC 1 OFERTA + DOC 5 MARCA/VOZ):`
    + line("Marca.producto", p.produto || p.producto)
    + line("Oferta (resumen)", p.oferta)
    + line("Mecanismo.diferenciador (marca)", p.diferenciador)
    + line("Marca.tono", p.tono || p.voz)
    + line("Marca.mercado", p.mercado || p.ubicacion)
    + mecanismoCtx
    + pruebaCtx
    + avatarCtx
    + (p.extra ? `\n\nExtra: ${p.extra}` : "");
}
