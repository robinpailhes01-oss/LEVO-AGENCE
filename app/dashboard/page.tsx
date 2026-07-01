import { Euro, Users, FileCheck2, Heart, ChevronDown, LineChart } from "lucide-react";
import { AgentCard } from "@/components/overview/AgentCard";
import { ActivityLog } from "@/components/overview/ActivityLog";
import { Donut } from "@/components/charts/Donut";
import { Funnel } from "@/components/charts/Funnel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AGENTS_MOCK, todayLabel, type AgentMock, type AgentStatus } from "@/lib/mock";
import { getOverview, getContent, getLeads } from "@/lib/queries";
import type { AgentLog, AgentName } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

function snapshot(
  agent: AgentName,
  logs: AgentLog[],
  fallbackSpeech: string,
): { status: AgentStatus; speech: string } {
  const last = logs.find((l) => l.agent_name === agent);
  if (!last) return { status: "idle", speech: fallbackSpeech };
  const ageMs = Date.now() - new Date(last.created_at).getTime();
  const status: AgentStatus =
    last.status === "pending" ? "working" : ageMs < 864e5 ? "active" : "idle";
  return { status, speech: last.action };
}

const FUNNEL_COLORS = ["#1A3BFF", "#3E57FF", "#6477FF", "#8C9AFF", "#B3BCFF"];
const FUNNEL_MAP: { key: string; label: string }[] = [
  { key: "new", label: "Nouveau" },
  { key: "contacted", label: "Contacté" },
  { key: "responded", label: "Répondu" },
  { key: "qualified", label: "Qualifié" },
  { key: "won", label: "Gagné" },
];

export default async function OverviewPage() {
  const [ov, content, leads] = await Promise.all([getOverview(), getContent(), getLeads()]);

  const ideasCount = content.filter((c) => c.status === "idea").length;
  const hasLeads = leads.length > 0;

  const stats: Record<string, { value: string; label: string }> = {
    luna: { value: String(ov.toValidate), label: "à valider" },
    orion: { value: String(ov.activeLeads), label: "leads actifs" },
    hermes: { value: `${ov.avgEngagement}%`, label: "engagement moyen" },
    veille: { value: String(ideasCount), label: "idées à trier" },
  };

  const agents: AgentMock[] = AGENTS_MOCK.map((a) => {
    const snap = snapshot(a.name.toUpperCase() as AgentName, ov.logs, a.speech);
    return { ...a, status: snap.status, speech: snap.speech, stat: stats[a.key] ?? a.stat };
  });

  const kpis = [
    { label: "MRR", value: formatCurrency(ov.mrr), icon: Euro, accent: "#1A3BFF" },
    { label: "Leads actifs", value: String(ov.activeLeads), icon: Users, accent: "#1D9E75" },
    { label: "Posts publiés", value: String(ov.publishedPosts), icon: FileCheck2, accent: "#BA7517" },
    { label: "Engagement", value: `${ov.avgEngagement}%`, icon: Heart, accent: "#7B2FBE" },
  ];

  const funnelStages = FUNNEL_MAP.map((s, i) => ({
    label: s.label,
    value: ov.leadsByStatus[s.key] ?? 0,
    color: FUNNEL_COLORS[i]!,
  }));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3 animate-fade-in">
        <div>
          <p className="text-[13px] font-medium capitalize text-muted">{todayLabel()}</p>
          <h1 className="mt-1 font-display text-[34px] font-bold leading-[1.05] tracking-apple-tight text-ink md:text-[42px]">
            Bonjour Robin <span className="inline-block">👋</span>
          </h1>
        </div>
        <button className="levo-pressable inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-4 py-2 text-sm font-medium text-ink shadow-xs transition-colors hover:bg-white">
          Cette semaine
          <ChevronDown className="h-4 w-4 text-muted" />
        </button>
      </header>

      {/* Agents */}
      <section>
        <p className="eyebrow mb-3">Vos agents</p>
        <div className="scroll-slim stagger -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
          {agents.map((agent) => (
            <AgentCard key={agent.key} agent={agent} />
          ))}
        </div>
      </section>

      {/* KPIs */}
      <section>
        <p className="eyebrow mb-3">Indicateurs clés</p>
        <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="levo-card p-5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${k.accent}14`, color: k.accent }}
              >
                <k.icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </span>
              <p className="mt-4 font-display text-[28px] font-semibold leading-none tracking-tightest text-ink">
                {k.value}
              </p>
              <p className="mt-1.5 text-xs text-muted">{k.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Charts */}
      <section>
        <p className="eyebrow mb-3">Performance</p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Tunnel de conversion</CardTitle>
              <Badge tone="green">ORION</Badge>
            </CardHeader>
            <CardContent className="pt-1">
              {hasLeads ? (
                <Funnel stages={funnelStages} />
              ) : (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <LineChart className="h-6 w-6 text-muted/50" />
                  <p className="text-sm text-muted">
                    Le tunnel se remplira dès les premiers leads.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sources de leads</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {ov.leadsBySource.length > 0 ? (
                <Donut segments={ov.leadsBySource} centerLabel="leads" />
              ) : (
                <p className="py-10 text-center text-sm text-muted">
                  Pas encore de leads à répartir.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Activity + hot leads */}
      <section>
        <p className="eyebrow mb-3">Pipeline &amp; activité</p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityLog logs={ov.logs} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leads chauds</CardTitle>
              <Badge tone="green">ORION</Badge>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {ov.hotLeads.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">Aucun lead chaud (≥ 70).</p>
              ) : (
                ov.hotLeads.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center gap-3 rounded-2xl border border-line/70 px-3 py-2.5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orion text-xs font-semibold text-white">
                      {(l.full_name ?? "?").slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {l.full_name ?? "Sans nom"}
                      </p>
                      <p className="truncate text-xs text-muted">{l.company ?? l.sector ?? "—"}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-success">
                      {l.score}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
