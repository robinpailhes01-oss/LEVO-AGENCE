import { Euro, Users, FileCheck2, Heart } from "lucide-react";
import { AgentCard, type AgentStatus } from "@/components/overview/AgentCard";
import { KpiCard } from "@/components/overview/KpiCard";
import { ActivityLog } from "@/components/overview/ActivityLog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { AGENTS, type AgentLog, type AgentName } from "@/lib/types";
import {
  getOverviewStats,
  getRecentLogs,
  getContent,
} from "@/lib/queries";
import { formatCurrency, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Derive a friendly status + last action from the agent's most recent log. */
function agentSnapshot(
  agent: AgentName,
  logs: AgentLog[],
  fallback: string,
): { status: AgentStatus; lastAction: string } {
  const last = logs.find((l) => l.agent === agent);
  if (!last) return { status: "idle", lastAction: fallback };
  const ageMs = Date.now() - new Date(last.created_at).getTime();
  const status: AgentStatus =
    last.status === "info"
      ? "working"
      : ageMs < 1000 * 60 * 60 * 24
        ? "active"
        : "idle";
  return { status, lastAction: last.summary ?? last.action };
}

export default async function OverviewPage() {
  const [stats, logs, content] = await Promise.all([
    getOverviewStats(),
    getRecentLogs(20),
    getContent(),
  ]);

  const lunaSnap = agentSnapshot(
    "luna",
    logs,
    "Prête à générer de nouvelles idées de contenu.",
  );
  const orionSnap = agentSnapshot(
    "orion",
    logs,
    "En attente de nouveaux leads à enrichir.",
  );
  const hermesSnap = agentSnapshot(
    "hermes",
    logs,
    "Prochain rapport hebdo programmé lundi 8h.",
  );
  const veilleSnap = agentSnapshot(
    "veille",
    logs,
    "Surveille les comptes concurrents.",
  );

  const publishedCount = content.filter((c) => c.status === "published").length;
  const pipelineCount = content.filter((c) => c.status !== "published").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Row 1 — Agent cards */}
      <section>
        <h2 className="sr-only">Agents</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AgentCard
            agent={AGENTS.luna}
            href="/dashboard/luna"
            status={lunaSnap.status}
            lastAction={lunaSnap.lastAction}
            stat={{ value: String(pipelineCount), label: "contenus en pipeline" }}
          />
          <AgentCard
            agent={AGENTS.orion}
            href="/dashboard/orion"
            status={orionSnap.status}
            lastAction={orionSnap.lastAction}
            stat={{ value: String(stats.activeLeads), label: "leads actifs" }}
          />
          <AgentCard
            agent={AGENTS.hermes}
            href="/dashboard/hermes"
            status={hermesSnap.status}
            lastAction={hermesSnap.lastAction}
            stat={{ value: String(publishedCount), label: "posts publiés" }}
          />
          <AgentCard
            agent={AGENTS.veille}
            href="/dashboard/orion"
            status={veilleSnap.status}
            lastAction={veilleSnap.lastAction}
            stat={{ value: String(stats.activeClients), label: "clients actifs" }}
          />
        </div>
      </section>

      {/* Row 2 — KPIs */}
      <section>
        <h2 className="sr-only">Indicateurs</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            label="MRR"
            value={formatCurrency(stats.mrr)}
            icon={Euro}
            accent="#1A3BFF"
          />
          <KpiCard
            label="Leads actifs"
            value={formatNumber(stats.activeLeads)}
            icon={Users}
            accent="#1D9E75"
          />
          <KpiCard
            label="Posts publiés"
            value={formatNumber(stats.publishedPosts)}
            icon={FileCheck2}
            accent="#BA7517"
          />
          <KpiCard
            label="Engagement moyen"
            value={`${stats.avgEngagement.toFixed(1)}%`}
            icon={Heart}
            accent="#7B2FBE"
          />
        </div>
      </section>

      {/* Row 3 — activity + to validate + hot leads */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <Badge tone="neutral">{logs.length}</Badge>
          </CardHeader>
          <CardContent>
            <ActivityLog logs={logs} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>À valider</CardTitle>
            <Badge tone="blue">LUNA</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.toValidate.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                Rien à valider.
              </p>
            ) : (
              stats.toValidate.map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/luna/${c.id}`}
                  className="block rounded-xl border border-line/60 px-3 py-2.5 transition-colors hover:bg-background"
                >
                  <p className="truncate text-sm font-medium text-ink">
                    {c.title}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {c.hook ?? c.topic ?? "—"}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads chauds</CardTitle>
            <Badge tone="green">ORION</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.hotLeads.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                Aucun lead chaud.
              </p>
            ) : (
              stats.hotLeads.map((l) => (
                <Link
                  key={l.id}
                  href={`/dashboard/orion/${l.id}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-line/60 px-3 py-2.5 transition-colors hover:bg-background"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {l.name}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {l.company ?? l.niche ?? "—"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                    {l.score}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
