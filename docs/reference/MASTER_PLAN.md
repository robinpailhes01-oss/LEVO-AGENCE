# LEVO — Master Build Plan
**Pour Claude Code — Plan d'exécution complet**
**Version 1.0 — 26 juin 2026**

---

## CONTEXTE

Levo est une agence IA basée à Montpellier qui automatise les tâches répétitives des PME.
L'objectif est que l'agence tourne quasi-autonomement via des agents IA.

**Stack technique :** Next.js 14 App Router · Supabase · n8n · Vercel · Claude API
**Repo GitHub :** à connecter
**Domaine :** levo-plum.vercel.app (existant, à faire évoluer)

---

## VISION FINALE

Robin ouvre son dashboard le matin et voit :
- Les posts LUNA en attente de validation (généré automatiquement)
- Les leads ORION qualifiés de la semaine
- Le rapport HERMES avec les KPIs
- L'état de ses clients et projets

Il valide, clique, et l'agence avance. Il passe 30 min par jour dessus max.

---

## ORDRE D'EXÉCUTION — 5 PHASES

```
Phase 1 → Fondations (Supabase + MCP custom)
Phase 2 → Dashboard skeleton (Next.js)
Phase 3 → LUNA dans le dashboard
Phase 4 → ORION dans le dashboard
Phase 5 → HERMES dans le dashboard
```

---

# PHASE 1 — FONDATIONS

## 1A. Schéma Supabase Complet

Créer toutes les tables dans Supabase. Projet existant à utiliser.

### Table : clients
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  sector TEXT,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'churned', 'prospect')),
  mrr DECIMAL(10,2) DEFAULT 0,
  agent_name TEXT,
  notes TEXT,
  contract_start DATE,
  next_review DATE
);
```

### Table : leads
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  full_name TEXT,
  company TEXT,
  sector TEXT,
  email TEXT,
  linkedin_url TEXT,
  instagram_handle TEXT,
  source TEXT CHECK (source IN ('instagram', 'linkedin', 'referral', 'website', 'cold_email')),
  score INTEGER DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'responded', 'qualified', 'proposal', 'won', 'lost')),
  last_touch TIMESTAMP,
  notes TEXT,
  assigned_agent TEXT DEFAULT 'ORION',
  pain_points TEXT[],
  enrichment_data JSONB
);
```

### Table : content_calendar
```sql
CREATE TABLE content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  title TEXT NOT NULL,
  theme TEXT CHECK (theme IN ('cas_client', 'hook_probleme', 'educatif', 'solution', 'methode')),
  platform TEXT[] DEFAULT '{instagram,facebook}',
  status TEXT DEFAULT 'idea' CHECK (status IN ('idea', 'approved_idea', 'drafted', 'approved_content', 'generating', 'ready', 'scheduled', 'published')),
  hook_slide1 TEXT,
  slides_content JSONB,
  image_prompts JSONB,
  generated_images TEXT[],
  caption TEXT,
  hashtags TEXT[],
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  created_by TEXT DEFAULT 'LUNA',
  approved_by TEXT,
  client_ref TEXT
);
```

### Table : content_performance
```sql
CREATE TABLE content_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content_calendar(id),
  measured_at TIMESTAMP DEFAULT NOW(),
  platform TEXT,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  profile_visits INTEGER DEFAULT 0,
  link_clicks INTEGER DEFAULT 0
);
```

### Table : agent_logs
```sql
CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  agent_name TEXT NOT NULL CHECK (agent_name IN ('LUNA', 'ORION', 'HERMES', 'LEA', 'VEILLE')),
  action TEXT NOT NULL,
  input_data JSONB,
  output_data JSONB,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'pending', 'skipped')),
  duration_ms INTEGER,
  cost_tokens INTEGER,
  error_message TEXT
);
```

### Table : proposals
```sql
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  lead_id UUID REFERENCES leads(id),
  title TEXT,
  content TEXT,
  amount DECIMAL(10,2),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected')),
  sent_at TIMESTAMP,
  valid_until DATE,
  services JSONB,
  generated_by TEXT DEFAULT 'ORION'
);
```

### Table : weekly_reports
```sql
CREATE TABLE weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  mrr_total DECIMAL(10,2),
  mrr_change DECIMAL(5,2),
  leads_new INTEGER DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  posts_published INTEGER DEFAULT 0,
  posts_avg_engagement DECIMAL(5,2),
  top_post_id UUID REFERENCES content_calendar(id),
  report_content TEXT,
  recommendations TEXT[],
  generated_by TEXT DEFAULT 'HERMES'
);
```

