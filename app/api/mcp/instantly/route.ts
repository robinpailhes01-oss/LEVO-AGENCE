import { mcpRoute } from "@/lib/mcp";
import { getCampaignsAnalytics, listAccounts } from "@/lib/instantly";

export const runtime = "nodejs";

const { GET, POST } = mcpRoute("instantly", [
  {
    name: "get_campaigns_stats",
    description: "Stats de toutes les campagnes Instantly : envoyés, ouvertures, clics, réponses, bounces.",
    input: {},
    run: async () => {
      const rows = await getCampaignsAnalytics();
      return rows.map((r) => ({
        campaign: r.campaign_name,
        status: ["Draft", "Active", "Paused", "Completed"][r.campaign_status] ?? r.campaign_status,
        leads: r.leads_count,
        contacted: r.contacted_count,
        sent: r.emails_sent_count,
        opened: r.open_count_unique,
        open_rate: r.emails_sent_count > 0 ? `${((r.open_count_unique / r.emails_sent_count) * 100).toFixed(1)}%` : "—",
        replied: r.reply_count_unique,
        clicked: r.link_click_count,
        bounced: r.bounced_count,
        unsubscribed: r.unsubscribed_count,
      }));
    },
  },
  {
    name: "get_accounts_stats",
    description: "Statut + score de warmup des boîtes d'envoi Instantly (mailboxes).",
    input: {},
    run: async () => {
      const rows = await listAccounts();
      return rows.map((a) => ({
        email: a.email,
        status: { 1: "Active", 2: "Paused", 3: "Maintenance" }[a.status] ?? `Erreur (${a.status})`,
        warmup: { 0: "Paused", 1: "Active" }[a.warmup_status] ?? `Erreur (${a.warmup_status})`,
        warmup_score: a.stat_warmup_score,
        daily_limit: a.daily_limit,
      }));
    },
  },
]);

export { GET, POST };
