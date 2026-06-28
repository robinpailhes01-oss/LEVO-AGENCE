"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Lead } from "@/lib/types";

interface OutreachVariant {
  label: string;
  subject: string;
  body: string;
  followup: string;
}

export function LeadDetailActions({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [enriching, setEnriching] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variants, setVariants] = useState<OutreachVariant[] | null>(null);

  async function enrich() {
    setEnriching(true);
    setError(null);
    try {
      const res = await fetch("/api/orion/enrich-lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Enrichissement impossible");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enrichissement impossible");
    } finally {
      setEnriching(false);
    }
  }

  async function generateOutreach() {
    setDrafting(true);
    setError(null);
    try {
      const res = await fetch("/api/orion/generate-outreach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        data?: { variants: OutreachVariant[] };
        error?: string;
      };
      if (!res.ok || !data.ok || !data.data) {
        throw new Error(data.error ?? "Génération impossible");
      }
      setVariants(data.data.variants);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Génération impossible");
    } finally {
      setDrafting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={enrich} disabled={enriching} variant="secondary">
          {enriching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Enrichissement…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Enrichir & scorer
            </>
          )}
        </Button>
        <Button onClick={generateOutreach} disabled={drafting}>
          {drafting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Rédaction…
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" /> Générer séquence A/B
            </>
          )}
        </Button>
      </div>

      {error && (
        <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {variants && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {variants.map((v, i) => (
            <div key={i} className="levo-card p-4">
              <p className="font-display text-sm font-semibold text-orion">
                Variante {v.label}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Objet
              </p>
              <p className="text-sm text-ink">{v.subject}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Message
              </p>
              <p className="whitespace-pre-wrap text-sm text-ink/80">{v.body}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Relance
              </p>
              <p className="whitespace-pre-wrap text-sm text-ink/80">
                {v.followup}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
