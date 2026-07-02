/**
 * Accès centralisé et typé aux variables d'environnement.
 * Jamais de secret en dur — tout passe par process.env ici.
 * Les secrets serveur sont lus en lazy (getters) : tant qu'on ne les utilise
 * pas, le build et les pages visuelles continuent de fonctionner sans clés.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. À configurer dans Vercel.`,
    );
  }
  return value;
}

/** Valeurs publiques — exposables au navigateur. */
export const publicEnv = {
  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
} as const;

/** Secrets serveur. Accédés via getters → jamais inclus dans le bundle client. */
export const serverEnv = {
  get supabaseUrl(): string {
    return required(
      "SUPABASE_URL",
      process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
  },
  get supabaseServiceRoleKey(): string {
    return required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  },
  get anthropicApiKey(): string {
    return required("ANTHROPIC_API_KEY", process.env.ANTHROPIC_API_KEY);
  },
  get openaiApiKey(): string {
    return required("OPENAI_API_KEY", process.env.OPENAI_API_KEY);
  },
  get dashboardPassword(): string {
    return required("DASHBOARD_PASSWORD", process.env.DASHBOARD_PASSWORD);
  },
  get authSecret(): string {
    return required("AUTH_SECRET", process.env.AUTH_SECRET);
  },
  get mcpSecret(): string {
    return required("LEVO_MCP_SECRET", process.env.LEVO_MCP_SECRET);
  },
  get cronSecret(): string {
    return process.env.CRON_SECRET ?? process.env.LEVO_MCP_SECRET ?? "";
  },
  get resendApiKey(): string | undefined {
    return process.env.RESEND_API_KEY;
  },
  get emailTo(): string | undefined {
    return process.env.EMAIL_TO;
  },
  /** Instantly.ai — envoi/séquences/replies. Optionnel tant que non branché. */
  get instantlyApiKey(): string | undefined {
    return process.env.INSTANTLY_API_KEY;
  },
  /** Outscraper — scraping Google Maps + enrichment email/Instagram. Optionnel. */
  get outscraperApiKey(): string | undefined {
    return process.env.OUTSCRAPER_API_KEY;
  },
  /** Apify — scraping alternatif, si connecté. Optionnel. */
  get apifyApiToken(): string | undefined {
    return process.env.APIFY_API_TOKEN;
  },
} as const;

/** True si Supabase est configuré (sans lever d'erreur). Pour dégrader proprement. */
export function hasSupabase(): boolean {
  return (
    !!(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
