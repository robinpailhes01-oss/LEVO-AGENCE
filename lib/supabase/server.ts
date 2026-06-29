import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";

/**
 * Client Supabase côté serveur, avec la service-role key.
 * NE JAMAIS importer depuis un Client Component. RSC / routes serveur uniquement.
 * La service role contourne la RLS — tout usage doit être derrière auth / garde MCP.
 */
let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(serverEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
