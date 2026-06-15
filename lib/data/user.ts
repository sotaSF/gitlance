import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { cache } from "react";

// In-memory cache for current request to avoid duplicate getUser calls
// This is cleared per request in Next.js App Router

/**
 * Gets the current authenticated user
 * Returns null if not authenticated
 * Use this when you want to handle the auth state manually
 *
 * NOTE: For better performance, prefer requireUser() which has built-in
 * caching logic to prevent duplicate API calls within the same request.
 */
export async function getUser(): Promise<User | null> {
  // Check if already fetched in this request cycle
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;

  return user;
}

/**
 * Requires an authenticated user
 * Automatically redirects to /auth/sign-in if not authenticated
 * Use this in protected routes/pages and server actions
 *
 * OPTIMIZED: Includes per-request caching to eliminate duplicate getUser() calls
 * when multiple server actions run in parallel
 *
 * Note: Cannot delete cookies here as this is called from Server Components.
 * Cookie cleanup is handled by supabase.auth.signOut() and in middleware/actions.
 */
export async function requireUser(): Promise<User> {
  // Return cached user if already fetched in this request

  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Cache the result

  if (error || !user) {
    // Sign out to ensure clean state (Supabase handles cookie cleanup)
    await supabase.auth.signOut();

    // Check if it's a ban-specific error
    const errorMessage = error?.message?.toLowerCase() || "";
    if (
      errorMessage.includes("banned") ||
      errorMessage.includes("disabled") ||
      errorMessage.includes("access_denied")
    ) {
      redirect(
        "/auth/sign-in?error=Your account has been banned. Please contact support."
      );
    }

    redirect("/auth/sign-in");
  }

  return user;
}

/**
 * Gets the current session
 * Returns null if no active session
 */
export async function getSession() {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

/**
 * Requires an active session
 * Automatically redirects to /auth/sign-in if no session
 *
 * Note: Cannot delete cookies here as this is called from Server Components.
 * Cookie cleanup is handled by supabase.auth.signOut() and in middleware/actions.
 */
export async function requireSession() {
  const supabase = await createServerSupabase();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    // Sign out to ensure clean state (Supabase handles cookie cleanup)
    await supabase.auth.signOut();

    redirect("/auth/sign-in");
  }

  return session;
}

/**
 * Check if user has completed onboarding
 * Returns true if completed, false otherwise
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .single();

  if (error) {
    // If profile doesn't exist, onboarding is not complete
    console.error("Error checking onboarding status:", error);
    return false;
  }

  return data?.onboarding_completed === true;
}

/**
 * Requires user to have completed onboarding
 * Redirects to /onboarding if not completed
 */
export async function requireOnboarding(): Promise<User> {
  const user = await requireUser();
  const completed = await hasCompletedOnboarding(user.id);

  if (!completed) {
    redirect("/onboarding");
  }

  return user;
}
