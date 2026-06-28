import { Sparkles } from "lucide-react";
import { ContentKanban } from "@/components/luna/ContentKanban";

export default function LunaPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            LUNA — Création de contenu
          </h1>
          <p className="text-sm text-muted">
            De l'idée à la publication, suivi en un coup d'œil.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-luna px-4 py-2.5 text-sm font-medium text-white shadow-soft transition-all hover:brightness-110 active:scale-[0.98]">
          <Sparkles className="h-4 w-4" />
          Générer des idées
        </button>
      </div>

      <ContentKanban />
    </div>
  );
}
