# CLAUDE.md — Levo Dashboard (démo visuelle)

Guide pour toute session Claude Code travaillant sur ce repo.

## Projet

Dashboard de pilotage des 4 agents IA de **Levo**, agence IA à Montpellier :
**LUNA** (contenu), **ORION** (leads), **HERMES** (analytics), **VEILLE** (veille).

⚠️ **Version 100% visuelle pour l'instant.** Aucun backend, aucune API, aucune
variable d'environnement. Toutes les données sont mockées dans `lib/mock.ts`.
Objectif : `git push` → déploiement Vercel sans aucune config.

> **Vision complète (produit final) et bible de marque** dans `docs/reference/` :
> `LEVO_VISION.md` (config produit), `AGENT_DEFINITIONS.md`, `BUILD_METHODS.md`
> (méthodes Penser→Planifier→Construire→Vérifier→Tester→Livrer + Confusion
> Protocol : ne jamais deviner une décision d'archi/design, demander),
> `CAROUSEL_DESIGN.md` et `LUNA_SYSTEM_PROMPT.md` (charte contenu LUNA).
> À lire avant toute évolution de fond.

## Marque Levo (référence)

Site de référence : levo-plum.vercel.app · ton premium, calme, confiant.
Inspirations validées : **limova.ai** (pill, whitespace, dégradés subtils) et la
densité data-viz d'eGrow (Dribbble).

**Palette dashboard (validée) :** Fond **crème `#F0EDE6`** · cards `#FFFFFF` ·
sidebar navy `#0D1117` · accent bleu `#1A3BFF`. Agents : LUNA `#1A3BFF`,
ORION `#1D9E75`, HERMES `#BA7517`, VEILLE `#7B2FBE`.

**Typographie (validée, style Apple) :** `Inter Tight` (titres + grands chiffres,
proche de SF Pro) + `Inter` (corps). ⚠️ Le serif Cormorant a été **abandonné**
sur demande de Robin — ne pas le réintroduire sans validation.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · UI type shadcn.

## Règles

1. **Zéro appel API, zéro `process.env`.** Tout est statique.
2. **Toutes les données vivent dans `lib/mock.ts`.**
3. **TypeScript propre.** `noUncheckedIndexedAccess` activé.
4. **Mobile responsive** : sidebar → bottom nav, grilles → 1 colonne, cards agents → scroll horizontal.
5. **Animations douces** sur les interactions (hover, active).
6. **Build vert** (`npm run build` 100% statique).

## Carte du code

| Zone | Emplacement |
| --- | --- |
| Données mockées | `lib/mock.ts` |
| Navigation | `lib/nav.ts` |
| Helpers (cn…) | `lib/utils.ts` |
| Layout (sidebar, header, bottom nav) | `components/layout/*` |
| Overview | `app/dashboard/page.tsx`, `components/overview/*` |
| LUNA / ORION | `components/luna/*`, `components/orion/*` |
| Pages | `app/dashboard/*` |
| UI primitives | `components/ui/*` |
| Avatars | `public/avatars/*.png` (`scripts/gen-avatars.mjs`) |

## Palette / typo

Fond crème `#F0EDE6` · cards `#FFFFFF` (radius ~20px) · accent `#1A3BFF` · texte `#1A1A1A` · sidebar `#0D1117`.
Agents : LUNA `#1A3BFF`, ORION `#1D9E75`, HERMES `#BA7517`, VEILLE `#7B2FBE`.
Titres + grands chiffres = **Inter Tight** (style Apple/SF Pro), corps = Inter.
Cartes/boutons : ombres ultra-douces, boutons pill, anneaux d'avatar fins (pas de halo), bulles gris neutre.

## Commandes

```bash
npm run dev
npm run build
npm run typecheck
node scripts/gen-avatars.mjs
```
