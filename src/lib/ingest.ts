// ingest.ts — cliente del backend hosteado para ingerir fuentes (YouTube/TikTok/Instagram/
// Facebook). Reemplaza el uso del puente local (bridge.ts) para esto: el puente solo corre
// en la compu del alumno y nunca va a existir para un usuario real de la webapp desplegada.
// Sitio web y Google Reviews TODAVÍA NO tienen endpoint propio en el backend (ver
// backend/README.md "Lo que falta") — acá se detectan pero se dejan sin transcribir.
import { supabase } from "@/supabase";
import { BACKEND_URL } from "@/lib/ai";

export type IngestResult = { status: "done" | "error"; text?: string; error?: string };

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Necesitás iniciar sesión para procesar fuentes.");
  return { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` };
}

export function isBackendSupportedPlatform(url: string): boolean {
  return /youtu\.?be|tiktok\.com|instagram\.com|facebook\.com|fb\.watch/i.test(url || "");
}

// POST /ingest devuelve {id, status:"pending"} de inmediato — el trabajo pesado (Apify, o
// yt-dlp+Groq de respaldo) sigue en segundo plano. Acá lo esperamos con polling simple en
// vez de suscribirnos a Supabase Realtime (más simple para esta primera versión).
export async function ingestLink(url: string, projectId?: string): Promise<IngestResult> {
  const headers = await authHeaders();
  const r = await fetch(`${BACKEND_URL}/ingest`, {
    method: "POST",
    headers,
    body: JSON.stringify({ url, project_id: projectId }),
  });
  const d = await r.json().catch(() => ({} as any));
  if (!r.ok) {
    if ((d as any)?.code === "OUT_OF_CREDITS") {
      throw new Error("Sin créditos suficientes para procesar esta fuente — subí de plan o comprá un paquete extra.");
    }
    throw new Error((d as any)?.error || `Backend HTTP ${r.status}`);
  }

  const id = (d as any).id;
  const POLL_EVERY_MS = 2000;
  const MAX_TRIES = 45; // ~90s — Apify suele resolver en segundos, yt-dlp+Groq puede tardar más
  for (let i = 0; i < MAX_TRIES; i++) {
    await new Promise((res) => setTimeout(res, POLL_EVERY_MS));
    const sr = await fetch(`${BACKEND_URL}/sources/${id}`, { headers });
    if (!sr.ok) continue;
    const source = await sr.json();
    if (source.status === "done") return { status: "done", text: source.text || "" };
    if (source.status === "error") return { status: "error", error: source.error || "Falló el procesamiento." };
  }
  return { status: "error", error: "Tardó demasiado en procesarse — probá de nuevo en un rato." };
}
