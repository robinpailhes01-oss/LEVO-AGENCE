import { PageHeader } from "@/components/layout/PageHeader";
import { getClients } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";
import type { ClientStatus } from "@/lib/db";

export const dynamic = "force-dynamic";

const AGENT_COLOR: Record<string, string> = {
  LUNA: "#1A3BFF",
  ORION: "#1D9E75",
  HERMES: "#BA7517",
  VEILLE: "#7B2FBE",
};

const STATUS_LABEL: Record<ClientStatus, string> = {
  active: "Actif",
  churned: "Parti",
  prospect: "Prospect",
};

export default async function ClientsPage() {
  const clients = await getClients();
  const active = clients.filter((c) => c.status === "active").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Clients" subtitle={`${active} clients actifs`} />

      {clients.length === 0 ? (
        <div className="levo-card p-10 text-center">
          <p className="text-sm text-muted">
            Aucun client pour l'instant. Ajoute-les dans Supabase (table{" "}
            <code>clients</code>) ou via les outils MCP — ils apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="levo-card overflow-hidden p-0">
          <div className="hidden grid-cols-12 gap-4 border-b border-line/70 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-muted md:grid">
            <span className="col-span-4">Client</span>
            <span className="col-span-3">Secteur</span>
            <span className="col-span-2">MRR</span>
            <span className="col-span-2">Agent</span>
            <span className="col-span-1 text-right">Statut</span>
          </div>
          <ul className="divide-y divide-line/60">
            {clients.map((c) => (
              <li
                key={c.id}
                className="grid grid-cols-1 gap-2 px-6 py-4 transition-colors duration-200 hover:bg-background md:grid-cols-12 md:items-center md:gap-4"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ink to-[#3A3D46] text-xs font-semibold text-white shadow-soft">
                    {(c.name || "?").slice(0, 1).toUpperCase()}
                  </span>
                  <span className="font-medium text-ink">{c.name}</span>
                </div>
                <span className="col-span-3 text-sm text-muted">{c.sector ?? c.company ?? "—"}</span>
                <span className="col-span-2 font-display text-lg font-semibold tracking-tightest text-accent">
                  {formatCurrency(Number(c.mrr) || 0)}
                  <span className="ml-1 text-xs font-normal text-muted">/mois</span>
                </span>
                <span className="col-span-2">
                  {c.agent_name ? (
                    <span
                      className="inline-flex items-center gap-1.5 text-sm font-medium"
                      style={{ color: AGENT_COLOR[c.agent_name] ?? "#1A1A1A" }}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: AGENT_COLOR[c.agent_name] ?? "#1A1A1A" }}
                      />
                      {c.agent_name}
                    </span>
                  ) : (
                    <span className="text-sm text-muted">—</span>
                  )}
                </span>
                <span className="col-span-1 md:text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      c.status === "active"
                        ? "bg-success/10 text-success"
                        : "bg-muted/10 text-muted"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        c.status === "active" ? "bg-success" : "bg-muted"
                      }`}
                    />
                    {STATUS_LABEL[c.status]}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
