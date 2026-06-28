/**
 * Static mock data for the visual dashboard.
 * No backend, no API, no env — everything lives here.
 */

export type AgentKey = "luna" | "orion" | "hermes" | "veille";
export type AgentStatus = "active" | "working" | "idle";

export interface AgentMock {
  key: AgentKey;
  name: string;
  role: string;
  color: string;
  avatar: string;
  status: AgentStatus;
  speech: string;
  stat: { value: string; label: string };
}

export const AGENTS_MOCK: AgentMock[] = [
  {
    key: "luna",
    name: "LUNA",
    role: "Création de contenu",
    color: "#1A3BFF",
    avatar: "/avatars/luna.png",
    status: "working",
    speech: "2 carrousels prêts à valider, je peaufine les visuels…",
    stat: { value: "2", label: "posts à valider" },
  },
  {
    key: "orion",
    name: "ORION",
    role: "Acquisition & leads",
    color: "#1D9E75",
    avatar: "/avatars/orion.png",
    status: "active",
    speech: "3 leads ont répondu ce matin, deux sont très chauds.",
    stat: { value: "47", label: "séquences actives" },
  },
  {
    key: "hermes",
    name: "HERMES",
    role: "Analytics & rapports",
    color: "#BA7517",
    avatar: "/avatars/hermes.png",
    status: "idle",
    speech: "Rapport prêt. Engagement +24% cette semaine.",
    stat: { value: "Lundi 8h", label: "prochain rapport" },
  },
  {
    key: "veille",
    name: "VEILLE",
    role: "Veille concurrentielle",
    color: "#7B2FBE",
    avatar: "/avatars/veille.png",
    status: "active",
    speech: "4 nouvelles idées à trier depuis la concurrence.",
    stat: { value: "4", label: "idées à trier" },
  },
];

export interface KpiMock {
  label: string;
  value: string;
  trend: string;
  direction: "up" | "down" | "flat";
  icon: "euro" | "users" | "image" | "heart";
  accent: string;
  spark: number[];
}

export const KPIS_MOCK: KpiMock[] = [
  {
    label: "MRR",
    value: "3 500 €",
    trend: "+12%",
    direction: "up",
    icon: "euro",
    accent: "#1A3BFF",
    spark: [2100, 2300, 2250, 2600, 2800, 2750, 3100, 3500],
  },
  {
    label: "Leads actifs",
    value: "47",
    trend: "+8",
    direction: "up",
    icon: "users",
    accent: "#1D9E75",
    spark: [28, 31, 30, 35, 33, 39, 42, 47],
  },
  {
    label: "Posts ce mois",
    value: "8",
    trend: "2 en attente",
    direction: "flat",
    icon: "image",
    accent: "#BA7517",
    spark: [3, 4, 4, 5, 6, 6, 7, 8],
  },
  {
    label: "Engagement",
    value: "4.2%",
    trend: "+0.8%",
    direction: "up",
    icon: "heart",
    accent: "#7B2FBE",
    spark: [2.8, 3.0, 3.4, 3.2, 3.6, 3.9, 4.0, 4.2],
  },
];

/* ----------------------------- Charts ----------------------------- */

export const PERF_LABELS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];

export const PERF_SERIES = [
  { name: "Engagement", color: "#1A3BFF", data: [22, 26, 24, 31, 29, 36, 40, 46] },
  { name: "Leads", color: "#1D9E75", data: [12, 16, 18, 17, 24, 26, 31, 38] },
  { name: "Portée (k)", color: "#7B2FBE", data: [28, 30, 34, 33, 38, 41, 44, 50] },
];

// Cohesive blue→violet analogous ramp (premium, not rainbow).
export const LEAD_SOURCES = [
  { label: "Instagram", value: 42, color: "#1A3BFF" },
  { label: "LinkedIn", value: 28, color: "#5566FF" },
  { label: "Referral", value: 18, color: "#8B5CF6" },
  { label: "Cold email", value: 12, color: "#A9B2C7" },
];

