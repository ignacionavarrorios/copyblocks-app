# Deploy — cómo pasar cambios a producción

Este proyecto tiene **dos servicios** que se despliegan por separado, desde el **mismo repo**:

| Servicio | Dónde vive el código | Hosting | Se despliega cuando... |
|---|---|---|---|
| Frontend (React + Vite) | raíz del repo (`src/`) | Vercel | se hace `git push` a `main` en el repo de GitHub correcto (ver abajo) |
| Backend (ingesta + créditos) | `backend/` | Railway | confirmar en el dashboard de Railway si es automático desde GitHub o manual — ver sección Railway |

## ⚠️ El repo correcto — hay dos remotos configurados, uno de los dos NO hace nada

```
git remote -v
# origin    https://github.com/ignacionavarrorios/copyblocks-app.git   ← ESTE es el real
# flowi-ai  https://github.com/ignacionavarrorios/flowi-ai.git         ← no está conectado a Vercel
```

El proyecto de Vercel (`copyblocks-app`, team `roas-academy-adblocks`) está conectado a
**`github.com/ignacionavarrorios/copyblocks-app`, rama `main`** — confirmado consultando la API de
Vercel directamente (`list_projects` / `list_deployments`), no adivinado. Pushear a `flowi-ai` no
mueve nada en producción, aunque el nombre sea el correcto — es un remoto que quedó de alguna
migración pero que Vercel no mira.

**Siempre pushear a `origin`:**
```
git push origin main
```

Si en algún momento se quiere limpiar esta confusión, lo prolijo sería borrar el remoto `flowi-ai`
o renombrar `origin` a algo más claro — pero ninguna de las dos cosas es necesaria para que el
deploy funcione, así que no se tocó.

## Flujo para pasar cambios a producción (frontend)

1. Hacer los cambios.
2. Verificar **antes** de pushear (todo esto corre en segundos, sin costo):
   ```
   npx tsc --noEmit --ignoreDeprecations 6.0   # typecheck — ignorar errores pre-existentes en
                                                 # constants.ts/context.ts, no son nuevos
   npm run build                                # build real de producción — si esto falla, Vercel
                                                 # también va a fallar
   ```
3. `git add` + `git commit` (mensaje claro, en inglés como el resto del historial).
4. Pushear a producción es una acción visible para cualquiera que use la app en vivo — antes de
   `git push origin main`, avisar qué se va a subir (aunque sea un resumen corto) y esperar
   confirmación, sobre todo si el working tree tiene commits o archivos de otra sesión de Claude
   mezclados con los propios (ver nota abajo) — ahí el resumen tiene que dejar claro qué es de
   quién.
5. Una vez confirmado, `git push origin main`. Vercel arranca el build solo (webhook de GitHub) —
   normalmente listo en ~1-2 min. Confirmar en
   https://vercel.com/roas-academy-adblocks/copyblocks-app o con la API (ver abajo).

## Nota importante: varias sesiones de Claude trabajando en paralelo

Carlos suele tener **más de una sesión de Claude Code trabajando en este mismo repo al mismo
tiempo** (distintas ventanas/chats, cada uno tocando distintas partes de la app). Esto significa
que el working tree puede tener cambios de OTRA sesión mezclados con los propios cuando toca
pushear. Antes de pushear:

1. `git status` — ver qué hay sin commitear, y separar (si se puede) en commits distintos según de
   dónde vino cada cambio, para mantener el historial legible y que el resumen que se le da a
   Carlos sea preciso sobre qué es de esta sesión y qué no.
2. Si hay archivos nuevos o cambios que uno no reconoce, no asumir que están rotos — probablemente
   son de la otra sesión. Correr `npm run build` cubre a todos por igual (si compila, compila).
3. `git log --oneline origin/main..HEAD` para ver si ya hay commits locales sin pushear de la otra
   sesión, antes de agregar los propios — el push los va a llevar a todos juntos, no hay forma
   de pushear solo "los míos" sin reescribir historial (evitar esto último).

## Variables de entorno

### Frontend (Vercel → Project Settings → Environment Variables)
- `VITE_BACKEND_URL` — URL pública del backend en Railway (sin esto, `src/lib/ai.ts` apunta a
  `localhost:8080` y todo lo que pasa por `/generate` falla en producción).

### Backend (Railway → Variables) — ver `backend/.env.example` para la lista completa y comentada
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — nunca la anon key, este backend bypassea RLS a
  propósito porque ya verificó la identidad del usuario.
- `ANTHROPIC_API_KEY` — Claude Sonnet (`copy`, `rag` — el output final que el usuario lee).
- `GEMINI_API_KEY` — Gemini Flash-Lite (`setup`, `doc`, `suggest` — trámite y sugerencias, mucho
  más barato). Agregada 2026-07 — confirmar que sigue seteada si alguna de estas acciones empieza
  a devolver error "GEMINI_API_KEY no configurada".
- `GROQ_API_KEY` — fallback de transcripción (Whisper) cuando Apify no está configurado o falla.
- `OPENAI_API_KEY` — solo embeddings (RAG del Cerebro), no genera copy.
- `APIFY_API_TOKEN` (+ los `APIFY_*_ACTOR_ID`, opcionales) — scraping/transcripción de
  YouTube/TikTok/Instagram/Facebook.
- `FRONTEND_ORIGINS` — dominios permitidos por CORS (el de producción de Vercel + localhost).

## Railway (backend) — confirmar el modo de deploy

No hay un `railway.json` en el repo, así que la configuración de "¿deploya solo al pushear a
`main`, o hay que dispararlo a mano?" vive en el dashboard de Railway, no en el código. **Revisar
esto una vez en Railway → Settings → el service del backend → Source**, y anotar acá cuál de los
dos es:

- Si está en modo automático (GitHub trigger activado): el mismo `git push origin main` que
  dispara Vercel también redeploya el backend — un solo push, dos servicios actualizados.
- Si es manual: después de pushear el frontend, hay que ir a Railway y hacer "Deploy" a mano (o
  `railway up` si hay CLI instalada) para que el backend tome los cambios de `backend/src/index.js`.

## Verificar el estado del deploy sin abrir el dashboard

Si hay acceso al MCP de Vercel (`list_projects` / `list_deployments` con
`teamId: team_pwtj05RxKA3Yv3F8RIMQEXiJ`, `projectId: prj_f0b8ZKb6VEtBZbJc4SKTDuWKcWCf`), se puede
confirmar el estado (`READY`/`BUILDING`/`ERROR`) y el commit exacto de cada deployment sin salir
de la sesión de Claude — así fue como se confirmó el remoto correcto la primera vez.

## Si algo se rompe en producción

Vercel guarda cada deployment anterior — desde el dashboard (o la API, `isRollbackCandidate:
true` en la respuesta de `list_deployments`) se puede promover un deployment viejo a producción
al instante, sin revertir código ni hacer un nuevo push. Para el backend en Railway, revisar si
tiene el mismo tipo de rollback instantáneo desde su dashboard.
