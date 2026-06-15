"use server";

import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  TeamRole,
  WorkspaceMetadata,
  ModuleStatus,
  ProjectModule,
} from "@/types/workspace";
import {
  inviteCollaboratorToRepo,
  removeCollaboratorFromRepo,
  listRepositoryCollaborators,
  checkRepositoryAccess,
  listPendingInvitations,
} from "@/lib/services/github";
import { PaymentService } from "@/lib/services/payment";
import { indexProjectWithModules } from "@/lib/rag/indexing";

// ============================================================================
// PERMISSION HELPERS
// ============================================================================

/**
 * Get the current user's role in a workspace
 */
export async function getUserWorkspaceRole(
  workspaceId: string
): Promise<{
  role: TeamRole | null;
  userId: string | null;
  projectId: string | null;
}> {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { role: null, userId: null, projectId: null };

  // Get workspace to find project_id
  const { data: workspace } = await supabase
    .from("project_workspaces")
    .select("project_id")
    .eq("id", workspaceId)
    .single();

  if (!workspace) return { role: null, userId: user.id, projectId: null };

  // Check if user is the project owner
  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", workspace.project_id)
    .single();

  if (project?.owner_id === user.id) {
    return { role: "owner", userId: user.id, projectId: workspace.project_id };
  }

  // Check team membership
  const { data: member } = await supabase
    .from("project_team_members")
    .select("role")
    .eq("project_id", workspace.project_id)
    .eq("profile_id", user.id)
    .single();

  return {
    role: (member?.role as TeamRole) || null,
    userId: user.id,
    projectId: workspace.project_id,
  };
}

/**
 * Check if user has permission to perform an action
 */
export async function checkUserPermission(
  workspaceId: string,
  permission:
    | "manage_settings"
    | "invite_members"
    | "create_channels"
    | "manage_github"
): Promise<boolean> {
  const { role } = await getUserWorkspaceRole(workspaceId);

  if (!role) return false;

  switch (permission) {
    case "manage_settings":
    case "manage_github":
      return role === "owner";
    case "invite_members":
    case "create_channels":
      return role === "owner" || role === "maintainer";
    default:
      return false;
  }
}

// ============================================================================
// WORKSPACE SETTINGS
// ============================================================================

/**
 * Get workspace settings including metadata and user's role
 */
