# PROJECT_MEMORY.md — Levo Dashboard

_Dernière mise à jour : 2026-06-28._

## État actuel : démo visuelle (100% statique)

Le dashboard est désormais **purement visuel** : aucun backend, aucune API,
aucune variable d'environnement. Toutes les données sont mockées dans
`lib/mock.ts`. Déployable sur Vercel sans aucune configuration.

> Note : une première itération avec backend (Supabase, Claude, auth, MCP) avait
> été poussée puis **retirée** sur demande (pivot « que du visuel »). Elle reste
> récupérable dans l'historique git si besoin plus tard.

## Pages livrées

- `/login` — connexion visuelle (ouvre le dashboard, sans auth réelle).
- `/dashboard` — Overview : greeting, 4 cards agents (avatar 72px, statut, bulle de speech, stat, CTA), 4 KPIs, activité récente, à valider (LUNA), leads chauds (ORION).
- `/dashboard/luna` — kanban contenu 5 colonnes (Idée → Publié).
- `/dashboard/orion` — pipeline leads 5 colonnes avec score.
- `/dashboard/hermes` — rapport semaine : 4 KPIs, ce qui a marché / pas marché, top 3 actions.
- `/dashboard/clients` — table clients (dont Harmonie Yacht).
- `/dashboard/settings` — préférences (visuel).

## Design

- Bankio-like : fond `#ECEEF8`, cards blanches radius 16px, soft shadows.
- Accent `#1A3BFF`, sidebar `#0D1117`, accents agents (bleu/vert/ambre/violet).
- Cormorant Garamond (titres + grands chiffres), Inter (corps).
- Responsive : sidebar → bottom nav mobile, grilles → 1 colonne, cards agents → scroll horizontal.
- Micro-interactions hover/active sur cards et boutons.

## Vérifications

| Vérif | Statut |
| --- | --- |
| Build Next.js (zéro env) | ✅ 11 routes, toutes statiques |
| Typecheck | ✅ |
| Zéro API / zéro env | ✅ |
| Données mockées centralisées | ✅ `lib/mock.ts` |
| Responsive mobile | ✅ |
| Déploiement Vercel sans config | ✅ |

## Pour faire évoluer

- Tout le contenu se change dans `lib/mock.ts`.
- Avatars : `public/avatars/*.png` via `node scripts/gen-avatars.mjs` (orbes dégradés placeholder, à remplacer par les visuels finaux).
- Rebrancher un backend ultérieurement : repartir de l'historique git de la version Supabase/Claude.
