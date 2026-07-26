import { ContentKanban } from "@/components/luna/ContentKanban";
import { AgentChatWidget } from "@/components/chat/AgentChatWidget";
import { PageHeader } from "@/components/layout/PageHeader";
import { getContent } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function LunaPage() {
  const content = await getContent();
  return (
    <div className="space-y-6">
      <PageHeader
        title="LUNA — Création de contenu"
        subtitle="Brief LUNA à l'oral, elle structure le carrousel slide par slide."
      />
      <AgentChatWidget agent="luna" accent="#1A3BFF" placeholder="Brief LUNA (client, sujet, chiffres...)" />
      <ContentKanban content={content} />
    </div>
  );
}
