import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { AgentName, LogStatus } from "@/lib/types";

interface LogInput {
  agent: AgentName;
  action: string;
  summary?: string;
  entityType?: string;
  entityId?: string;
  status?: LogStatus;
  metadata?: Record<string, unknown>;
}

/**
 * Append a row to agent_logs. Never throws — logging failures must not break
 * the calling action. Errors are swallowed and reported to the console.
 */
export async function logActivity(input: LogInput): Promise<void> {
  try {
    await supabaseAdmin()
      .from("agent_logs")
      .insert({
        agent: input.agent,
        action: input.action,
        summary: input.summary ?? null,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        status: input.status ?? "success",
        metadata: input.metadata ?? null,
      });
  } catch (err) {
    console.error("[logActivity] failed:", err);
  }
}
