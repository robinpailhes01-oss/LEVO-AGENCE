# LUMA — Audit & Plan d'action Semaine 1

*Rédigé le 30 juillet 2026. Un seul objectif, une seule niche, 7 jours.*
*À la fin de la semaine : bilan chiffré (section 5) → on analyse, on améliore.*

---

## 1. Audit honnête de la situation

### Ce qui existe (et qui a de la valeur)

| Actif | État | Valeur commerciale |
| --- | --- | --- |
| **LÉA sur WhatsApp chez Harmonie Yacht** | Déployée, en prod | ⭐⭐⭐ C'est LA preuve. Robin utilise son propre produit dans sa propre entreprise touristique, à Carnon, en pleine saison. Aucun concurrent local ne peut dire ça. |
| **Machine d'outreach complète** | Fonctionnelle | Outscraper (sourcing) → HERMES (accroche personnalisée, template validé) → Instantly (envoi + détection réponses) → audit/Loom/relances dans le dashboard. Déjà rodée sur les artisans. |
| **Campagne hébergement (Resend + bot Telegram)** | **Codée mais jamais lancée** | Bloquée sur 3 détails : contenu exact du mail (lien landing), token/chat_id Telegram, sourcing des 300-400 leads. C'est le chantier le plus proche du cash. |
| **Dashboard Luma (LUNA/ORION/HERMES)** | En prod, riche | Outil interne solide. Mais un dashboard ne signe pas de client. |
| **Offre sites + automatisations "tout type d'entreprise"** | Vague | Trop large pour convaincre à 0 client. |

### Les 3 vrais problèmes

1. **Dispersion.** Trois offres (sites web, automatisations généralistes, hébergement/WhatsApp) pour zéro client. À 0 client, une agence n'a pas un problème d'offre, elle a un problème de **focus**. La niche hébergement est la seule où Luma a un avantage injuste : Robin *est* un acteur du tourisme local qui utilise le produit.
2. **La campagne la plus prometteuse est à 90% et n'est pas partie.** Tout le code existe depuis le 28 juillet. Ce qui manque tient en une demi-journée de travail. Chaque jour de retard en pleine saison est un jour où les hébergeurs du Gard/Hérault croulent sous les demandes WhatsApp sans nous connaître.
3. **Aucune boucle de mesure.** Sans campagne envoyée, aucune donnée : impossible de savoir si c'est l'accroche, l'offre ou la cible qui coince. La priorité n'est pas de perfectionner, c'est d'**obtenir des données réelles**.

### Le timing joue pour nous — cette semaine précisément

Fin juillet = pic de saison. Les campings, chambres d'hôtes et hôtels indépendants du Gard/Hérault sont **en train de vivre le problème** qu'on résout (WhatsApp qui sonne pendant le ménage, les check-ins, les réclamations). La douleur est maximale, le message "je réponds à vos clients WhatsApp pendant que vous travaillez" n'aura jamais autant de résonance. En octobre, ils auront oublié.

### ⚠️ Un point technique à trancher (risque réel)

**Resend n'est pas fait pour le cold email.** C'est un service transactionnel : envoyer 300-400 mails froids d'un coup risque le blocage du compte et grille la délivrabilité du domaine. Instantly (déjà branché, avec warm-up et détection de réponses) est l'outil prévu pour ça.
**Recommandation :** garder Instantly pour l'envoi à froid ; si Robin tient à Resend, alors sous-domaine dédié (ex. `contact.luma-agence.fr`), **maximum 40-50 mails/jour**, montée progressive. Le bot Telegram fonctionne dans les deux cas.

---

## 2. LE plan : "Semaine LÉA Hébergement"

**Un seul objectif d'ici mercredi 5 août : 3 démos réalisées, dont 1 client pilote signé.**

**L'offre unique de la semaine (on ne vend rien d'autre) :**
> **LÉA pour votre établissement** — un agent WhatsApp qui répond à vos clients 24/7 (dispos, horaires, check-in, questions fréquentes) + un tableau de bord personnalisé pour tout suivre. Déjà en service chez Harmonie Yacht à Carnon.
> **Offre pilote (3 premiers établissements) : installation offerte + 1er mois à prix pilote, en échange d'un témoignage.**

