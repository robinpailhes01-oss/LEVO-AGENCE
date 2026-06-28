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
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Clients</h1>
        <p className="text-sm text-muted">{active} clients actifs</p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-card">
        {/* header — desktop */}
        <div className="hidden grid-cols-12 gap-4 border-b border-line/60 px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted md:grid">
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
              className="grid grid-cols-1 gap-2 px-5 py-4 transition-colors hover:bg-background md:grid-cols-12 md:items-center md:gap-4"
            >
              <div className="col-span-4 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                  {c.name.slice(0, 1)}
                </span>
                <span className="font-medium text-ink">{c.name}</span>
              </div>
              <span className="col-span-3 text-sm text-muted">{c.sector}</span>
              <span className="col-span-2 font-display text-lg font-semibold text-accent">
                {c.mrr}
                <span className="ml-1 text-xs font-normal text-muted">/mois</span>
              </span>
              <span className="col-span-2">
                <span
                  className="inline-flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: AGENT_COLOR[c.agent] ?? "#1A1A1A" }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: AGENT_COLOR[c.agent] ?? "#1A1A1A" }}
                  />
                  {c.agent}
                </span>
              </span>
              <span className="col-span-1 md:text-right">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    c.status === "active"
                      ? "bg-success/10 text-success"
                      : "bg-muted/10 text-muted"
                  }`}
                >
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
