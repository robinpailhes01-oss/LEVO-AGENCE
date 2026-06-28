# PROJECT_MEMORY.md — Levo Dashboard

État vivant du projet. Mis à jour à la fin de chaque session.

_Dernière mise à jour : 2026-06-28._

## Ce qui est construit

### Fondations
- Next.js 14 App Router, TypeScript strict (`noUncheckedIndexedAccess`), Tailwind (palette Levo), primitives UI type shadcn (`button`, `card`, `badge`, `input`).
- Accès env typé et centralisé (`lib/env.ts`) — aucun secret en dur.
- Clients Supabase server (service role) + browser (anon).
- Wrapper Claude server-side (`lib/claude.ts`, `callClaude` / `callClaudeJson`).
- Journalisation d'activité (`lib/log.ts` → `agent_logs`).
- Helpers API (`withHandler`, `jsonOk`, `jsonError`) + data-access résilient (`lib/queries.ts`).

### Phase 1 — Supabase
- `docs/schema.sql` : 10 tables (clients, leads, content_calendar, content_slides, content_performance, agent_logs, proposals, weekly_reports, settings, watched_accounts), RLS activée + forcée, triggers `updated_at`, seed `settings`.
- `docs/seed.sql` : données de démo optionnelles.
- ⚠️ À exécuter manuellement dans le SQL editor du projet `yzaypsoonsldhmujuqjw` (non accessible via MCP depuis cette session).

### Phase 2 — Auth + Layout
- Auth par cookie HMAC signé, Edge-compatible (`lib/auth.ts`), `middleware.ts` protège `/dashboard/*`.
- `/login` + `/api/auth` (POST login / DELETE logout).
- Sidebar (desktop), Header (titre + logout), MobileNav (bottom nav mobile).

### Phase 3 — Overview (priorité visuelle)
- Row 1 : 4 AgentCards (avatar PNG, bulle dernière action, status, stat, CTA « Parler à »), border-top par couleur d'agent.
- Row 2 : 4 KPIs (MRR, leads actifs, posts publiés, engagement).
- Row 3 : activité récente + posts à valider (LUNA) + leads chauds (ORION).

### Phase 4 — MCP custom
- 4 routes Bearer `LEVO_MCP_SECRET` : `/api/mcp/{content,leads,analytics,clients}`.
- `GET` = découverte des outils, `POST {tool,input}` = exécution. Service role.

### Phase 5 — Agents
- **LUNA** : kanban Idée→Approuvé→Rédigé→Validé→Publié, génération d'idées, rédaction carrousel complet (slides + caption + hashtags + prompts ChatGPT Image 2), régénération ciblée par slide avec feedback.
- **ORION** : pipeline scoring 0-100, ajout lead, enrichissement IA + scoring, séquences outreach A/B, webhook réponses Instantly.ai.
- **HERMES** : agrégation hebdo, rapport Claude en Markdown, envoi Resend, historique. Cron Vercel lundi 07:00 UTC (`vercel.json`).
- Clients (liste + MRR), Settings (présence env + réglages agents).

## État de vérification

| Vérif | Statut |
| --- | --- |
| Build Next.js | ✅ vert (26 routes) |
| Typecheck strict | ✅ |
| 10 tables Supabase | ⏳ SQL livré, à exécuter manuellement |
| Auth | ✅ code complet (nécessite `DASHBOARD_PASSWORD`/`AUTH_SECRET`) |
| Overview 4 avatars | ✅ |
| LUNA génération idées | ✅ (nécessite `ANTHROPIC_API_KEY`) |
| ORION enrich lead | ✅ |
| HERMES rapport | ✅ |
| Mobile responsive | ✅ bottom nav |
| schema.sql dans /docs | ✅ |
| PROJECT_MEMORY.md | ✅ |

## À faire / repris par les vrais docs

- Réconcilier schémas & outils MCP si les specs originales (MASTER_PLAN 1A/1B, LUNA_SYSTEM_PROMPT, CAROUSEL_DESIGN) sont fournies — schémas actuellement déduits du brief.
- Brancher la génération d'images (ChatGPT Image 2 / OpenAI) sur les `image_prompt` des slides (prompts déjà produits, `OPENAI_API_KEY` câblé en env).
- Page/contenu VEILLE dédiée (actuellement comptes surveillés en table, agrégés dans l'Overview).
- Remplacer les avatars placeholder (orbes dégradés) par les visuels finaux des agents.

## Setup déploiement

1. Exécuter `docs/schema.sql` (puis `docs/seed.sql` en option) dans Supabase.
2. Renseigner toutes les variables dans Vercel (cf. `.env.example`).
3. `AUTH_SECRET` et `LEVO_MCP_SECRET` : chaînes aléatoires (générées hors repo).
4. Déployer. Le cron HERMES se déclenche chaque lundi.
