import { Sparkles, TrendingUp, Bookmark, Eye } from "lucide-react";
import { AgentCard } from "@/components/overview/AgentCard";
import { KpiCard } from "@/components/overview/KpiCard";
import { ActivityLog } from "@/components/overview/ActivityLog";
import { TrendChart } from "@/components/charts/TrendChart";
import { Donut } from "@/components/charts/Donut";
import { Funnel } from "@/components/charts/Funnel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AGENTS_MOCK,
  KPIS_MOCK,
  TO_VALIDATE_MOCK,
  HOT_LEADS_MOCK,
  PERF_SERIES,
  PERF_LABELS,
  LEAD_SOURCES,
  FUNNEL_STAGES,
  INSIGHT_MOCK,
  TOP_CONTENT,
  todayLabel,
} from "@/lib/mock";

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      <header className="animate-fade-in">
        <p className="text-[13px] font-medium capitalize text-muted">{todayLabel()}</p>
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

      {/* Row 2 — KPIs with sparklines */}
      <section className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS_MOCK.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </section>

      {/* Row 3 — performance chart + lead sources donut */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="animate-fade-in lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance — 8 dernières semaines</CardTitle>
            <Badge tone="blue">Live</Badge>
          </CardHeader>
          <CardContent>
            <TrendChart series={PERF_SERIES} labels={PERF_LABELS} />
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Sources de leads</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <Donut segments={LEAD_SOURCES} centerLabel="leads" />
          </CardContent>
        </Card>
      </section>

      {/* Row 4 — funnel + activity + insight */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Tunnel de conversion</CardTitle>
            <Badge tone="green">ORION</Badge>
          </CardHeader>
          <CardContent className="pt-1">
            <Funnel stages={FUNNEL_STAGES} />
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <span className="text-xs font-medium text-muted">Aujourd'hui</span>
          </CardHeader>
          <CardContent>
            <ActivityLog />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          {/* HERMES insight */}
          <Card className="animate-fade-in bg-gradient-to-br from-accent to-[#0E29D6] text-white shadow-lift">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <p className="text-sm font-semibold">{INSIGHT_MOCK.title}</p>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-white/85">
              {INSIGHT_MOCK.text}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              {INSIGHT_MOCK.metric}
            </span>
          </Card>

          {/* Top content */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Top contenu</CardTitle>
              <Badge tone="blue">LUNA</Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <span
                  className="h-12 w-12 shrink-0 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${TOP_CONTENT.color}, ${TOP_CONTENT.color}aa)`,
                  }}
                />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {TOP_CONTENT.title}
                  </p>
                  <p className="truncate text-xs text-muted">{TOP_CONTENT.meta}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-muted">
                <span className="inline-flex items-center gap-1">
                  <Bookmark className="h-3.5 w-3.5" /> {TOP_CONTENT.saves} saves
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> {TOP_CONTENT.reach} de portée
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Row 5 — to validate + hot leads */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{post.title}</p>
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
                  <p className="truncate text-[13px] font-medium text-ink">{lead.name}</p>
                  <p className="truncate text-xs text-muted">{lead.sector}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                    lead.score > 70 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
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
