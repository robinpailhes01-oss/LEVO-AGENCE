import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { AgentName, LogStatus } from "@/lib/db";

interface LogInput {
  agent: AgentName;
  action: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  status?: LogStatus;
  durationMs?: number;
  costTokens?: number;
  error?: string;
}

/**
 * Ajoute une ligne dans agent_logs. Ne lève jamais — une erreur de log ne doit
 * pas casser l'action appelante. Les erreurs sont seulement remontées en console.
 */
export async function logAgent(input: LogInput): Promise<void> {
  try {
    await supabaseAdmin()
      .from("agent_logs")
      .insert({
        agent_name: input.agent,
        action: input.action,
        input_data: input.input ?? null,
        output_data: input.output ?? null,
        status: input.status ?? "success",
        duration_ms: input.durationMs ?? null,
        cost_tokens: input.costTokens ?? null,
        error_message: input.error ?? null,
      });
  } catch (err) {
    console.error("[logAgent] échec:", err);
  }
}
