import { CheckCircle2, XCircle } from "lucide-react";
import { getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Presence-only check — never exposes secret values to the client. */
const ENV_CHECKS: { label: string; present: boolean; required: boolean }[] = [
  { label: "SUPABASE_URL", present: !!process.env.SUPABASE_URL, required: true },
  {
    label: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    required: true,
  },
  {
    label: "SUPABASE_SERVICE_ROLE_KEY",
    present: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    required: true,
  },
  { label: "ANTHROPIC_API_KEY", present: !!process.env.ANTHROPIC_API_KEY, required: true },
  { label: "OPENAI_API_KEY", present: !!process.env.OPENAI_API_KEY, required: false },
  { label: "DASHBOARD_PASSWORD", present: !!process.env.DASHBOARD_PASSWORD, required: true },
  { label: "AUTH_SECRET", present: !!process.env.AUTH_SECRET, required: true },
  { label: "LEVO_MCP_SECRET", present: !!process.env.LEVO_MCP_SECRET, required: true },
  { label: "RESEND_API_KEY", present: !!process.env.RESEND_API_KEY, required: false },
  { label: "EMAIL_TO", present: !!process.env.EMAIL_TO, required: false },
];

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">
          Paramètres
        </h2>
        <p className="text-sm text-muted">
          Configuration de l'environnement et réglages des agents.
        </p>
      </div>

      <div className="levo-card p-5">
        <h3 className="font-display text-lg font-semibold text-ink">
          Variables d'environnement
        </h3>
        <p className="text-xs text-muted">
          Statut de présence (les valeurs ne sont jamais affichées).
        </p>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ENV_CHECKS.map((env) => (
            <li
              key={env.label}
              className="flex items-center justify-between rounded-xl border border-line/60 px-3 py-2"
            >
              <span className="font-mono text-xs text-ink/80">{env.label}</span>
              {env.present ? (
                <span className="inline-flex items-center gap-1 text-xs text-success">
                  <CheckCircle2 className="h-4 w-4" /> Configuré
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1 text-xs ${
                    env.required ? "text-danger" : "text-muted"
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  {env.required ? "Manquant" : "Optionnel"}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="levo-card p-5">
        <h3 className="font-display text-lg font-semibold text-ink">
          Réglages agents
        </h3>
        {settings.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Aucun réglage. La table <code>settings</code> est vide ou
            inaccessible.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {settings.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-line/60 px-3 py-2"
              >
                <p className="text-sm font-medium text-ink">{s.key}</p>
                {s.description && (
                  <p className="text-xs text-muted">{s.description}</p>
                )}
                <pre className="mt-1 overflow-x-auto text-xs text-ink/70">
                  {JSON.stringify(s.value, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
