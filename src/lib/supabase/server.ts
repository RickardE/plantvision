import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { publicEnv, serverEnv } from "@/lib/env";
import type { Database } from "./database.types";

/** Supabase client acting as the signed-in user. RLS applies to every query. */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only. The proxy refreshes
          // the session, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Privileged client that bypasses RLS. Only for work that has no user context (background
 * AI jobs) or that Supabase restricts to the service role (inviting users, changing roles).
 * Callers must authorise the user themselves before using it.
 */
export function createSupabaseAdminClient() {
  const env = serverEnv();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type ServerSupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;
