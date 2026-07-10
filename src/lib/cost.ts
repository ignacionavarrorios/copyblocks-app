// @ts-nocheck
// ─── MEDIDOR DE COSTO DE API ──────────────────────────────────────────────────
// Captura el uso de tokens de cada llamada a la IA y calcula el costo en USD.
// Sirve para estimar cuánto cuesta el uso de un usuario real.
//
// Precios LISTA por 1M de tokens (input / output). Anthropic además cobra:
//   - escritura de caché  = 1.25× input
//   - lectura de caché    = 0.10× input
// OpenAI / Gemini son aproximados (verificar con su tarifa vigente).

export const PRICING = {
  // Anthropic
  "claude-sonnet-4-5": { in: 3,    out: 15,   cache: true },
  "claude-sonnet-4-6": { in: 3,    out: 15,   cache: true },
  "claude-opus-4-8":   { in: 5,    out: 25,   cache: true },
  "claude-haiku-4-5":  { in: 1,    out: 5,    cache: true },
  // OpenAI (aprox.)
  "gpt-4o":            { in: 2.5,  out: 10,   cache: false },
  // Google (aprox.)
  "gemini-1.5-pro":    { in: 1.25, out: 5,    cache: false },
};

const DEFAULT_PRICE = { in: 3, out: 15, cache: false };

let _records = [];
const _listeners = new Set();

function emit() { _listeners.forEach(fn => { try { fn(getSummary()); } catch {} }); }

export function subscribe(fn) { _listeners.add(fn); fn(getSummary()); return () => _listeners.delete(fn); }

// Normaliza la forma de `usage` de cada proveedor → {input, output, cacheCreate, cacheRead}
export function normalizeUsage(provider, usage) {
  if (!usage) return { input: 0, output: 0, cacheCreate: 0, cacheRead: 0 };
  if (provider === "openai") {
    return { input: usage.prompt_tokens || 0, output: usage.completion_tokens || 0, cacheCreate: 0, cacheRead: usage.prompt_tokens_details?.cached_tokens || 0 };
  }
  if (provider === "gemini") {
    return { input: usage.promptTokenCount || 0, output: usage.candidatesTokenCount || 0, cacheCreate: 0, cacheRead: usage.cachedContentTokenCount || 0 };
  }
  // anthropic
  return {
    input: usage.input_tokens || 0,
    output: usage.output_tokens || 0,
    cacheCreate: usage.cache_creation_input_tokens || 0,
    cacheRead: usage.cache_read_input_tokens || 0,
  };
}

export function computeCost(model, u) {
  const p = PRICING[model] || DEFAULT_PRICE;
  // input "fresco" (no cacheado): para anthropic, `input` ya excluye lo leído de caché
  const inputCost  = (u.input * p.in) / 1e6;
  const writeCost  = (u.cacheCreate * p.in * 1.25) / 1e6;
  const readCost   = (u.cacheRead * p.in * 0.10) / 1e6;
  const outputCost = (u.output * p.out) / 1e6;
  return inputCost + writeCost + readCost + outputCost;
}

// Registra una llamada. Devuelve el costo en USD.
export function recordUsage({ provider, model, usage, label, ms }) {
  const u = normalizeUsage(provider, usage);
  const cost = computeCost(model, u);
  const rec = {
    id: Math.random().toString(36).slice(2),
    label: label || "Generación IA",
    provider, model,
    ...u,
    totalIn: u.input + u.cacheCreate + u.cacheRead,
    cost,
    ms: ms || 0,
    at: Date.now(),
  };
  _records = [rec, ..._records].slice(0, 200);
  // Log legible en consola
  console.log(
    `💸 [${rec.label}] $${cost.toFixed(5)} · in ${rec.totalIn}t (caché lee ${u.cacheRead}t) · out ${u.output}t · ${model}`
  );
  emit();
  return cost;
}

export function getSummary() {
  const total = _records.reduce((s, r) => s + r.cost, 0);
  const calls = _records.length;
  const tokensIn = _records.reduce((s, r) => s + r.totalIn, 0);
  const tokensOut = _records.reduce((s, r) => s + r.output, 0);
  const cacheRead = _records.reduce((s, r) => s + r.cacheRead, 0);
  return { total, calls, tokensIn, tokensOut, cacheRead, records: _records };
}

export function resetCost() { _records = []; emit(); }
