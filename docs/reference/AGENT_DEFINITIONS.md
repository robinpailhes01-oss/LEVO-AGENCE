# LEVO — Fiches Définition Agents
**Version 1.0 — 26 juin 2026 — Validé par Robin**

---

## VUE D'ENSEMBLE

```
                    ┌─────────────────┐
                    │   DASHBOARD     │
                    │   (Next.js)     │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
     ┌────┴────┐        ┌────┴────┐        ┌────┴────┐
     │  LUNA   │        │  ORION  │        │ HERMES  │
     │Contenu  │        │Acquis.  │        │Analytics│
     └────┬────┘        └────┬────┘        └─────────┘
          │                  │
     ┌────┴────┐        ┌────┴────┐
     │ VEILLE  │        │  Clay   │
     │ Veille  │        │Instantly│
     └─────────┘        └─────────┘
```

---

## AGENT LUNA — Création de Contenu

**Statut :** 70% prêt
**Dépendances :** VEILLE (idées), ChatGPT Image 2 API (images), Supabase

### Rôle
Orchestrateur de contenu Instagram/Facebook/LinkedIn.
Produit 2-3 carrousels par semaine, coordonne les autres
agents pour les sources de contenu.

### Déclencheur
- Auto : dimanche soir génère les idées pour la semaine
- Manuel : Robin peut forcer depuis le dashboard

### Ce que Robin fournit
- Cas client : formulaire avec contexte + chiffres + citation
- Éducatif : rien → VEILLE fournit le brief
- Autres : rien → LUNA décide du sujet

### Workflow
```
1. LUNA propose 7 idées → Robin valide/rejette
2. Pour idées validées :
   - Éducatif → VEILLE brief → LUNA génère
   - Cas client → Robin remplit formulaire → LUNA génère
3. LUNA génère slides + prompts images
4. ChatGPT Image 2 API génère les visuels
5. Robin review carrousel complet
6. Feedback slide par slide (champ + / -)
7. LUNA ne retouche QUE les slides avec feedback
8. Robin valide version finale
9. Robin publie manuellement
10. Fin session → feedback capturé → skill mis à jour
```

### Feedback Loop (Auto-amélioration)
- Robin note ses + et - dans un champ texte par slide
- Système capture toutes les corrections effectuées
- En fin de session : CAROUSEL_DESIGN.md + LUNA_SYSTEM_PROMPT.md mis à jour automatiquement

### Organisation Fichiers Supabase/Dashboard
```
carrousels/
├── 2026-W27/
│   ├── cas-client-harmonie-yacht/
│   │   ├── slides.json (contenu chaque slide)
│   │   ├── prompts.json (prompts ChatGPT Image 2)
│   │   ├── images/ (visuels générés)
│   │   ├── caption.txt
│   │   └── feedback.txt (retours Robin)
│   └── educatif-automatisation-pme/
└── 2026-W28/
```

### Tables Supabase
- `content_calendar` : idées et statuts
- `content_slides` : contenu de chaque slide
- `content_images` : URLs des visuels générés
- `content_feedback` : retours Robin par slide
- `content_performance` : métriques J+48

---

## AGENT VEILLE — Sous-agent de LUNA

**Statut :** À construire
**Dépendances :** Apify (scraping), Claude API, Supabase

### Rôle
Surveille Instagram, LinkedIn, newsletters et presse
business pour identifier les sujets qui résonnent
avec les chefs d'entreprise PME 40-50 ans.
Produit des briefs complets prêts pour LUNA.

### Sources
- Instagram : entrepreneurs, coaches business, PME, productivité
- LinkedIn : articles automatisation, gestion PME
- Newsletters : business/productivité FR
- Presse : Les Echos, BFM Business, Challenges

### Filtre obligatoire
Chaque sujet testé : "Est-ce qu'un chef d'entreprise de 45 ans
qui gère 10 personnes va s'y reconnaître ?"
- Inclus : gain de temps, clients, relances, devis, équipe, process
- Exclus : LLM, tokens, code, technique IA, contenu dev

### Fréquence
3x par semaine (lundi / mercredi / vendredi) — automatique

### Triage par Robin
Dashboard vue "Idées VEILLE" :
- Carte par idée : sujet + source + engagement + angle suggéré
- Boutons : ✅ Garder | ❌ Écarter
- Robin trie en 5 minutes max

### Output — Brief complet pour LUNA
```
Sujet       : [Titre du post]
Angle       : [Point de vue Levo]
Accroche S1 : [Hook slide 1 proposé]
Données     : [Chiffres ou faits clés]
Structure   : [Nombre slides + plan]
Ton         : [Éducatif / Hook / Méthode]
Source      : [Compte ou article origine]
Engagement  : [Likes/saves observés sur source]
```

### Tables Supabase
- `watched_accounts` : comptes à surveiller
- `veille_items` : contenus scrappés bruts
- `veille_briefs` : briefs filtrés et validés

---

## AGENT ORION — Acquisition Client

**Statut :** À construire
**Dépendances :** Clay, Apify, Instantly.ai API, Supabase

