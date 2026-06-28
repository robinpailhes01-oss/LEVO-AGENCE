# LEVO — Carousel Design System
**Version 1.0 — Validé le 25 juin 2026**

---

## 1. Principe Fondateur

> Le 3D est le héros. Le texte est l'invité.

Chaque slide suit cette hiérarchie :
- L'objet 3D occupe 55 à 65% du slide
- Le texte est minimal, lisible, élégant
- L'espace blanc est une décision de design, pas un oubli
- Le style reflète le site web : confiant, calme, premium

---

## 2. Palette Couleurs

| Rôle | Nom | Hex |
|------|-----|-----|
| Fond principal | Crème Levo | `#F0EDE6` |
| Fond sombre 1 | Vert forêt | `#1A2E1A` |
| Fond sombre 2 | Navy nuit | `#0D1117` |
| Texte principal | Noir profond | `#1A1A1A` |
| Accent primaire | Bleu Levo | `#1A3BFF` |
| Texte secondaire | Gris | `#888888` |
| Texte clair | Blanc | `#FFFFFF` |

### Règles absolues
- Maximum 2 couleurs de fond par carrousel complet
- ZÉRO orange, ZÉRO terracotta, ZÉRO gradient chaud
- Le bleu `#1A3BFF` est réservé aux accents uniquement (jamais en fond)
- Fonds autorisés : crème / vert forêt / navy uniquement

---

## 3. Système Typographique

### Font principale — Titres
**Serif élégant** (Playfair Display / DM Serif Display / Cormorant Garamond)
- Mixed case obligatoire — jamais tout en majuscules
- Tailles : 48-72pt pour les titres principaux
- Poids : Bold pour les titres, Italic pour les sous-titres

### Font secondaire — Corps
**Sans-serif clean** (Inter / DM Sans)
- Tailles : 16-22pt
- Poids : Regular uniquement
- Opacité : 60-75% sur fonds sombres

### Règles typographiques
```
INTERDIT                        AUTORISÉ
──────────────────────          ──────────────────────
"VOS CONCURRENTS"               "Vos concurrents"
Barlow Condensed Black 240pt    Serif élégant 54pt
Tout en caps agressif           Mixed case lisible
Texte = héros du slide          Texte = accompagnement
```

### Hiérarchie par slide
```
Titre principal   : 48-72pt, serif bold, couleur principale
Titre secondaire  : 28-38pt, serif bold, couleur principale 70%
Corps de texte    : 16-20pt, serif italic, couleur principale 60%
Label/tag         : 10-11pt, sans-serif caps, letter-spacing 0.14em
Footer            : 13pt, sans-serif regular
```

---

## 4. Les 5 Types de Posts

### Type A — Résultat chiffré
*Fond : Vert forêt ou Crème*
```
Structure :
- Pill tag "ÉTUDE DE CAS" ou "RÉSULTAT"
- Chiffre clé en grand (48-72pt)
- Phrase résultat en dessous
- Corps italic "comment c'est possible"
- Séparateur ligne bleue
- Attribution client (bold) + italic description
- Objet 3D : doré (sablier, trophée, pièce)
```

### Type B — Hook problème
*Fond : Crème ou Navy*
```
Structure :
- Info block top-right (Agence IA / PME / Montpellier)
- Accroche principale 48-60pt serif
- 1 mot-clé ou chiffre plus grand pour l'emphase
- Corps italic "ce que ça représente"
- Séparateur ligne bleue
- Objet 3D : rouge (urgence) ou bleu-violet (tech)
```

### Type C — Éducatif
*Fond : Crème*
```
Structure :
- Label "POUR LES PME" ou thème
- Titre en question ou affirmation 48pt
- Liste 3-4 points, 16pt regular
- Séparateur ligne bleue
- CTA discret
- Objet 3D : illustre le sujet
```

### Type D — Solution / Produit
*Fond : Navy*
```
Structure :
- Pill tag "LA SOLUTION"
- Numéro de slide top-right, 12pt, 20% opacité
- Nom du produit/agent très grand (72pt max)
- Sous-titre descriptif 22pt, 70% opacité
- Tags fonctionnalités (texte only, no icons)
- Mockup ou objet 3D réaliste (iPhone, interface)
```

