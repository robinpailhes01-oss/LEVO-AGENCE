# SKILLS — ACQUISITION (agent ORION)

Bibliothèque de compétences de l'agent d'acquisition de **Luma**.
Même rôle que `docs/reference/LUNA_SYSTEM_PROMPT.md` + `CAROUSEL_DESIGN.md`
pour LUNA : la connaissance métier vit ici, le code n'en est que la plomberie.

**Architecture retenue (validée par Robin, juillet 2026) :** un seul agent
d'acquisition, **ORION**, adossé à cette bibliothèque. Pas de multiplication
d'agents tant qu'un rôle ne devient pas trop gros pour un seul.

---

## Ordre de lecture

| # | Skill | Ce qu'elle contient | Quand ORION la charge |
| --- | --- | --- | --- |
| 1 | **ACQUISITION_CORE.md** | Positionnement, ICP, pivot de valeur, règles non négociables | **toujours** |
| 2 | **OFFER_DESIGN.md** | Méthode de construction d'offre + l'offre Luma, grille, protections | offre, prix, devis, objections prix |
| 3 | **COPYWRITING.md** | Charte d'écriture, gabarit 5 lignes, banques d'objets/accroches/preuves, mots interdits | tout ce qui s'écrit |
| 4 | **SALES_CALL.md** | Découverte, chiffrage, annonce du prix, closing, suite | préparation et suivi de rendez-vous |
| 5 | **FUNNEL.md** | Tunnel complet, métriques, délivrabilité, règles d'arrêt | pilotage de campagne |
| 6 | **NICHE_HEBERGEMENT.md** | Playbook niche : tiers, décideur, pains, vocabulaire, calendrier, requêtes Google Maps, scoring | sourcing, scoring, personnalisation |

**Règle :** `ACQUISITION_CORE.md` est la source de vérité du positionnement.
Toute évolution de fond se fait là d'abord, les autres skills en découlent.

---

## Ce qui est validé et ce qui reste ouvert

**Validé par Robin**
- Un seul agent ORION + bibliothèque de skills.
- Niche : établissements d'accueil touristique du Sud à fort volume de demandes
  entrantes (Gard / Hérault d'abord). Pas les loueurs de bateaux : Harmonie
  Yacht est la **preuve**, pas le marché.
- Offre : **installation 100 % offerte, facturation à l'usage** avec marge sur
  l'usage.

**À trancher / à mesurer**
- Le nom de l'offre (`OFFER_DESIGN.md` §B1).
- La grille tarifaire exacte, après vérification des coûts réels
  (`OFFER_DESIGN.md` §B3).
- Le tarif catalogue de la clause de reprise d'installation (§B4).
- Instantly est-il toujours actif ? Il détermine le canal du froid
  (`FUNNEL.md` §5).

---

## Lien avec le code

| Skill | Code concerné |
| --- | --- |
| ACQUISITION_CORE, NICHE_HEBERGEMENT, COPYWRITING | `prompts/orion.ts` (system prompts + scoring) |
| NICHE_HEBERGEMENT §7 | `lib/outscraper.ts`, `app/api/mcp/scrape` |
| NICHE_HEBERGEMENT §8 | `app/api/mcp/leads` → `enrich_lead` |
| COPYWRITING §3 | `app/api/mcp/leads` → `generate_email1` |
| FUNNEL §2 | `leads.stage` (`supabase/outreach.sql`) |
| FUNNEL §5 | `lib/resend.ts`, `lib/instantly.ts`, `app/api/webhooks/*` |

---

## Boucle d'amélioration

Après **chaque** campagne, dans cet ordre :
1. Les objections reçues mot pour mot → `OFFER_DESIGN.md` §B7 et
   `NICHE_HEBERGEMENT.md` §10.
2. Les phrases des prospects décrivant leur douleur → `COPYWRITING.md` §11.
3. Les objets et accroches morts → sortis des banques.
4. Les chiffres réels obtenus chez un client → liste blanche
   `COPYWRITING.md` §6. **C'est la mise à jour qui change le plus les taux.**
5. Les requêtes de sourcing les plus rentables → `NICHE_HEBERGEMENT.md` §7.

Rien ne se met à jour à l'avance, sur intuition. Uniquement après contact réel.
