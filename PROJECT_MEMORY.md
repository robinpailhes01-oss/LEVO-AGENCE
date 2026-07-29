# PROJECT_MEMORY.md — Mémoire de Levo

*Claude Code lit ce fichier au début de chaque session et le met à jour à la fin.*

*Dernière mise à jour : 2026-07-29 — session « skills acquisition ORION » (2 passes).*

---

## État du projet
- Le backend est branché (Supabase + MCP + Claude API + Outscraper + Instantly + Resend + Telegram). `lib/mock.ts` ne sert plus que de reliquat visuel — ⚠️ `CLAUDE.md` décrit encore une version « 100% visuelle, zéro API » : **il est obsolète et à réécrire.**
- Déploiement : `levo-agence.vercel.app`.
- **Les 4 avatars réels sont en place** (`public/avatars/{luna,orion,hermes,veille}.png`, PNG 1254×1254).
- **Chantier en cours : l'acquisition client.** Bibliothèque de skills ORION posée dans `docs/skills/acquisition/` (6 fichiers + README) et `prompts/orion.ts` recâblé dessus. Voir la section « Acquisition » plus bas.

---

## Acquisition — décisions validées par Robin (2026-07-29)
- **Marque : Luma** (les prompts disent déjà Luma, les docs `docs/reference/` disent encore Levo → à harmoniser un jour).
- **Un seul agent d'acquisition : ORION**, adossé à une bibliothèque de skills (`docs/skills/acquisition/`). Pas de multiplication d'agents.
- **Niche : établissements d'accueil touristique du Sud à fort volume de demandes entrantes** (Gard / Hérault d'abord) — campings, hôtels indépendants, résidences, villages vacances, complexes. ⚠️ **Pas** les loueurs de bateaux : Harmonie Yacht est la **preuve**, pas le marché. L'ancienne cible « artisans Occitanie » est abandonnée.
- **Offre : installation 100 % offerte, facturation uniquement à l'usage** (à la conversation traitée), avec marge sur l'usage. Robin a tranché en connaissance des risques (saisonnalité, pas de plancher) — les garde-fous retenus sont le filtre en amont, la contrepartie non monétaire obligatoire (nom + chiffres + témoignage) et une clause de reprise d'installation avant 3 mois.
- **Pivot de valeur : du CA récupéré, pas du temps gagné.** « Le premier qui répond prend la réservation. »
- **Le premier contact ne demande jamais un rendez-vous ni un test de démo.** Il n'y a **aucun numéro de démo générique** — Robin en construit une au cas par cas, pour chaque établissement, après un échange. L'email 1 demande juste une réponse.
- **Stack technique de l'agent : Baileys + Railway.** Donc zéro coût par message (pas d'API WhatsApp Business officielle), seul coût variable = les appels Claude → marge > 90 %. ⚠️ Baileys n'est pas officiel : risque de suspension du numéro, à trancher (numéro dédié plutôt que la ligne principale du client).
- **Canal d'envoi : Resend uniquement. Instantly est abandonné** (~150 €/mois pour un volume inutilisé). **Deux domaines dédiés déjà en place** pour le froid, distincts du transactionnel client ; emails vérifiés, warm-up progressif, **50 envois/jour maximum**.
- **Réponses par email → notification Telegram immédiate**, sur un nouveau canal dédié (à créer), via Resend Inbound. Réutilise `lib/telegram.ts` (`sendTelegramMessage`), mais en push automatique — pas comme le bot "manager" actuel qui répond seulement à la demande.
- **Calendrier : on n'envoie pas de froid en juin-août.** Meilleure fenêtre = septembre (bilan de saison à chaud), puis janvier-mars.
- **Prix non figé, non public.** Chaque établissement a son propre tarif, décidé au cas par cas, avec marge cachée derrière (coût réel quasi nul, cf. Baileys). Robin veut que chaque client ait **son propre tableau de bord d'usage** — nouvelle brique produit, pas encore construite.
- Liste de leads (300-400, Gard/Hérault) : **déjà sourcée** par Robin (pas besoin de relancer le scraping dans l'immédiat).
- Page de vente : **déjà créée**, Robin l'améliore ; à revoir ensemble plutôt qu'à réécrire.

Restent à trancher : nom de l'offre, tarif catalogue de la clause de reprise, numéro dédié vs ligne principale pour Baileys, construction technique de la notif Telegram (Resend Inbound + nouveau bot), et le tableau de bord client.

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

## À faire prochaine session — acquisition (par ordre de rendement)
1. **Notif Telegram sur réponse reçue** — trou le plus critique laissé par le départ d'Instantly. Nécessite : Resend Inbound sur le domaine de prospection + nouveau bot/canal Telegram (chat_id à créer) + webhook de parsing (détail dans `FUNNEL.md` §5.2).
2. **Rédiger et faire valider l'email 1 + les 3 relances** (CTA = obtenir une réponse, pas tester une démo).
3. Revoir la page de vente existante de Robin à la lumière de `COPYWRITING.md` §8.
4. **Ajouter `reviews` + `rating` au scraping** (`lib/outscraper.ts`) si la liste déjà sourcée ne les a pas — proxy du volume de demandes, premier critère du scoring.
5. **Lecture du tunnel étape par étape dans le dashboard** (les `stage` existent déjà, la correspondance est dans `FUNNEL.md` §2).
6. Envoi à partir de **début septembre** — pas avant.

## À faire prochaine session — dette
- **Réécrire `CLAUDE.md`** : il décrit une version « 100% visuelle, zéro API, données mockées » qui n'existe plus. Il induit en erreur toute nouvelle session.
- Harmoniser Levo → Luma dans `docs/reference/`.
- (Option) Enrichir les pages internes (LUNA kanban, ORION pipeline, HERMES, Clients) au niveau de l'Overview.

---

## Notes importantes
- Réfs produit complètes dans `docs/reference/` : MASTER_PLAN, AGENT_DEFINITIONS, BUILD_METHODS, CAROUSEL_DESIGN, LUNA_SYSTEM_PROMPT, LEVO_VISION.
- Site / réf visuelle : levo-plum.vercel.app · inspiration : limova.ai · densité data-viz : eGrow (Dribbble).
- Robin valide les décisions importantes (Confusion Protocol). Aucune clé en dur ; tout via env le jour du backend.
- Outil de preview interne : `scripts/shot.mjs` (Playwright, gitignored — spécifique à l'environnement).
