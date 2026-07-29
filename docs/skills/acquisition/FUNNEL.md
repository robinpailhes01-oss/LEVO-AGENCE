# SKILL — FUNNEL
**Le tunnel complet : étapes, actifs, métriques, délivrabilité, règles d'arrêt.**
*v1.0 — juillet 2026*

---

## 1. LE PRINCIPE DIRECTEUR

**Pas de numéro de démo générique.** Robin construit une démo personnalisée
**au cas par cas, pour chaque établissement**, et il y a toujours un échange
avant. Donc le tunnel n'est pas « tester une démo tout de suite » — c'est :

- l'email froid ne vend pas le produit, il déclenche **une réponse** ;
- la réponse ouvre **une conversation courte** (par email ou WhatsApp) ;
- Robin construit ensuite **une démo personnalisée pour cet établissement** ;
- c'est cette démo, montrée en rendez-vous ou envoyée après, qui vend.

Corollaire inchangé : **on ne demande jamais un rendez-vous au premier
contact.** L'email 1 demande une réponse, pas un créneau — voir
`COPYWRITING.md` §3.

---

## 2. LE TUNNEL

```
① SOURCING            Outscraper (Google Maps) → leads bruts
        ↓
② VÉRIFICATION        emails validés, doublons et hors-cible écartés
        ↓
③ SCORING             ORION enrichit + score (0-100), Robin valide ≥ 60
        ↓
④ EMAIL 1             structure 5 lignes → CTA = obtenir une réponse
        ↓
⑤ RÉPONSE             notif Telegram immédiate → Robin prend le relais
        ↓
⑥ ÉCHANGE COURT       Robin cerne le besoin (par écrit ou par téléphone)
        ↓
⑦ DÉMO PERSONNALISÉE  construite au cas par cas pour CET établissement
        ↓
⑧ RENDEZ-VOUS 20 min  démo montrée + chiffrage + prix (`SALES_CALL.md`)
        ↓
⑨ RÉCAP + CONTREPARTIE
        ↓
⑩ INSTALLATION        offerte
        ↓
⑪ USAGE               facturation mensuelle, upsells après résultat
```

### Correspondance avec les `stage` déjà en base

Aucune migration nécessaire — on réutilise les valeurs existantes de
`leads.stage` (`supabase/outreach.sql`) :

| Étape du tunnel | `stage` |
| --- | --- |
| ①②③ | `new` |
| ④ envoyé | `contacted` |
| ouverture détectée | `opened` |
| ⑤ réponse reçue | `replied` |
| ⑥ échange en cours / infos récupérées | `audit_received` |
| ⑦ démo personnalisée envoyée ou présentée | `loom_sent` |
| relances en cours | `follow_up` |
| ⑩ signé | `won` |
| disqualifié ou refus | `lost` |

---

## 3. ÉTAPE PAR ÉTAPE — OBJECTIF, ACTIF, QUI, MÉTRIQUE

| # | Objectif unique | Actif nécessaire | Qui | Cible |
| --- | --- | --- | --- | --- |
| ① | 300-400 établissements Gard/Hérault | requêtes Google Maps (`NICHE_HEBERGEMENT.md`) | ORION | 300+ fiches |
| ② | ne jamais envoyer à une adresse morte | vérification d'emails | ORION | bounce < 2 % |
| ③ | ne travailler que le haut de la liste | grille de scoring | ORION → Robin | ≥ 60 % de la liste au-dessus de 60 |
| ④ | obtenir une réponse | gabarit 5 lignes, CTA = répondre | ORION → Robin valide | réponse 4-10 % |
| ⑤ | être notifié tout de suite | **email reçu → notif Telegram** (à construire) | ORION alerte, Robin répond | notif < 2 min après réception |
| ⑥ | cerner le besoin réel | échange court (email ou tel) | Robin | < 2 h de délai de réponse en journée |
| ⑦ | démo qui prouve qu'on a écouté | démo construite au cas par cas | Robin | 60 % des échanges → démo |
| ⑧ | qu'il chiffre lui-même sa perte | `SALES_CALL.md`, démo à l'appui | Robin | 50 % des démos → RDV |
| ⑨ | verrouiller le périmètre | récap 1 page | ORION rédige | envoyé dans l'heure |
| ⑩ | mise en service rapide | checklist d'onboarding | Robin | < 7 jours après le oui |
| ⑪ | facturer et documenter | CRM + relevé de conversations | Robin | 1er chiffre client publiable |

### L'actif manquant, et c'est le plus important