### Table : settings
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Valeurs par défaut
INSERT INTO settings (key, value) VALUES
('luna_auto_generate', 'false'),
('luna_posts_per_week', '3'),
('orion_daily_limit', '10'),
('hermes_report_day', '"monday"'),
('target_mrr', '5000'),
('agency_name', '"Levo"'),
('agency_location', '"Montpellier"');
```

---

## 1B. MCP Levo Personnalisé

Créer un serveur MCP custom en Node.js (TypeScript) qui expose les données Levo à tous les agents Claude.

**Localisation :** `/levo-mcp/` (repo séparé ou dans le monorepo)

### Structure du projet MCP
```
levo-mcp/
├── src/
│   ├── index.ts          # Point d'entrée MCP
│   ├── tools/
│   │   ├── content.ts    # Outils LUNA
│   │   ├── leads.ts      # Outils ORION
│   │   ├── analytics.ts  # Outils HERMES
│   │   ├── clients.ts    # Gestion clients
│   │   └── logs.ts       # Logging agents
│   └── supabase.ts       # Client Supabase
├── package.json
└── .env
```

### Tools MCP à créer

**Content Tools (LUNA)**
```typescript
// get_content_calendar
// Input: { status?: string, limit?: number }
// Output: Liste des posts dans le calendrier

// create_content_idea
// Input: { title, theme, hook_slide1, platform[] }
// Output: ID du nouveau post créé

// update_content_status
// Input: { id, status, slides_content?, image_prompts?, caption? }
// Output: Post mis à jour

// get_content_performance
// Input: { content_id }
// Output: Métriques du post

// log_agent_action
// Input: { agent_name, action, input_data, output_data, status }
// Output: Log créé
```

**Leads Tools (ORION)**
```typescript
// get_leads
// Input: { status?, score_min?, limit? }
// Output: Liste des leads

// create_lead
// Input: { full_name, company, email, source, linkedin_url? }
// Output: Lead créé

// update_lead
// Input: { id, status?, score?, notes?, enrichment_data? }
// Output: Lead mis à jour

// create_proposal
// Input: { lead_id, title, amount, services, content }
// Output: Proposition créée
```

**Analytics Tools (HERMES)**
```typescript
// get_weekly_stats
// Input: { week_start }
// Output: Stats agrégées de la semaine

// get_top_content
// Input: { limit?, metric? }
// Output: Posts les plus performants

// get_lead_pipeline
// Input: {}
// Output: Leads par statut avec comptages

// create_weekly_report
// Input: { week_start, week_end, content }
// Output: Rapport créé
```

**Clients Tools**
```typescript
// get_clients
// Input: { status? }
// Output: Liste des clients

// get_client
// Input: { id }
// Output: Détail d'un client avec historique

