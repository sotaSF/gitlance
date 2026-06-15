import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/config/env";

export const createBrowserSupabase = () =>
  createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
