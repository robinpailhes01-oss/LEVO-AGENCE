import { WeeklyReport } from "@/components/hermes/WeeklyReport";
import { GenerateReportButton } from "@/components/hermes/GenerateReportButton";
import { Badge } from "@/components/ui/badge";
import { getReports } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HermesPage() {
  const reports = await getReports();
  const latest = reports[0];
  const history = reports.slice(1);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">
            Rapports hebdomadaires
          </h2>
          <p className="text-sm text-muted">
            HERMES synthétise la semaine chaque lundi 8h — ou à la demande.
          </p>
        </div>
        <GenerateReportButton />
      </div>

      {!latest ? (
        <div className="levo-card p-8 text-center">
          <p className="text-sm text-muted">
            Aucun rapport pour l'instant. Lance la première génération.
          </p>
        </div>
      ) : (
        <div className="levo-card p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-ink">
              Semaine du {latest.week_start} au {latest.week_end}
            </h3>
            <Badge tone={latest.sent_at ? "green" : "neutral"}>
              {latest.sent_at ? "Envoyé" : "Enregistré"}
            </Badge>
          </div>
          <WeeklyReport markdown={latest.content_md ?? "_Rapport vide._"} />
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h3 className="mb-2 font-display text-lg font-semibold text-ink">
            Historique
          </h3>
          <div className="space-y-2">
            {history.map((r) => (
              <details key={r.id} className="levo-card p-4">
                <summary className="cursor-pointer text-sm font-medium text-ink">
                  Semaine du {r.week_start} au {r.week_end}
                </summary>
                <div className="mt-3 border-t border-line/60 pt-3">
                  <WeeklyReport markdown={r.content_md ?? "_Rapport vide._"} />
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
