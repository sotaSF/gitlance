import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/config/env";

/**
 * Creates a Supabase server client for use in Server Components and Server Actions
 * This should be used in your Data Access Layer (DAL) functions
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored in RSC (Read Static Cookies)
          }
        },
        
      },
    }
  );
}

/**
 * Creates a Supabase admin client using the service role key.
 * This bypasses RLS - use ONLY for trusted server-side operations
 * where app-level permission checks have already been done.
 */
export function createAdminSupabase() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );
}
