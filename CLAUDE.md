# CLAUDE.md — Levo Dashboard

Guide pour toute session Claude Code travaillant sur ce repo.

## Projet

Dashboard unique de pilotage des 4 agents IA de **Levo**, agence IA à Montpellier.
Ce n'est PAS un site vitrine — uniquement le cockpit agents.

Agents : **LUNA** (contenu/carrousels), **ORION** (prospection/leads),
**HERMES** (analytics/rapports), **VEILLE** (veille concurrentielle).

## Stack

- Next.js 14 (App Router) · TypeScript strict · Tailwind · shadcn-style UI
- Supabase (Postgres + RLS) via service-role key, server-side uniquement
- Anthropic Claude (raisonnement agents) — toujours server-side
- Déploiement Vercel (+ cron HERMES)

## Règles non négociables

1. **TypeScript strict, jamais `any`.** `noUncheckedIndexedAccess` activé.
2. **Aucun secret en dur.** Tout passe par `lib/env.ts` (`process.env`).
3. **Toute la donnée vit dans Supabase.** Jamais de `localStorage`.
4. **Appels Claude uniquement côté serveur** (`lib/claude.ts`).
5. **Gestion d'erreur sur tout appel externe** (`withHandler`, `safe`).
6. **Mobile responsive** — bottom nav `<MobileNav>` sur mobile.
7. **Pas de TODO livré.** Commit propre après chaque phase.

## Carte du code

| Zone | Emplacement |
| --- | --- |
| Env typé | `lib/env.ts` |
| Auth (cookie HMAC Edge) | `lib/auth.ts`, `middleware.ts`, `app/api/auth` |
| Supabase | `lib/supabase/{server,client}.ts` |
| Données (lecture RSC) | `lib/queries.ts` |
| Claude | `lib/claude.ts`, prompts dans `prompts/` |
| Logs d'activité | `lib/log.ts` → table `agent_logs` |
| MCP (Bearer) | `lib/mcp.ts`, `app/api/mcp/*` |
| Agents (actions UI) | `app/api/{luna,orion,hermes}/*` |
| Overview (priorité visuelle) | `app/dashboard/page.tsx`, `components/overview/*` |
| Schéma SQL | `docs/schema.sql` (+ `docs/seed.sql`) |

## Palette / typo

Fond `#ECEEF8` · cards `#FFFFFF` · accent `#1A3BFF` · texte `#1A1A1A` · sidebar `#0D1117`.
Agents : LUNA `#1A3BFF`, ORION `#1D9E75`, HERMES `#BA7517`, VEILLE `#7B2FBE`.
Titres = Cormorant Garamond, corps = Inter.

## Commandes

```bash
npm run dev         # dev local
npm run build       # build prod (doit rester vert)
npm run typecheck   # tsc --noEmit
node scripts/gen-avatars.mjs   # régénère les avatars
```

## Vérifs avant commit

- `npm run typecheck` et `npm run build` passent.
- Aucun secret committé. Pas de `any`. Pas de TODO.
