# LEVO — Méthodes de Construction
**Concepts extraits de gstack (Garry Tan / YC), adaptés à Levo**
**Pour Claude Code — Façon de travailler, pas outils à installer**

---

## POURQUOI CE FICHIER

gstack est un système de 23 outils créé par le CEO de Y Combinator.
On n'installe rien. On extrait uniquement les MÉTHODES qui rendent
le développement plus robuste, et on les applique à Levo.

Claude Code doit suivre ces principes de travail.

---

## PRINCIPE 1 — Le Cycle de Construction

Pour CHAQUE feature de Levo (un agent, une page dashboard, une API),
Claude Code suit ce cycle, sans sauter d'étape :

```
PENSER → PLANIFIER → CONSTRUIRE → VÉRIFIER → TESTER → LIVRER
```

**PENSER** (avant tout code)
- Reformuler le besoin : "Robin a demandé X, mais le vrai besoin est Y"
- Identifier le produit "10 étoiles" caché dans la demande
- Lister les hypothèses cachées et les expliciter

**PLANIFIER** (avant tout code)
- Architecture : data flow, états, cas limites
- Schéma des données touchées
- Liste des fichiers à créer/modifier
- Tests à prévoir

**CONSTRUIRE**
- Code complet, jamais de "TODO: implement later"
- TypeScript strict, pas de `any`
- Gestion d'erreurs sur tous les appels externes

**VÉRIFIER** (auto-review)
- Relire le code comme un staff engineer
- Chercher les bugs qui passent les tests mais cassent en prod
- Race conditions, edge cases, null checks

**TESTER**
- Tester dans un vrai navigateur si c'est de l'UI
- Vérifier que les API répondent correctement
- Générer un test de régression pour chaque bug trouvé

**LIVRER**
- Commit propre avec message clair
- Documentation mise à jour
- Variables d'environnement notées

---

## PRINCIPE 2 — Le Confusion Protocol

**Règle d'or de gstack : ne jamais deviner sur une décision d'architecture.**

Si Claude Code rencontre une décision importante non spécifiée :
- Ne PAS choisir au hasard et continuer
- S'ARRÊTER et poser la question à Robin
- Proposer 2-3 options avec leurs trade-offs

Exemple :
```
"Pour le stockage des images générées par LUNA,
 deux options :
 A) Supabase Storage (simple, dans ta stack)
 B) Cloudinary (optimisation auto, mais service en +)
 Je recommande A. Tu confirmes ?"
```

---

## PRINCIPE 3 — Les 4 Failure Modes à Éviter

Karpathy (cofondateur OpenAI) identifie 4 erreurs classiques de l'IA
qui code. Claude Code doit les éviter activement :

```
1. MAUVAISES HYPOTHÈSES
   → Toujours expliciter les hypothèses avant de coder
   → "Je suppose que X. Est-ce correct ?"

2. SUR-COMPLEXITÉ
   → Toujours choisir la solution la plus simple qui marche
   → Pas d'abstraction prématurée

3. ÉDITIONS ORTHOGONALES
   → Ne modifier QUE ce qui est demandé
   → Pas de "drive-by edits" sur du code non concerné

4. IMPÉRATIF AU LIEU DE DÉCLARATIF
   → Transformer chaque tâche en objectif vérifiable
   → Test-first quand c'est possible
```

---

## PRINCIPE 4 — Design Itératif (pour Dashboard + Carrousels)

Inspiré de /design-shotgun. Pour tout travail visuel :

```
1. Générer PLUSIEURS variantes (4-6), pas une seule
2. Les comparer côte à côte
3. Robin choisit ses préférées + donne du feedback
4. Itérer en gardant ce qui plaît
5. Mémoriser les goûts de Robin pour les prochaines fois
```

Cette méthode s'applique à :
- Les maquettes du dashboard
- Les carrousels LUNA (déjà notre workflow naturel)
- Les avatars des agents

---

## PRINCIPE 5 — Mémoire Persistante (le concept GBrain)

**Le problème :** Claude Code oublie tout entre les sessions.
Quand Robin revient coder ORION après LUNA, il faut tout réexpliquer.

**La solution Levo (sans installer GBrain) :**
Maintenir un fichier `PROJECT_MEMORY.md` à la racine du projet
que Claude Code lit au début de chaque session et met à jour à la fin.

Contenu de PROJECT_MEMORY.md :
```
## État du projet
- Phase actuelle : [X]
- Dernière session : [date + ce qui a été fait]

## Décisions d'architecture prises
- [Décision] → [Pourquoi]

## Patterns établis
- [Pattern de code utilisé partout dans Levo]

## Pièges rencontrés
- [Bug ou difficulté] → [Solution]

## À faire prochaine session
- [Tâches]
```

Claude Code DOIT :
1. Lire PROJECT_MEMORY.md au début de chaque session
2. Le mettre à jour à la fin de chaque session
3. S'y référer pour rester cohérent avec ce qui existe déjà

---

## PRINCIPE 6 — Review Routing Intelligent

Tous les changements n'ont pas besoin de la même review.

```
Changement UI/Dashboard    → Review design + test navigateur
Changement API/Backend     → Review architecture + edge cases
Changement Agent (prompt)  → Review cohérence + test output
Bug fix simple             → Review rapide + test régression
```

Claude Code adapte son niveau de vérification au type de changement.

---

## PRINCIPE 7 — Tester comme un Humain

Inspiré de /qa. Pour toute interface :
- Ouvrir un vrai navigateur
- Cliquer dans les vrais flows
- Tester les cas d'erreur (champs vides, mauvaises données)
- Vérifier le responsive mobile (Robin utilise son iPhone)
- Screenshot avant/après pour les changements visuels

---

## CE QUE CLAUDE CODE NE DOIT JAMAIS FAIRE

```
❌ Livrer du code avec "TODO: implement"
❌ Deviner sur une décision d'architecture importante
❌ Modifier du code non concerné par la tâche
❌ Sur-compliquer une solution simple
❌ Oublier de mettre à jour PROJECT_MEMORY.md
❌ Livrer sans tester
❌ Utiliser `any` en TypeScript
❌ Exposer une clé API côté client
```

---

*Méthodes extraites de gstack — Adaptées à Levo*
*Aucune installation requise — Ce sont des principes de travail*