### Type E — Méthode / Processus
*Fond : Crème*
```
Structure :
- Label "NOTRE MÉTHODE"
- Titre 48pt
- Liste numérotée 01/02/03, mixte bold + regular
- Séparateurs lignes bleues 0.5px entre chaque
- Pas d'objet 3D — le design est l'élément visuel
```

---

## 5. Les 6 Éléments de Signature Levo

Présents sur 100% des slides.

| Élément | Spec | Usage |
|---------|------|-------|
| **Accent ■** | Carré bleu #1A3BFF, 18×18px | Après chaque point final du titre |
| **Flèche →** | Bleu #1A3BFF, 28pt, medium | Bas gauche, au-dessus du footer |
| **Pill tag** | Border 0.5px #1A3BFF, no fill, 10pt caps | Catégorie du slide top-left |
| **Séparateur** | Ligne 0.5px #1A3BFF, 48-80px | Entre titre et corps de texte |
| **Footer** | Barre #1A1A1A 48px, ● Levo / Suite → | Identique sur tous les slides |
| **Numéro éditorial** | 12pt, 20-40% opacité, top-right | Sur les slides 02, 03, 04... |

### Spec Footer
```
Barre : #1A1A1A, hauteur 48px, pleine largeur
Gauche (48px marge) : 
  Cercle ● rempli #1A3BFF, 6px + "Levo" blanc 13pt regular
Droite (48px marge) : 
  "Suite →" blanc 13pt regular
Note : "Levo" en mixed case — pas "LEVO"
```

---

## 6. Système Objets 3D

### Règle de couleur par message

| Couleur 3D | Message | Exemples d'objets |
|------------|---------|-------------------|
| **Or/Doré** `#B8860B→#FFD700` | Résultats, valeur, gains | Sablier, trophée, pièce de monnaie, médaille |
| **Bleu-violet** `#1A3BFF→#7B2FBE` | Tech, automatisation, IA | Engrenages, sphère réseau, cube data |
| **Rouge** `#CC0000→#FF3333` | Urgence, problème, perte | Horloge, cube fracturé, signal d'alarme |
| **Argent/Chrome** | Neutre, processus, méthode | Main robotique, flèche, structure |

### Règles de placement
```
- Toujours positionné côté droit du slide
- Occupe 55-65% de la largeur du canvas
- TOUJOURS croppé sur au moins 1 bord (droit ou bas)
- Jamais centré, jamais flottant au milieu
- Glow ambiant de la couleur de l'objet sur le fond
- Qualité : hyper-réaliste, studio lighting, premium CGI
```

### Règle fond/objet
```
Fond clair (crème/blanc) → Objet doré ou bleu-violet
Fond sombre (vert/navy)  → Objet doré ou rouge
Jamais argent sur fond clair (pas assez de contraste)
```

---

## 7. Règles de Composition

### Zones du slide (1080×1080px)
```
┌────────────────────────────────────────┐
│ [TAG]              [INFO / NUM]         │ ← Top row : 52px margins
│                                         │
│ Titre              [                    │
│ principal          [                    │
│ ici.■              [   OBJET 3D         │
│                    [   HÉROS            │
│ Corps italic       [   (55-65%          │
│ en dessous         [   du slide)        │
│ ─────              [                    │
│ Attribution        [                    │
│                                         │
│ →                                       │ ← Flèche : 28pt
├────────────────────────────────────────┤
│ ● Levo                       Suite →   │ ← Footer : 48px
└────────────────────────────────────────┘
```

### Marges
- Toutes les marges : **48px minimum**
- Espacement entre titre et corps : **20-24px**
- Espacement entre corps et séparateur : **20px**
- Espacement entre séparateur et attribution : **14px**

### Espace blanc
- Minimum 20% du slide doit rester vide (hors objet 3D)
- Ne jamais remplir tous les espaces
- Le silence visuel est une force, pas un manque

