"use server";

import { Octokit } from "octokit";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Sanitize a project title to be GitHub repository name compatible
 * Rules: lowercase, alphanumeric + hyphens, no consecutive hyphens, max 100 chars
 */
export async function sanitizeRepoName(title: string): Promise<string> {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace consecutive hyphens with single hyphen
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .substring(0, 100); // Limit to 100 characters
}

/**
 * Sanitize a description to be GitHub compatible
 * Removes control characters and limits length
 */
export async function sanitizeDescription(description: string): Promise<string> {
  return description
    .trim()
    // Remove control characters (newlines, tabs, carriage returns, etc.)
    .replace(/[\x00-\x1F\x7F]/g, " ")
    // Replace multiple spaces with single space
    .replace(/\s+/g, " ")
    // Limit to 350 characters (GitHub's limit is 350)
    .substring(0, 350)
    .trim();
}

/**
 * Check if a token looks like a valid GitHub token (basic format check)
 * GitHub tokens typically start with 'gho_', 'ghp_', 'ghu_', or are 40-char hex strings
 * Google tokens start with 'ya29.' - we should NOT use those for GitHub
 */
function isLikelyGitHubToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  
  // Reject known non-GitHub token formats
  if (token.startsWith('ya29.')) {
    console.warn("[GitHub] Token appears to be a Google OAuth token, not GitHub!");
    return false;
  }
  
  // GitHub token formats:
  // - Classic tokens: 40-char hex strings
  // - Fine-grained tokens: start with 'github_pat_'
  // - OAuth tokens: start with 'gho_', 'ghu_', or 'ghp_'
  const isGitHubFormat = 
    token.startsWith('gho_') ||
    token.startsWith('ghp_') ||
    token.startsWith('ghu_') ||
    token.startsWith('github_pat_') ||
    /^[a-f0-9]{40}$/i.test(token);
  
  return isGitHubFormat;
}

/**
 * Get GitHub access token from database or session
 * Primary: Checks oauth_tokens table for persistent token
 * Fallback: Session provider_token for backward compatibility
 * 
 * IMPORTANT: Validates token format to prevent using non-GitHub tokens
 */
export async function getGitHubAccessToken(): Promise<string | null> {
  try {
    const supabase = await createServerSupabase();
    
    // Get current user first
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    // STEP 1: Try to get token from database (new persistent approach)
    const { data: tokenData } = await supabase
      .from("oauth_tokens")
      .select("access_token, expires_at")
      .eq("user_id", user.id)
      .eq("provider", "github")
      .maybeSingle(); // Use maybeSingle to avoid error if no token exists

    if (tokenData?.access_token) {
      console.log("[GitHub] Found token in database");
      
      // CRITICAL: Validate this is actually a GitHub token
      if (!isLikelyGitHubToken(tokenData.access_token)) {
        console.error("[GitHub] Database token is NOT a valid GitHub token format!");
        console.error("[GitHub] Token may be corrupted. User needs to re-authorize GitHub.");
        // Don't return the invalid token - fall through to check session
      } else {
        // Check if token is expired
        if (tokenData.expires_at) {
          const expiresAt = new Date(tokenData.expires_at);
          if (expiresAt > new Date()) {
            console.log("[GitHub] Database token is valid");
            return tokenData.access_token;
          } else {
            console.log("[GitHub] Database token expired, falling back to session");
            // TODO: Implement token refresh logic
          }
        } else {
          // No expiration set, assume valid
          return tokenData.access_token;
        }
      }
    }

    // STEP 2: Fallback to session provider_token (backward compatibility)
    console.log("[GitHub] No valid database token, checking session");
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return null;
    }

    const providerToken = session.provider_token;
    
    if (providerToken) {
      // Validate session token too
      if (!isLikelyGitHubToken(providerToken)) {
        console.warn("[GitHub] Session token is not a GitHub token (might be from another provider)");
        return null;
      }
      console.log("[GitHub] Found valid token in session");
      return providerToken;
    }

    console.log("[GitHub] No valid GitHub token found");
    return null;
  } catch (error) {
    console.error("Error getting GitHub access token:", error);
    return null;
  }
}

/**
 * Get the scopes associated with a GitHub access token
 * Fetches directly from GitHub API headers
 */
