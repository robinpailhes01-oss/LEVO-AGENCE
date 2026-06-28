import { FileBarChart, ThumbsUp, ThumbsDown, Target } from "lucide-react";
import { PageHeader, ActionButton } from "@/components/layout/PageHeader";
import { TrendChart } from "@/components/charts/TrendChart";
import { Donut } from "@/components/charts/Donut";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HERMES_KPIS,
  HERMES_WORKED,
  HERMES_NOT_WORKED,
  HERMES_ACTIONS,
  PERF_SERIES,
  PERF_LABELS,
  LEAD_SOURCES,
} from "@/lib/mock";

export default function HermesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="HERMES — Analytics"
        subtitle="Rapport de la semaine du 22 au 28 juin."
        action={
          <ActionButton color="#BA7517">
            <FileBarChart className="h-4 w-4" />
            Générer rapport
          </ActionButton>
        }
      />

      {/* KPIs */}
      <section className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
        {HERMES_KPIS.map((kpi) => (
          <div
            key={kpi.label}
            className="levo-card p-5 transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-lift"
          >
            <p className="text-xs text-muted">{kpi.label}</p>
            <p className="mt-3 font-display text-[28px] font-semibold leading-none tracking-tightest text-ink">
              {kpi.value}
            </p>
            <p
              className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                kpi.direction === "up"
                  ? "bg-success/10 text-success"
                  : "bg-danger/10 text-danger"
              }`}
            >
              {kpi.direction === "up" ? "↑" : "↓"} {kpi.trend}
            </p>
          </div>
        ))}
      </section>

      {/* Performance chart + channel mix */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vue d'ensemble</CardTitle>
            <Badge tone="blue">8 semaines</Badge>
          </CardHeader>
          <CardContent>
            <TrendChart series={PERF_SERIES} labels={PERF_LABELS} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mix de canaux</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <Donut segments={LEAD_SOURCES} centerLabel="leads" />
          </CardContent>
        </Card>
      </section>

      {/* Worked / not worked */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="levo-card p-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10 text-success">
              <ThumbsUp className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </span>
            <h2 className="font-display text-lg font-semibold tracking-tightest text-ink">
              Ce qui a marché
            </h2>
          </div>
          <ul className="mt-4 space-y-3">
            {HERMES_WORKED.map((item, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink/75">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="levo-card p-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger/10 text-danger">
              <ThumbsDown className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </span>
            <h2 className="font-display text-lg font-semibold tracking-tightest text-ink">
              Ce qui n'a pas marché
            </h2>
          </div>
          <ul className="mt-4 space-y-3">
            {HERMES_NOT_WORKED.map((item, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink/75">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Recommended actions */}
      <section className="levo-card p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Target className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </span>
          <h2 className="font-display text-lg font-semibold tracking-tightest text-ink">
            Top 3 actions recommandées
          </h2>
        </div>
        <ol className="mt-4 space-y-3">
          {HERMES_ACTIONS.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-ink/75">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white shadow-soft">
                {i + 1}
              </span>
              <span className="pt-0.5">{item}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
