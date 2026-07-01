import { UserPlus } from "lucide-react";
import { LeadPipeline } from "@/components/orion/LeadPipeline";
import { PageHeader, ActionButton } from "@/components/layout/PageHeader";
import { getLeads } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function OrionPage() {
  const leads = await getLeads();
  return (
    <div className="space-y-6">
      <PageHeader
        title="ORION — Acquisition"
        subtitle={`${leads.length} leads dans le pipeline`}
        action={
          <ActionButton color="#1D9E75">
            <UserPlus className="h-4 w-4" />
            Ajouter un lead
          </ActionButton>
        }
      />
      <LeadPipeline leads={leads} />
    </div>
  );
}
