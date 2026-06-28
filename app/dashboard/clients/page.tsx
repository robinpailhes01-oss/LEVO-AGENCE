import { Badge } from "@/components/ui/badge";
import { getClients } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";
import type { ClientStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<ClientStatus, "green" | "amber" | "red"> = {
  active: "green",
  paused: "amber",
  churned: "red",
};

const STATUS_LABEL: Record<ClientStatus, string> = {
  active: "Actif",
  paused: "En pause",
  churned: "Parti",
};

export default async function ClientsPage() {
  const clients = await getClients();
  const active = clients.filter((c) => c.status === "active");
  const mrr = active.reduce((s, c) => s + (c.monthly_fee ?? 0), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">Clients</h2>
        <p className="text-sm text-muted">
          {active.length} actifs · {formatCurrency(mrr)} de MRR
        </p>
      </div>

      {clients.length === 0 ? (
        <div className="levo-card p-8 text-center">
          <p className="text-sm text-muted">
            Aucun client pour l'instant. Ajoute-les via Supabase ou les outils MCP.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => (
            <div key={c.id} className="levo-card p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-semibold text-ink">
                    {c.name}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {c.company ?? c.niche ?? "—"}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[c.status]}>
                  {STATUS_LABEL[c.status]}
                </Badge>
              </div>

              <p className="mt-4 font-display text-2xl font-semibold text-accent">
                {formatCurrency(c.monthly_fee ?? 0)}
                <span className="ml-1 text-xs font-normal text-muted">/mois</span>
              </p>

              {c.services.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.services.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-background px-2 py-0.5 text-[11px] text-muted"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {c.instagram_handle && (
                <p className="mt-3 text-xs text-muted">{c.instagram_handle}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
