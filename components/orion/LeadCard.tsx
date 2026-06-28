"use client";

import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

function scoreTone(score: number): string {
  if (score >= 70) return "bg-success/10 text-success";
  if (score >= 40) return "bg-warning/10 text-warning";
  return "bg-muted/10 text-muted";
}

export function LeadCard({
  lead,
  onAdvance,
  canAdvance,
  busy,
}: {
  lead: Lead;
  onAdvance: (lead: Lead) => void;
  canAdvance: boolean;
  busy: boolean;
}) {
  return (
    <div className="rounded-xl border border-line/70 bg-white p-3 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/dashboard/orion/${lead.id}`} className="min-w-0">
          <p className="truncate text-sm font-medium text-ink hover:text-orion">
            {lead.name}
          </p>
          <p className="truncate text-xs text-muted">
            {lead.company ?? lead.niche ?? "—"}
          </p>
        </Link>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
            scoreTone(lead.score),
          )}
        >
          {lead.score}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        {lead.location ? (
          <span className="inline-flex items-center gap-1 truncate text-[11px] text-muted">
            <MapPin className="h-3 w-3" /> {lead.location}
          </span>
        ) : (
          <span />
        )}
        {canAdvance && (
          <button
            onClick={() => onAdvance(lead)}
            disabled={busy}
            className="inline-flex items-center gap-0.5 rounded-lg border border-line px-2 py-1 text-[11px] text-muted hover:text-ink disabled:opacity-40"
          >
            Avancer <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
