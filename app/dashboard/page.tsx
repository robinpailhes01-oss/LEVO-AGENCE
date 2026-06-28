import { AgentCard } from "@/components/overview/AgentCard";
import { KpiCard } from "@/components/overview/KpiCard";
import { ActivityLog } from "@/components/overview/ActivityLog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AGENTS_MOCK,
  KPIS_MOCK,
  TO_VALIDATE_MOCK,
  HOT_LEADS_MOCK,
  todayLabel,
} from "@/lib/mock";

export default function OverviewPage() {
  return (
    <div className="space-y-7 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">
          Bonjour Robin 👋
        </h1>
        <p className="mt-1 text-sm capitalize text-muted">{todayLabel()}</p>
      </div>

      {/* Row 1 — Agents (horizontal scroll on mobile) */}
      <section>
        <div className="scroll-slim -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
          {AGENTS_MOCK.map((agent) => (
            <AgentCard key={agent.key} agent={agent} />
          ))}
        </div>
      </section>

      {/* Row 2 — KPIs */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS_MOCK.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </section>

      {/* Row 3 — activity / to validate / hot leads */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityLog />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>À valider</CardTitle>
            <Badge tone="blue">LUNA</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {TO_VALIDATE_MOCK.map((post) => (
              <div
                key={post.title}
                className="flex items-center gap-3 rounded-xl border border-line/60 p-2.5 transition-colors hover:bg-background"
              >
                <span
                  className="h-12 w-12 shrink-0 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${post.color}, ${post.color}99)`,
                  }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {post.title}
                  </p>
                  <p className="truncate text-xs text-muted">{post.meta}</p>
                </div>
                <button className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95">
                  Valider
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads chauds</CardTitle>
            <Badge tone="green">ORION</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {HOT_LEADS_MOCK.map((lead) => (
              <div
                key={lead.name}
                className="flex items-center gap-3 rounded-xl border border-line/60 px-3 py-2.5 transition-colors hover:bg-background"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: lead.color }}
                >
                  {lead.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {lead.name}
                  </p>
                  <p className="truncate text-xs text-muted">{lead.sector}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    lead.score > 70
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {lead.score}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
