"use client";

import { useEffect } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

/**
 * Filet de sécurité pour tout le dashboard — sans lui, une erreur client
 * dans UNE page (ex. LUNA) rendait toute l'appli non-cliquable (sidebar et
 * navigation mobile comprises), faute d'error boundary React nulle part
 * dans le projet. Ici, seul le contenu de la page plante — la sidebar et
 * la nav restent utilisables (elles vivent dans le layout, hors de cette
 * boundary).
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard:error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
        <AlertTriangle className="h-5 w-5 text-danger" />
      </div>
      <div className="space-y-1">
        <p className="text-[15px] font-semibold text-ink">Un problème est survenu sur cette page.</p>
        <p className="text-[13px] text-muted">Le reste du dashboard (menu, autres pages) reste accessible.</p>
      </div>
      <button
        onClick={reset}
        className="levo-pressable flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-[13px] font-medium text-white"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Réessayer
      </button>
    </div>
  );
}