**La détection automatique des réponses n'existe pas encore.** Sans Instantly,
un email de réponse arrive dans une boîte mail normale — personne n'est
prévenu. Il faut : Resend Inbound (ou équivalent) sur le domaine de
prospection → parsing → **notification Telegram immédiate** sur un canal
dédié. C'est la première brique à construire : chaque heure de retard sur une
réponse est une réponse qui refroidit. Détail dans `FUNNEL.md` §5.2.

---

## 4. CADENCES ET RELANCES

| Envoi | Jour | Contenu |
| --- | --- | --- |
| Email 1 | J | structure 5 lignes |
| Relance 1 | J+3 | la démo autrement (capture d'un vrai échange) |
| Relance 2 | J+8 | le moment, précisé pour son type d'établissement |
| Relance 3 | J+15 | annonce d'arrêt |
| — | — | **stop** |

Détail rédactionnel dans `COPYWRITING.md` §7.

**Une seule réactivation autorisée**, à la fenêtre d'avant-saison suivante.
Au-delà, le lead passe en `lost` définitif : re-solliciter plus de deux fois un
établissement dans un milieu local, c'est y griller son nom.

---

## 5. DÉLIVRABILITÉ — RÈGLES OPÉRATIONNELLES

Sujet le plus sous-estimé du tunnel. Une liste scrapée non vérifiée détruit un
domaine en une semaine, et un domaine grillé ne se répare pas.

### 5.1 Séparation des domaines — non négociable

**Décision (juillet 2026) : Instantly est abandonné** (~150 €/mois pour un
volume que nous n'utilisons pas). **Tout passe par Resend**, sur deux domaines
séparés.

| Usage | Domaine | Compte |
| --- | --- | --- |
| Prospection à froid | **domaine dédié**, distinct | Resend |
| Transactionnel client (diagnostic, récap, factures, rapports HERMES) | domaine principal | Resend |

**Jamais de cold email depuis le domaine qui porte les emails clients.** La
raison n'est pas théorique : si la réputation du domaine tombe, ce sont les
devis et les factures qui n'arrivent plus.

### 5.2 Les 5 conditions du froid par Resend — non négociables

Resend est un service **transactionnel** : sa politique d'usage suppose des
destinataires qui ont consenti, et le risque réel n'est pas le volume — c'est
la **suspension du compte**, qui emporterait aussi tout notre transactionnel.
Puisqu'on n'a plus de solution de repli, ces conditions ne sont plus des
précautions mais des règles :

1. **Domaine d'envoi dédié**, SPF + DKIM + DMARC configurés dessus.
2. **Emails vérifiés avant envoi** (les adresses scrapées Google Maps ont un
   taux d'invalidité élevé). Bounce cible < 2 %, alerte à 3 %, arrêt à 5 %.
3. **Warm-up progressif** : 10/j semaine 1 → 20/j semaine 2 → 35/j semaine 3
   → 50/j ensuite. Jamais de saut.
4. **Désinscription en un clic**, traitée immédiatement, plus la phrase de
   sortie en ligne 5 (`COPYWRITING.md` §3).
5. **Plafond de 50 envois/jour**, étalés sur la journée. À 50/j, les 300-400
   leads de la première liste sont couverts en une dizaine de jours ouvrés —
   c'est largement suffisant, monter plus haut n'apporte rien et met le compte
   en risque.

**Ce qu'on perd en quittant Instantly, et comment on compense :**

| Instantly faisait | Sans lui |
| --- | --- |
| détection automatique des réponses | remplacé par le plan Telegram ci-dessous |
| séquences et relances automatiques | à piloter depuis le dashboard, ou à la main au début (`FUNNEL.md` §9 — de toute façon on n'automatise pas avant que le message ait fait ses preuves) |
| warm-up géré | à faire à la main (condition 3) |
| rotation d'inbox | inutile à 50/j |

Le webhook Resend en place (`app/api/webhooks/resend/route.ts`) remonte
`sent/opened/clicked/bounced/complained` — **mais pas les réponses**, ce n'est
pas son rôle.

**Le plan retenu : email reçu → notification Telegram immédiate.**

```
prospect répond → email arrive sur le domaine de prospection
        ↓
Resend Inbound (ou routage équivalent) capture le mail entrant
        ↓
webhook parse l'expéditeur, retrouve le lead, marque stage=replied
        ↓
notification poussée sur un canal Telegram dédié (nouveau bot/chat_id,
distinct du bot "manager" existant en §7 de la config Telegram)
        ↓
Robin voit la notif, répond depuis sa boîte mail habituelle
```

Réutilise `lib/telegram.ts` (`sendTelegramMessage`) déjà en place — seul le
déclenchement change : push automatique à la réception, pas seulement
réponse à la demande comme le bot "manager" actuel
(`app/api/webhooks/telegram/route.ts`). **C'est la première brique à
construire** (§9) : nécessite de créer le canal/bot Telegram dédié et de
configurer Resend Inbound sur le domaine de prospection.

### 5.3 Cadre légal (France, B2B)

La prospection B2B relève du régime **opt-out** : pas de consentement préalable
requis si le message concerne l'activité professionnelle du destinataire,
l'expéditeur est identifiable et l'opposition est simple et immédiate. Une
adresse générique du type `contact@camping-x.fr` est le cas le plus solide.

À respecter dans tous les cas : identité complète de l'expéditeur, objet non
trompeur, opposition traitée sans délai, et suppression effective en base.

### 5.4 Hygiène d'envoi

- Heures ouvrées, envois étalés (jamais 50 d'un coup).
- Texte simple, **un seul lien**, pas d'image, pas de pixel de tracking agressif.
- Pas de pièce jointe.
- Toute adresse en bounce dur → supprimée définitivement.
- Toute plainte → domaine surveillé, campagne mise en pause le jour même.

---

## 6. MÉTRIQUES — CIBLES RÉALISTES

Cold email B2B français sur liste scrapée et vérifiée :

| Métrique | Alerte | Correct | Bon |
| --- | --- | --- | --- |
| Délivrance | < 92 % | 95 % | > 98 % |
| Bounce | > 3 % | < 2 % | < 1 % |
| Réponse (toutes) | < 3 % | 4-7 % | > 10 % |
| Réponse positive | < 1 % | 2-3 % | > 5 % |
| Démo construite / échanges | < 30 % | 60 % | > 80 % |
| RDV / démo montrée | < 30 % | 50 % | > 70 % |
| Signature / RDV | < 15 % | 25 % | > 40 % |

⚠️ **Le taux d'ouverture n'est pas une métrique de décision.** Les protections
de confidentialité des messageries déclenchent de faux « ouvert » et masquent
les vrais. Il sert uniquement à comparer deux objets d'email entre eux, sur au
moins 60 envois par version.

### Diagnostic rapide quand ça ne marche pas

| Symptôme | Cause quasi certaine |
| --- | --- |
| Beaucoup de bounces | liste non vérifiée |
| Délivrance OK, zéro réponse | message interchangeable, ou cible sans volume |
| Réponses négatives / agacées | mauvais moment (pleine saison) ou mauvaise cible |
| Réponses positives mais pas de RDV | on demande trop d'engagement, ou pas de démo à tester |
| RDV mais pas de signature | la valeur n'a pas été chiffrée par le prospect (`SALES_CALL.md` §5) |

---

## 7. RÈGLES D'ARRÊT

On coupe **sans discuter** si :
- bounce > 5 % → on stoppe l'envoi, on re-vérifie la liste entière ;
- une plainte pour spam → pause de la campagne le jour même, audit du domaine ;
- 100 envois sans une seule réponse → le problème est la cible ou le message,
  pas le volume : on ne monte jamais le volume pour compenser ;
- 3 refus consécutifs pour la même raison → on change l'offre ou le segment,
  pas le copy ;
- entrée en pleine saison (voir `NICHE_HEBERGEMENT.md`) → on suspend le froid
  et on ne garde que les relances des conversations déjà ouvertes.

---

## 8. QUI FAIT QUOI — RÉSUMÉ

**ORION** : sourcing, vérification, scoring, rédaction, relances, alertes,
récaps, mise à jour des skills après campagne.
**Robin** : validation avant envoi, toutes les conversations humaines, les
rendez-vous, le prix, l'installation.

**La frontière, sans exception :** dès qu'un humain répond, ORION se tait et
notifie. Il ne négocie pas, ne promet rien, n'improvise aucun prix.

---

## 9. ORDRE DE CONSTRUCTION DES ACTIFS

Par rendement décroissant :

1. **Réception des réponses → notif Telegram immédiate.** Sans Instantly, rien
   ne prévient plus quand un prospect répond — c'est le trou le plus critique.
2. **Liste 300-400 établissements Gard/Hérault** — déjà faite, à vérifier avant
   envoi.
3. **Email 1 + les 3 relances**, validés par Robin (à refaire).
4. **Page de vente** — déjà créée, en cours d'amélioration par Robin.
5. **Suivi dans le dashboard** : les stages existent déjà, il manque la lecture
   du tunnel étape par étape.
6. **Automatisation des relances** — en dernier, jamais avant que le message ait
   prouvé qu'il fonctionne à la main.

*Automatiser un tunnel qui ne convertit pas ne fait que produire du bruit plus
vite.*
