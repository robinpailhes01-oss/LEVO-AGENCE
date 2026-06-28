import { Sparkles } from "lucide-react";
import { ContentKanban } from "@/components/luna/ContentKanban";
import { PageHeader, ActionButton } from "@/components/layout/PageHeader";

export default function LunaPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="LUNA — Création de contenu"
        subtitle="De l'idée à la publication, suivi en un coup d'œil."
        action={
          <ActionButton color="#1A3BFF">
            <Sparkles className="h-4 w-4" />
            Générer des idées
          </ActionButton>
        }
      />
      <ContentKanban />
    </div>
  );
}
