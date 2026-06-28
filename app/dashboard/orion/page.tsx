import { UserPlus } from "lucide-react";
import { LeadPipeline } from "@/components/orion/LeadPipeline";
import { PageHeader, ActionButton } from "@/components/layout/PageHeader";

export default function OrionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="ORION — Acquisition"
        subtitle="Pipeline de prospection, du premier contact à la réponse."
        action={
          <ActionButton color="#1D9E75">
            <UserPlus className="h-4 w-4" />
            Ajouter un lead
          </ActionButton>
        }
      />
      <LeadPipeline />
    </div>
  );
}
