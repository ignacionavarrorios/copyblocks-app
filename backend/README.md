# Flowi AI — backend de ingesta

Servicio Node separado del `server.mjs` (bridge local). Corre en un servidor propio (no en
la compu del alumno), para que scrapear/transcribir YouTube/TikTok/Instagram/Facebook
funcione siempre, sin depender del antivirus o la RAM de cada máquina.

## Desarrollo local

```
cd backend
cp .env.example .env   # completar SUPABASE_SERVICE_ROLE_KEY y GROQ_API_KEY
npm install
npm run dev
```

## Deploy (Railway o Fly.io)

Cualquiera de los dos sirve — es un servicio Node simple, sin base de datos propia (usa
Supabase). Pasos generales:

1. Crear un nuevo proyecto/app apuntando a este folder (`backend/`) como raíz.
2. Cargar las variables de entorno de `.env.example` en el panel del hosting — **nunca**
   commitear el `.env` real.
3. Asegurarse de que el buildpack instale `ffmpeg` si `ffmpeg-static` no trae un binario
   compatible con la arquitectura del servidor (raro, pero puede pasar en algunos
   contenedores ARM) — revisar logs del primer deploy.
4. Una vez desplegado, actualizar el frontend (`src/lib/bridge.ts` o el nuevo cliente que
   lo reemplace) para apuntar a la URL pública de este servicio en vez de
   `http://localhost:8787`.

## Endpoints

- `GET /health` — chequeo de vida, sin auth.
- `POST /ingest` — body `{url, project_id}`, header `Authorization: Bearer <supabase access_token>`.
  Crea una fila en `cerebro_sources` (status `pending`), procesa en segundo plano — intenta
  **Apify primero** (barato, sin pelear anti-bot), si falla o no está configurado cae a
  **yt-dlp + Groq Whisper**. Responde de inmediato con `{id, status}`. Una vez que termina,
  arma embeddings automáticamente para que la fuente quede disponible en el chat (RAG). El
  resultado se ve suscribiéndose a `cerebro_sources` por Supabase Realtime, o con `GET /sources/:id`.
- `GET /sources/:id` — mismo auth, devuelve la fila completa (para pollear si todavía no
  está armado el listener de Realtime en el frontend).
- `POST /chats` — body `{project_id, title, source_ids: [...]}`. Crea un chat linkeado a
  las fuentes elegidas (tabla `chat_sources`).
- `POST /chats/:id/messages` — body `{content}`. Cobra 10 créditos (acción `rag`), guarda el
  mensaje del usuario, busca los chunks más relevantes de las fuentes linkeadas
  (`match_cerebro_chunks`), le pasa ese contexto a Claude Sonnet, guarda y devuelve la
  respuesta. Si Claude falla, reembolsa los créditos.
- `GET /chats/:id/messages` — historial completo de un chat.
- `POST /generate` — body `{prompt, max, actionType, image?, systemText?}`, header
  `Authorization: Bearer <supabase access_token>`. Reemplaza las llamadas directas a
  Anthropic que hacía el frontend (`src/lib/ai.ts`) — la key de Anthropic ya no toca el
  navegador. `actionType` (`copy`|`setup`|`doc`) decide el modelo (Sonnet para `copy`, Haiku
  para `setup`/`doc`) y cuántos créditos se cobran. Si `systemText` viene, se manda con
  `cache_control: ephemeral` (prompt caching — el contexto de Marca/Persona/Receta/Oferta no
  se vuelve a pagar completo en cada mensaje de la misma sesión). Devuelve `402
  {code: "OUT_OF_CREDITS"}` si no alcanza el balance.
- `GET /credits` — devuelve la fila de `user_credits` del usuario (plan, balance, créditos
  incluidos, ciclo) para que el frontend pinte el `CreditsPanel` con datos reales.

## Sistema de créditos

Ver la ficha técnica acordada — créditos por acción, valor de 1 crédito ($0.002 real), y los
4 planes (free/starter/pro/agency), viven en `ACTION_CREDITS`/`ACTION_MODELS`/`MODEL_PRICING`
en `src/index.js`. Balance real en la tabla `user_credits` (Supabase), con RLS de solo
lectura — todas las escrituras pasan por la función `adjust_user_credits` (atómica, ejecutada
únicamente por este backend vía service role). Cada llamada de IA queda auditada en
`credit_ledger` con el costo real en dólares (calculado del `usage` que devuelve el proveedor),
para poder comparar contra lo que se cobró en créditos y recalibrar si hace falta.

**Dos proveedores, según qué tan importante es la calidad para esa acción** (`providerForModel()`
en `src/index.js` decide cuál llamar):
- **Claude Sonnet** — `copy` (compositor) y `rag` (chat con el Cerebro): el output final que el
  usuario lee y siente, ahí vale la pena pagar más por calidad.
- **Gemini Flash-Lite** — `setup`, `doc`, `suggest`: trámite y sugerencias de bajo riesgo. 10x
  más barato que Haiku y con contexto de 1M tokens — un documento/libro largo entra completo en
  una sola llamada sin trocear, así que `doc` puede distillar documentos grandes por centavos.

## Lo que falta para producción

- **Elegir los actores de Apify por plataforma** — `.env.example` tiene los 4 IDs vacíos
  (`APIFY_*_ACTOR_ID`). Actores recomendados ya elegidos (ver plan): YouTube
  `codepoetry/youtube-transcript-ai-scraper`, TikTok `apidojo/tiktok-scraper`, Instagram
  `apify/instagram-scraper`, Facebook Ads `apify/facebook-ads-scraper`. Una vez cargados,
  probar contra un link real: `extractTranscriptField()` en `src/index.js` prueba varios
  nombres de campo comunes porque no confirmamos todavía el schema exacto de salida.
- Ads Library: pendiente del access token de Meta.
- **Ingesta de Google Reviews y sitio web** todavía no tienen endpoint propio —
  `creditActionForPlatform()`/`detectPlatform()` solo cubren YouTube/TikTok/Instagram/Facebook
  por ahora. Google Reviews va a necesitar su propio actor de Apify
  (`compass/google-maps-reviews-scraper`, tope de 50 reviews) y acción de crédito `reviews`
  (ya definida en `ACTION_CREDITS`, falta el endpoint).
- Rate limiting de ráfaga (hoy el único límite es el balance de créditos, sin tope de
  "máximo N acciones por minuto").
- El frontend (`src/lib/ai.ts`) todavía no llama a `/generate` — sigue pegándole a Anthropic
  directo desde el navegador con `window.__cbApiKey`. Ese es el siguiente paso.
