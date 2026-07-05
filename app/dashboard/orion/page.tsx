import { UserPlus } from "lucide-react";
import { LeadPipeline } from "@/components/orion/LeadPipeline";
import { PageHeader, ActionButton } from "@/components/layout/PageHeader";
import { getLeads, getNiches, getLatestAuditsByLead } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function OrionPage() {
  const [leads, niches, auditsByLead] = await Promise.all([getLeads(), getNiches(), getLatestAuditsByLead()]);

  const replied = leads.filter((l) =>
    ["replied", "audit_received", "loom_sent", "follow_up"].includes(l.stage),
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="ORION — Acquisition"
        subtitle={`${leads.length} leads · ${niches.length} niches · ${replied} en conversation`}
        action={
          <ActionButton color="#1D9E75">
            <UserPlus className="h-4 w-4" />
            Ajouter un lead
          </ActionButton>
        }
      />
      <LeadPipeline leads={leads} niches={niches} auditsByLead={auditsByLead} />
    </div>
  );
}
