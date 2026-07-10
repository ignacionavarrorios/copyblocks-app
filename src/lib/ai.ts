import { COPY_BRAIN } from "@/lib/prompts";
import { recordUsage } from "@/lib/cost";
import { supabase } from "@/supabase";

export type ImageInput = { mimeType: string; base64: string };
export type ActionType = "copy" | "setup" | "doc";

// URL del backend hosteado (Railway) — configurar VITE_BACKEND_URL en producción.
// En desarrollo local apunta al backend corriendo en :8080 (ver backend/README.md).
export const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:8080";

// ─── AI CALL — pasa por el backend hosteado, nunca directo a Anthropic ───────────────────
// La key de Anthropic ya no toca el navegador: el backend la tiene server-side, cobra los
// créditos correspondientes a `actionType`, elige el modelo (Sonnet para "copy", Haiku para
// "setup"/"doc"), y devuelve el texto. `label` solo etiqueta la acción en el medidor de
// costo local (src/lib/cost.ts) — no afecta el cobro real, eso lo decide `actionType`.
// `image`, si se pasa, permite analizar un creativo estático (anuncio de imagen).
export async function callClaude(
  prompt: string,
  _apiKey?: string | null,
  max = 1400,
  label?: string,
  image?: ImageInput | null,
  actionType: ActionType = "copy",
): Promise<string> {
  const t0 = (typeof performance !== "undefined" ? performance.now() : 0);

  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (!accessToken) throw new Error("Necesitás iniciar sesión para usar la IA.");

  // El cerebro de copywriting general (COPY_BRAIN) es idéntico en cada llamada del
  // compositor — va aparte como `systemText` para que el backend lo cachee (cache_control
  // ephemeral): solo la primera llamada de la sesión lo paga completo, el resto lee de
  // caché a ~10% del costo.
  let systemText: string | undefined;
  let userContent = prompt;
  if (prompt.startsWith(COPY_BRAIN)) {
    systemText = COPY_BRAIN;
    userContent = prompt.slice(COPY_BRAIN.length).replace(/^\n+/, "");
  }

  const r = await fetch(`${BACKEND_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ prompt: userContent, max, actionType, image: image || undefined, systemText }),
  });

  if (!r.ok) {
    const e = await r.json().catch(() => ({} as any));
    if ((e as any)?.code === "OUT_OF_CREDITS") {
      throw new Error("Te quedaste sin créditos este mes — subí de plan o comprá un paquete extra para seguir generando.");
    }
    throw new Error((e as any)?.error || `Backend HTTP ${r.status}`);
  }

  const d = await r.json();
  const model = actionType === "copy" ? "claude-sonnet-4-5" : "claude-haiku-4-5";
  recordUsage({ provider: "anthropic", model, usage: (d as any).usage, label, ms: (performance?.now?.() || 0) - t0 });
  return (d as any).text || "";
}
