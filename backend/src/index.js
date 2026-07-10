// Flowi AI — backend de ingesta hosteado.
// Corre en un servidor propio (Railway/Fly.io), NO en la compu del alumno — por eso el
// problema de CERTIFICATE_VERIFY_FAILED de yt-dlp en Windows (antivirus/EDR interceptando
// TLS) no aplica acá: Linux, sin AV de por medio.
//
// Flujo de ingesta: POST /ingest {url, project_id} (con Authorization: Bearer <supabase
// access_token>) → detecta plataforma → intenta Apify (barato, sin pelear anti-bot nosotros)
// → si falla, yt-dlp baja el audio y Groq Whisper transcribe → guarda en cerebro_sources →
// arma embeddings para RAG → el frontend se entera vía Supabase Realtime.
//
// Flujo de chat: POST /chats (crea un chat linkeado a fuentes) → POST /chats/:id/messages
// (busca los chunks más relevantes de esas fuentes, arma contexto, le pregunta a Claude
// Sonnet, guarda la respuesta).
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { createClient } from "@supabase/supabase-js";
import YTDlpWrapPkg from "yt-dlp-wrap-plus";
import ffmpegPath from "ffmpeg-static";
import { access, mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const YTDlpWrap = YTDlpWrapPkg.default || YTDlpWrapPkg;

const PORT = Number(process.env.PORT || 8080);
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
// Actores elegidos (2026-07-10, ver investigación de mercado) — con solo cargar
// APIFY_API_TOKEN ya funcionan los 4 sin configurar nada más. Overrideable por env var si en
// el futuro se quiere cambiar de actor. YouTube e Instagram hacen su propia transcripción por
// IA si el video no tiene captions (reemplazan a yt-dlp+Groq); TikTok y Facebook solo leen
// captions nativos, así que para esas dos el fallback a yt-dlp+Groq sigue siendo necesario.
const APIFY_ACTORS = {
  youtube: process.env.APIFY_YOUTUBE_ACTOR_ID || "codepoetry/youtube-transcript-ai-scraper",
  tiktok: process.env.APIFY_TIKTOK_ACTOR_ID || "scrape-creators/best-tiktok-transcripts-scraper",
  instagram: process.env.APIFY_INSTAGRAM_ACTOR_ID || "electrifying_haircut/instagram-reel-analyzer",
  facebook: process.env.APIFY_FACEBOOK_ACTOR_ID || "automation-lab/video-transcript-scraper",
  // Ads Library (facebook.com/ads/library/...) es un actor totalmente distinto — scrapea copy
  // de anuncios pagados, no transcript de video. Ver detectPlatform().
  facebook_ad: process.env.APIFY_FACEBOOK_AD_ACTOR_ID || "apify/facebook-ads-scraper",
};

// ── Sistema de créditos ────────────────────────────────────────────────────────────────
// Mismos valores que la ficha técnica acordada. 1 crédito = $0.002 USD de costo real.
const CREDIT_VALUE_USD = 0.002;
const ACTION_CREDITS = {
  copy: 10,     // Generación de copy (compositor)
  setup: 5,     // Chat de configuración (Marca/Persona/Oferta)
  doc: 10,      // Documento subido / texto largo a distillar
  yt: 10,       // Fuente de YouTube ingerida
  social: 1,    // Fuente de TikTok/Instagram/Facebook (post/reel)
  ads: 3,       // Anuncio importado de la Facebook Ads Library — el actor cuesta más real (~$0.003-0.006/anuncio)
  reviews: 15,  // Tanda de 50 Google Reviews
  rag: 10,      // Chat con el Cerebro
};
// Sonnet para lo que el usuario "siente" (copy final, respuestas del RAG); Haiku para tareas
// de trámite (completar el perfil charlando, o extraer/resumir un documento largo) — mucho
// más barato y de sobra para esas tareas.
const ACTION_MODELS = {
  copy: "claude-sonnet-4-5",
  rag: "claude-sonnet-4-5",
  setup: "claude-haiku-4-5",
  doc: "claude-haiku-4-5",
};
// $ por millón de tokens — usado solo para calcular el costo real que se guarda en el
// ledger (auditoría), no afecta cuántos créditos se cobran.
const MODEL_PRICING = {
  "claude-sonnet-4-5": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5": { input: 1.0, output: 5.0 },
};

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno.");
  process.exit(1);
}
if (!GROQ_API_KEY) console.warn("GROQ_API_KEY no está seteada — el fallback de transcripción va a fallar.");
if (!OPENAI_API_KEY) console.warn("OPENAI_API_KEY no está seteada — no se van a generar embeddings (sin RAG).");
if (!ANTHROPIC_API_KEY) console.warn("ANTHROPIC_API_KEY no está seteada — el chat con el cerebro va a fallar.");
if (!APIFY_API_TOKEN) console.warn("APIFY_API_TOKEN no está seteada — se usa yt-dlp+Groq directo, sin intentar Apify primero.");