### Rôle
Trouve, qualifie et contacte des dirigeants PME.
Gère les séquences jusqu'à la réponse.
Robin prend le relais dès qu'il y a un intérêt.

### Outil principal : Instantly.ai
- 25 000 leads inclus dans l'abonnement Robin
- Gère l'envoi, tracking, relances, A/B tests
- ORION l'alimente via l'API Instantly

### Source des leads
ORION trouve seul via :
- Clay : enrichissement + scraping LinkedIn
- Apify : scraping Instagram comptes PME locaux

Critères de recherche :
- Secteur : services, commerce, artisanat
- Taille : 2 à 50 employés
- Géo : France (Sud de France prioritaire)
- Signaux : recrutement actif, croissance, présence digitale

### Scoring (0-100)
```
+20 : PME 2-50 personnes
+20 : Secteur services/commerce
+15 : Présence digitale active
+15 : Géolocalisation Sud de France
+10 : Dirigeant identifié et contactable
+10 : Pain points visibles publiquement
+10 : Entreprise financièrement saine
-10 : Concurrent direct IA
-20 : Structure >200 personnes
```

### Workflow
```
1. ORION scrape 50-100 profils/semaine (auto)
2. Clay enrichit : email pro, nom, CA estimé, pain points
3. Score calculé automatiquement
4. Robin valide les leads ≥ 60 dans le dashboard (10 min)
5. ORION génère séquence email personnalisée (3 messages)
   + 2 versions A/B par séquence
6. Robin valide les messages avant envoi
7. Instantly envoie + gère les relances
8. Si réponse → notification Robin → Robin prend le relais
   ORION stoppe la séquence automatiquement
```

### A/B Testing
ORION teste en parallèle :
- Angle A : gain de temps ("3h récupérées par jour")
- Angle B : concurrents ("vos concurrents automatisent déjà")
- Angle C : problème spécifique au secteur du lead
HERMES analyse les taux et recommande l'angle gagnant chaque semaine

### Canaux
- Phase 1 (maintenant) : Email via Instantly.ai
- Phase 2 (plus tard) : DM Instagram en plus

### Tables Supabase
- `leads` : tous les leads avec score et statut
- `outreach_sequences` : séquences générées
- `ab_tests` : résultats des A/B tests
- `replies` : réponses reçues + notification Robin

---

## AGENT HERMES — Analytics & Reporting

**Statut :** À construire
**Dépendances :** Supabase (toutes les tables), Resend (email), n8n (trigger)

### Rôle
Lit toutes les données de l'agence, détecte les tendances,
et dit à Robin quoi faire concrètement cette semaine.
Pas juste des chiffres — des recommandations actionnables.

### Déclencheur
- Auto : chaque lundi 8h via workflow n8n
- Manuel : bouton "Générer rapport" dans dashboard

### Données analysées
**Contenu (LUNA) :**
Posts publiés, engagement, reach, saves, format gagnant

**Prospection (ORION) :**
Leads trouvés/validés/contactés, taux ouverture, A/B gagnant

**CA & Clients :**
MRR total, variation hebdo, clients actifs, renouvellements

**Activité agents :**
LUNA : posts générés vs publiés
ORION : séquences actives, réponses en attente
VEILLE : dernière veille, idées générées
→ Alerte si un agent n'a pas tourné

### Format rapport
```
Section 1 — Chiffres clés (vs semaine précédente)
  MRR : X€ (▲+Y%)
  Leads contactés : N | Taux réponse : X%
  Posts publiés : N | Engagement moyen : X%
  Meilleur post : [titre] — X saves

Section 2 — Ce qui a marché + pourquoi

Section 3 — Ce qui n'a pas marché + recommandation

Section 4 — Top 3 actions de la semaine
  [Action concrète] → [Impact attendu] → [Urgence 🔴🟡🟢]

Section 5 — Alertes
  ⚠️ Lead chaud sans réponse depuis 3j
  ⚠️ Aucun post depuis 5j
  ⚠️ Agent inactif
```

### Livraison
- Dashboard : page HERMES avec rapport complet et historique
- Email via Resend : résumé + Top 3 actions

### Tables Supabase
- `weekly_reports` : rapports générés et historique
- Lecture de toutes les autres tables

---

## INTÉGRATIONS EXTERNES — Résumé

| Outil | Agent | Usage | Statut |
|-------|-------|-------|--------|
| Instantly.ai | ORION | Envoi emails + A/B tests | Abonné ✅ |
| Clay | ORION | Enrichissement leads | À connecter |
| Apify | VEILLE + ORION | Scraping Instagram/LinkedIn | À connecter |
| ChatGPT Image 2 | LUNA | Génération visuels | Clé API Robin |
| Resend | HERMES | Emails rapports | Gratuit |
| n8n | HERMES | Trigger lundi 8h | Connecté |
| Buffer | LUNA | Publication auto (phase 2) | Reporté |

---

*Agents définis le 26 juin 2026 — Validé par Robin*
*Prêt à intégrer dans MASTER_PLAN.md pour Claude Code*
