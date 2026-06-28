import { ContentKanban } from "@/components/luna/ContentKanban";
import { getContent } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function LunaPage() {
  const content = await getContent();

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">
          Pipeline de contenu
        </h2>
        <p className="text-sm text-muted">
          De l'idée à la publication — LUNA t'assiste à chaque étape.
        </p>
      </div>
      <ContentKanban initial={content} />
    </div>
  );
}
