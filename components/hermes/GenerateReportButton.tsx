"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GenerateReportButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hermes/generate-report", { method: "POST" });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Génération impossible");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Génération impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={generate} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Génération…
          </>
        ) : (
          <>
            <FileBarChart className="h-4 w-4" /> Générer le rapport
          </>
        )}
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
