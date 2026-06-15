"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type {
  ProfileSettingsFormData,
  SocialLinksFormData,
  LinkedProvider,
} from "@/types/settings";

/**
 * Get current user settings data
 */
export async function getUserSettings(): Promise<{
  success: boolean;
  data?: {
    profile: ProfileSettingsFormData;
    social: SocialLinksFormData;
    linkedProviders: LinkedProvider[];
  };
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        `
        display_name,
        username,
        headline,
        description,
        location,
        timezone,
        pronouns,
        years_experience,
        seniority,
        primary_role,
        github_username,
        linkedin_url,
        avatar_url,
        stripe_connect_id
      `
      )
      .eq("id", user.id)
      .single();

    if (profileError) {
      return { success: false, error: "Failed to fetch profile data" };
    }

    // Get linked providers from user metadata
    // Supabase stores providers in app_metadata.providers array
    const linkedProviders: LinkedProvider[] = [];
    const providers = (user.app_metadata?.providers as string[]) || [];

    for (const provider of providers) {
      linkedProviders.push({
        provider: provider as "email" | "github" | "google",
        identity_id: user.id,
        created_at: user.created_at,
      });
    }

    return {
      success: true,
      data: {
        profile: {
          display_name: profile.display_name,
          username: profile.username,
          headline: profile.headline,
          description: profile.description,
          location: profile.location,
          timezone: profile.timezone,
          pronouns: profile.pronouns,
          years_experience: profile.years_experience,
          seniority: profile.seniority,
          primary_role: profile.primary_role,
          avatar_url: profile.avatar_url,
          stripe_connect_id: profile.stripe_connect_id,
        },
        social: {
          github_username: profile.github_username,
          linkedin_url: profile.linkedin_url,
        },
        linkedProviders,
      },
    };
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update profile settings
 */
export async function updateProfileSettings(
  data: ProfileSettingsFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // If username is being changed, check availability
    if (data.username) {
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", data.username)
        .neq("id", user.id)
        .single();

      if (existingUser) {
        return { success: false, error: "Username is already taken" };
      }
    }

    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: data.display_name,
        username: data.username,
        headline: data.headline,
        description: data.description,
        location: data.location,
        timezone: data.timezone,
        pronouns: data.pronouns,
        years_experience: data.years_experience,
        seniority: data.seniority,
        primary_role: data.primary_role,
        avatar_url: data.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return { success: false, error: "Failed to update profile" };
    }

    revalidatePath("/settings");
    // Revalidate using the updated username for SEO-friendly URL
    if (data.username) {
      revalidatePath(`/profile/${data.username}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error in updateProfileSettings:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update social links
 */
export async function updateSocialLinks(
  data: SocialLinksFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Update social links
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        // github_username is managed via OAuth connection only
        linkedin_url: data.linkedin_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating social links:", updateError);
      return { success: false, error: "Failed to update social links" };
    }

    // Get the user's username for revalidation
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    revalidatePath("/settings");
    // Revalidate using username for SEO-friendly URL
    if (profile?.username) {
      revalidatePath(`/profile/${profile.username}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error in updateSocialLinks:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Check username availability
 */
export async function checkUsernameAvailability(
  username: string
): Promise<{ available: boolean }> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", user?.id || "")
      .single();

    return { available: !existingUser };
  } catch (error) {
    // If no user found, username is available
    return { available: true };
  }
}

/**
 * Update password
 */