// Blue monochrome ramp — reads as one cohesive funnel.
export const FUNNEL_STAGES = [
  { label: "Prospects", value: 1240, color: "#1A3BFF" },
  { label: "Contactés", value: 480, color: "#3E57FF" },
  { label: "Répondus", value: 190, color: "#6477FF" },
  { label: "Qualifiés", value: 72, color: "#8C9AFF" },
  { label: "Clients", value: 14, color: "#B3BCFF" },
];

export const INSIGHT_MOCK = {
  title: "Insight HERMES",
  text: "Le carrousel « 3 signes que ton Insta ne convertit pas » a généré 9 DM. Réplique ce format cette semaine.",
  metric: "+24% engagement",
};

export const TOP_CONTENT = {
  title: "3 signes que ton Insta ne convertit pas",
  meta: "Carrousel · publié le 3 juin",
  saves: 218,
  reach: "6,4k",
  color: "#1A3BFF",
};

export interface ActivityMock {
  agent: AgentKey;
  color: string;
  text: string;
  time: string;
}

export const ACTIVITY_MOCK: ActivityMock[] = [
  { agent: "orion", color: "#1D9E75", text: "ORION a reçu une réponse de Julien Mercier", time: "il y a 12 min" },
  { agent: "luna", color: "#1A3BFF", text: "LUNA a rédigé le carrousel « 5 erreurs LinkedIn »", time: "il y a 38 min" },
  { agent: "veille", color: "#7B2FBE", text: "VEILLE a repéré 4 idées tendance dans ta niche", time: "il y a 1 h" },
  { agent: "hermes", color: "#BA7517", text: "HERMES a finalisé le rapport hebdomadaire", time: "il y a 2 h" },
  { agent: "orion", color: "#1D9E75", text: "ORION a enrichi le profil de Camille Roux (score 82)", time: "il y a 3 h" },
  { agent: "luna", color: "#1A3BFF", text: "LUNA a généré 6 idées de contenu", time: "il y a 5 h" },
];

export interface ToValidateMock {
  title: string;
  meta: string;
  color: string;
}

export const TO_VALIDATE_MOCK: ToValidateMock[] = [
  { title: "5 automatisations IA pour artisans", meta: "Carrousel · 8 slides", color: "#1A3BFF" },
  { title: "Le coût caché de ne pas automatiser", meta: "Carrousel · 10 slides", color: "#0D1117" },
];

export interface HotLeadMock {
  name: string;
  sector: string;
  initials: string;
  score: number;
  color: string;
}

export const HOT_LEADS_MOCK: HotLeadMock[] = [
  { name: "Hugo Mercier", sector: "Coaching sportif", initials: "HM", score: 88, color: "#1D9E75" },
  { name: "Camille Roux", sector: "Architecture", initials: "CR", score: 82, color: "#1A3BFF" },
  { name: "Karim Benali", sector: "Immobilier", initials: "KB", score: 64, color: "#BA7517" },
];

/* ----------------------------- LUNA kanban ----------------------------- */
export interface ContentCardMock {
  title: string;
  type: string;
  slides: number;
  date: string;
}

export interface KanbanColumn<T> {
  key: string;
  label: string;
  items: T[];
}

export const LUNA_BOARD: KanbanColumn<ContentCardMock>[] = [
  {
    key: "idea",
    label: "Idée",
    items: [
      { title: "5 automatisations IA pour artisans", type: "Carrousel", slides: 8, date: "12 juin" },
      { title: "Pourquoi ton Insta ne convertit pas", type: "Carrousel", slides: 7, date: "13 juin" },
    ],
  },
  {
    key: "approved",
    label: "Approuvé",
    items: [
      { title: "Étude de cas — Studio Lumen", type: "Carrousel", slides: 9, date: "10 juin" },
      { title: "3 outils IA gratuits", type: "Reel", slides: 1, date: "11 juin" },
    ],
  },
  {
    key: "drafted",
    label: "Rédigé",
    items: [
      { title: "Le coût caché de ne pas automatiser", type: "Carrousel", slides: 10, date: "9 juin" },
      { title: "Avant / Après — refonte Insta", type: "Carrousel", slides: 6, date: "9 juin" },
    ],
  },
  {
    key: "validated",
    label: "Validé",
    items: [
      { title: "5 erreurs LinkedIn d'indépendants", type: "Carrousel", slides: 8, date: "7 juin" },
    ],
  },
  {
    key: "published",
    label: "Publié",
    items: [
      { title: "3 signes que ton Insta ne convertit pas", type: "Carrousel", slides: 8, date: "3 juin" },
      { title: "La méthode Levo en 60s", type: "Reel", slides: 1, date: "1 juin" },
    ],
  },
];

