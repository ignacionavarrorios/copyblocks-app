// bridge.ts — Cliente del puente local (server.mjs).
// Si el puente no está corriendo, todas las funciones fallan en silencio y la app
// cae al comportamiento offline (localStorage / API key).
export const BRIDGE: string =
  (typeof window !== "undefined" && (window as any).__cbBridge) || "http://localhost:8787";

export async function bridgeHealth(): Promise<any | null> {
  try { const r = await fetch(BRIDGE + "/health"); return r.ok ? await r.json() : null; }
  catch { return null; }
}

export async function bridgeLoad(): Promise<any | null> {
  try {
    const r = await fetch(BRIDGE + "/data");
    if (!r.ok) return null;
    const d = await r.json();
    return d && d.brands?.length ? d : null;
  } catch { return null; }
}

export async function bridgeSave(data: any): Promise<void> {
  try {
    await fetch(BRIDGE + "/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch { /* puente apagado — se guarda igual en localStorage */ }
}

// Trae la transcripción de un video de YouTube vía el puente local (endpoint /youtube-transcript).
export async function fetchYoutubeTranscript(url: string): Promise<string> {
  const r = await fetch(BRIDGE + "/youtube-transcript?url=" + encodeURIComponent(url));
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d as any)?.error || `El puente local respondió ${r.status}. ¿Está corriendo con "npm run start"?`);
  return (d as any).text || "";
}