export async function getGitHubTokenScopes(token: string): Promise<string[]> {
  try {
    if (!token) return [];

    // Initialize Octokit with the token
    const octokit = new Octokit({ auth: token });

    // Make a simple authenticated request to check scopes
    // The scopes are returned in the response headers
    const response = await octokit.request("GET /user");
    
    // GitHub returns scopes in the X-OAuth-Scopes header
    const scopesHeader = response.headers["x-oauth-scopes"];
    
    if (!scopesHeader) {
      return [];
    }

    // Parse scopes string into array
    return scopesHeader.split(",").map((s: string) => s.trim());
  } catch (error) {
    console.error("Error fetching GitHub token scopes:", error);
    return [];
  }
}

/**
 * Check if the user's GitHub token has the 'repo' scope
 * Returns true if the scope is present, false otherwise
 */
export async function hasGitHubRepoScope(): Promise<boolean> {
  try {
    const token = await getGitHubAccessToken();
    
    if (!token) {
      return false;
    }

    const scopes = await getGitHubTokenScopes(token);
    return scopes.includes("repo");
  } catch (error) {
    console.error("Error checking GitHub repo scope:", error);
    return false;
  }
}

/**
 * Create a GitHub repository using the user's access token
 */
export async function createGitHubRepository(params: {
  name: string;
  description: string;
  isPrivate?: boolean;
}): Promise<{ success: boolean; repoUrl?: string; error?: string }> {
  try {
    const token = await getGitHubAccessToken();

    if (!token) {
      return {
        success: false,
        error: "GitHub access token not found. Please connect your GitHub account.",
      };
    }

    // Initialize Octokit with the user's token
    const octokit = new Octokit({ auth: token });

    // Sanitize the repository name
    const sanitizedName = await sanitizeRepoName(params.name);
    
    // Sanitize the description to remove control characters
    const sanitizedDescription = await sanitizeDescription(params.description || "");

    if (!sanitizedName) {
      return {
        success: false,
        error: "Invalid repository name. Please use alphanumeric characters and hyphens.",
      };
    }

    // Create the repository
    const { data: repo } = await octokit.rest.repos.createForAuthenticatedUser({
      name: sanitizedName,
      description: sanitizedDescription,
      private: params.isPrivate ?? true, // Default to private
      auto_init: true, // Initialize with README
    });

    return {
      success: true,
      repoUrl: repo.html_url,
    };
  } catch (error: any) {
    console.error("Error creating GitHub repository:", error);

    // Handle specific GitHub API errors
    if (error.status === 422) {
      return {
        success: false,
        error: "A repository with this name already exists. Please choose a different project name.",
      };
    }

    if (error.status === 401) {
      return {
        success: false,
        error: "GitHub authentication failed. Please reconnect your GitHub account.",
      };
    }

    if (error.status === 403) {
      if (error.message?.includes("scope")) {
        return {
          success: false,
          error: "Missing required permissions. Please grant repository access.",
        };
      }
      return {
        success: false,
        error: "GitHub API rate limit exceeded. Please try again later.",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to create GitHub repository. Please try again.",
    };
  }
}

/**
 * Get the authenticated GitHub user's information
 */
export async function getGitHubUser(): Promise<{
  success: boolean;
  username?: string;
  error?: string;
}> {
  try {
    const token = await getGitHubAccessToken();

    if (!token) {
      return {
        success: false,
        error: "Not authenticated with GitHub",
      };
    }

    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.rest.users.getAuthenticated();

    return {
      success: true,
      username: user.login,
    };
  } catch (error: any) {
    console.error("Error fetching GitHub user:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch GitHub user information",
    };
  }
}

/**
 * Invite a user to a GitHub repository as a collaborator
 */
export async function inviteCollaboratorToRepo(
  repoFullName: string,
  username: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getGitHubAccessToken();

    if (!token) {
      return {
        success: false,
        error: "Not authenticated with GitHub",
      };
    }

    const octokit = new Octokit({ auth: token });
    const [owner, repo] = repoFullName.split("/");

    await octokit.rest.repos.addCollaborator({
      owner,
      repo,
      username,
      permission: "push", // Give push access for developers
    });

    return { success: true };
  } catch (error: any) {
    console.error(`Error inviting ${username} to ${repoFullName}:`, error);
    return {
      success: false,
      error: error.message || "Failed to invite collaborator",
    };
  }
}

/**
 * Remove a collaborator from a GitHub repository
 */
