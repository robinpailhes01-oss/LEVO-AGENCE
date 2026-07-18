"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";

/** Déclenche une analyse Hermes pour un lead candidat (site web + rédaction email). */
export function HermesAnalyzeButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    setState("loading");
    setError(null);
    try {
      const res = await fetch("/api/hermes/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
      router.refresh();
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Échec de l'analyse.");
    }
  }

  return (
    <div>
      <button
        onClick={analyze}
        disabled={state === "loading"}
        className="levo-pressable flex items-center gap-1.5 rounded-xl bg-[#BA7517] px-3 py-1.5 text-[12.5px] font-medium text-white disabled:opacity-50"
      >
        {state === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        Analyser
      </button>
      {error && <p className="mt-1.5 text-[11px] font-medium text-danger">{error}</p>}
    </div>
  );
}
