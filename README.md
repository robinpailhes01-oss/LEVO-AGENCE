# Levo — Dashboard (démo visuelle)

Dashboard de pilotage des agents IA de **Levo**, agence IA à Montpellier.
**100% visuel** : aucune donnée réelle, aucun backend, aucune clé API, aucune variable d'environnement.

Next.js 14 · TypeScript · Tailwind · shadcn-style UI.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:3000
```

## Déployer sur Vercel

Importer le repo dans Vercel et déployer. **Zéro configuration** — pas de variables d'environnement à renseigner.

## Pages

| Route | Contenu |
| --- | --- |
| `/login` | Connexion (visuelle — ouvre le dashboard) |
| `/dashboard` | Overview : 4 agents, KPIs, activité, à valider, leads chauds |
| `/dashboard/luna` | Kanban contenu (Idée → Publié) |
| `/dashboard/orion` | Pipeline leads avec scoring |
| `/dashboard/hermes` | Rapport analytics de la semaine |
| `/dashboard/clients` | Liste clients |
| `/dashboard/settings` | Préférences |

## Données

Toutes les données sont mockées dans **`lib/mock.ts`**. Modifier ce fichier
suffit à changer ce qui s'affiche partout.

## Style

- Fond `#ECEEF8` · cards `#FFFFFF` (radius 16px, soft shadow) · accent `#1A3BFF` · sidebar `#0D1117`
- Titres **Cormorant Garamond**, corps **Inter**
- Avatars agents : `public/avatars/*.png` (régénérables via `node scripts/gen-avatars.mjs`)

## Build

```bash
npm run build      # statique, sans erreur
npm run typecheck
```
