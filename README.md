# Levo — Dashboard agents

Cockpit de pilotage des agents IA de **Levo**, agence IA à Montpellier.
Next.js 14 · TypeScript strict · Supabase · Tailwind · Claude.

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs
npm run dev
```

## Configuration

1. **Supabase** — exécuter `docs/schema.sql` (puis `docs/seed.sql` en option)
   dans le SQL editor du projet.
2. **Variables d'environnement** (voir `.env.example`) — à définir dans Vercel :
   - `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
   - `DASHBOARD_PASSWORD`, `AUTH_SECRET`, `LEVO_MCP_SECRET`
   - `RESEND_API_KEY`, `EMAIL_TO` (rapports HERMES — optionnels)
3. **Déploiement Vercel** — le cron HERMES (`vercel.json`) tourne chaque lundi 07:00 UTC.

## Architecture

- `app/dashboard/*` — pages (Overview, LUNA, ORION, HERMES, Clients, Settings)
- `app/api/{luna,orion,hermes}/*` — actions agents (Claude server-side)
- `app/api/mcp/*` — outils MCP sécurisés (Bearer `LEVO_MCP_SECRET`)
- `lib/*` — env, auth, Supabase, Claude, requêtes
- `prompts/*` — system prompts des agents
- `docs/schema.sql` — schéma Postgres + RLS

Voir `CLAUDE.md` (conventions) et `PROJECT_MEMORY.md` (état du projet).
