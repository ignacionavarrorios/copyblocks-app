# Flowi AI — Claude Code Context

## What this is
Ad copy generation tool for Meta Ads, built around the **Luke Eha Copy Blocks methodology** (Pain → Promise → Proof → Curiosity → Constraints → Conditions). Formerly "Copyblocks", then "Adblocks" — now "Flowi AI".

The app lets users build brand profiles, define avatars, and generate structured ad copy (blocks) + video scripts using AI.

## Running the app
```
cd C:\Users\User\claude-roas\Apps\Adblocks
npm run dev
```
Runs on http://localhost:5173

## Stack
- **React 18 + Vite** — SPA, no router
- **Supabase** — auth (email/password) + brand data storage (`brands_data` table, one JSONB row per user)
- **AI** — direct browser calls to Anthropic (`claude-sonnet-4-5`), OpenAI (`gpt-4o`), or Gemini. API keys stored in localStorage only, never in Supabase. Provider controlled via `window.__cbProvider` / `window.__cbApiKey`.

## Env setup
Create `.env` in this folder:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
See `.env.example`. Supabase schema is in `supabase-schema.sql`.

## Architecture
The monolith has been split into typed files. `App.tsx` is the orchestrator (~2530 lines, `// @ts-nocheck` at top during migration).

```
src/
├── types/
│   └── index.ts          ← Brand, Asset, Avatar, Concepto, BlockType, etc.
├── lib/
│   ├── constants.ts      ← T (design tokens), TIPOS, ANGULOS, ESTILOS, BLOCK_FORMATS,
│   │                        HOOK_FRAMEWORKS, SUBCOMPONENTS, DEMO_BRAND, etc.
│   ├── prompts.ts        ← COPY_BRAIN system prompt + perfilCtx()
│   ├── ai.ts             ← callClaude() — routes to Anthropic/OpenAI/Gemini
│   ├── storage.ts        ← storage.get() / storage.set() (Supabase + localStorage)
│   └── utils.ts          ← cn(), uid()
├── components/
│   ├── ui/               ← Btn (button.tsx), Card, Inp (input.tsx), Modal,
│   │                        Toast, BlockBadge/FuncTag (badge.tsx)
│   ├── BlockCard.tsx
│   └── AssetForm.tsx
├── App.tsx               ← Main component + all state (imports from above)
├── main.tsx              ← Entry point, imports index.css
├── index.css             ← Tailwind v4 + brand CSS vars
└── supabase.ts           ← Supabase client
```

**Tailwind v4** — brand colors available as `text-purple`, `bg-navy`, `border-gray-light`, etc. (defined in `@theme` block in index.css). No tailwind.config file needed.

**shadcn/ui** — add components with `npx shadcn@latest add [component]` from the Flowi AI folder. CSS variables are set up in index.css.

## Data model (stored as JSONB in `brands_data.data`)
```json
{
  "brands": [
    {
      "id": "...",
      "name": "Brand name",
      "industry": "...",
      "perfil": { "produto", "oferta", "diferenciador", "voz", "mecanismo_nombrado", "ubicacion", "extra" },
      "avatars": [{ "id", "name", "desc", "pains", "objection", "language" }],
      "competitors": [{ "id", "name", "url", "notes" }],
      "assets": [{ "id", "tipo", "funcs", "tags", "text" }],
      "conceptos": [{ "id", "concepto", "angulo", "estilo", "hook", "personaId", "personaDesc" }],
      "copies": [],
      "offers": [],
      "customAngles": [],
      "customStyles": []
    }
  ]
}
```

## Key constants
- `TIPOS` — the 7 block types (pain, promise, proof, curiosity, constraints, conditions, offer)
- `BLOCK_FORMATS` — hook/pain/promise/proof/etc. format templates per block type
- `HOOK_FRAMEWORKS` — 30+ hook frameworks with category, desc, when, example, starter
- `ANGULOS` — 13 ad angles (contrarian, story, how-to, etc.)
- `ESTILOS` — 10 video production styles (ugc, talking-head, etc.)
- `SUBCOMPONENTS` — facebook_ad and video_script subcomponent definitions

## GitHub
Remote: https://github.com/ignacionavarrorios/copyblocks-app.git (repo name not yet renamed to match Flowi AI)
Branch: main

## Local CLI mode (downloadable build for students)

Students run the app **without an API key**, using their own CLI subscription (Claude Code /
Codex / Gemini). Two pieces make this work:

- **`server.mjs`** — local bridge (port 8787). `POST /generate` pipes the prompt to the
  student's CLI headless (`claude -p`, `codex exec`, `gemini -p`) and returns the text.
  `GET/POST /data` read/write `data/store.json`.
- **`npm run start`** (`start.mjs`) launches the bridge + Vite together.
- In the app, `callClaude` (`src/lib/ai.ts`) routes to the bridge when `window.__cbProvider==="cli"`.
  The CLI is chosen in `SetupScreen` (`window.__cbCli` = auto|claude|codex|gemini).

### Acting as the agent for a student
The student can ask you (in the terminal) to fill the app's data instead of typing it. You
write directly to **`data/store.json`**, and the UI picks it up on reload. Examples: "fill my
brand profile from this doc", "turn these copies into blocks", "pull copies from a connected
MCP and build blocks". When editing `store.json`:
- Respect the schema in **`data/SCHEMA.md`**. Never drop existing data. Use unique short `id`s.
- Copy rules: Spanish, **second person (tú/vos)**, never invent mechanism names (only use
  `perfil.mecanismo_nombrado` if set), specific over generic, `[brackets]` for missing real data.

## Things to know
- `package.json`'s `name` field is `flowi-ai` (renamed 2026-07-07, was `copyblocks-app`)
- Prompt caching enabled for Anthropic calls when `COPY_BRAIN` is the system prompt
- `STORAGE_KEY = "copyblocks_beta_v2"` is the localStorage fallback key — **left unchanged on purpose** during the Flowi AI rebrand: changing it would silently orphan any brand data already saved in a user's browser (they'd open the app and see nothing). Only change this with an explicit migration step, not as a drive-by rename.
- The demo brand `DEMO_BRAND` is a Bolivian restaurant (used for onboarding examples)
- `App.tsx` has `// @ts-nocheck` at line 1 — remove it as components get properly typed
- **Old backup files still exist: `App.jsx`, `main.jsx`, `supabase.js` — DO NOT EDIT THESE.** They are dead code (`index.html` loads `main.tsx` → `App.tsx`, confirmed by inspecting the actual build output). A prior session lost real work by editing `App.jsx` for hours without realizing it had zero effect on the running app. Safe to delete once stable — ask before deleting since the tree isn't committed to git yet.
- Inline styles in App.tsx are intentional — dynamic color values (from T tokens) don't map cleanly to static Tailwind classes
