import { LunaWorkspace } from "@/components/luna/LunaWorkspace";
import { LunaMemory } from "@/components/luna/LunaMemory";
import { PageHeader } from "@/components/layout/PageHeader";
import { getContent, getLunaLearnings, getLunaReferences } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function LunaPage() {
  const [content, learnings, references] = await Promise.all([
    getContent(),
    getLunaLearnings(),
    getLunaReferences(),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="LUNA — Création de contenu"
        subtitle="Brief LUNA à l'oral, elle structure le carrousel slide par slide et génère les visuels."
      />
      <LunaWorkspace content={content}>
        <LunaMemory learnings={learnings} references={references} />
      </LunaWorkspace>
    </div>
  );
}