export async function getWorkspaceSettings(workspaceId: string) {
  const supabase = await createServerSupabase();

  const { role, userId, projectId } = await getUserWorkspaceRole(workspaceId);

  if (!role || !["owner", "maintainer"].includes(role)) {
    return {
      error: "Unauthorized",
      workspace: null,
      metadata: null,
      userRole: null,
    };
  }

  const { data: workspace, error } = await supabase
    .from("project_workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single();

  if (error || !workspace) {
    return {
      error: "Workspace not found",
      workspace: null,
      metadata: null,
      userRole: null,
    };
  }

  const metadata: WorkspaceMetadata = workspace.metadata || {};

  return {
    error: null,
    workspace,
    metadata,
    userRole: role,
    canManageSettings: role === "owner",
    userId,
  };
}

/**
 * Update workspace general settings (name, description)
 */
export async function updateWorkspaceSettings(
  workspaceId: string,
  settings: { name?: string; description?: string }
) {
  const supabase = await createServerSupabase();

  const canManage = await checkUserPermission(workspaceId, "manage_settings");
  if (!canManage) {
    return { error: "Only workspace owners can modify settings" };
  }

  // Get current metadata
  const { data: current } = await supabase
    .from("project_workspaces")
    .select("metadata")
    .eq("id", workspaceId)
    .single();

  const currentMetadata: WorkspaceMetadata = current?.metadata || {};

  const updates: any = {};
  if (settings.name) updates.name = settings.name;
  if (settings.description !== undefined) {
    updates.metadata = {
      ...currentMetadata,
      description: settings.description,
    };
  }

  const { error } = await supabase
    .from("project_workspaces")
    .update(updates)
    .eq("id", workspaceId);

  if (error) {
    console.error("Error updating workspace settings:", error);
    return { error: "Failed to update settings" };
  }

  revalidatePath(`/workspace/${workspaceId}`);
  revalidatePath(`/workspace/${workspaceId}/setting`);
  return { success: true };
}

/**
 * Pause a workspace (only #general allows messages)
 */
export async function pauseWorkspace(workspaceId: string) {
  const supabase = await createServerSupabase();

  const { role, userId } = await getUserWorkspaceRole(workspaceId);
  if (role !== "owner") {
    return { error: "Only workspace owners can pause the workspace" };
  }

  const { data: current } = await supabase
    .from("project_workspaces")
    .select("metadata")
    .eq("id", workspaceId)
    .single();

  const currentMetadata: WorkspaceMetadata = current?.metadata || {};

  const { error } = await supabase
    .from("project_workspaces")
    .update({
      metadata: {
        ...currentMetadata,
        is_paused: true,
        paused_at: new Date().toISOString(),
        paused_by: userId,
      },
    })
    .eq("id", workspaceId);

  if (error) {
    console.error("Error pausing workspace:", error);
    return { error: "Failed to pause workspace" };
  }

  revalidatePath(`/workspace/${workspaceId}`);
  revalidatePath(`/workspace/${workspaceId}/setting`);
  return { success: true };
}

/**
 * Unpause a workspace
 */
export async function unpauseWorkspace(workspaceId: string) {
  const supabase = await createServerSupabase();

  const { role } = await getUserWorkspaceRole(workspaceId);
  if (role !== "owner") {
    return { error: "Only workspace owners can unpause the workspace" };
  }

  const { data: current } = await supabase
    .from("project_workspaces")
    .select("metadata")
    .eq("id", workspaceId)
    .single();

  const currentMetadata: WorkspaceMetadata = current?.metadata || {};

  const { error } = await supabase
    .from("project_workspaces")
    .update({
      metadata: {
        ...currentMetadata,
        is_paused: false,
        paused_at: undefined,
        paused_by: undefined,
      },
    })
    .eq("id", workspaceId);

  if (error) {
    console.error("Error unpausing workspace:", error);
    return { error: "Failed to unpause workspace" };
  }

  revalidatePath(`/workspace/${workspaceId}`);
  revalidatePath(`/workspace/${workspaceId}/setting`);
  return { success: true };
}

// ============================================================================
// TEAM MANAGEMENT
// ============================================================================

/**
 * Get all team members for a workspace's project
 */
export async function getTeamMembers(workspaceId: string) {
  const supabase = await createServerSupabase();

  const { role, projectId } = await getUserWorkspaceRole(workspaceId);
  if (!role || !projectId) {
    return { error: "Unauthorized", members: [] };
  }

  // Get project owner
  const { data: project } = await supabase
    .from("projects")
    .select(
      "owner_id, owner:profiles!projects_owner_fk(id, display_name, avatar_url, username, github_username)"
    )
    .eq("id", projectId)
    .single();

  // Get team members
  const { data: members, error } = await supabase
    .from("project_team_members")
    .select(
      `
      id,
      profile_id,
      role,
      joined_at,
      active,
      profile:profiles!team_members_profile_fk(
        id,
        display_name,
        avatar_url,
        username,
        github_username
      )
    `
    )
    .eq("project_id", projectId);

  if (error) {
    console.error("Error fetching team members:", error);
    return { error: "Failed to fetch team members", members: [] };
  }

  // Add owner to the list if not already present
  const allMembers = [...(members || [])];

  if (
    project?.owner &&
    !allMembers.some((m) => m.profile_id === project.owner_id)
  ) {
    allMembers.unshift({
      id: "owner",
      profile_id: project.owner_id,
      role: "owner",
      joined_at: null,
      active: true,
      profile: project.owner,
    });
  }

  return { error: null, members: allMembers };
}

/**
 * Update a team member's role
 */
export async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  newRole: "maintainer" | "contributor"
) {
  const supabase = await createServerSupabase();

  const { role } = await getUserWorkspaceRole(workspaceId);
  if (role !== "owner") {
    return { error: "Only workspace owners can change member roles" };
  }

  const { error } = await supabase
    .from("project_team_members")
    .update({ role: newRole })
    .eq("id", memberId);

  if (error) {
    console.error("Error updating member role:", error);
    return { error: "Failed to update member role" };
  }

  revalidatePath(`/workspace/${workspaceId}`);
  revalidatePath(`/workspace/${workspaceId}/setting`);
  return { success: true };
}

