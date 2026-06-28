import { PageHeader } from "@/components/layout/PageHeader";
import { CLIENTS_MOCK } from "@/lib/mock";

const AGENT_COLOR: Record<string, string> = {
  LUNA: "#1A3BFF",
  ORION: "#1D9E75",
  HERMES: "#BA7517",
  VEILLE: "#7B2FBE",
};

export default function ClientsPage() {
  const active = CLIENTS_MOCK.filter((c) => c.status === "active").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Clients" subtitle={`${active} clients actifs`} />

      <div className="levo-card overflow-hidden p-0">
        {/* header — desktop */}
        <div className="hidden grid-cols-12 gap-4 border-b border-line/70 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-muted md:grid">
          <span className="col-span-4">Client</span>
          <span className="col-span-3">Secteur</span>
          <span className="col-span-2">MRR</span>
          <span className="col-span-2">Agent</span>
          <span className="col-span-1 text-right">Statut</span>
        </div>

        <ul className="divide-y divide-line/60">
          {CLIENTS_MOCK.map((c) => (
            <li
              key={c.name}
              className="grid grid-cols-1 gap-2 px-6 py-4 transition-colors duration-200 hover:bg-background md:grid-cols-12 md:items-center md:gap-4"
            >
              <div className="col-span-4 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ink to-[#3A3D46] text-xs font-semibold text-white shadow-soft">
                  {c.name.slice(0, 1)}
                </span>
                <span className="font-medium text-ink">{c.name}</span>
              </div>
              <span className="col-span-3 text-sm text-muted">{c.sector}</span>
              <span className="col-span-2 font-display text-lg font-semibold tracking-tightest text-accent">
                {c.mrr}
                <span className="ml-1 text-xs font-normal text-muted">/mois</span>
              </span>
              <span className="col-span-2">
                <span
                  className="inline-flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: AGENT_COLOR[c.agent] ?? "#16181D" }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: AGENT_COLOR[c.agent] ?? "#16181D" }}
                  />
                  {c.agent}
                </span>
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
                  {c.status === "active" ? "Actif" : "Inactif"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
