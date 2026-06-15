export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY, // server only - bypasses RLS
  GEMINI_API_KEY: process.env.GEMINI_API_KEY, // server only
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY, // server only
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY, // client only
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET, // server only
  GROK_CLOUD_API_KEY: process.env.GROK_CLOUD_API, // server only
};