/**
 * Remove a team member from the project
 */
export async function removeMember(workspaceId: string, memberId: string) {
  // First check permissions using the regular client
  const { role } = await getUserWorkspaceRole(workspaceId);
  if (role !== "owner") {
    return { error: "Only workspace owners can remove members" };
  }

  console.log("Attempting to remove member with id:", memberId);

  // Use admin client to bypass RLS for the delete operation
  // Permission check was already done above at the app level
  const adminSupabase = createAdminSupabase();

  // Use .select() to get the deleted rows and verify deletion actually happened
  const { data, error } = await adminSupabase
    .from("project_team_members")
    .delete()
    .eq("id", memberId)
    .select();

  if (error) {
    console.error("Error removing member:", error);
    return { error: "Failed to remove member" };
  }

  // Check if any row was actually deleted
  if (!data || data.length === 0) {
    console.error("No member found with id:", memberId);
    return { error: "Member not found or already removed" };
  }

  console.log("Successfully removed member:", data);

  revalidatePath(`/workspace/${workspaceId}`);
  revalidatePath(`/workspace/${workspaceId}/setting`);
  return { success: true };
}

/**
 * Invite a new member to the project (only owner can invite)
 */
export async function inviteMember(
  workspaceId: string,
  username: string,
  role: "maintainer" | "contributor" = "contributor"
) {
  const supabase = await createServerSupabase();

  const { role: userRole } = await getUserWorkspaceRole(workspaceId);
  if (userRole !== "owner") {
    return { error: "Only workspace owners can invite members" };
  }

  const { projectId } = await getUserWorkspaceRole(workspaceId);
  if (!projectId) {
    return { error: "Workspace not found" };
  }

  // Find user by username
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (!profile) {
    return { error: "User not found" };
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("project_team_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("profile_id", profile.id)
    .single();

  if (existing) {
    return { error: "User is already a team member" };
  }

  // Add team member
  const { error } = await supabase.from("project_team_members").insert({
    project_id: projectId,
    profile_id: profile.id,
    role,
  });

  if (error) {
    console.error("Error inviting member:", error);
    return { error: "Failed to invite member" };
  }

  revalidatePath(`/workspace/${workspaceId}`);
  revalidatePath(`/workspace/${workspaceId}/setting`);
  return { success: true };
}

// ============================================================================
// GITHUB MANAGEMENT
// ============================================================================

/**
 * Get workspace's linked repository info
 */
export async function getWorkspaceRepository(workspaceId: string) {
  const supabase = await createServerSupabase();

  const { projectId } = await getUserWorkspaceRole(workspaceId);
  if (!projectId) {
    return { error: "Workspace not found", repo: null };
  }

  const { data: repo, error } = await supabase
    .from("project_repos")
    .select("*")
    .eq("project_id", projectId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching repository:", error);
    return { error: "Failed to fetch repository", repo: null };
  }

  return { error: null, repo };
}

/**
 * Get GitHub collaborators for the workspace's repository
 */
export async function getRepositoryCollaborators(workspaceId: string) {
  const { repo } = await getWorkspaceRepository(workspaceId);

  if (!repo?.repo_full_name) {
    return { error: "No repository linked", collaborators: [] };
  }

  const result = await listRepositoryCollaborators(repo.repo_full_name);

  if (!result.success) {
    return { error: result.error, collaborators: [] };
  }

  return { error: null, collaborators: result.collaborators || [] };
}

/**
 * Invite a team member to the GitHub repository
 */
export async function inviteToRepository(
  workspaceId: string,
  profileId: string
) {
  const supabase = await createServerSupabase();

  const canManage = await checkUserPermission(workspaceId, "manage_github");
  if (!canManage) {
    return { error: "Only workspace owners can manage GitHub access" };
  }

  const { repo } = await getWorkspaceRepository(workspaceId);
  if (!repo?.repo_full_name) {
    return { error: "No repository linked" };
  }

  // Get user's GitHub username
  const { data: profile } = await supabase
    .from("profiles")
    .select("github_username")
    .eq("id", profileId)
    .single();

  if (!profile?.github_username) {
    return { error: "User has not connected their GitHub account" };
  }

  const result = await inviteCollaboratorToRepo(
    repo.repo_full_name,
    profile.github_username
  );

  if (!result.success) {
    return { error: result.error };
  }

  revalidatePath(`/workspace/${workspaceId}/setting`);
  return { success: true };
}

/**
 * Remove a team member from the GitHub repository
 */
export async function removeFromRepository(
  workspaceId: string,
  profileId: string
) {
  const supabase = await createServerSupabase();

  const canManage = await checkUserPermission(workspaceId, "manage_github");
  if (!canManage) {
    return { error: "Only workspace owners can manage GitHub access" };
  }

  const { repo } = await getWorkspaceRepository(workspaceId);
  if (!repo?.repo_full_name) {
    return { error: "No repository linked" };
  }

  // Get user's GitHub username
  const { data: profile } = await supabase
    .from("profiles")
    .select("github_username")
    .eq("id", profileId)
    .single();

  if (!profile?.github_username) {
    return { error: "User has not connected their GitHub account" };
  }

  const result = await removeCollaboratorFromRepo(
    repo.repo_full_name,
    profile.github_username
  );

  if (!result.success) {
    return { error: result.error };
  }

  revalidatePath(`/workspace/${workspaceId}/setting`);
  return { success: true };
}

/**
 * Check a member's GitHub access status
 */
export async function getMemberGitHubStatus(
  workspaceId: string,
  profileId: string
) {
  const supabase = await createServerSupabase();

  const { repo } = await getWorkspaceRepository(workspaceId);
  if (!repo?.repo_full_name) {
    return { status: "no_repo" as const };
  }

  // Get user's GitHub username
  const { data: profile } = await supabase
    .from("profiles")
    .select("github_username")
    .eq("id", profileId)
    .single();

  if (!profile?.github_username) {
    return { status: "no_github" as const };
  }

  const result = await checkRepositoryAccess(
    repo.repo_full_name,
    profile.github_username
  );

  if (!result.success) {
    return { status: "error" as const, error: result.error };
  }

  if (result.hasAccess) {
    return { status: "active" as const };
  }

  if (result.pendingInvite) {
    return { status: "invited" as const };
  }

  return { status: "not_invited" as const };
}

export type GitHubAccessStatus =
  | "active"
  | "invited"
  | "not_invited"
  | "no_github"
  | "no_repo"
  | "error";

/**
 * Batch fetch all members' GitHub access statuses at once
 * This is much more efficient than checking each member individually
 * as it only makes 2 API calls (collaborators + invitations) regardless of member count
 */
export async function getAllMembersGitHubStatus(
  workspaceId: string,
  members: Array<{
    profile_id: string;
    github_username: string | null | undefined;
  }>
): Promise<{ statuses: Record<string, GitHubAccessStatus>; error?: string }> {
  const { repo } = await getWorkspaceRepository(workspaceId);

  if (!repo?.repo_full_name) {
    // Return no_repo for all members
    const statuses: Record<string, GitHubAccessStatus> = {};
    for (const member of members) {
      statuses[member.profile_id] = "no_repo";
    }
    return { statuses };
  }

  // Fetch collaborators and pending invitations in parallel (2 API calls total)
  const [collaboratorsResult, invitationsResult] = await Promise.all([
    listRepositoryCollaborators(repo.repo_full_name),
    listPendingInvitations(repo.repo_full_name),
  ]);

  // Build a Set of active collaborator usernames (lowercase for case-insensitive matching)
  const activeCollaborators = new Set<string>();
  if (collaboratorsResult.success && collaboratorsResult.collaborators) {
    for (const collab of collaboratorsResult.collaborators) {
      activeCollaborators.add(collab.login.toLowerCase());
    }
  }

  // Build a Set of pending invitation usernames (lowercase)
  const pendingInvitations = new Set<string>();
  if (invitationsResult.success && invitationsResult.invitations) {
    for (const inv of invitationsResult.invitations) {
      pendingInvitations.add(inv.invitee.toLowerCase());
    }
  }

  // Check for API errors
  if (!collaboratorsResult.success && !invitationsResult.success) {
    const statuses: Record<string, GitHubAccessStatus> = {};
    for (const member of members) {
      statuses[member.profile_id] = "error";
    }
    return {
      statuses,
      error: collaboratorsResult.error || invitationsResult.error,
    };
  }

  // Map each member to their status
  const statuses: Record<string, GitHubAccessStatus> = {};

  for (const member of members) {
    if (!member.github_username) {
      statuses[member.profile_id] = "no_github";
      continue;
    }

    const githubUsernameLower = member.github_username.toLowerCase();

    if (activeCollaborators.has(githubUsernameLower)) {
      statuses[member.profile_id] = "active";
    } else if (pendingInvitations.has(githubUsernameLower)) {
      statuses[member.profile_id] = "invited";
    } else {
      statuses[member.profile_id] = "not_invited";
    }
  }

  return { statuses };
}

// ============================================================================
// MODULE MANAGEMENT
// ============================================================================

/**
 * Get all modules for the workspace's project
 */
export async function getWorkspaceModules(workspaceId: string) {
  const supabase = await createServerSupabase();

  const { projectId, role } = await getUserWorkspaceRole(workspaceId);
  if (!projectId) {
    return { error: "Workspace not found", modules: [] };
  }

  const { data: modules, error } = await supabase
    .from("project_modules")
    .select(
      `
      *,
      assignee:profiles!project_modules_assigned_to_fkey(
        id,
        display_name,
        avatar_url,
        username
      )
    `
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching modules:", error);
    return { error: "Failed to fetch modules", modules: [] };
  }

  return { error: null, modules: modules || [], userRole: role };
}

/**
 * Mark a module as done (by contributor)
 */
export async function markModuleAsDone(workspaceId: string, moduleId: string) {
  const supabase = await createServerSupabase();

  const { role, userId } = await getUserWorkspaceRole(workspaceId);
  if (!role || !userId) {
    return { error: "Unauthorized" };
  }

  // Get the module to check assignment
  const { data: module } = await supabase
    .from("project_modules")
    .select("assigned_to, status, project_id")
    .eq("id", moduleId)
    .single();

  if (!module) {
    return { error: "Module not found" };
  }

  // Owner/maintainer can mark any module, contributors can only mark their own
  if (role === "contributor" && module.assigned_to !== userId) {
    return { error: "You can only mark your own modules as done" };
  }

  if (module.status === "completed") {
    return { error: "Module is already completed" };
  }

  const adminSupabase = createAdminSupabase();
  const { error } = await adminSupabase
    .from("project_modules")
    .update({ status: "pending_review" })
    .eq("id", moduleId);

  if (error) {
    console.error("Error marking module as done:", error);
    return { error: "Failed to update module status" };
  }

  revalidatePath(`/workspace/${workspaceId}/setting`);

  // Re-index project embeddings for this project (best-effort)
  try {
    if (module?.project_id) {
      indexProjectWithModules(module.project_id).catch((err) => console.error("RAG re-index failed:", err));
    }
  } catch (err) {
    console.error("RAG indexing call error:", err);
  }
  return { success: true };
}

/**
 * Confirm module completion (by owner/maintainer)
 */
export async function confirmModuleCompletion(
  workspaceId: string,
  moduleId: string
) {
  const supabase = await createServerSupabase();

  const { role, userId } = await getUserWorkspaceRole(workspaceId);
  if (!role || !["owner", "maintainer"].includes(role)) {
    return {
      error: "Only owners and maintainers can confirm module completion",
    };
  }

  // Get module details to know the assignee and amount
  const { data: moduleData } = await supabase
    .from("project_modules")
    .select("assigned_to, owner_final_cost, ai_estimated_cost")
    .eq("id", moduleId)
    .single();

  if (!moduleData || !moduleData.assigned_to) {
    return { error: "Module or assignee not found" };
  }

  // Determine amount (in cents for Stripe)
  const cost = moduleData.owner_final_cost ?? moduleData.ai_estimated_cost ?? 0;
  if (cost <= 0) {
    return { error: "Module cost must be greater than zero for payout." };
  }

  const amountInCents = Math.round(cost * 100);

  // Get assignee's stripe account id
  const { data: assigneeProfile } = await supabase
    .from("profiles")
    .select("stripe_connect_id")
    .eq("id", moduleData.assigned_to)
    .single();

  if (!assigneeProfile?.stripe_connect_id) {
    return { error: "Assignee has not connected a Stripe account for payouts." };
  }

  try {
    // [DEBUG] Log IDs and amount for troubleshooting
    console.log(`[Payout] Attempting transfer:
      - Amount: ${amountInCents} cents
      - Assignee ID: ${moduleData.assigned_to}
      - Stripe ID: ${assigneeProfile.stripe_connect_id}
      - Workspace: ${workspaceId}
      - Module: ${moduleId}`);

    // Perform Stripe Transfer
    await PaymentService.transferToFreelancer(
      amountInCents,
      assigneeProfile.stripe_connect_id,
      {
        workspaceId,
        moduleId,
        userId: moduleData.assigned_to,
      }
    );

    const adminSupabase = createAdminSupabase();
    const { error } = await adminSupabase
      .from("project_modules")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        confirmed_by: userId,
      })
      .eq("id", moduleId);

    if (error) {
      console.error("Error confirming module completion in DB:", error);
      return { error: "Failed to confirm module completion in database" };
    }

    revalidatePath(`/workspace/${workspaceId}/setting`);

    // Check if ALL modules for this project are now completed
    const { data: workspace } = await supabase
      .from("project_workspaces")
      .select("project_id")
      .eq("id", workspaceId)
      .single();

    if (workspace) {
      const { count: remainingCount } = await supabase
        .from("project_modules")
        .select("id", { count: "exact", head: true })
        .eq("project_id", workspace.project_id)
        .neq("status", "completed");

      if (remainingCount === 0) {
        // All modules completed! Get project owner and contributors for review prompt
        const { data: project } = await supabase
          .from("projects")
          .select("owner_id")
          .eq("id", workspace.project_id)
          .single();

        const { data: teamMembers } = await supabase
          .from("project_team_members")
          .select("profile_id, profile:profiles!team_members_profile_fk(id, display_name, avatar_url, username)")
          .eq("project_id", workspace.project_id);

        // Get existing reviews by this user for this project
        const { data: existingReviews } = await supabase
          .from("user_reviews")
          .select("reviewee_id")
          .eq("reviewer_id", userId)
          .eq("project_id", workspace.project_id);

        const reviewedUserIds = (existingReviews || []).map((r: any) => r.reviewee_id);

        // Re-index the project now that modules changed (best-effort)
        try {
          if (workspace.project_id) {
            indexProjectWithModules(workspace.project_id).catch((err) =>
              console.error("RAG re-index failed after module completion:", err)
            );
          }
        } catch (err) {
          console.error("RAG indexing call error:", err);
        }

        return {
          success: true,
          allModulesCompleted: true,
          projectId: workspace.project_id,
          ownerId: project?.owner_id || null,
          contributors: (teamMembers || []).map((m: any) => ({
            id: m.profile_id,
            displayName: m.profile?.display_name || null,
            avatarUrl: m.profile?.avatar_url || null,
            username: m.profile?.username || null,
          })),
          reviewedUserIds,
        };
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Stripe transfer failed:", error);
    return { error: error.message || "Failed to transfer funds to freelancer" };
  }
}

/**
 * Get review data for a workspace (check if all modules completed, get team info)
 */
export async function getProjectReviewData(workspaceId: string) {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { allModulesCompleted: false };

  const { data: workspace } = await supabase
    .from("project_workspaces")
    .select("project_id")
    .eq("id", workspaceId)
    .single();

  if (!workspace) return { allModulesCompleted: false };

  const { count: remainingCount } = await supabase
    .from("project_modules")
    .select("id", { count: "exact", head: true })
    .eq("project_id", workspace.project_id)
    .neq("status", "completed");

  if (remainingCount !== 0) return { allModulesCompleted: false };

  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", workspace.project_id)
    .single();

  const { data: teamMembers } = await supabase
    .from("project_team_members")
    .select("profile_id, profile:profiles!team_members_profile_fk(id, display_name, avatar_url, username)")
    .eq("project_id", workspace.project_id);

  // Get existing reviews by this user for this project
  const { data: existingReviews } = await supabase
    .from("user_reviews")
    .select("reviewee_id")
    .eq("reviewer_id", user.id)
    .eq("project_id", workspace.project_id);

  const reviewedUserIds = (existingReviews || []).map((r: any) => r.reviewee_id);

  return {
    allModulesCompleted: true,
    projectId: workspace.project_id,
    ownerId: project?.owner_id || null,
    contributors: (teamMembers || []).map((m: any) => ({
      id: m.profile_id,
      displayName: m.profile?.display_name || null,
      avatarUrl: m.profile?.avatar_url || null,
      username: m.profile?.username || null,
    })),
    reviewedUserIds,
  };
}
/**
 * Assign a module to a contributor
 */
export async function assignModule(
  workspaceId: string,
  moduleId: string,
  assigneeId: string
) {
  const supabase = await createServerSupabase();

  const { role } = await getUserWorkspaceRole(workspaceId);
  if (!role || !["owner", "maintainer"].includes(role)) {
    return { error: "Only owners and maintainers can assign modules" };
  }

  const adminSupabase = createAdminSupabase();
  const { error } = await adminSupabase
    .from("project_modules")
    .update({
      assigned_to: assigneeId,
      is_assigned: true,
      status: "in_progress",
    })
    .eq("id", moduleId);

  if (error) {
    console.error("Error assigning module:", error);
    return { error: "Failed to assign module" };
  }

  revalidatePath(`/workspace/${workspaceId}/setting`);

  // Re-index project embeddings for this project (best-effort)
  try {
    const { data: module } = await supabase
      .from("project_modules")
      .select("project_id")
      .eq("id", moduleId)
      .single();

    if (module?.project_id) {
      indexProjectWithModules(module.project_id).catch((err) =>
        console.error("RAG re-index failed after assign:", err)
      );
    }
  } catch (err) {
    console.error("RAG indexing call error:", err);
  }
  return { success: true };
}

// ============================================================================
// DANGER ZONE
// ============================================================================

/**
 * Unassign a module (by owner only)
 */
export async function unassignModule(workspaceId: string, moduleId: string) {
  const supabase = await createServerSupabase();

  const { role } = await getUserWorkspaceRole(workspaceId);
  if (role !== "owner") {
    return { error: "Only owners can unassign modules" };
  }

  // Check module state before unassigning
  const { data: module } = await supabase
    .from("project_modules")
    .select("progress, status")
    .eq("id", moduleId)
    .single();

  if (!module) {
    return { error: "Module not found" };
  }

  if (module.status === "pending_review") {
    return { error: "Cannot unassign a module that is pending review" };
  }

  if ((module.progress ?? 0) > 0) {
    return { error: "Cannot unassign a module with progress. Reset the progress to 0 first." };
  }

  const adminSupabase = createAdminSupabase();
  const { error } = await adminSupabase
    .from("project_modules")
    .update({
      assigned_to: null,
      is_assigned: false,
      status: "pending",
      progress: 0,
    })
    .eq("id", moduleId);

  if (error) {
    console.error("Error unassigning module:", error);
    return { error: "Failed to unassign module" };
  }

  revalidatePath(`/workspace/${workspaceId}`);
  revalidatePath(`/workspace/${workspaceId}/setting`);

  // Re-index project embeddings for this project (best-effort)
  try {
    const { data: module } = await supabase
      .from("project_modules")
      .select("project_id")
      .eq("id", moduleId)
      .single();

    if (module?.project_id) {
      indexProjectWithModules(module.project_id).catch((err) =>
        console.error("RAG re-index failed after unassign:", err)
      );
    }
  } catch (err) {
    console.error("RAG indexing call error:", err);
  }
  return { success: true };
}

/**
 * Update module progress (by assigned developer only)
 */
export async function updateModuleProgress(
  workspaceId: string,
  moduleId: string,
  progress: number
) {
  const supabase = await createServerSupabase();

  const { role, userId } = await getUserWorkspaceRole(workspaceId);
  if (!role || !userId) {
    return { error: "Unauthorized" };
  }

  // Validate progress range
  if (progress < 0 || progress > 100) {
    return { error: "Progress must be between 0 and 100" };
  }

  // Get the module to check assignment
  const { data: module } = await supabase
    .from("project_modules")
    .select("assigned_to, status")
    .eq("id", moduleId)
    .single();

  if (!module) {
    return { error: "Module not found" };
  }

  // Only assigned developer can update progress
  if (module.assigned_to !== userId) {
    return { error: "Only the assigned developer can update progress" };
  }

  // Can't update progress if module is completed or pending review
  if (module.status === "completed" || module.status === "pending_review") {
    return { error: "Cannot update progress for completed or pending review modules" };
  }

  const adminSupabase = createAdminSupabase();
  const { error } = await adminSupabase
    .from("project_modules")
    .update({ progress })
    .eq("id", moduleId);

  if (error) {
    console.error("Error updating module progress:", error);
    return { error: "Failed to update module progress" };
  }

  revalidatePath(`/workspace/${workspaceId}`);
  revalidatePath(`/workspace/${workspaceId}/setting`);

  // Re-index project embeddings for this project (best-effort)
  try {
    const { data: module } = await supabase
      .from("project_modules")
      .select("project_id")
      .eq("id", moduleId)
      .single();

    if (module?.project_id) {
      indexProjectWithModules(module.project_id).catch((err) =>
        console.error("RAG re-index failed after progress update:", err)
      );
    }
  } catch (err) {
    console.error("RAG indexing call error:", err);
  }
  return { success: true };
}

/**
 * Archive a workspace (soft delete)
 */
export async function archiveWorkspace(workspaceId: string) {
  const supabase = await createServerSupabase();

  const { role } = await getUserWorkspaceRole(workspaceId);
  if (role !== "owner") {
    return { error: "Only workspace owners can archive the workspace" };
  }

  const { data: current } = await supabase
    .from("project_workspaces")
    .select("metadata, project_id")
    .eq("id", workspaceId)
    .single();

  const currentMetadata: WorkspaceMetadata = current?.metadata || {};

  const { error } = await supabase
    .from("project_workspaces")
    .update({
      metadata: {
        ...currentMetadata,
        is_archived: true,
        archived_at: new Date().toISOString(),
      },
    })
    .eq("id", workspaceId);

  if (error) {
    console.error("Error archiving workspace:", error);
    return { error: "Failed to archive workspace" };
  }

  revalidatePath(`/workspace/${workspaceId}`);
  return { success: true, redirectTo: `/project/${current?.project_id}` };
}

/**
 * Delete a workspace permanently
 */
export async function deleteWorkspace(workspaceId: string) {
  const supabase = await createServerSupabase();

  const { role, projectId } = await getUserWorkspaceRole(workspaceId);
  if (role !== "owner") {
    return { error: "Only workspace owners can delete the workspace" };
  }

  // Delete channels first
  await supabase
    .from("workspace_channels")
    .delete()
    .eq("workspace_id", workspaceId);

  // Delete workspace
  const { error } = await supabase
    .from("project_workspaces")
    .delete()
    .eq("id", workspaceId);

  if (error) {
    console.error("Error deleting workspace:", error);
    return { error: "Failed to delete workspace" };
  }

  return { success: true, redirectTo: `/project/${projectId}` };
}