// update_client
// Input: { id, ...fields }
// Output: Client mis à jour
```

### Configuration MCP (pour claude_desktop_config.json)
```json
{
  "mcpServers": {
    "levo": {
      "command": "node",
      "args": ["/path/to/levo-mcp/dist/index.js"],
      "env": {
        "SUPABASE_URL": "...",
        "SUPABASE_SERVICE_KEY": "..."
      }
    }
  }
}
```

---

# PHASE 2 — DASHBOARD SKELETON

## Structure Next.js

```
levo-dashboard/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Redirect vers /dashboard
│   ├── dashboard/
│   │   ├── layout.tsx              # Sidebar + header
│   │   ├── page.tsx                # Overview / Home
│   │   ├── luna/
│   │   │   ├── page.tsx            # Calendrier contenu + validation
│   │   │   └── [id]/page.tsx       # Détail d'un post
│   │   ├── orion/
│   │   │   ├── page.tsx            # Pipeline leads
│   │   │   └── [id]/page.tsx       # Détail d'un lead
│   │   ├── hermes/
│   │   │   └── page.tsx            # Rapports hebdo
│   │   ├── clients/
│   │   │   ├── page.tsx            # Liste clients
│   │   │   └── [id]/page.tsx       # Détail client
│   │   └── settings/
│   │       └── page.tsx            # Paramètres agence
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── dashboard/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── StatCard.tsx
│   ├── luna/
│   │   ├── ContentCalendar.tsx
│   │   ├── PostCard.tsx
│   │   └── ValidationPanel.tsx
│   ├── orion/
│   │   ├── LeadPipeline.tsx
│   │   └── LeadCard.tsx
│   └── hermes/
│       └── WeeklyReport.tsx
├── lib/
│   ├── supabase.ts                 # Client Supabase
│   └── claude.ts                  # Client Claude API
└── .env.local
```

## Design du Dashboard

**Palette :** Même que le site — crème/noir/bleu #1A3BFF
**Font :** Inter (dashboard) + serif pour les titres
**Style :** Minimal, épuré, comme le site web

### Page Overview (dashboard/page.tsx)

KPIs en haut :
- CA mensuel (MRR)
- Posts publiés cette semaine
- Leads qualifiés ce mois
- Clients actifs

Section milieu :
- 3 posts en attente de validation (LUNA)
- 3 leads chauds (ORION)

Section bas :
- Dernière activité des agents (agent_logs)

### Page LUNA (dashboard/luna/page.tsx)

Kanban horizontal :
```
[Idée] → [Contenu rédigé] → [À valider] → [Prêt] → [Publié]
```

Pour chaque post "À valider" :
- Slides content (texte)
- Prompts image générés
- Caption + hashtags
- Boutons : ✅ Valider | ✏️ Modifier | ❌ Rejeter

### Page ORION (dashboard/orion/page.tsx)

Pipeline Kanban :
```
[Nouveau] → [Contacté] → [Répondu] → [Qualifié] → [Proposition] → [Gagné/Perdu]
```

Pour chaque lead :
- Score (0-100) avec badge couleur
- Source (Instagram/LinkedIn/Referral)
- Pain points détectés
- Dernière action ORION
- Bouton : Voir proposition générée

### Page HERMES (dashboard/hermes/page.tsx)

Rapport de la semaine :
- KPIs vs semaine précédente
- Post le plus performant
- Recommandations HERMES (top 3 actions)
- Graphique engagement sur 30j
- Pipeline leads en résumé

---

# PHASE 3 — LUNA DANS LE DASHBOARD

## Workflow LUNA complet

```
1. [Automatique ou Manuel] LUNA génère 7 idées
   → Stockées dans content_calendar (status: 'idea')
   → Affichées dans le dashboard

2. [Robin] Valide les idées en 1 clic
   → Status → 'approved_idea'

3. [Automatique] LUNA rédige le contenu complet
   → Texte de chaque slide
   → Prompts ChatGPT Image 2
   → Caption + hashtags
   → Status → 'drafted'

4. [Robin] Valide le contenu
   → Status → 'approved_content'

5. [Robin] Génère les visuels dans ChatGPT Image 2
   → Upload les images dans Supabase Storage
   → Status → 'ready'

