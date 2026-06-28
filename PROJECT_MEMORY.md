# PROJECT_MEMORY.md — Mémoire de Levo

*Claude Code lit ce fichier au début de chaque session et le met à jour à la fin.*

*Dernière mise à jour : 2026-06-29 — session « dashboard visuel premium ».*

---

## État du projet
- Phase actuelle : **Dashboard visuel premium, terminé et en ligne** (Phase 2 « skeleton » du MASTER_PLAN, en version 100% mockée).
- Déploiement : `levo-agence.vercel.app` (auto-deploy sur push de la branche `claude/levo-dashboard-setup-0mbsm3`).
- 100% statique, **zéro backend / zéro variable d'env**. Données mockées dans `lib/mock.ts`.
- **Les 4 avatars réels sont en place** (`public/avatars/{luna,orion,hermes,veille}.png`, PNG 1254×1254).
- Prochaine étape possible : enrichir les pages internes au niveau de l'Overview, ou (plus tard) brancher le backend du MASTER_PLAN.

---

## Décisions de design prises (validées par Robin)
- **Fond crème marque `#F0EDE6`** (choisi vs `#ECEEF8` Bankio) — aligné site levo-plum + charte. Sidebar navy `#0D1117`, accent bleu `#1A3BFF`.
- **Typographie façon Apple** : `Inter Tight` (display, proche de SF Pro) pour titres + grands chiffres, `Inter` (corps). **Le serif Cormorant a été abandonné** sur demande de Robin (« plus style Apple »). Fallback `-apple-system`. Chiffres en figures alignées + tabulaires.
- **Inspiration limova.ai** : boutons **pill**, **cercles dégradés** subtils en fond (bleu/violet), whitespace généreux.
- **Passe « Apple » (retenue)** :
  - Avatars : **pas de halo lumineux** → anneau fin (couleur agent) + ombre douce. Portrait 88px, crop visage `objectPosition: 50% 26%`.
  - **Bulles de dialogue en gris neutre** (type iMessage), plus de teinte colorée.
  - **Carte Insight HERMES en sombre navy** (sophistiqué), plus de bleu vif.
  - **Ombres ultra-douces** (card/lift), hairlines légers.
- **Data-viz** (eGrow/Dribbble) : sparklines sous les KPIs, **graphique Performance** multi-séries, **donut** sources, **funnel** de conversion. Tout en **SVG pur, zéro dépendance**.
- **Animations de chargement** des graphiques (tracé progressif via `pathLength=1`, barres `scaleX`, donut reveal), en CSS pur, respectant `prefers-reduced-motion`.
- **Labels éditoriaux** (`.eyebrow`, caps + letter-spacing) au-dessus de chaque section.
- **Palette graphique resserrée** : funnel bleu monochrome, donut bleu→violet analogue (pas d'arc-en-ciel).
- **Couleurs d'identité agents conservées** : LUNA `#1A3BFF`, ORION `#1D9E75`, HERMES `#BA7517`, VEILLE `#7B2FBE`.
  - ⚠️ HERMES ambre est légèrement orangé alors que la charte dit « zéro orange ». Conservé (couleur d'origine + colle au fond jaune de sa photo). À ré-arbitrer si Robin veut un ton plus brand.

---

## Patterns établis
- Toutes les données mockées : **`lib/mock.ts`** (point de vérité unique).
- Design tokens : `tailwind.config.ts` (palette, ombres, easing `smooth`/`spring`, tracking `tightest`/`apple-tight`).
- Utilitaires CSS dans `app/globals.css` : `.levo-card`, `.frost`, `.agent-cta` (tint→fill au hover via `--agent`), `.eyebrow`, `.stagger`, `.chart-line|area|bar|ring|dot`.
- Graphiques réutilisables : `components/charts/{Sparkline,TrendChart,Donut,Funnel}.tsx` (SVG, Server Components).
- Layout : `components/layout/{Sidebar,Header,MobileNav,PageHeader,Logo}`. Pages = Server Components statiques ; interactions = CSS/hover (pas de fetch).
- Avatars affichés via `next/image` (object-cover, ring couleur agent). TS strict, jamais de `any`. Build statique vert sans env.

---

## Pièges rencontrés (IMPORTANT)
- **Upload d'images via GitHub web** : l'étape **« rename » après upload casse tout** — le fichier se retrouve à la racine (`/luna.png`), dans `public/` (`public/orion.png`), ou est **vidé à 2 octets** (veille). 
  - ✅ **Méthode fiable** : renommer le fichier (`orion.png`…) **sur l'appareil AVANT**, entrer dans le dossier `public/avatars/` sur GitHub, puis **Add file → Upload files** (sans aucun rename). Ou passer par Google Drive et laisser Claude placer les fichiers.
  - 🛟 **Récupération** : les fichiers mal placés/vidés se récupèrent dans l'historique git (`git ls-tree`, `git cat-file blob <hash> > dest`), puis `git mv` au bon endroit.
- **`next/image` met en cache** les images optimisées sur un serveur lancé : si un avatar change sur le disque, un `next start` déjà actif sert l'ancienne version. → `rm -rf .next && next build` pour rafraîchir en preview locale. (Aucun impact sur Vercel qui build à neuf.)
- **Avatar « bille » côté Vercel après upload** = simple **cache navigateur** → force-refresh / navigation privée.
- **Build local** : `pkill` d'un serveur de fond dans la même commande compound peut faire sortir le shell en code 144 → lancer `next build` seul.
- TS 5.7 a durci les génériques `Uint8Array`/`BufferSource` (vu sur l'ancien backend).

---

## À faire prochaine session
1. (Option) Enrichir pages internes (LUNA kanban, ORION pipeline, HERMES, Clients) au niveau de l'Overview : mini-graphes, mêmes finitions Apple.
2. (Option) Animer plus finement (compteurs de chiffres, hover graphes).
3. (Plus tard) Passage au réel : rebrancher le backend du MASTER_PLAN (Supabase + MCP + API agents) — récupérable dans l'historique git (1re itération supprimée lors du pivot « visuel »).

---

## Notes importantes
- Réfs produit complètes dans `docs/reference/` : MASTER_PLAN, AGENT_DEFINITIONS, BUILD_METHODS, CAROUSEL_DESIGN, LUNA_SYSTEM_PROMPT, LEVO_VISION.
- Site / réf visuelle : levo-plum.vercel.app · inspiration : limova.ai · densité data-viz : eGrow (Dribbble).
- Robin valide les décisions importantes (Confusion Protocol). Aucune clé en dur ; tout via env le jour du backend.
- Outil de preview interne : `scripts/shot.mjs` (Playwright, gitignored — spécifique à l'environnement).
