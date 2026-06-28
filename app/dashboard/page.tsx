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
    <div className="space-y-8">
      <header className="animate-fade-in">
        <p className="text-[13px] font-medium capitalize text-muted">
          {todayLabel()}
        </p>
        <h1 className="mt-1 font-display text-[34px] font-semibold leading-tight tracking-tightest text-ink md:text-[40px]">
          Bonjour Robin <span className="inline-block">👋</span>
        </h1>
      </header>

      {/* Row 1 — Agents */}
      <section>
        <div className="scroll-slim stagger -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
          {AGENTS_MOCK.map((agent) => (
            <AgentCard key={agent.key} agent={agent} />
          ))}
        </div>
      </section>

      {/* Row 2 — KPIs */}
      <section className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS_MOCK.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </section>

      {/* Row 3 — activity / to validate / hot leads */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="animate-fade-in lg:col-span-2">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <span className="text-xs font-medium text-muted">Aujourd'hui</span>
          </CardHeader>
          <CardContent>
            <ActivityLog />
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>À valider</CardTitle>
            <Badge tone="blue">LUNA</Badge>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {TO_VALIDATE_MOCK.map((post) => (
              <div
                key={post.title}
                className="levo-pressable group flex items-center gap-3 rounded-2xl border border-line/70 p-2.5 transition-colors hover:border-transparent hover:bg-background"
              >
                <span
                  className="h-11 w-11 shrink-0 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${post.color}, ${post.color}aa)`,
                    boxShadow: `0 6px 16px -6px ${post.color}80`,
                  }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {post.title}
                  </p>
                  <p className="truncate text-xs text-muted">{post.meta}</p>
                </div>
                <button className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-xs font-medium text-white shadow-soft transition-all hover:brightness-110 active:scale-95">
                  Valider
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Leads chauds</CardTitle>
            <Badge tone="green">ORION</Badge>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {HOT_LEADS_MOCK.map((lead) => (
              <div
                key={lead.name}
                className="levo-pressable flex items-center gap-3 rounded-2xl border border-line/70 px-3 py-2.5 transition-colors hover:border-transparent hover:bg-background"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{
                    backgroundColor: lead.color,
                    boxShadow: `0 4px 12px -4px ${lead.color}90`,
                  }}
                >
                  {lead.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {lead.name}
                  </p>
                  <p className="truncate text-xs text-muted">{lead.sector}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
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