/* ----------------------------- ORION pipeline ----------------------------- */
export interface LeadCardMock {
  name: string;
  sector: string;
  score: number;
  initials: string;
}

export const ORION_BOARD: KanbanColumn<LeadCardMock>[] = [
  {
    key: "new",
    label: "Nouveau",
    items: [
      { name: "Claire Fontaine", sector: "Fleuriste", score: 45, initials: "CF" },
      { name: "Thomas Lemaire", sector: "Restaurant", score: 52, initials: "TL" },
    ],
  },
  {
    key: "enriched",
    label: "Enrichi",
    items: [
      { name: "Karim Benali", sector: "Immobilier", score: 64, initials: "KB" },
      { name: "Sophie Renard", sector: "Coaching", score: 71, initials: "SR" },
    ],
  },
  {
    key: "qualified",
    label: "Validé",
    items: [
      { name: "Camille Roux", sector: "Architecture", score: 82, initials: "CR" },
    ],
  },
  {
    key: "contacted",
    label: "Contacté",
    items: [
      { name: "Hugo Mercier", sector: "Coaching sportif", score: 88, initials: "HM" },
      { name: "Léa Girard", sector: "Esthétique", score: 76, initials: "LG" },
    ],
  },
  {
    key: "replied",
    label: "Répondu",
    items: [
      { name: "Julien Mercier", sector: "Menuiserie", score: 79, initials: "JM" },
    ],
  },
];

/* ----------------------------- HERMES analytics ----------------------------- */
export interface HermesKpiMock {
  label: string;
  value: string;
  trend: string;
  direction: "up" | "down";
}

export const HERMES_KPIS: HermesKpiMock[] = [
  { label: "Engagement moyen", value: "4.2%", trend: "+0.8%", direction: "up" },
  { label: "Portée totale", value: "18.4k", trend: "+24%", direction: "up" },
  { label: "Nouveaux leads", value: "23", trend: "+8", direction: "up" },
  { label: "Taux de réponse", value: "11%", trend: "-2%", direction: "down" },
];

export const HERMES_WORKED: string[] = [
  "Le carrousel « 3 signes que ton Insta ne convertit pas » a généré 9 demandes en DM.",
  "Les séquences ORION variante B ont +18% de taux de réponse vs variante A.",
  "La publication du mardi 8h reste le meilleur créneau (portée +31%).",
];

export const HERMES_NOT_WORKED: string[] = [
  "Les Reels ont sous-performé cette semaine (-22% de portée).",
  "2 leads chauds non relancés sous 48h — opportunité perdue.",
];

export const HERMES_ACTIONS: string[] = [
  "Doubler la cadence de carrousels éducatifs (3 → 5 / semaine).",
  "Mettre en place une relance automatique J+2 sur les leads « Répondu ».",
  "Tester un hook « résultat chiffré » sur les 2 prochains posts.",
];

/* ----------------------------- Clients ----------------------------- */
export interface ClientMock {
  name: string;
  sector: string;
  mrr: string;
  agent: string;
  status: "active" | "inactive";
}

export const CLIENTS_MOCK: ClientMock[] = [
  { name: "Harmonie Yacht", sector: "Yachting de luxe", mrr: "1 200 €", agent: "LUNA", status: "active" },
  { name: "Atelier Dubois", sector: "Menuiserie", mrr: "890 €", agent: "ORION", status: "active" },
  { name: "Studio Lumen", sector: "Photographie", mrr: "650 €", agent: "LUNA", status: "active" },
  { name: "Mercier Fitness", sector: "Coaching sportif", mrr: "760 €", agent: "ORION", status: "active" },
  { name: "Cabinet Vela", sector: "Juridique", mrr: "0 €", agent: "HERMES", status: "inactive" },
];

export function todayLabel(): string {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
