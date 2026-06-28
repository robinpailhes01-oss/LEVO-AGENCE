/**
 * Centralized, typed access to environment variables.
 * Never hard-code secrets — everything flows through process.env here.
 * Server-only secrets are read lazily so client bundles never touch them.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Configure it in Vercel.`,
    );
  }
  return value;
}

/** Public values — safe to expose to the browser. */
export const publicEnv = {
  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
} as const;

/** Server-only secrets. Accessed via getters so they are never bundled client-side. */
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
    // Vercel Cron sends Authorization: Bearer <CRON_SECRET>. Fall back to the
    // MCP secret so a single secret works if CRON_SECRET isn't set separately.
    return process.env.CRON_SECRET ?? process.env.LEVO_MCP_SECRET ?? "";
  },
  get resendApiKey(): string | undefined {
    return process.env.RESEND_API_KEY;
  },
  get emailTo(): string | undefined {
    return process.env.EMAIL_TO;
  },
} as const;