// Cliente con service role: bypassea RLS a propósito (este backend YA verificó la identidad
// del usuario vía su access_token antes de tocar las tablas — ver requireUser()).
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const app = new Hono();

// Sin esto, el navegador bloquea cualquier fetch del frontend (Vercel) hacia este backend
// (Railway) por ser un origen distinto — "Failed to fetch" en la consola, sin más detalle.
const ALLOWED_ORIGINS = (process.env.FRONTEND_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  "*",
  cors({
    origin: ALLOWED_ORIGINS,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/health", (c) => c.json({ ok: true }));

// Verifica el JWT de Supabase que manda el frontend y devuelve el user_id real — nunca
// confiar en un user_id que venga en el body, cualquiera podría mandar el de otra persona.
async function requireUser(c) {
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

function detectPlatform(link) {
  let h = "", p = "";
  try { const u = new URL(link); h = u.hostname; p = u.pathname; } catch { return "unknown"; }
  if (/youtu\.?be/i.test(h)) return "youtube";
  if (/tiktok\.com/i.test(h)) return "tiktok";
  if (/instagram\.com/i.test(h)) return "instagram";
  // La Ads Library es un producto totalmente distinto de un post/reel normal — mismo dominio,
  // pero necesita otro actor de Apify y devuelve copy de anuncio, no transcript de video.
  if (/facebook\.com/i.test(h) && /\/ads\/library/i.test(p)) return "facebook_ad";
  if (/facebook\.com|fb\.watch/i.test(h)) return "facebook";
  return "unknown";
}

// ── Apify (camino principal — barato, sin pelear anti-bot nosotros) ───────────────────
// Corre un actor de forma síncrona y devuelve el primer item del dataset resultante. La API
// de Apify espera el actor ID con "~" (no "/") en la URL — los slugs del Store usan "/", así
// que lo normalizamos acá para no pegarle a una URL de actor inexistente.
async function runApifyActor(actorId, input) {
  const normalizedId = actorId.replace("/", "~");
  const url = `https://api.apify.com/v2/acts/${normalizedId}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!r.ok) throw new Error(`Apify actor ${actorId}: ${r.status} ${(await r.text()).slice(0, 300)}`);
  const items = await r.json();
  if (!Array.isArray(items) || !items.length) throw new Error(`Apify actor ${actorId} no devolvió resultados.`);
  return items[0];
}
// Cada actor de Apify espera un shape de input distinto — mandamos varios nombres de campo
// posibles a la vez (los actores ignoran los que no reconocen), cubriendo los 4 elegidos.
function buildApifyInput(url) {
  return {
    url,
    urls: [url],
    startUrls: [{ url }], // convención Crawlee — objetos {url}, no strings
    videoUrls: [url],     // confirmado con automation-lab/video-transcript-scraper: strings, no objetos
    videos: [url],
    reelUrls: [url],
    instagramUrl: url,
  };
}
// TikTok (scrape-creators) devuelve el transcript en formato WEBVTT (con timestamps) —
// lo limpiamos a texto plano.
function stripWebvtt(s) {
  if (!/^WEBVTT/i.test(s.trim())) return s;
  return s
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t || /^WEBVTT/i.test(t) || /^\d+$/.test(t) || /-->/.test(t)) return false;
      return true;
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
// Nombres de campo de output confirmados para los 4 actores elegidos, más algunos genéricos
// de respaldo por si se cambia de actor en el futuro. Algunos actores anidan el resultado
// (ej. transcript.full_text, result.text — shape crudo de Whisper) — se busca ahí también.
function extractTranscriptField(item) {
  // Un anuncio de la Ads Library suele traer título + cuerpo como campos separados — a
  // diferencia de un transcript de video, acá conviene juntarlos en vez de quedarnos con
  // el primero que aparezca. OJO: esto solo debe dispararse si hay un campo de "cuerpo de
  // anuncio" de verdad — muchos actores de transcript de video TAMBIÉN traen "title" (el
  // título del video), y si disparáramos con title solo, le devolveríamos el título en vez
  // del transcript real a YouTube/TikTok/Instagram.
  const adBody = item?.ad_creative_body ?? item?.body ?? item?.ad_text;
  if (typeof adBody === "string" && adBody.trim()) {
    const adParts = [item?.title, adBody, item?.link_description].filter((v) => typeof v === "string" && v.trim());
    return adParts.join("\n\n").trim();
  }

  const candidates = [
    "transcript_text", "transcriptText", "transcript_llm", "transcript",
    "full_text", "text", "captions", "subtitles", "caption", "description",
  ];
  for (const key of candidates) {
    const v = item?.[key];
    if (typeof v === "string" && v.trim()) return stripWebvtt(v.trim());
    if (Array.isArray(v) && v.length) {
      const joined = v.map((seg) => (typeof seg === "string" ? seg : seg?.text || "")).join(" ").trim();
      if (joined) return stripWebvtt(joined);
    }
  }
  for (const nestKey of ["transcript", "result", "snapshot"]) {
    const nested = item?.[nestKey];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const nestedText = extractTranscriptField(nested);
      if (nestedText) return nestedText;
    }
  }
  return null;
}
// Cada actor también trae un thumbnail del video (o imagen/creativo del anuncio) en algún
// campo — usamos esto para mostrar una preview real en el Cerebro (antes de esto, TikTok/
// Instagram/Facebook solo tenían el favicon genérico del dominio, YouTube era el único con
// thumbnail real vía img.youtube.com).
function extractThumbnailField(item) {
  const candidates = [
    "thumbnail", "thumbnailUrl", "thumb", "coverUrl", "cover", "cover_image_url",
    "displayUrl", "image", "imageUrl", "videoThumbnail", "video_thumbnail", "previewImageUrl",
  ];
  for (const key of candidates) {
    const v = item?.[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (Array.isArray(v) && v.length && typeof v[0] === "string") return v[0]; // ads: images[]
  }
  for (const nestKey of ["videoMeta", "video", "media", "snapshot"]) {
    const nested = item?.[nestKey];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const nestedThumb = extractThumbnailField(nested);
      if (nestedThumb) return nestedThumb;
    }
  }
  return null;
}
async function fetchViaApify(url, platform) {
  const actorId = APIFY_ACTORS[platform];
  if (!APIFY_API_TOKEN || !actorId) return null; // no configurado — el caller cae a yt-dlp
  try {
    const item = await runApifyActor(actorId, buildApifyInput(url));
    const text = extractTranscriptField(item);
    const thumb = extractThumbnailField(item);
    if (!text && !thumb) {
      // El actor respondió bien (no tiró error) pero ninguno de los nombres de campo que
      // probamos matcheó nada — sin este log no hay forma de saber qué shape real devuelve.
      console.warn(`Apify (${actorId}) para ${platform} (${url}) no trajo texto/thumb reconocible. Item crudo:`, JSON.stringify(item).slice(0, 2000));
    }
    return text || thumb ? { text, thumb } : null;
  } catch (e) {
    console.warn(`Apify falló para ${platform} (${url}): ${e.message}`);
    return null; // el caller cae a yt-dlp
  }
}

// ── yt-dlp + Groq (fallback) ───────────────────────────────────────────────────────────
// Railway no trae yt-dlp preinstalado (spawn ENOENT) — si no se pasó YTDLP_PATH, bajamos el
// binario standalone (incluye su propio Python empaquetado) una sola vez a un path fijo dentro
// del contenedor y lo reusamos en llamadas siguientes.
const AUTO_YTDLP_PATH = path.join(tmpdir(), "yt-dlp-bin", process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp");
let _ytDlp = null;
let _ytDlpReady = null;
async function getYtDlp() {
  if (_ytDlp) return _ytDlp;
  const bin = process.env.YTDLP_PATH || AUTO_YTDLP_PATH;
  if (!process.env.YTDLP_PATH) {
    if (!_ytDlpReady) {
      _ytDlpReady = access(AUTO_YTDLP_PATH).catch(async () => {
        console.log("Descargando binario de yt-dlp a", AUTO_YTDLP_PATH, "...");
        await mkdir(path.dirname(AUTO_YTDLP_PATH), { recursive: true });
        await YTDlpWrap.downloadFromGithub(AUTO_YTDLP_PATH);
      });
    }
    await _ytDlpReady;
  }
  _ytDlp = new YTDlpWrap(bin);
  return _ytDlp;
}

async function downloadAudio(url) {
  const yt = await getYtDlp();
  const tmpDir = await mkdtemp(path.join(tmpdir(), "ingest-"));
  const outTemplate = path.join(tmpDir, "audio.%(ext)s");
  await yt.execPromise([
    url, "-x", "--audio-format", "mp3", "--audio-quality", "5",
    "--ffmpeg-location", ffmpegPath, "-o", outTemplate,
    "--no-playlist", "--max-filesize", "100M",
  ]);
  const files = await readdir(tmpDir);
  const audioFile = files.find((f) => f.startsWith("audio."));
  if (!audioFile) throw new Error("No pude extraer el audio de este link.");
  return { path: path.join(tmpDir, audioFile), tmpDir };
}

async function transcribeWithGroq(audioPath) {
  const buf = await readFile(audioPath);
  const form = new FormData();
  form.append("file", new Blob([buf]), path.basename(audioPath));
  form.append("model", "whisper-large-v3-turbo");
  form.append("language", "es");
  const r = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    body: form,
  });
  if (!r.ok) throw new Error(`Groq API: ${r.status} ${(await r.text()).slice(0, 300)}`);
  const data = await r.json();
  if (!data?.text?.trim()) throw new Error("Groq no devolvió texto para este audio.");
  return data.text.trim();
}

// ── Embeddings (RAG — chat con el cerebro) ─────────────────────────────────────────────
function chunkText(text, maxChars = 1200) {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxChars) chunks.push(text.slice(i, i + maxChars));
  return chunks;
}

async function embedTexts(texts) {
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({ model: "text-embedding-3-small", input: texts }),
  });
  if (!r.ok) throw new Error(`OpenAI embeddings: ${r.status} ${(await r.text()).slice(0, 300)}`);
  const data = await r.json();
  return data.data.map((d) => d.embedding);
}

async function embedAndStoreChunks(sourceId, userId, text) {
  if (!OPENAI_API_KEY) { console.warn("OPENAI_API_KEY no configurada — salteo embeddings para", sourceId); return; }
  const chunks = chunkText(text).filter((t) => t.trim());
  if (!chunks.length) return;
  const embeddings = await embedTexts(chunks);
  const rows = chunks.map((chunk_text, i) => ({ source_id: sourceId, user_id: userId, chunk_text, embedding: embeddings[i] }));
  const { error } = await supabase.from("cerebro_chunks").insert(rows);
  if (error) throw new Error(error.message);
}

// `systemText`, si se pasa, va con cache_control ephemeral — el contexto de Marca/Persona/
// Receta/Oferta se repite en cada llamada de una misma sesión, así que solo la primera paga
// precio completo (creation) y el resto lee de caché (~10% del costo, ver usage.cache_read_*).
async function callClaude(model, prompt, max = 1400, opts = {}) {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY no configurada en el backend.");
  const { image, systemText } = opts;
  const content = image
    ? [{ type: "image", source: { type: "base64", media_type: image.mimeType, data: image.base64 } }, { type: "text", text: prompt }]
    : prompt;
  const reqBody = systemText
    ? { model, max_tokens: max, system: [{ type: "text", text: systemText, cache_control: { type: "ephemeral" } }], messages: [{ role: "user", content }] }
    : { model, max_tokens: max, messages: [{ role: "user", content }] };
  const headers = { "Content-Type": "application/json", "anthropic-version": "2023-06-01", "x-api-key": ANTHROPIC_API_KEY };
  if (systemText) headers["anthropic-beta"] = "prompt-caching-2024-07-31";
  const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers, body: JSON.stringify(reqBody) });
  if (!r.ok) throw new Error(`Anthropic API: ${r.status} ${(await r.text()).slice(0, 300)}`);
  const data = await r.json();
  return { text: data.content?.[0]?.text || "", usage: data.usage };
}

// Costo real en USD de una llamada, para el ledger de auditoría — no afecta lo que se cobra
// en créditos (eso es fijo por acción), solo permite comparar "cobramos X créditos, costó Y
// dólares reales" y confirmar que los créditos por acción están bien calibrados.
function computeRealCost(model, usage) {
  const pricing = MODEL_PRICING[model];
  if (!pricing || !usage) return null;
  const input = usage.input_tokens || 0;
  const output = usage.output_tokens || 0;
  const cacheRead = usage.cache_read_input_tokens || 0;
  const cacheWrite = usage.cache_creation_input_tokens || 0;
  return (
    (input * pricing.input) / 1e6 +
    (cacheRead * pricing.input * 0.1) / 1e6 + // lectura de caché ≈ 10% del precio normal
    (cacheWrite * pricing.input * 1.25) / 1e6 + // escritura de caché ≈ 125% (TTL de 5 min)
    (output * pricing.output) / 1e6
  );
}

// Cobro/reembolso atómico — ver la función Postgres adjust_user_credits (evita condiciones
// de carrera si el mismo usuario dispara dos acciones al mismo tiempo).
async function chargeCredits(userId, actionType) {
  const amount = ACTION_CREDITS[actionType];
  if (amount == null) throw new Error(`Acción de crédito desconocida: ${actionType}`);
  const { data, error } = await supabase.rpc("adjust_user_credits", { p_user_id: userId, p_delta: -amount });
  if (error) throw new Error(error.message);
  return { ok: data === true, amount };
}
async function refundCredits(userId, amount) {
  // El builder de supabase-js no siempre expone .catch() directo (rompía con
  // "supabase.rpc(...).catch is not a function") — try/catch con await es seguro siempre.
  try {
    const { error } = await supabase.rpc("adjust_user_credits", { p_user_id: userId, p_delta: amount });
    if (error) console.error("No pude reembolsar créditos a", userId, error.message);
  } catch (e) {
    console.error("No pude reembolsar créditos a", userId, e.message || e);
  }
}
async function logUsage(userId, actionType, { creditsCharged, realCostUsd, provider, model, tokensIn, tokensOut, metadata } = {}) {
  await supabase.from("credit_ledger").insert({
    user_id: userId,
    action_type: actionType,
    credits_charged: creditsCharged,
    real_cost_usd: realCostUsd,
    provider,
    model,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    metadata: metadata || null,
  }).then(({ error }) => { if (error) console.error("No pude loguear uso en credit_ledger:", error.message); });
}

// ── Ingesta ─────────────────────────────────────────────────────────────────────────────
// youtube cobra "yt" (10cr, escala más porque puede caer a Groq); tiktok/instagram/facebook
// cobran "social" (1cr, casi siempre resuelve Apify barato); facebook_ad (Ads Library) cobra
// "ads" (3cr, el actor cuesta más real por resultado). Google Reviews y sitio web todavía no
// tienen endpoint de ingesta propio — pendiente, quedan afuera de este mapeo.
function creditActionForPlatform(platform) {
  if (platform === "youtube") return "yt";
  if (platform === "facebook_ad") return "ads";
  return "social";
}

async function processIngestJob(id, url, platform, userId, creditAction, creditsCharged) {
  await supabase.from("cerebro_sources").update({ status: "processing", updated_at: new Date().toISOString() }).eq("id", id);
  let tmpDir;
  try {
    const apifyResult = await fetchViaApify(url, platform);
    let text = apifyResult?.text || null;
    const thumb = apifyResult?.thumb || null;

    // Un anuncio de la Ads Library no es un video — no hay audio que bajarle a yt-dlp, así
    // que si Apify no trajo el copy, no tiene sentido intentar el fallback de video/Groq.
    if (!text && platform === "facebook_ad") throw new Error("No se pudo traer el copy de este anuncio.");
    // Sin GROQ_API_KEY no tiene sentido ni intentar el fallback — así el usuario ve un
    // mensaje claro ("no encontramos transcript") en vez del error crudo de una API que
    // deliberadamente no está configurada.
    let usedGroq = false;
    if (!text && !GROQ_API_KEY) {
      throw new Error("No encontramos un transcript disponible para este video (sin captions ni fallback de audio configurado).");
    }
    if (!text) {
      const { path: audioPath, tmpDir: dir } = await downloadAudio(url);
      tmpDir = dir;
      text = await transcribeWithGroq(audioPath);
      usedGroq = true;
    }

    await supabase.from("cerebro_sources").update({ status: "done", text, thumb, updated_at: new Date().toISOString() }).eq("id", id);
    await logUsage(userId, creditAction, { creditsCharged, provider: usedGroq ? "apify/groq" : "apify", metadata: { source_id: id, platform } });
    await embedAndStoreChunks(id, userId, text).catch((e) => console.error("embedding falló para", id, e.message));
  } catch (e) {
    await supabase.from("cerebro_sources").update({ status: "error", error: e.message || String(e), updated_at: new Date().toISOString() }).eq("id", id);
    // La ingesta falló del todo — no le cobramos el crédito.
    await refundCredits(userId, creditsCharged);
  } finally {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

app.post("/ingest", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "No autenticado." }, 401);

  const body = await c.req.json().catch(() => ({}));
  const { url, project_id } = body;
  if (!url) return c.json({ error: "Falta url" }, 400);

  const platform = detectPlatform(url);
  if (platform === "unknown") return c.json({ error: "Por ahora solo YouTube/TikTok/Instagram/Facebook." }, 400);

  const creditAction = creditActionForPlatform(platform);
  const { ok, amount } = await chargeCredits(user.id, creditAction);
  if (!ok) return c.json({ error: "Sin créditos suficientes.", code: "OUT_OF_CREDITS" }, 402);

  const { data: row, error: insertErr } = await supabase
    .from("cerebro_sources")
    .insert({ user_id: user.id, project_id: project_id || null, kind: "link", platform, source_url: url, status: "pending" })
    .select()
    .single();
  if (insertErr) {
    await refundCredits(user.id, amount);
    return c.json({ error: insertErr.message }, 500);
  }

  // Responde YA con el id (pending) — el trabajo pesado sigue en segundo plano y el
  // frontend se entera del resultado por Supabase Realtime sobre cerebro_sources. Si falla,
  // processIngestJob reembolsa los créditos.
  processIngestJob(row.id, url, platform, user.id, creditAction, amount).catch((e) => console.error("ingest job failed", row.id, e));

  return c.json({ id: row.id, status: "pending" });
});

app.get("/sources/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "No autenticado." }, 401);
  const { data, error } = await supabase
    .from("cerebro_sources")
    .select("*")
    .eq("id", c.req.param("id"))
    .eq("user_id", user.id)
    .single();
  if (error || !data) return c.json({ error: "No encontrado" }, 404);
  return c.json(data);
});

// ── Generación de IA (compositor, chat de configuración, extracción de documentos) ───────
// El frontend YA NO llama a Anthropic directo desde el navegador (la key quedaba expuesta) —
// pasa por acá, que cobra los créditos, elige el modelo según la acción, y loguea el costo
// real para poder auditar contra lo que cobramos en créditos.
app.post("/generate", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "No autenticado." }, 401);

  const body = await c.req.json().catch(() => ({}));
  const { prompt, max = 1400, actionType, image, systemText } = body;
  if (!prompt) return c.json({ error: "Falta prompt" }, 400);
  const model = ACTION_MODELS[actionType];
  if (!model) return c.json({ error: `actionType inválido: ${actionType}` }, 400);

  const { ok, amount } = await chargeCredits(user.id, actionType);
  if (!ok) return c.json({ error: "Sin créditos suficientes.", code: "OUT_OF_CREDITS" }, 402);

  try {
    const { text, usage } = await callClaude(model, prompt, max, { image, systemText });
    await logUsage(user.id, actionType, {
      creditsCharged: amount,
      realCostUsd: computeRealCost(model, usage),
      provider: "anthropic",
      model,
      tokensIn: usage?.input_tokens,
      tokensOut: usage?.output_tokens,
    });
    // `usage` viaja de vuelta al frontend para que src/lib/cost.ts (el medidor de costo
    // real, ya existente) siga mostrando números reales en vez de un placeholder null.
    return c.json({ text, usage });
  } catch (e) {
    await refundCredits(user.id, amount);
    return c.json({ error: e.message || String(e) }, 502);
  }
});

app.get("/credits", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "No autenticado." }, 401);
  const { data, error } = await supabase.from("user_credits").select("*").eq("user_id", user.id).single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// ── Chat con el cerebro (RAG) ───────────────────────────────────────────────────────────
app.post("/chats", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "No autenticado." }, 401);
  const { project_id, title, source_ids } = await c.req.json().catch(() => ({}));

  const { data: chat, error } = await supabase
    .from("chats")
    .insert({ user_id: user.id, project_id: project_id || null, title: title || "Nuevo chat" })
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 500);

  if (Array.isArray(source_ids) && source_ids.length) {
    await supabase.from("chat_sources").insert(source_ids.map((source_id) => ({ chat_id: chat.id, source_id })));
  }
  return c.json(chat);
});

app.post("/chats/:id/messages", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "No autenticado." }, 401);
  const chatId = c.req.param("id");
  const { content } = await c.req.json().catch(() => ({}));
  if (!content?.trim()) return c.json({ error: "Falta el mensaje." }, 400);

  // El service role bypassea RLS, así que confirmamos a mano que el chat es de este usuario.
  const { data: chat } = await supabase.from("chats").select("id, user_id").eq("id", chatId).single();
  if (!chat || chat.user_id !== user.id) return c.json({ error: "Chat no encontrado." }, 404);

  await supabase.from("messages").insert({ chat_id: chatId, role: "user", content });

  const { data: links } = await supabase.from("chat_sources").select("source_id").eq("chat_id", chatId);
  const sourceIds = (links || []).map((l) => l.source_id);

  let contextText = "";
  if (sourceIds.length && OPENAI_API_KEY) {
    try {
      const [queryEmbedding] = await embedTexts([content]);
      const { data: matches, error: matchErr } = await supabase.rpc("match_cerebro_chunks", {
        query_embedding: queryEmbedding,
        p_user_id: user.id,
        source_ids: sourceIds,
        match_count: 6,
      });
      if (matchErr) throw new Error(matchErr.message);
      contextText = (matches || []).map((m) => m.chunk_text).join("\n---\n");
    } catch (e) {
      console.warn("RAG retrieval falló, respondo sin contexto:", e.message);
    }
  }

  const prompt = contextText
    ? `Contexto de las fuentes del usuario:\n${contextText}\n\nPregunta del usuario: ${content}\n\nRespondé en español usando el contexto de arriba cuando sea relevante. Si el contexto no alcanza para responder, decilo con honestidad en vez de inventar.`
    : content;

  const { ok, amount } = await chargeCredits(user.id, "rag");
  if (!ok) return c.json({ error: "Sin créditos suficientes.", code: "OUT_OF_CREDITS" }, 402);

  let reply, usage;
  try {
    const model = ACTION_MODELS.rag;
    ({ text: reply, usage } = await callClaude(model, prompt));
    await logUsage(user.id, "rag", {
      creditsCharged: amount,
      realCostUsd: computeRealCost(model, usage),
      provider: "anthropic",
      model,
      tokensIn: usage?.input_tokens,
      tokensOut: usage?.output_tokens,
    });
  } catch (e) {
    await refundCredits(user.id, amount);
    return c.json({ error: e.message }, 502);
  }

  const { data: savedReply, error: replyErr } = await supabase
    .from("messages")
    .insert({ chat_id: chatId, role: "assistant", content: reply })
    .select()
    .single();
  if (replyErr) return c.json({ error: replyErr.message }, 500);

  return c.json(savedReply);
});

app.get("/chats/:id/messages", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "No autenticado." }, 401);
  const chatId = c.req.param("id");
  const { data: chat } = await supabase.from("chats").select("id, user_id").eq("id", chatId).single();
  if (!chat || chat.user_id !== user.id) return c.json({ error: "Chat no encontrado." }, 404);
  const { data, error } = await supabase.from("messages").select("*").eq("chat_id", chatId).order("created_at");
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Flowi AI ingest backend → http://localhost:${info.port}`);
});
