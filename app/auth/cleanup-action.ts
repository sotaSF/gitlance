"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { clearAuthCookies } from "@/lib/auth/cookies";

/**
 * Server Action to clean up authentication state
 * Use this when you need to forcefully clear auth cookies and sign out
 * This can only be called from client components via form actions or useTransition
 */
export async function cleanupAuthAndRedirect(errorMessage?: string) {
  const supabase = await createServerSupabase();

  // Sign out the user
  await supabase.auth.signOut();

  // Clear all auth cookies
  await clearAuthCookies();

  // Redirect to sign-in with optional error message
  const redirectUrl = errorMessage
    ? `/auth/sign-in?error=${encodeURIComponent(errorMessage)}`
    : "/auth/sign-in";

  redirect(redirectUrl);
}
