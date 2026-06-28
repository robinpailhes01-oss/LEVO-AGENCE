import { UserPlus } from "lucide-react";
import { LeadPipeline } from "@/components/orion/LeadPipeline";

export default function OrionPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            ORION — Acquisition
          </h1>
          <p className="text-sm text-muted">
            Pipeline de prospection, du premier contact à la réponse.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-orion px-4 py-2.5 text-sm font-medium text-white shadow-soft transition-all hover:brightness-110 active:scale-[0.98]">
          <UserPlus className="h-4 w-4" />
          Ajouter un lead
        </button>
      </div>

      <LeadPipeline />
    </div>
  );
}