Le prix pilote exact est à fixer par Robin en J1 (repère : 0 € d'installation + 150-250 €/mois pilote, prix public annoncé plus haut pour ancrer la valeur).

### Jour par jour

**J1 — Jeudi 31/07 : débloquer (une demi-journée suffit)**
- [ ] Fixer le prix pilote et figer le paragraphe d'offre ci-dessus.
- [ ] Écrire le mail de campagne : accroche HERMES personnalisée + pitch fixe adapté hébergement (même structure que le template artisans validé : accroche 10 mots → question sur les demandes clients → preuve Harmonie Yacht → démo gratuite sans engagement). Le lien pointe vers une **page unique** (une section dédiée sur le site existant suffit — pas de nouveau site) : 3 captures de LÉA en action + le tableau de bord + un bouton WhatsApp direct.
- [ ] Créer le bot Telegram (@BotFather, 5 min), renseigner token + chat_id → le récap `sent/opened/clicked/replied` est opérationnel.
- [ ] Trancher Instantly vs Resend (cf. audit).

**J2 — Vendredi 01/08 : munitions**
- [ ] Sourcing Outscraper : 300-400 établissements Gard/Hérault — campings indépendants, chambres d'hôtes, hôtels < 30 chambres, gîtes avec site web. **Exclure** chaînes et gros groupes (décideur inaccessible).
- [ ] Génération des accroches HERMES sur tout le lot → validation par lots via "Tout approuver" + relecture rapide des 30 premières.
- [ ] **Canal chaud en parallèle (le plus important à 0 client)** : lister 10 établissements que Robin peut toucher en direct — voisins de Carnon, contacts d'Harmonie Yacht, connaissances. Message WhatsApp perso (pas un mail) : « Je te montre en 10 min ce que j'ai installé chez Harmonie Yacht ? » **Le premier client viendra probablement de là, pas du cold email.**

**J3 — Samedi 02/08 : premier tir réel**
- [ ] Envoi du **premier batch de 50** (pas 400 : on teste avant de vider le chargeur).
- [ ] Envoyer les 10 messages chauds.
- [ ] Préparer la démo type (15 min) : le prospect écrit en live au numéro WhatsApp de démo de LÉA → effet immédiat, puis tableau de bord, puis offre pilote. Samedi soir : premier récap Telegram.

**J4-J5 — Dimanche 03 / Lundi 04 : réponses et démos**
- [ ] Si délivrabilité OK (pas de bounces anormaux) : batchs suivants de 50-80/jour.
- [ ] Toute réponse = proposition de créneau démo **dans les 24h** (les hébergeurs décident vite en saison, ou pas du tout).
- [ ] Relance J+3 automatique sur les ouvreurs silencieux (mécanisme déjà en place).

**J6-J7 — Mardi 05 / Mercredi 06 : conclure et analyser**
- [ ] Pousser les démos vers la signature pilote (l'offre "3 premiers établissements" crée l'urgence — et c'est vrai).
- [ ] **Mercredi soir : bilan chiffré** (section 5) → on analyse et on améliore, comme convenu.

### Ce qu'on ne fait PAS cette semaine (aussi important que le reste)

- ❌ Pas de nouvelle fonctionnalité dashboard, pas de refonte de site.
- ❌ Pas de contenu LUNA/Instagram (ça nourrit la marque, pas le premier client).
- ❌ Pas d'autre niche, pas de prospection artisans en parallèle.
- ❌ Pas de perfectionnement du mail au-delà de J1 — on améliore **après** les données de J3.

---

## 3. Pourquoi ce plan et pas un autre

- **C'est le chemin le plus court vers un client** : 90% du travail est déjà fait, il reste l'exécution commerciale.
- **C'est la seule offre avec une preuve vivante** : "je l'utilise moi-même dans mon entreprise à Carnon" vaut plus que n'importe quel portfolio.
- **La saison crée l'urgence chez le prospect** — l'argument de vente se périme en septembre.
- **Un pilote hébergement débloque tout le reste** : témoignage → cas client → contenu LUNA crédible → les offres sites/automatisations se vendront ensuite en upsell aux mêmes clients.

## 4. Rôles

| Qui | Fait quoi |
| --- | --- |
| **Robin** | Prix pilote, création bot Telegram, messages chauds, démos, closing. |
| **Claude Code (sessions dashboard)** | Section landing hébergement, adaptation du pitch fixe HERMES hébergement, sourcing Outscraper via MCP, lancement des batchs. |
| **HERMES** | Accroches personnalisées sur 300-400 leads. |
| **LÉA (démo)** | Répondre en live au numéro de démo pendant les rendez-vous. |

## 5. Bilan de mercredi soir — les chiffres qui décident

| Métrique | Seuil sain | Si en-dessous → action |
| --- | --- | --- |
| Bounces | < 5% | Sourcing/vérification emails à revoir |
| Ouvertures | > 40% | Changer l'objet (pas le corps) |
| Réponses | > 3% | Changer l'accroche ou la question, pas l'offre |
| Démos bookées | ≥ 3 | Si réponses OK mais 0 démo → revoir le CTA du mail |
| Pilote signé | ≥ 1 | Si démos faites mais 0 signature → revoir prix/offre pilote |
| Canal chaud | ≥ 5 réponses / 10 | Si 0 → le pitch oral est à retravailler avant tout le reste |

**Règle d'or du bilan : on ne change qu'UNE variable à la fois pour la semaine 2.**

---

*Document vivant — à mettre à jour au bilan de mercredi 06/08.*
