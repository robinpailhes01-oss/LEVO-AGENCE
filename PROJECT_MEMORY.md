# PROJECT_MEMORY.md — Mémoire de Levo

*Claude Code lit ce fichier au début de chaque session et le met à jour à la fin.*

---

## État du projet
- Phase actuelle : **Démo visuelle du dashboard** (Phase 2 « skeleton » du MASTER_PLAN, en version 100% mockée).
- Dernière session (2026-06-28) : dashboard visuel complet, rebrandé crème `#F0EDE6` (marque Levo + inspiration limova.ai), bible de marque importée dans `docs/reference/`.
- Prochaine action probable : intégrer les avatars réels, puis (si validé) brancher le backend du MASTER_PLAN (Supabase + MCP + agents).

---

## Décisions d'architecture prises
- **Version actuelle = 100% visuelle, zéro backend / zéro env** (choix de Robin « git push → voir le dashboard »). Données mockées dans `lib/mock.ts`.
- Fond du dashboard : **crème `#F0EDE6`** (arbitré avec Robin, aligné marque, vs `#ECEEF8` Bankio initial).
- Boutons pill + cercles dégradés subtils (inspiration limova.ai).
- Couleurs agents conservées : LUNA bleu / ORION vert / HERMES ambre / VEILLE violet.
- Une 1re itération avec backend (Supabase/Claude/auth/MCP, conforme au MASTER_PLAN) avait été construite puis retirée sur demande — **récupérable dans l'historique git** pour la suite.
- Réfs produit complètes dans `docs/reference/` : MASTER_PLAN, AGENT_DEFINITIONS, BUILD_METHODS, CAROUSEL_DESIGN, LUNA_SYSTEM_PROMPT, LEVO_VISION.

---

## Patterns établis
- Toutes les données mockées vivent dans `lib/mock.ts` (un seul point de vérité visuel).
- Design tokens dans `tailwind.config.ts` (palette marque, ombres en couches, easing) + utilitaires dans `app/globals.css` (`.levo-card`, `.frost`, `.agent-cta`, `.stagger`).
- Pages = Server Components statiques ; interactions = CSS/hover (pas de fetch).
- Composants : `components/layout/*` (Sidebar, Header, MobileNav, PageHeader, Logo), `components/overview|luna|orion|hermes/*`, `components/ui/*`.
- TypeScript strict, jamais de `any`. Build 100% statique, vert sans aucune variable d'env.

---

## Pièges rencontrés
- TS 5.7 a durci les génériques `Uint8Array`/`BufferSource` (rencontré sur l'ancien `lib/auth.ts`).
- Le projet Supabase cible `yzaypsoonsldhmujuqjw` n'est pas accessible via MCP depuis ces sessions → SQL livré à exécuter à la main quand le backend reviendra.
- Les images jointes au chat ne sont pas accessibles comme fichiers → pour pousser des avatars il faut une URL/Drive (pas une pièce jointe chat).

---

## À faire prochaine session
1. Intégrer les 4 avatars réels (`public/avatars/{luna,orion,hermes,veille}.png`).
2. (Optionnel) Aligner les colonnes mock ORION sur le pipeline MASTER_PLAN (Nouveau → Contacté → Répondu → Qualifié → Proposition → Gagné/Perdu) et thèmes LUNA (cas_client/hook_probleme/educatif/solution/methode).
3. Si Robin valide le passage au réel : rebrancher le backend du MASTER_PLAN (Supabase + MCP + API agents) depuis l'historique git.

---

## Notes importantes
- Site existant / référence visuelle : levo-plum.vercel.app · inspiration : limova.ai
- Robin valide les décisions importantes (Confusion Protocol — BUILD_METHODS).
- Robin fournit les clés API au fur et à mesure des besoins (aucune en dur dans le code).