6. [Manuel pour l'instant] Publier sur Instagram
   → Status → 'published'
   → Métriques collectées J+48
```

## Déclenchement LUNA

Deux modes depuis le dashboard :
- **Automatique :** bouton "Générer les idées de la semaine" → appel Claude API avec LUNA System Prompt
- **Manuel :** formulaire "Nouvelle idée" avec thème + hook

## API Route : /api/luna/generate-ideas

```typescript
// POST /api/luna/generate-ideas
// Body: { count: number, themes?: string[] }
// 
// 1. Appel Claude API avec LUNA_SYSTEM_PROMPT
// 2. Parse le JSON retourné
// 3. Insert dans content_calendar
// 4. Retourne les IDs créés
```

## API Route : /api/luna/draft-content

```typescript
// POST /api/luna/draft-content
// Body: { content_id: string }
//
// 1. Récupère l'idée approuvée depuis Supabase
// 2. Appel Claude API avec LUNA + contexte brand
// 3. Génère slides, prompts, caption
// 4. Update content_calendar
// 5. Status → 'drafted'
```

---

# PHASE 4 — ORION DANS LE DASHBOARD

## System Prompt ORION

ORION est l'agent d'acquisition de Levo. Il trouve, qualifie et approche des prospects PME.

**Offre d'entrée :** Audit gratuit, 30 minutes, sans engagement.

**Cible :** Dirigeants PME, 40-50 ans, Sud de France prioritairement, tous secteurs.

**Ton :** Direct, professionnel, jamais pushy. On apporte de la valeur avant de vendre.

**Sources de leads :**
- Instagram (comptes de PME locales)
- LinkedIn (gérants, directeurs)
- Referrals clients existants

### Tâches ORION
1. Analyser un profil LinkedIn/Instagram → produire un profil enrichi
2. Rédiger un cold email personnalisé (based sur profil)
3. Rédiger un DM Instagram personnalisé
4. Scorer un lead (0-100) selon critères
5. Générer une proposition commerciale depuis un brief

### Critères de scoring
```
+20 : PME avec équipe (2-50 personnes)
+20 : Secteur service ou commerce (pas industrie lourde)
+15 : Présence digitale active (site web, réseaux)
+15 : Geolocalisation Sud de France
+10 : Dirigeant/gérant identifié et contactable
+10 : Pain points visibles (beaucoup de demandes, équipe débordée)
+10 : Budget apparent (entreprise saine, CA visible)
-10 : Concurrent direct
-20 : Trop grande structure (>200 employés)
```

## Workflow ORION

```
1. [Robin ou Manuel] Ajouter un lead dans le dashboard
   → Profil LinkedIn URL ou Instagram handle

2. [ORION] Enrichissement automatique
   → Analyse publique du profil
   → Score calculé
   → Pain points identifiés

3. [ORION] Génère cold email + DM Instagram
   → Templates personnalisés
   → Affichés dans dashboard pour approbation

4. [Robin] Valide et envoie
   → Manuellement pour l'instant

5. [ORION] Suivi
   → Si pas de réponse J+3 : relance 1
   → Si pas de réponse J+7 : relance 2
   → Alertes dans dashboard
```

## API Route : /api/orion/enrich-lead

```typescript
// POST /api/orion/enrich-lead
// Body: { lead_id: string }
//
// 1. Récupère le lead depuis Supabase
// 2. Appel Claude API avec ORION System Prompt
// 3. Analyse le profil public
// 4. Calcule le score
// 5. Update leads table
```

## API Route : /api/orion/generate-outreach

```typescript
// POST /api/orion/generate-outreach
// Body: { lead_id: string, type: 'email' | 'dm' }
//
// 1. Récupère le profil enrichi
// 2. Appel Claude API avec contexte lead
// 3. Génère message personnalisé
// 4. Stocke dans proposals ou lead notes
```

---

# PHASE 5 — HERMES DANS LE DASHBOARD

## System Prompt HERMES

HERMES est l'agent analytique de Levo. Il lit les données Supabase, détecte les tendances, et produit des rapports actionnables.

**Rapport hebdomadaire (lundi 8h) :**
```
1. KPIs semaine (CA, leads, posts, engagement)
2. Comparaison semaine précédente
3. Post le plus performant + pourquoi
4. Lead le plus chaud
5. Top 3 actions recommandées pour la semaine
6. Alertes si quelque chose cloche
```

## n8n Workflow HERMES (la seule vraie utilité de n8n)

```
Trigger: Cron lundi 8h
→ Récupérer données Supabase (derniers 7 jours)
→ Appel Claude API avec HERMES System Prompt + données
→ Stocker rapport dans weekly_reports
→ Envoyer email à Robin
→ Notifier dans le dashboard
```

---

# FICHIERS DE CONFIGURATION

## CLAUDE.md (racine du projet)

```markdown
# LEVO — Configuration Claude Code

## Identité
Tu travailles sur Levo, une agence IA à Montpellier.
Stack: Next.js 14, Supabase, n8n, Vercel, Claude API.

## Structure du projet
/app → Next.js App Router
/components → Composants React
/lib → Utilitaires (Supabase client, Claude client)
/levo-mcp → MCP custom Levo

## Conventions
- TypeScript strict
- Tailwind CSS pour les styles
- shadcn/ui pour les composants UI
- Supabase pour toutes les données
- Pas de localStorage (tout dans Supabase)

## Agents actifs
- LUNA (contenu) → System Prompt dans /prompts/LUNA.md
- ORION (acquisition) → System Prompt dans /prompts/ORION.md
- HERMES (analytics) → System Prompt dans /prompts/HERMES.md
- LÉA (Harmonie Yacht) → Déployé sur WhatsApp

## Variables d'environnement requises
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=

## Design system
- Couleurs: crème #F0EDE6 / noir #1A1A1A / bleu #1A3BFF / navy #0D1117
- Fonts: Cormorant Garamond (display) + Inter (body)
- Style: minimal, épuré, premium B2B
- Référence: levo-plum.vercel.app
```

## Structure des dossiers Skills

```
/prompts/
├── LUNA.md               # System Prompt LUNA complet
├── ORION.md              # System Prompt ORION complet
├── HERMES.md             # System Prompt HERMES
└── LEA.md                # System Prompt Léa (Harmonie Yacht)

/skills/
├── CAROUSEL_DESIGN.md    # Charte design carrousels
├── brand-guidelines.md   # Identité visuelle Levo
└── tone-of-voice.md      # Règles rédactionnelles
```

---

# VARIABLES D'ENVIRONNEMENT

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://dashboard.levo.ia

# Instagram (pour métriques - Phase 3)
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_BUSINESS_ACCOUNT_ID=

# n8n (pour workflows schedulés)
N8N_WEBHOOK_URL=
N8N_API_KEY=
```

---

# CHECKLIST D'EXÉCUTION POUR CLAUDE CODE

## Phase 1 — Supabase + MCP (Faire en premier)
- [ ] Créer toutes les tables SQL dans Supabase
- [ ] Activer Row Level Security sur toutes les tables
- [ ] Créer le projet levo-mcp en TypeScript
- [ ] Implémenter tous les tools MCP listés
- [ ] Tester la connexion MCP depuis Claude Desktop
- [ ] Déployer le MCP (Railway ou Render)

## Phase 2 — Dashboard Skeleton
- [ ] Créer le projet Next.js 14 avec App Router
- [ ] Installer shadcn/ui + Tailwind
- [ ] Créer la sidebar avec les 5 sections
- [ ] Créer le layout principal
- [ ] Connecter Supabase (lecture seule pour commencer)
- [ ] Afficher les données réelles sur Overview
- [ ] Déployer sur Vercel

## Phase 3 — LUNA
- [ ] Créer /api/luna/generate-ideas
- [ ] Créer /api/luna/draft-content
- [ ] Créer le composant ContentCalendar (kanban)
- [ ] Créer le composant ValidationPanel
- [ ] Tester le flow complet idée → validation → prêt

## Phase 4 — ORION
- [ ] Créer /api/orion/enrich-lead
- [ ] Créer /api/orion/generate-outreach
- [ ] Créer le composant LeadPipeline (kanban)
- [ ] Tester le flow lead → enrichissement → message

## Phase 5 — HERMES
- [ ] Créer /api/hermes/generate-report
- [ ] Créer le workflow n8n lundi 8h
- [ ] Créer le composant WeeklyReport
- [ ] Tester la génération du premier rapport

---

# NOTES IMPORTANTES POUR CLAUDE CODE

1. **Tout passe par Supabase** — jamais de localStorage, jamais de state côté client pour les données métier.

2. **Les appels Claude API se font côté serveur** — jamais exposer ANTHROPIC_API_KEY dans le navigateur. Toujours via des API routes Next.js.

3. **Design fidèle au site** — levo-plum.vercel.app est la référence visuelle. Le dashboard doit avoir le même ADN : crème, noir, bleu #1A3BFF, Inter, Cormorant Garamond.

4. **TypeScript strict** — pas de `any`, typer toutes les réponses Supabase.

5. **Gestion d'erreurs** — tous les appels Claude API et Supabase doivent avoir des try/catch avec logging dans agent_logs.

6. **Mobile responsive** — Robin utilise son dashboard sur iPhone aussi.

7. **Pas d'auth complexe** — pour l'instant, une simple variable d'environnement DASHBOARD_PASSWORD suffit. On ajoutera Clerk plus tard si besoin.

---

*Levo Master Plan v1.0 — Document vivant*
*Mis à jour après chaque session avec Robin*


---

# COMPLÉMENTS — Ajoutés après révision

## A. MCP Custom — Hébergement

**Choix retenu : Vercel API Routes (déjà dans la stack)**

Le MCP Levo est hébergé directement dans le projet Next.js sur Vercel.
Pas de service séparé. Zéro coût. Déploiement automatique via git push.

```
/app/api/mcp/
├── content/route.ts     # Tools LUNA
├── leads/route.ts       # Tools ORION
├── analytics/route.ts   # Tools HERMES
└── clients/route.ts     # Tools clients
```

Sécurisation via header `Authorization: Bearer LEVO_MCP_SECRET`
La variable LEVO_MCP_SECRET est dans les env vars Vercel.

**Configuration dans claude_desktop_config.json :**
```json
{
  "mcpServers": {
    "levo": {
      "type": "http",
      "url": "https://dashboard.levo.ia/api/mcp",
      "headers": {
        "Authorization": "Bearer LEVO_MCP_SECRET_ICI"
      }
    }
  }
}
```

---

## B. System Prompt ORION — Complet

```
Tu es ORION, l'agent d'acquisition de Levo.
Tu trouves, qualifies et approches des dirigeants de PME 
pour leur proposer un audit gratuit de 30 minutes.

CONTEXTE LEVO :
- Agence IA à Montpellier, spécialisée automatisation PME
- Offre d'entrée : audit gratuit, sans engagement
- Cible : dirigeants 40-50 ans, PME 2-50 personnes
- Sud de France en priorité, tous secteurs services

TON DE VOIX :
- Direct, professionnel, jamais pushy
- On apporte de la valeur avant de vendre
- On parle résultats concrets, pas technologie
- Vouvoiement obligatoire
- Maximum 4 lignes par message

QUAND TU ENRICHIS UN LEAD, tu analyses :
1. Le secteur et la taille de l'entreprise
2. Les pain points probables (cherche les indices publics)
3. Le niveau de maturité digitale
4. La capacité d'investissement probable
5. Le meilleur angle d'approche

SCORING LEAD (0-100) :
+20 : PME 2-50 personnes
+20 : Secteur services/commerce
+15 : Présence digitale active
+15 : Géolocalisation Sud de France
+10 : Dirigeant identifié et contactable
+10 : Pain points visibles publiquement
+10 : Entreprise saine financièrement
-10 : Concurrent direct IA
-20 : Structure >200 personnes

FORMAT COLD EMAIL :
- Objet : court, personnel, pas commercial
- Ligne 1 : accroche sur LEUR activité (pas Levo)
- Ligne 2-3 : pain point probable + résultat concret
- Ligne 4 : proposition d'audit gratuit
- Signature : Robin, Levo
- Max 6 lignes total

FORMAT DM INSTAGRAM :
- Référence un post récent de leur compte
- Pain point en 1 phrase
- Offre audit en 1 phrase
- Max 3 lignes total
```

---

## C. System Prompt HERMES — Complet

```
Tu es HERMES, l'agent analytique de Levo.
Tu lis les données de l'agence et produis des insights actionnables.
Ton rôle : dire à Robin quoi faire cette semaine, pas juste quoi observer.

CHAQUE LUNDI 8H, tu produis un rapport qui contient :

1. CHIFFRES SEMAINE (comparaison semaine précédente)
   - MRR total et variation
   - Nouveaux leads / leads qualifiés
   - Posts publiés / engagement moyen
   - Propositions envoyées / taux réponse

2. ANALYSE CONTENU
   - Post le plus performant + pourquoi il a marché
   - Post le moins performant + ce qu'il faut éviter
   - Recommandation format pour la semaine suivante

3. ANALYSE ACQUISITION
   - Lead le plus chaud du moment
   - Source qui performe le mieux
   - Recommandation canal à prioriser

4. TOP 3 ACTIONS SEMAINE
   Format : "Action concrète → Impact attendu"
   Exemple : "Publier un post cas client → +30% engagement estimé"

5. ALERTES si :
   - Aucun post publié depuis 5 jours
   - Lead chaud sans contact depuis 3 jours
   - MRR en baisse 2 semaines consécutives

TON : Analytique, direct, sans fioritures.
Tu ne commentes pas. Tu recommandes.
```

---

## D. Sous-Agent Veille (LUNA)

**Nom :** VEILLE
**Rôle :** Générer des idées de contenu en analysant des comptes Instagram similaires

**Comptes à surveiller (à enrichir par Robin) :**
- Comptes agences IA francophones
- Comptes consultants business PME
- Comptes entrepreneurs Sud de France
- Comptes thématiques automatisation/productivité

**Workflow technique :**
```
1. Apify scrape les 10 derniers posts des comptes listés
   → Format : {account, caption, likes, comments, saves, date}
   
2. VEILLE analyse avec Claude API :
   → Identifie les formats qui performent (>moy engagement)
   → Identifie les thèmes qui résonnent
   → Génère 7 idées adaptées à Levo
   
3. Stocke les idées dans content_calendar (status: 'idea')
4. Robin valide dans le dashboard
```

**API Route : /api/veille/generate-ideas**

Déclenché : manuellement depuis dashboard OU automatique dimanche soir
Fréquence recommandée : 1 fois par semaine

**Table Supabase supplémentaire :**
```sql
CREATE TABLE watched_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT CHECK (platform IN ('instagram', 'linkedin')),
  handle TEXT NOT NULL,
  category TEXT,
  active BOOLEAN DEFAULT true,
  last_scraped TIMESTAMP
);
```

---

## E. Onboarding Nouveau Client

Quand Robin signe un nouveau client, voici ce qui doit se passer automatiquement :

```
1. Robin crée le client dans le dashboard
   → Renseigne : nom, secteur, email, services, MRR

2. Dashboard génère automatiquement :
   → Email de bienvenue personnalisé (template Levo)
   → Fiche projet dans Supabase
   → Checklist onboarding

3. Si agent IA prévu :
   → Fork du System Prompt Léa avec customisation client
   → Stocké dans /prompts/clients/[nom-client].md
```

---

## F. Design System Dashboard

Le dashboard doit être visuellement cohérent avec le site levo-plum.vercel.app.

**CSS Variables à définir dans globals.css :**
```css
:root {
  --levo-cream: #F0EDE6;
  --levo-black: #1A1A1A;
  --levo-navy: #0D1117;
  --levo-blue: #1A3BFF;
  --levo-green: #1A2E1A;
  --levo-gray: #888888;
  --levo-white: #FFFFFF;
  
  --font-display: 'Cormorant Garamond', serif;
  --font-body: 'Inter', sans-serif;
  
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
}
```

**Composants shadcn/ui à installer :**
- Button, Card, Badge, Dialog, Sheet
- Table, Select, Input, Textarea
- Tabs, Separator, Avatar
- Toast (pour les confirmations)

---

## G. Auth Dashboard — Simple et Sécurisé

Pas besoin de Clerk ou NextAuth pour commencer.
Solution : middleware Next.js avec cookie signé.

```typescript
// middleware.ts
// Vérifie un cookie de session signé
// Login via /login avec le DASHBOARD_PASSWORD env var
// Session valide 30 jours
```

Variables d'environnement à ajouter :
```
DASHBOARD_PASSWORD=mot_de_passe_fort_ici
NEXTAUTH_SECRET=secret_pour_signer_cookies
```

---

## H. Emails Transactionnels (HERMES Reports)

Service : **Resend** (gratuit jusqu'à 3000 emails/mois)
Usage : Rapport hebdo HERMES + alertes importantes

```
RESEND_API_KEY=re_...
EMAIL_FROM=hermes@levo.ia
EMAIL_TO=robin@levo.ia
```

---

## I. Instructions Autonomie — Pour Claude Code

Claude Code doit exécuter ce plan avec un maximum d'autonomie.

**Ce que Claude Code doit faire sans demander :**
- Choisir les patterns d'implémentation les plus robustes
- Créer tous les fichiers de configuration
- Gérer les cas d'erreur et edge cases
- Écrire les types TypeScript complets
- Créer les migrations Supabase
- Faire des choix d'UI sensés basés sur le design system Levo
- Installer les dépendances nécessaires
- Documenter le code avec des commentaires clairs

**Ce que Claude Code doit faire avant de continuer :**
- Tester que chaque API route fonctionne
- Vérifier que la connexion Supabase est opérationnelle
- S'assurer que le dashboard est responsive mobile
- Valider que le MCP répond correctement

**Format des livrables attendus :**
Après chaque phase, Claude Code doit fournir :
1. Liste des fichiers créés
2. URL de test si applicable
3. Variables d'environnement à ajouter
4. Prochaine phase recommandée

**Niveau de complétude attendu :**
Pas de scaffolding, pas de "TODO: implement this".
Chaque feature livrée doit être 100% fonctionnelle.

---

## J. Variables d'Environnement — Liste Complète

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Auth Dashboard
DASHBOARD_PASSWORD=
NEXTAUTH_SECRET=

# MCP Security
LEVO_MCP_SECRET=

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=hermes@levo.ia
EMAIL_TO=

# App
NEXT_PUBLIC_APP_URL=https://levo-plum.vercel.app

# n8n (pour workflows planifiés)
N8N_WEBHOOK_SECRET=

# Instagram (Phase 3 - plus tard)
# INSTAGRAM_ACCESS_TOKEN=
# INSTAGRAM_BUSINESS_ACCOUNT_ID=

# Apify (pour VEILLE - Phase 3)
# APIFY_API_TOKEN=
```
