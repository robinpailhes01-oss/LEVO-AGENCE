import { FileBarChart, ThumbsUp, ThumbsDown, Target } from "lucide-react";
import {
  HERMES_KPIS,
  HERMES_WORKED,
  HERMES_NOT_WORKED,
  HERMES_ACTIONS,
} from "@/lib/mock";

export default function HermesPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            HERMES — Analytics
          </h1>
          <p className="text-sm text-muted">
            Rapport de la semaine du 22 au 28 juin.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-hermes px-4 py-2.5 text-sm font-medium text-white shadow-soft transition-all hover:brightness-110 active:scale-[0.98]">
          <FileBarChart className="h-4 w-4" />
          Générer rapport
        </button>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {HERMES_KPIS.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl bg-card p-5 shadow-soft transition-shadow hover:shadow-card"
          >
            <p className="text-xs text-muted">{kpi.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold text-ink">
              {kpi.value}
            </p>
            <p
              className={`mt-1 text-xs font-medium ${
                kpi.direction === "up" ? "text-success" : "text-danger"
              }`}
            >
              {kpi.direction === "up" ? "▲" : "▼"} {kpi.trend}
            </p>
          </div>
        ))}
      </section>

      {/* Worked / not worked */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
              <ThumbsUp className="h-4 w-4" />
            </span>
            <h2 className="font-display text-lg font-semibold text-ink">
              Ce qui a marché
            </h2>
          </div>
          <ul className="mt-3 space-y-2">
            {HERMES_WORKED.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink/80">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger/10 text-danger">
              <ThumbsDown className="h-4 w-4" />
            </span>
            <h2 className="font-display text-lg font-semibold text-ink">
              Ce qui n'a pas marché
            </h2>
          </div>
          <ul className="mt-3 space-y-2">
            {HERMES_NOT_WORKED.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink/80">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Recommended actions */}
      <section className="rounded-2xl bg-card p-5 shadow-card">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Target className="h-4 w-4" />
          </span>
          <h2 className="font-display text-lg font-semibold text-ink">
            Top 3 actions recommandées
          </h2>
        </div>
        <ol className="mt-3 space-y-2">
          {HERMES_ACTIONS.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-ink/80">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
