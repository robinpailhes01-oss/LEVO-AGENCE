"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

/**
 * Browser Supabase client (anon key, RLS-enforced).
 * Used only for realtime subscriptions / public reads from Client Components.
 */
let cached: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  if (cached) return cached;
  cached = createBrowserClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
  );
  return cached;
}
