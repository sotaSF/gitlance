import { createAdminSupabase, createServerSupabase } from "@/lib/supabase/server";
import { env } from "@/config/env";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getRagSupabase(): Promise<SupabaseClient> {
  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    return createAdminSupabase();
  }

  return createServerSupabase();
}
