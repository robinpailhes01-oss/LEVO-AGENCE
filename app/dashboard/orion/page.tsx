import { LeadPipeline } from "@/components/orion/LeadPipeline";
import { getLeads } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function OrionPage() {
  const leads = await getLeads();

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">
          Pipeline de prospection
        </h2>
        <p className="text-sm text-muted">
          ORION score, enrichit et prépare l'approche de chaque lead.
        </p>
      </div>
      <LeadPipeline initial={leads} />
    </div>
  );
}
