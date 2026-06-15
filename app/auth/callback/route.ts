import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { hasCompletedOnboarding } from "@/lib/data/user";
import { cookies } from "next/headers";

/**
 * OAuth Callback Handler
 * Handles the callback from OAuth providers (GitHub, Google, etc.)
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const next = requestUrl.searchParams.get("next") || "/explore";

  // Handle errors from OAuth provider (e.g., user_banned)
  if (error) {
    const cookieStore = await cookies();

    // Standardized error message for banned users
    let errorMessage = errorDescription || error;
    if (error === "access_denied" && errorDescription?.includes("banned")) {
      errorMessage = "Your account has been banned. Please contact support.";
    }

    const response = NextResponse.redirect(
      new URL(
        `/auth/sign-in?error=${encodeURIComponent(errorMessage)}`,
        request.url
      )
    );

    // Clear all Supabase auth cookies
    const allCookies = cookieStore.getAll();
    allCookies.forEach((cookie) => {
      if (cookie.name.includes("sb-")) {
        response.cookies.set(cookie.name, "", {
          maxAge: 0,
          path: "/",
        });
      }
    });

    return response;
  } else if (code) {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // Clear any existing auth cookies to prevent redirect loops
      const cookieStore = await cookies();
      const response = NextResponse.redirect(
        new URL(
          `/auth/sign-in?error=${encodeURIComponent(error.message)}`,
          request.url
        )
      );

      // Clear all Supabase auth cookies
      const allCookies = cookieStore.getAll();
      allCookies.forEach((cookie) => {
        if (cookie.name.includes("sb-")) {
          response.cookies.set(cookie.name, "", {
            maxAge: 0,
            path: "/",
          });
        }
      });

      return response;
    }

    // Verify the user session is valid after exchange
    if (data.session) {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        // User session is invalid (e.g., banned user)
        await supabase.auth.signOut();

        const cookieStore = await cookies();
        const response = NextResponse.redirect(
          new URL(
            `/auth/sign-in?error=${encodeURIComponent(
              userError?.message || "Authentication failed"
            )}`,
            request.url
          )
        );

        // Clear all Supabase cookies to prevent redirect loops
        const allCookies = cookieStore.getAll();
        allCookies.forEach((cookie) => {
          if (cookie.name.includes("sb-")) {
            response.cookies.set(cookie.name, "", {
              maxAge: 0,
              path: "/",
            });
          }
        });

        return response;
      }

      // Session is valid, check if user needs onboarding
      const onboardingComplete = await hasCompletedOnboarding(userData.user.id);

      // STORE OAUTH TOKEN IN DATABASE - ONLY FOR THE PROVIDER THAT WAS JUST USED
      console.log("[OAuth Callback] Session provider_token exists:", !!data.session.provider_token);
      console.log("[OAuth Callback] User identities:", userData.user.identities?.map(id => ({
        provider: id.provider,
        updated_at: id.updated_at
      })));
      
      if (data.session.provider_token && userData.user.identities) {
        // CRITICAL: Determine which provider was JUST used for this OAuth flow
        // by finding the identity with the most recent updated_at timestamp
        const sortedIdentities = [...userData.user.identities].sort((a, b) => {
          const dateA = new Date(a.updated_at || 0).getTime();
          const dateB = new Date(b.updated_at || 0).getTime();
          return dateB - dateA; // Most recent first
        });
        
        const currentProvider = sortedIdentities[0]?.provider;
        console.log("[OAuth Callback] Current OAuth provider detected:", currentProvider);
        
        // Only store token for the provider that was just used
        if (currentProvider === "github") {
          const githubIdentity = userData.user.identities.find(id => id.provider === "github");
          
          if (githubIdentity) {
            try {
              // Validate token is actually a GitHub token by making API call
              console.log("[OAuth Callback] Validating GitHub token...");
              
              const githubResponse = await fetch("https://api.github.com/user", {
                headers: {
                  Authorization: `Bearer ${data.session.provider_token}`,
                  Accept: "application/vnd.github.v3+json",
                },
              });
              
              if (!githubResponse.ok) {
                console.error("[OAuth Callback] Token validation failed - not a valid GitHub token. Status:", githubResponse.status);
                // Don't store invalid token
              } else {
                // Token is valid, extract scopes from response headers
                const scopesHeader = githubResponse.headers.get("x-oauth-scopes");
                let newScopes: string[] = scopesHeader 
                  ? scopesHeader.split(",").map(s => s.trim())
                  : [];
                
                // Also check identity data for scopes
                if (newScopes.length === 0 && githubIdentity.identity_data?.scopes) {
                  newScopes = (githubIdentity.identity_data.scopes as string).split(" ");
                }
                
                console.log("[OAuth Callback] GitHub token validated. New token scopes:", newScopes);

                // CRITICAL: Check if we already have a token with better scopes
                // Don't overwrite a token with 'repo' scope with one that doesn't have it
                const { data: existingToken } = await supabase
                  .from("oauth_tokens")
                  .select("scopes, access_token")
                  .eq("user_id", userData.user.id)
                  .eq("provider", "github")
                  .maybeSingle();

                const existingScopes = existingToken?.scopes || [];
                const existingHasRepoScope = existingScopes.includes("repo");
                const newHasRepoScope = newScopes.includes("repo");

                console.log("[OAuth Callback] Existing token scopes:", existingScopes);
                console.log("[OAuth Callback] Existing has repo scope:", existingHasRepoScope);
                console.log("[OAuth Callback] New has repo scope:", newHasRepoScope);

                // Decision logic:
                // 1. If no existing token -> store new token
                // 2. If existing has repo scope but new doesn't -> DON'T overwrite (keep existing)
                // 3. If new has repo scope -> store new token (upgrade)
                // 4. If neither has repo scope -> store new token (refresh)
                
                let shouldStoreToken = true;
                
                if (existingToken?.access_token && existingHasRepoScope && !newHasRepoScope) {
                  console.log("[OAuth Callback] ⚠️ Keeping existing token with 'repo' scope - new token doesn't have it");
                  console.log("[OAuth Callback] This was likely a regular sign-in, not an authorization with scopes");
                  shouldStoreToken = false;
                }

                if (shouldStoreToken) {
                  // Store token in database for persistent access
                  const { error: tokenError } = await supabase
                    .from("oauth_tokens")
                    .upsert({
                      user_id: userData.user.id,
                      provider: "github",
                      access_token: data.session.provider_token,
                      refresh_token: null, // GitHub doesn't provide refresh tokens via OAuth
                      expires_at: null, // GitHub tokens don't expire unless revoked
                      scopes: newScopes,
                      updated_at: new Date().toISOString(),
                    }, {
                      onConflict: 'user_id,provider'
                    });

                  if (tokenError) {
                    console.error("[OAuth Callback] FAILED to store GitHub token:", tokenError);
                  } else {
                    console.log(`[OAuth Callback] ✅ Successfully stored GitHub token for user ${userData.user.id} with scopes:`, newScopes);
                  }
                }
                
                // Always sync GitHub username to profile (regardless of token storage)
                const githubUsername = githubIdentity.identity_data?.login ||
                  githubIdentity.identity_data?.user_name ||
                  githubIdentity.identity_data?.preferred_username;
                
                if (githubUsername) {
                  const { error: profileError } = await supabase
                    .from("profiles")
                    .update({
                      github_username: githubUsername as string,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("id", userData.user.id);
                  
                  if (profileError) {
                    console.error("[OAuth Callback] Failed to sync GitHub username:", profileError);
                  } else {
                    console.log(`[OAuth Callback] ✅ Synced GitHub username: ${githubUsername}`);
                  }
                }
              }
            } catch (error) {
              // Log error but don't block the OAuth flow
              console.error("[OAuth Callback] Exception storing GitHub token:", error);
            }
          }
        } else if (currentProvider === "google") {
          // Google sign-in - store Google token separately (if needed)
          console.log("[OAuth Callback] Google OAuth detected - NOT storing as GitHub token");
          
          // Optionally store Google token for Google-related features
          try {
            const { error: tokenError } = await supabase
              .from("oauth_tokens")
              .upsert({
                user_id: userData.user.id,
                provider: "google",
                access_token: data.session.provider_token,
                refresh_token: data.session.provider_refresh_token || null,
                expires_at: null,
                scopes: [], // Google scopes if needed
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id,provider'
              });

            if (tokenError) {
              console.error("[OAuth Callback] Failed to store Google token:", tokenError);
            } else {
              console.log(`[OAuth Callback] ✅ Stored Google token for user ${userData.user.id}`);
            }
          } catch (error) {
            console.error("[OAuth Callback] Exception storing Google token:", error);
          }
        } else {
          console.log(`[OAuth Callback] Unknown provider: ${currentProvider} - not storing token`);
        }
      }

      if (!onboardingComplete) {
        // First-time user - redirect to onboarding
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }

      // User has completed onboarding - proceed to intended destination
    } else {
      // No session created - this shouldn't happen if code exchange succeeded
      return NextResponse.redirect(
        new URL(
          `/auth/sign-in?error=${encodeURIComponent(
            "Session creation failed"
          )}`,
          request.url
        )
      );
    }
  }

  // Check onboarding status before final redirect
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const onboardingComplete = await hasCompletedOnboarding(user.id);
    if (!onboardingComplete) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
