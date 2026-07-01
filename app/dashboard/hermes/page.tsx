import { FileBarChart, Euro, Users, FileCheck2, Heart } from "lucide-react";
import { PageHeader, ActionButton } from "@/components/layout/PageHeader";
import { Donut } from "@/components/charts/Donut";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getReports, getOverview } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HermesPage() {
  const [reports, ov] = await Promise.all([getReports(), getOverview()]);
  const latest = reports[0];

  const kpis = [
    { label: "MRR", value: formatCurrency(ov.mrr), icon: Euro, accent: "#1A3BFF" },
    { label: "Leads actifs", value: String(ov.activeLeads), icon: Users, accent: "#1D9E75" },
    { label: "Posts publiés", value: String(ov.publishedPosts), icon: FileCheck2, accent: "#BA7517" },
    { label: "Engagement", value: `${ov.avgEngagement}%`, icon: Heart, accent: "#7B2FBE" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="HERMES — Analytics"
        subtitle="Chiffres en temps réel + rapports hebdomadaires."
        action={
          <ActionButton color="#BA7517">
            <FileBarChart className="h-4 w-4" />
            Générer rapport
          </ActionButton>
        }
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dernier rapport</CardTitle>
            {latest && <Badge tone="amber">HERMES</Badge>}
          </CardHeader>
          <CardContent>
            {latest ? (
              <div>
                <p className="mb-2 text-xs text-muted">
                  Semaine du {latest.week_start} au {latest.week_end}
                </p>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
                  {latest.report_content ?? "Rapport vide."}
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted">
                Aucun rapport pour l'instant. « Générer rapport » (branché à l'étape
                HERMES) produira ta première synthèse hebdo.
              </p>
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
              <p className="py-8 text-center text-sm text-muted">
                Pas encore de leads à répartir.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
