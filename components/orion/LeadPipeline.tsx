"use client";

import { useState } from "react";
import type { Lead, LeadStage, Niche } from "@/lib/db";

/** Colonnes du pipeline réel ORION (flow Robin). `lost` traité à part. */
const COLUMNS: { key: LeadStage; label: string; tone: string }[] = [
  { key: "new", label: "Nouveau", tone: "text-muted" },
  { key: "contacted", label: "Contacté", tone: "text-ink" },
  { key: "opened", label: "Ouvert", tone: "text-ink" },
  { key: "replied", label: "Répondu", tone: "text-orion" },
  { key: "audit_received", label: "Audit reçu", tone: "text-orion" },
  { key: "loom_sent", label: "Loom envoyé", tone: "text-orion" },
  { key: "follow_up", label: "Suivi", tone: "text-ink" },
  { key: "won", label: "Gagné", tone: "text-success" },
];

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function LeadPipeline({ leads, niches }: { leads: Lead[]; niches: Niche[] }) {
  const [nicheId, setNicheId] = useState<string | "all" | "none">("all");

  const visible = leads.filter((l) => {
    if (nicheId === "all") return true;
    if (nicheId === "none") return !l.niche_id;
    return l.niche_id === nicheId;
  });

  const countFor = (id: string | "all" | "none") =>
    leads.filter((l) => (id === "all" ? true : id === "none" ? !l.niche_id : l.niche_id === id)).length;

  const lostCount = visible.filter((l) => l.stage === "lost").length;

  const chip = (id: string | "all" | "none", label: string) => (
    <button
      key={id}
      onClick={() => setNicheId(id)}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
        nicheId === id
          ? "bg-orion text-white shadow-soft"
          : "bg-white text-muted shadow-xs hover:text-ink"
      }`}
    >
      {label}
      <span className={`ml-1.5 tabular-nums ${nicheId === id ? "text-white/70" : "text-muted/60"}`}>
        {countFor(id)}
      </span>
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Filtre niches */}
      <div className="scroll-slim -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        {chip("all", "Toutes niches")}
        {niches.map((n) => chip(n.id, n.name))}
        {countFor("none") > 0 && chip("none", "Sans niche")}
      </div>

      {visible.length === 0 ? (
        <div className="levo-card p-10 text-center">
          <p className="text-sm text-muted">
            Aucun lead ici. Importe des leads via le scrape Outscraper (outils MCP)
            ou change de niche.
          </p>
        </div>
      ) : (
        <>
          <div className="scroll-slim -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
            {COLUMNS.map((col) => {
              const items = visible.filter((l) => l.stage === col.key);
              return (
                <div key={col.key} className="flex w-[76vw] shrink-0 flex-col sm:w-60">
                  <div className="mb-2.5 flex items-center justify-between px-1.5">
                    <span className={`text-[13px] font-semibold ${col.tone}`}>{col.label}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-muted shadow-xs">
                      {items.length}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2.5 rounded-3xl bg-black/[0.025] p-2.5">
                    {items.length === 0 ? (
                      <p className="py-6 text-center text-xs text-muted/60">—</p>
                    ) : (
                      items.map((l) => <LeadCard key={l.id} lead={l} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {lostCount > 0 && (
            <p className="px-1 text-xs text-muted/70">{lostCount} lead(s) perdu(s) (masqués)</p>
          )}
        </>
      )}
    </div>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  const city =
    lead.enrichment_data && typeof lead.enrichment_data === "object"
      ? (lead.enrichment_data as Record<string, unknown>).city
      : null;
  return (
    <div className="levo-card levo-pressable cursor-pointer p-3.5 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orion text-xs font-semibold text-white shadow-soft">
          {initials(lead.company ?? lead.full_name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium text-ink">
            {lead.company ?? lead.full_name ?? "Sans nom"}
          </p>
          <p className="truncate text-xs text-muted">
            {[lead.sector, typeof city === "string" ? city : null].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
      </div>
      {lead.email && (
        <p className="mt-2.5 truncate text-[11px] text-muted/80">{lead.email}</p>
      )}
    </div>
  );
}
