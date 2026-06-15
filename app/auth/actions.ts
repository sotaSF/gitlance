"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { hasCompletedOnboarding } from "@/lib/data/user";
import { headers } from "next/headers";

function getAppOrigin(requestOrigin?: string | null): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    requestOrigin ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

/**
 * Sign in action using Supabase Auth
 * Authentication is handled in server actions, not in proxy.ts
 */
export async function signInAction(
  formData: FormData
): Promise<{ error?: string } | void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { error: "Invalid email format" };
  }

  // Validate password length (minimum 8 characters)
  if (password.length < 8) {
    return { error: "Invalid credentials" };
  }

  const supabase = await createServerSupabase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    // Clear any stale cookies before throwing error
    await clearAuthCookies();

    // Check if it's an email not confirmed error
    if (error.message.includes("Email not confirmed")) {
      // Redirect to confirmation email waiting page
      redirect(`/auth/confirm-email?email=${encodeURIComponent(email.trim())}`);
    }

    // Generic error message to prevent username enumeration attacks
    return { error: "Invalid credentials" };
  }

  // Verify the user is not banned or disabled
  if (data.user) {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      // User is banned or account is disabled
      await supabase.auth.signOut();

      // Clear cookies
      await clearAuthCookies();

      return { error: "Your account has been banned. Please contact support." };
    }

    // Check if user has completed onboarding
    const onboardingComplete = await hasCompletedOnboarding(userData.user.id);

    if (!onboardingComplete) {
      // First-time user - redirect to onboarding
      redirect("/onboarding");
    }
  }

  // Successful authentication - redirect to dashboard
  redirect("/explore");
}

/**
 * Normalize email by removing dots from the local part (before @)
 * This prevents duplicate accounts since providers like Gmail treat
 * john.doe@gmail.com and johndoe@gmail.com as the same account
 */
function normalizeEmail(email: string): string {
  const trimmedEmail = email.trim().toLowerCase();
  const [localPart, domain] = trimmedEmail.split("@");

  if (!localPart || !domain) {
    return trimmedEmail;
  }

  // Remove dots from local part only, keep domain intact
  const normalizedLocalPart = localPart.replace(/\./g, "");
  return `${normalizedLocalPart}@${domain}`;
}

/**
 * Sign up action using Supabase Auth
 */
export async function signUpAction(
  formData: FormData
): Promise<{ error?: string } | void> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm") as string;

  if (!name || !email || !password || !confirmPassword) {
    return { error: "All fields are required" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  // Validate name (must not be empty and should only contain letters and spaces)
  if (name.trim().length < 2) {
    return { error: "Name must be at least 2 characters long" };
  }

  if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
    return { error: "Name must only contain letters and spaces" };
  }

  // Validate email format before normalization
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { error: "Invalid email format" };
  }

  // Normalize email: remove dots from local part to prevent duplicate accounts
  const normalizedEmail = normalizeEmail(email);

  // Validate password (minimum 8 characters, at least one letter and one number)
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return {
      error:
        "Password must be at least 8 characters long and include at least one letter and one number",
    };
  }

  // Prevent password reuse (optional: could check against common passwords list)
  const commonPasswords = ["password", "12345678", "password123"];
  if (commonPasswords.includes(password.toLowerCase())) {
    return {
      error: "Password is too common. Please choose a stronger password",
    };
  }

  const supabase = await createServerSupabase();
  const origin = (await headers()).get("origin");

  if (!origin) {
    return { error: "Unable to determine origin" };
  }

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,

    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        name: name.trim(),
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Redirect to confirmation email waiting page
  redirect(`/auth/confirm-email?email=${encodeURIComponent(email.trim())}`);
}

/**
 * OAuth sign in action
 */
export async function oauthSignIn(
  provider: "github" | "google",
  options?: {
    isAuthorization?: boolean;
    redirectPath?: string;
  }
): Promise<{ error: string } | void> {
  const supabase = await createServerSupabase();
  const origin = getAppOrigin((await headers()).get("origin"));

  if (!origin) {
    return { error: "Unable to determine origin" };
  }

  const isAuthorization = options?.isAuthorization || false;
  const redirectPath = options?.redirectPath || "/explore";

  // Construct the callback URL with the next parameter
  const callbackUrl = new URL(`${origin}/auth/callback`);
  callbackUrl.searchParams.set("next", redirectPath);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl.toString(),
      // FOR GITHUB scopes: "repo user:email",
      scopes:
        isAuthorization && provider === "github"
          ? "repo user:email"
          : undefined,
      // Force consent to ensure scopes are requested even if already logged in
      queryParams: isAuthorization ? { prompt: "consent" } : undefined,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

/**
 * OAuth sign in wrapper for GitHub (for form actions)
 */
export async function oauthSignInGithub(): Promise<{ error: string } | void> {
  return oauthSignIn("github");
}

/**
 * OAuth sign in wrapper for Google (for form actions)
 */
export async function oauthSignInGoogle(): Promise<{ error: string } | void> {
  return oauthSignIn("google");
}

/*
 * Authorize github repository creation and collaboration
 */

/**
 * Resend confirmation email action
 */
export async function resendConfirmationEmail(
  email: string
): Promise<{ success: boolean; message: string }> {
  if (!email) {
    return { success: false, message: "Email is required" };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { success: false, message: "Invalid email format" };
  }

  const supabase = await createServerSupabase();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim(),
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: "Confirmation email sent successfully" };
}

/**
 * Sign out action
 */
export async function signOutAction() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/auth/sign-in");
}

/**
 * Request password reset action
 */
export async function requestPasswordResetAction(email: string) {
  try {
    if (!email) {
      return { error: "Email is required." };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { error: "Invalid email format." };
    }

    const origin = getAppOrigin();

    const supabase = await createServerSupabase();

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin}/auth/reset-password`,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "An error occurred";
    return { error: message };
  }
}

/**
 * Reset password action
 */
export async function resetPasswordAction(password: string) {
  try {
    const supabase = await createServerSupabase();
    // Get current user to verify they have an active recovery session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        error: "Session expired. Please request a new password reset link.",
      };
    }

    // Update password securely on the server
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "An error occurred";
    return { error: message };
  }
}
