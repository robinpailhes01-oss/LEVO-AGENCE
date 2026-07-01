import type { Lead, LeadStatus } from "@/lib/db";

const COLUMNS: { key: LeadStatus; label: string }[] = [
  { key: "new", label: "Nouveau" },
  { key: "contacted", label: "Contacté" },
  { key: "responded", label: "Répondu" },
  { key: "qualified", label: "Qualifié" },
  { key: "proposal", label: "Proposition" },
  { key: "won", label: "Gagné" },
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

function scoreTone(score: number): string {
  return score > 70 ? "bg-success/10 text-success" : "bg-warning/10 text-warning";
}

export function LeadPipeline({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) {
    return (
      <div className="levo-card p-10 text-center">
        <p className="text-sm text-muted">
          Aucun lead pour l'instant. Ajoute-en via « Ajouter un lead », les outils
          MCP, ou la table <code>leads</code> dans Supabase.
        </p>
      </div>
    );
  }

  return (
    <div className="scroll-slim -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 xl:grid-cols-6">
      {COLUMNS.map((col) => {
        const items = leads.filter((l) => l.status === col.key);
        return (
          <div key={col.key} className="flex w-[76vw] shrink-0 flex-col sm:w-64 md:w-auto">
            <div className="mb-2.5 flex items-center justify-between px-1.5">
              <span className="text-[13px] font-semibold text-ink">{col.label}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-muted shadow-xs">
                {items.length}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2.5 rounded-3xl bg-black/[0.025] p-2.5">
              {items.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted/60">—</p>
              ) : (
                items.map((l) => (
                  <div
                    key={l.id}
                    className="levo-card levo-pressable cursor-pointer p-3.5 hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orion text-xs font-semibold text-white shadow-soft">
                        {initials(l.full_name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium text-ink">
                          {l.full_name ?? "Sans nom"}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {l.company ?? l.sector ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] text-muted">Score</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${scoreTone(l.score)}`}
                      >
                        {l.score}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