export async function updatePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("Error updating password:", updateError);
      return { success: false, error: "Failed to update password" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in updatePassword:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get linked OAuth providers
 */
export async function getLinkedProviders(): Promise<{
  success: boolean;
  providers?: LinkedProvider[];
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get identities from user metadata
    // Supabase stores identities in the user object
    const providers: LinkedProvider[] = [];

    // Check user.app_metadata.providers array
    const linkedProviders = (user.app_metadata?.providers as string[]) || [];

    for (const provider of linkedProviders) {
      providers.push({
        provider: provider as "email" | "github" | "google",
        identity_id: user.id,
        created_at: user.created_at,
      });
    }

    return { success: true, providers };
  } catch (error) {
    console.error("Error fetching linked providers:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Link OAuth provider to account
 * Note: This routes through /auth/callback to ensure token is stored in database
 */
export async function linkOAuthProvider(
  provider: "github" | "google",
  redirect: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get origin from headers (server-side)
    const headersList = await headers();
    const origin =
      headersList.get("origin") ||
      headersList.get("referer")?.split("/").slice(0, 3).join("/") ||
      "";

    if (!origin) {
      console.error(
        "[linkOAuthProvider] Could not determine origin from headers"
      );
      return {
        success: false,
        error: "Could not determine application origin",
      };
    }

    // IMPORTANT: Route through /auth/callback to ensure token is captured and stored
    // The callback will then redirect to the final destination
    const finalPath = redirect.startsWith("http")
      ? new URL(redirect).pathname
      : redirect;

    // Build callback URL with next parameter pointing to final destination
    const callbackUrl = new URL("/auth/callback", origin);
    callbackUrl.searchParams.set("next", finalPath);

    console.log(
      `[linkOAuthProvider] Origin: ${origin}, Final path: ${finalPath}`
    );
    console.log(
      `[linkOAuthProvider] Redirecting through callback: ${callbackUrl.toString()}`
    );

    // Initiate OAuth linking flow using linkIdentity
    const { data, error } = await supabase.auth.linkIdentity({
      provider: provider,
      options: {
        scopes: provider === "github" ? "repo user:email" : undefined,
        queryParams: {
          prompt: "consent",
        },
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      console.error("Error linking provider:", error);
      return { success: false, error: `Failed to link ${provider}` };
    }

    console.log(`[linkOAuthProvider] OAuth URL generated for ${provider}`);
    return { success: true, url: data.url };
  } catch (error) {
    console.error("Error in linkOAuthProvider:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Re-authorize GitHub with additional scopes
 * Use this when user already has GitHub linked but needs additional permissions (e.g., repo scope)
 * Routes through /auth/callback to ensure token is stored in database
 */
export async function reauthorizeGitHubWithScopes(
  scopes: string,
  redirectTo: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get origin from headers (server-side)
    const headersList = await headers();
    const origin =
      headersList.get("origin") ||
      headersList.get("referer")?.split("/").slice(0, 3).join("/") ||
      "";

    if (!origin) {
      console.error(
        "[reauthorizeGitHub] Could not determine origin from headers"
      );
      return {
        success: false,
        error: "Could not determine application origin",
      };
    }

    // IMPORTANT: Route through /auth/callback to ensure token is captured and stored
    const finalPath = redirectTo.startsWith("http")
      ? new URL(redirectTo).pathname
      : redirectTo;

    // Build callback URL with next parameter pointing to final destination
    const callbackUrl = new URL("/auth/callback", origin);
    callbackUrl.searchParams.set("next", finalPath);

    console.log(
      `[reauthorizeGitHub] Origin: ${origin}, Final path: ${finalPath}`
    );
    console.log(
      `[reauthorizeGitHub] Redirecting through callback: ${callbackUrl.toString()}`
    );

    // Use regular OAuth sign-in flow with prompt=consent to force re-authorization
    // This doesn't try to "link" - it just re-authorizes with new scopes
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        scopes: scopes,
        queryParams: {
          prompt: "consent", // Force GitHub to show authorization screen
        },
        redirectTo: callbackUrl.toString(),
        skipBrowserRedirect: true, // Return URL instead of redirecting
      },
    });

    if (error) {
      console.error("Error re-authorizing GitHub:", error);
      return { success: false, error: "Failed to re-authorize GitHub" };
    }

    console.log(
      `[reauthorizeGitHub] OAuth URL generated with scopes: ${scopes}`
    );
    return { success: true, url: data.url };
  } catch (error) {
    console.error("Error in reauthorizeGitHubWithScopes:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Smart GitHub authorization that handles both new linking and re-authorization
 * Automatically detects if GitHub is already linked and chooses the right flow
 */
export async function authorizeGitHub(
  scopes: string,
  redirectTo: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if GitHub is already linked
    const hasGitHub = user.identities?.some((id) => id.provider === "github");

    if (hasGitHub) {
      // User already has GitHub linked - use re-authorization flow
      console.log("GitHub already linked, using re-authorization flow");
      return await reauthorizeGitHubWithScopes(scopes, redirectTo);
    } else {
      // User doesn't have GitHub - use link identity flow
      console.log("GitHub not linked, using link identity flow");
      return await linkOAuthProvider("github", redirectTo);
    }
  } catch (error) {
    console.error("Error in authorizeGitHub:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Sync GitHub token from session to database for persistent storage
 * Call this after successful GitHub authorization to ensure token is stored
 *
 * This is the PRIMARY method for storing OAuth tokens after GitHub redirects back.
 * It extracts the provider_token from the active session and stores it with scopes.
 */
export async function syncGitHubTokenToDatabase(): Promise<{
  success: boolean;
  stored?: boolean;
  alreadyStored?: boolean;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    console.log("[syncGitHubToken] Starting token sync...");

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("[syncGitHubToken] Session error:", sessionError);
      return { success: false, error: "Session error" };
    }

    if (!session) {
      console.warn("[syncGitHubToken] No active session found");
      return { success: false, error: "No active session" };
    }

    // Check if user has GitHub identity
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("[syncGitHubToken] User error:", userError);
      return { success: false, error: "Not authenticated" };
    }

    const githubIdentity = user.identities?.find(
      (id) => id.provider === "github"
    );

    if (!githubIdentity) {
      console.warn(
        "[syncGitHubToken] No GitHub identity found for user",
        user.id
      );
      return { success: false, error: "GitHub not linked to account" };
    }

    // Extract provider token from session
    const providerToken = session.provider_token;

    if (!providerToken) {
      console.error(
        "[syncGitHubToken] No provider_token in session for user",
        user.id
      );
      console.log("[syncGitHubToken] Session keys:", Object.keys(session));

      // Check if token already exists in database (maybe it was stored earlier)
      const { data: existingToken } = await supabase
        .from("oauth_tokens")
        .select("access_token")
        .eq("user_id", user.id)
        .eq("provider", "github")
        .maybeSingle();

      if (existingToken?.access_token) {
        console.log(
          "[syncGitHubToken] Token already exists in database, no sync needed"
        );
        return { success: true, alreadyStored: true };
      }

      return {
        success: false,
        error: "GitHub token not found in session. Try re-authorizing GitHub.",
      };
    }

    console.log("[syncGitHubToken] Found provider_token in session");

    // Get token scopes from GitHub identity data
    const scopesString = githubIdentity.identity_data?.scopes as
      | string
      | undefined;
    let scopes = scopesString ? scopesString.split(" ") : [];

    console.log("[syncGitHubToken] Scopes from identity:", scopes);

    // Fallback: If no scopes found in identity (common issue), fetch from GitHub API
    if (scopes.length === 0) {
      console.log(
        "[syncGitHubToken] No scopes in identity, fetching from GitHub API..."
      );
      try {
        // Dynamically import to avoid circular dependencies if any
        const { getGitHubTokenScopes } = await import("@/lib/services/github");
        const fetchedScopes = await getGitHubTokenScopes(providerToken);

        if (fetchedScopes.length > 0) {
          console.log(
            "[syncGitHubToken] Fetched scopes from API:",
            fetchedScopes
          );
          scopes = fetchedScopes;
        } else {
          console.warn(
            "[syncGitHubToken] Failed to fetch scopes from API or no scopes granted"
          );
        }
      } catch (scopeError) {
        console.error(
          "[syncGitHubToken] Error fetching scopes fallback:",
          scopeError
        );
      }
    }

    // Store token in database using the existing storeOAuthToken function
    const result = await storeOAuthToken({
      provider: "github",
      accessToken: providerToken,
      scopes,
    });

    if (!result.success) {
      console.error("[syncGitHubToken] Failed to store token:", result.error);
      return { success: false, error: result.error };
    }

    console.log(
      `[syncGitHubToken] ✅ Successfully stored GitHub token for user ${user.id} with scopes:`,
      scopes
    );
    return { success: true, stored: true };
  } catch (error) {
    console.error("[syncGitHubToken] Exception:", error);
    return { success: false, error: "Failed to sync GitHub token" };
  }
}

/**
 * Unlink OAuth provider from account
 */
export async function unlinkOAuthProvider(
  provider: "github" | "google"
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Find the identity to unlink
    const identity = user.identities?.find((id) => id.provider === provider);

    if (!identity) {
      return { success: false, error: `${provider} not linked` };
    }

    // Unlink the identity
    const { error } = await supabase.auth.unlinkIdentity(identity);

    if (error) {
      console.error("Error unlinking provider:", error);
      return { success: false, error: `Failed to unlink ${provider}` };
    }

    // If unlinking GitHub, remove the username from profile
    if (provider === "github") {
      await supabase
        .from("profiles")
        .update({
          github_username: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error in unlinkOAuthProvider:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Sync GitHub username from linked identity to profile
 * Call this after GitHub OAuth linking completes
 */
export async function syncGitHubUsername(): Promise<{
  success: boolean;
  github_username?: string;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get current user with identities
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Find GitHub identity
    const githubIdentity = user.identities?.find(
      (identity) => identity.provider === "github"
    );

    if (!githubIdentity) {
      return { success: false, error: "GitHub not linked" };
    }

    // Extract GitHub username from identity data
    // GitHub OAuth returns the username in the 'login' field
    const identityData = githubIdentity.identity_data as any;
    const githubUsername =
      identityData?.login ||
      identityData?.user_name ||
      identityData?.preferred_username;

    console.log("GitHub identity data:", identityData);
    console.log("Extracted username:", githubUsername);

    if (!githubUsername) {
      console.error(
        "Full GitHub identity:",
        JSON.stringify(githubIdentity, null, 2)
      );
      return {
        success: false,
        error: "GitHub username not found in identity data",
      };
    }

    // Update profile with GitHub username
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        github_username: githubUsername as string,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating GitHub username:", updateError);
      return { success: false, error: "Failed to update profile" };
    }

    console.log("Successfully synced GitHub username:", githubUsername);
    revalidatePath("/settings");
    revalidatePath("/onboarding");
    return { success: true, github_username: githubUsername as string };
  } catch (error) {
    console.error("Error in syncGitHubUsername:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Upload profile picture to Supabase storage
 */
export async function uploadProfilePicture(
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error:
          "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
      };
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return {
        success: false,
        error: "File size exceeds 5MB limit.",
      };
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

    // Delete old avatar if exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    if (profile?.avatar_url) {
      // Extract old filename from URL
      const oldFileName = profile.avatar_url.split("/").pop();
      if (oldFileName) {
        const oldFilePath = `${user.id}/${oldFileName}`;
        await supabase.storage.from("profilepicbucket").remove([oldFilePath]);
      }
    }

    // Upload file to Supabase storage
    const { data, error: uploadError } = await supabase.storage
      .from("profilepicbucket")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return { success: false, error: "Failed to upload file" };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("profilepicbucket").getPublicUrl(fileName);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("Error in uploadProfilePicture:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Store OAuth provider token in database for persistent access
 */
export async function storeOAuthToken(data: {
  provider: "github" | "google";
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number; // seconds
  scopes?: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Calculate expiration time
    const expiresAt = data.expiresIn
      ? new Date(Date.now() + data.expiresIn * 1000).toISOString()
      : null;

    // Upsert token (insert or update if exists)
    const { error } = await supabase.from("oauth_tokens").upsert(
      {
        user_id: user.id,
        provider: data.provider,
        access_token: data.accessToken,
        refresh_token: data.refreshToken || null,
        expires_at: expiresAt,
        scopes: data.scopes || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,provider",
      }
    );

    if (error) {
      console.error("Error storing OAuth token:", error);
      return { success: false, error: "Failed to store OAuth token" };
    }

    console.log(
      `Successfully stored ${data.provider} OAuth token for user ${user.id}`
    );
    return { success: true };
  } catch (error) {
    console.error("Error in storeOAuthToken:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get OAuth token from database for a specific provider
 */
export async function getOAuthToken(provider: "github" | "google"): Promise<{
  success: boolean;
  token?: string;
  refreshToken?: string;
  expiresAt?: string | null;
  scopes?: string[] | null;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Query oauth_tokens table
    const { data, error } = await supabase
      .from("oauth_tokens")
      .select("access_token, refresh_token, expires_at, scopes")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No token found - not an error, just no token stored yet
        return { success: true, token: undefined };
      }
      console.error(`Error fetching ${provider} token:`, error);
      return { success: false, error: "Failed to fetch OAuth token" };
    }

    return {
      success: true,
      token: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
      scopes: data.scopes,
    };
  } catch (error) {
    console.error("Error in getOAuthToken:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Clear a corrupted or invalid OAuth token from the database
 * Use this when the stored token is invalid and user needs to re-authorize
 */
export async function clearOAuthToken(
  provider: "github" | "google"
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Delete the token from the database
    const { error } = await supabase
      .from("oauth_tokens")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", provider);

    if (error) {
      console.error(`Error clearing ${provider} token:`, error);
      return { success: false, error: `Failed to clear ${provider} token` };
    }

    console.log(`Successfully cleared ${provider} token for user ${user.id}`);
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error in clearOAuthToken:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Validate if the stored GitHub token is actually a valid GitHub token
 * Returns false if the token appears to be from another provider (e.g., Google)
 */
export async function validateGitHubToken(): Promise<{
  valid: boolean;
  needsReauthorization: boolean;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        valid: false,
        needsReauthorization: false,
        error: "Not authenticated",
      };
    }

    // Get the stored token
    const { data: tokenData } = await supabase
      .from("oauth_tokens")
      .select("access_token")
      .eq("user_id", user.id)
      .eq("provider", "github")
      .maybeSingle();

    if (!tokenData?.access_token) {
      // No token stored - need to authorize
      return { valid: false, needsReauthorization: true };
    }

    const token = tokenData.access_token;

    // Check if token looks like a Google token (corrupted data)
    if (token.startsWith("ya29.")) {
      console.error(
        "[validateGitHubToken] Token is a Google token, not GitHub!"
      );
      return { valid: false, needsReauthorization: true };
    }

    // Try to validate with GitHub API
    try {
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (response.ok) {
        return { valid: true, needsReauthorization: false };
      } else if (response.status === 401) {
        console.log("[validateGitHubToken] Token is invalid or expired");
        return { valid: false, needsReauthorization: true };
      } else {
        console.log(
          "[validateGitHubToken] Unexpected response:",
          response.status
        );
        return { valid: false, needsReauthorization: true };
      }
    } catch (apiError) {
      console.error("[validateGitHubToken] API call failed:", apiError);
      return {
        valid: false,
        needsReauthorization: true,
        error: "Failed to validate token",
      };
    }
  } catch (error) {
    console.error("Error in validateGitHubToken:", error);
    return {
      valid: false,
      needsReauthorization: false,
      error: "An unexpected error occurred",
    };
  }
}
