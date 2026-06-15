"use server";

import { createServerSupabase } from "@/lib/supabase/server";

export interface UserWorkspace {
  id: string;
  name: string;
  role: "owner" | "contributor" | "maintainer";
  member_count: number;
  project: {
    id: string;
    title: string;
  };
}

export async function getUserWorkspaces(): Promise<UserWorkspace[]> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  // 1. Get workspaces where user is owner (via project ownership)
  const { data: ownedWorkspacesData } = await supabase
    .from("project_workspaces")
    .select(`
      id,
      name,
      project:projects!inner (
        id,
        title,
        owner_id
      )
    `)
    .eq("project.owner_id", user.id);
    
  const ownedWorkspaces = ownedWorkspacesData as any[];

  // 2. Get workspaces where user is a team member
  const { data: memberWorkspacesData } = await supabase
    .from("project_team_members")
    .select(`
      role,
      project:projects!inner (
        id,
        title,
        workspaces:project_workspaces (
          id,
          name
        )
      )
    `)
    .eq("profile_id", user.id);
    
  const memberWorkspaces = memberWorkspacesData as any[];

  const workspaces: UserWorkspace[] = [];

  // Process owned workspaces
  if (ownedWorkspaces) {
    for (const ws of ownedWorkspaces) {
      // Get member count
      const { count } = await supabase
        .from("project_team_members")
        .select("*", { count: 'exact', head: true })
        .eq("project_id", ws.project.id);

      workspaces.push({
        id: ws.id,
        name: ws.name,
        role: "owner",
        member_count: count || 0,
        project: {
          id: ws.project.id,
          title: ws.project.title
        }
      });
    }
  }

  // Process member workspaces
  if (memberWorkspaces) {
    for (const mw of memberWorkspaces) {
      // A project might have multiple workspaces, but usually one. 
      // The query returns an array of workspaces for the project.
      const projectWorkspaces = mw.project.workspaces as any[];
      
      if (projectWorkspaces && projectWorkspaces.length > 0) {
        for (const ws of projectWorkspaces) {
          // Avoid duplicates if user is both owner and member (shouldn't happen ideally but possible)
          if (!workspaces.find(w => w.id === ws.id)) {
             // Get member count
            const { count } = await supabase
              .from("project_team_members")
              .select("*", { count: 'exact', head: true })
              .eq("project_id", mw.project.id);

            workspaces.push({
              id: ws.id,
              name: ws.name,
              role: mw.role as any,
              member_count: count || 0,
              project: {
                id: mw.project.id,
                title: mw.project.title
              }
            });
          }
        }
      }
    }
  }

  return workspaces;
}

/**
 * Status of user's GitHub connection and OAuth scopes
 */
export interface GitHubScopesStatus {
  hasGitHub: boolean;
  hasRequiredScopes: boolean;
  scopes: string[];
  githubUsername?: string;
}

const REQUIRED_SCOPES = ["repo", "user:email"];

/**
 * Check if the user has GitHub connected and has the required scopes
 * Required scopes: ["repo", "user:email"]
 */
export async function checkGitHubScopesStatus(): Promise<GitHubScopesStatus> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      hasGitHub: false,
      hasRequiredScopes: false,
      scopes: [],
    };
  }

  // Check if user has GitHub identity
  const githubIdentity = user.identities?.find(
    (identity) => identity.provider === "github"
  );

  if (!githubIdentity) {
    return {
      hasGitHub: false,
      hasRequiredScopes: false,
      scopes: [],
    };
  }

  // Get GitHub username from identity
  const identityData = githubIdentity.identity_data as any;
  const githubUsername = identityData?.login || identityData?.user_name;

  // Check oauth_tokens table for stored scopes
  const { data: tokenData } = await supabase
    .from("oauth_tokens")
    .select("scopes, access_token")
    .eq("user_id", user.id)
    .eq("provider", "github")
    .maybeSingle();

  let scopes: string[] = tokenData?.scopes || [];

  // If no scopes in DB, try to fetch from GitHub API
  if (scopes.length === 0 && tokenData?.access_token) {
    try {
      const { getGitHubTokenScopes } = await import("@/lib/services/github");
      scopes = await getGitHubTokenScopes(tokenData.access_token);
    } catch (error) {
      console.error("Error fetching GitHub scopes:", error);
    }
  }

  // Check if user has all required scopes
  const hasRequiredScopes = REQUIRED_SCOPES.every((required) =>
    scopes.some((scope) => scope === required || scope.startsWith(`${required}:`))
  );

  return {
    hasGitHub: true,
    hasRequiredScopes,
    scopes,
    githubUsername,
  };
}