export async function removeCollaboratorFromRepo(
  repoFullName: string,
  username: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getGitHubAccessToken();

    if (!token) {
      return {
        success: false,
        error: "Not authenticated with GitHub",
      };
    }

    const octokit = new Octokit({ auth: token });
    const [owner, repo] = repoFullName.split("/");

    await octokit.rest.repos.removeCollaborator({
      owner,
      repo,
      username,
    });

    return { success: true };
  } catch (error: any) {
    console.error(`Error removing ${username} from ${repoFullName}:`, error);
    return {
      success: false,
      error: error.message || "Failed to remove collaborator",
    };
  }
}

/**
 * List all collaborators for a GitHub repository
 */
export async function listRepositoryCollaborators(
  repoFullName: string
): Promise<{ 
  success: boolean; 
  collaborators?: Array<{
    id: number;
    login: string;
    avatar_url: string;
    permissions: {
      admin: boolean;
      push: boolean;
      pull: boolean;
    };
  }>; 
  error?: string 
}> {
  try {
    const token = await getGitHubAccessToken();

    if (!token) {
      return {
        success: false,
        error: "Not authenticated with GitHub",
      };
    }

    const octokit = new Octokit({ auth: token });
    const [owner, repo] = repoFullName.split("/");

    const { data } = await octokit.rest.repos.listCollaborators({
      owner,
      repo,
      affiliation: "all",
    });

    const collaborators = data.map((c: any) => ({
      id: c.id,
      login: c.login,
      avatar_url: c.avatar_url,
      permissions: c.permissions || { admin: false, push: false, pull: false },
    }));

    return { success: true, collaborators };
  } catch (error: any) {
    console.error(`Error listing collaborators for ${repoFullName}:`, error);
    return {
      success: false,
      error: error.message || "Failed to list collaborators",
    };
  }
}

/**
 * Check if a user has access to a repository (as collaborator or pending invite)
 */
export async function checkRepositoryAccess(
  repoFullName: string,
  username: string
): Promise<{ 
  success: boolean; 
  hasAccess?: boolean; 
  pendingInvite?: boolean; 
  error?: string 
}> {
  try {
    const token = await getGitHubAccessToken();

    if (!token) {
      return {
        success: false,
        error: "Not authenticated with GitHub",
      };
    }

    const octokit = new Octokit({ auth: token });
    const [owner, repo] = repoFullName.split("/");

    // First check if user is a collaborator
    try {
      await octokit.rest.repos.checkCollaborator({
        owner,
        repo,
        username,
      });
      return { success: true, hasAccess: true, pendingInvite: false };
    } catch (e: any) {
      if (e.status !== 404) {
        throw e;
      }
    }

    // Check for pending invitations
    try {
      const { data: invitations } = await octokit.rest.repos.listInvitations({
        owner,
        repo,
      });
      
      const hasPendingInvite = invitations.some(
        (inv: any) => inv.invitee?.login?.toLowerCase() === username.toLowerCase()
      );
      
      return { 
        success: true, 
        hasAccess: false, 
        pendingInvite: hasPendingInvite 
      };
    } catch (e: any) {
      // If we can't check invitations, just return no access
      return { success: true, hasAccess: false, pendingInvite: false };
    }
  } catch (error: any) {
    console.error(`Error checking access for ${username} to ${repoFullName}:`, error);
    return {
      success: false,
      error: error.message || "Failed to check repository access",
    };
  }
}

/**
 * List pending repository invitations
 */
export async function listPendingInvitations(
  repoFullName: string
): Promise<{ 
  success: boolean; 
  invitations?: Array<{
    id: number;
    invitee: string;
    permissions: string;
    created_at: string;
  }>; 
  error?: string 
}> {
  try {
    const token = await getGitHubAccessToken();

    if (!token) {
      return {
        success: false,
        error: "Not authenticated with GitHub",
      };
    }

    const octokit = new Octokit({ auth: token });
    const [owner, repo] = repoFullName.split("/");

    const { data } = await octokit.rest.repos.listInvitations({
      owner,
      repo,
    });

    const invitations = data.map((inv: any) => ({
      id: inv.id,
      invitee: inv.invitee?.login || "unknown",
      permissions: inv.permissions,
      created_at: inv.created_at,
    }));

    return { success: true, invitations };
  } catch (error: any) {
    console.error(`Error listing invitations for ${repoFullName}:`, error);
    return {
      success: false,
      error: error.message || "Failed to list invitations",
    };
  }
}