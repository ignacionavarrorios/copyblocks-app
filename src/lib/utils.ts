import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

// Extrae JSON de una respuesta de IA de forma robusta: tolera markdown/prosa alrededor
// y balancea llaves/corchetes con conteo de profundidad respetando strings.
export function extractJSON(raw: string): any {
  const t = String(raw).replace(/```json|```/gi, "").trim();
  const fo = t.indexOf("{"), fa = t.indexOf("[");
  let start = -1, openCh = "{", closeCh = "}";
  if (fa !== -1 && (fo === -1 || fa < fo)) { start = fa; openCh = "["; closeCh = "]"; }
  else if (fo !== -1) { start = fo; openCh = "{"; closeCh = "}"; }
  if (start === -1) return JSON.parse(t);
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < t.length; i++) {
    const c = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === openCh) depth++;
    else if (c === closeCh) { depth--; if (depth === 0) return JSON.parse(t.slice(start, i + 1)); }
  }
  const end = t.lastIndexOf(closeCh);
  return JSON.parse(t.slice(start, end > start ? end + 1 : undefined));
}
