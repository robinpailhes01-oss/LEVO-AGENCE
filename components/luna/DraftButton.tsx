"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DraftButton({
  contentId,
  hasSlides,
}: {
  contentId: string;
  hasSlides: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function draft() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/luna/draft-content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentId }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Rédaction impossible");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rédaction impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={draft} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Rédaction…
          </>
        ) : (
          <>
            <PenLine className="h-4 w-4" />
            {hasSlides ? "Re-rédiger le carrousel" : "Rédiger le carrousel"}
          </>
        )}
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