---

## 8. Règles Rédactionnelles

### Ton de voix
```
INTERDIT                        AUTORISÉ
──────────────────────          ──────────────────────
Jargon IA (LLM, tokens)         Langage business concret
"Révolutionnaire"               "Ça leur fait gagner 3h"
Phrases de +12 mots             Phrases courtes, directes
Promesses vagues                Chiffres réels uniquement
Emojis dans les slides          Zéro emoji
```

### Structure narrative d'un carrousel
```
Slide 1 : Hook — Le résultat ou le problème choc
Slide 2 : Contexte — Qui, quelle situation
Slide 3 : Solution — Ce qu'on a construit
Slide 4 : Preuve — Chiffres et détails
Slide 5 : Témoignage — Citation client réelle
Slide 6 : CTA — Audit gratuit, sans engagement
```

### Règle pour les études de cas
- Les mots du client restent tels quels
- Robin fournit : le contexte, les chiffres, la citation
- LUNA formate : structure, hiérarchie, slide par slide
- Jamais inventer un chiffre ou une citation

---

## 9. Rythme du Feed Instagram

### Alternance couleurs (sur 9 posts = 3 rangées)
```
Rangée 1 : Sombre / Clair  / Sombre
Rangée 2 : Clair  / Sombre / Clair
Rangée 3 : Sombre / Clair  / Sombre
```

### Alternance thématiques (sur 9 posts)
```
Post 1 : Cas client (résultat)
Post 2 : Hook problème
Post 3 : Éducatif
Post 4 : Hook problème
Post 5 : Méthode
Post 6 : Solution/Produit
Post 7 : Cas client (contexte)
Post 8 : Éducatif
Post 9 : CTA
```

---

## 10. Éléments Interdits

```
❌ Fond orange, terracotta, gradient chaud
❌ Tout en majuscules (sauf labels 10pt)
❌ Typographie ultra-condensed oversized
❌ Texte qui prend plus de 50% du slide
❌ Plus de 2 polices différentes par slide
❌ Objets 3D argentés sur fond clair
❌ Slides surchargés (plus de 4 éléments texte)
❌ Emojis dans les slides
❌ Jargon technique IA
❌ Chiffres ou citations inventés
❌ Footer différent d'un slide à l'autre
❌ ■ ou → dans une autre couleur que #1A3BFF
```

---

## 11. Slide de Référence Absolu

Le slide validé le 25 juin 2026 :

```
"3 heures récupérées par jour.■"
Fond : Crème #F0EDE6
Font : Serif élégant, mixed case, 54pt bold
3D   : Sablier doré, très grand, croppé droite+bas
Corps: "Sans embaucher. / Sans changer leurs outils."
       Serif italic, 18pt, #777777
Sépar: Ligne 0.5px #1A3BFF, 48px
Attrib: "Harmonie Yacht — cas client 2025"
Flèche: → #1A3BFF 28pt, bas gauche
Footer: ● Levo / Suite →
```

**Ce slide est la référence de qualité minimum pour tout contenu Levo.**

---

## 12. Log des Améliorations

*Ce log est mis à jour à la fin de chaque session de validation.*

### Session 1 — 25 juin 2026
**Pivot majeur validé :**
- Abandon de Barlow Condensed Black oversized
- Adoption du serif élégant mixed case
- Le 3D devient le héros, le texte l'invité
- Fond crème comme fond principal
- Espace blanc = décision de design

**Appris des itérations :**
- Les objets 3D dorés sur fond sombre performent mieux visuellement
- Les objets argentés sur fond clair manquent de contraste
- La police doit être cohérente sur tous les slides d'un même carrousel
- Le style doit refléter le site web, pas des comptes créatifs

**Prochaines validations à faire :**
- Slides 2 et 3 du carrousel Harmonie Yacht dans le nouveau style
- Carrousel complet publié et métriques collectées
- Ajustements selon les retours terrain

---
*LEVO Brand System v1.0 — Document vivant — Mis à jour à chaque session*
