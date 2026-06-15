"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { Octokit } from "octokit";
import {
  getGitHubAccessToken,
  inviteCollaboratorToRepo,
} from "@/lib/services/github";
import {
  WorkspaceRecord,
  WorkspaceChannel,
  GitHubStats,
  ContributorStat,
  CommitActivity,
  WorkspaceMember,
  LanguageStat,
  CodeFrequency,
  RecentActivity,
} from "@/types/workspace";
import { revalidatePath } from "next/cache";

/**
 * Check if a project has a linked repository
 */
export async function checkProjectRepository(projectId: string) {
  const supabase = await createServerSupabase();

  const { data: repo, error } = await supabase
    .from("project_repos")
    .select("*")
    .eq("project_id", projectId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking project repo:", error);
    throw new Error("Failed to check project repository");
  }

  return {
    hasRepo: !!repo,
    repo: repo,
  };
}

/**
 * Get accepted proposals for a project to identify team members
 */
export async function getAcceptedProposals(projectId: string) {
  const supabase = await createServerSupabase();

  const { data: proposals, error } = await supabase
    .from("proposals")
    .select(
      `
      id,
      proposer_id,
      status,
      proposed_budget,
      modules_snapshot,
      proposer:profiles!proposals_proposer_id_fkey (
        id,
        display_name,
        avatar_url,
        username
      )
    `
    )
    .eq("project_id", projectId)
    .eq("status", "accepted");

  if (error) {
    console.error("Error fetching accepted proposals:", error);
    throw new Error("Failed to fetch accepted proposals");
  }

  return proposals || [];
}

// Types for module assignment
export interface ModuleAssignment {
  moduleId: string;
  assigneeId: string;
  proposedCost: number;
}

export interface ModuleConflict {
  moduleId: string;
  moduleName: string;
  originalCost: number;
  proposers: Array<{
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    proposedCost: number;
  }>;
}

export interface UnselectedModule {
  id: string;
  name: string;
  originalCost: number;
}

export interface ModuleAssignmentData {
  proposals: Array<{
    id: string;
    proposerId: string;
    proposerName: string | null;
    proposerAvatar: string | null;
    proposerUsername: string | null;
    totalProposedCost: number;
    modules: Array<{
      id: string;
      name: string;
      originalCost: number;
      proposedCost: number;
      hasConflict: boolean;
    }>;
  }>;
  conflicts: ModuleConflict[];
  unselectedModules: UnselectedModule[];
  allModules: Array<{
    id: string;
    name: string;
    originalCost: number;
  }>;
}

/**
 * Get module assignment data for workspace creation
 * Builds conflict detection and unselected module information
 */
export async function getModuleAssignmentData(
  projectId: string
): Promise<ModuleAssignmentData> {
  const supabase = await createServerSupabase();

  // Fetch accepted proposals with modules
  const proposals = await getAcceptedProposals(projectId);

  // Fetch all project modules
  const { data: projectModules, error: modulesError } = await supabase
    .from("project_modules")
    .select("id, name, owner_final_cost, ai_estimated_cost")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (modulesError) {
    console.error("Error fetching project modules:", modulesError);
    throw new Error("Failed to fetch project modules");
  }

  const modules = projectModules || [];

  // Build a map of module_id -> proposers who selected it
  const moduleToProposers: Map<
    string,
    Array<{
      proposerId: string;
      displayName: string | null;
      avatarUrl: string | null;
      proposedCost: number;
    }>
  > = new Map();

  // Track which modules are selected by at least one proposer
  const selectedModuleIds = new Set<string>();

  // Process each proposal
  for (const proposal of proposals) {
    const modulesSnapshot = proposal.modules_snapshot as Array<{
      id?: string;
      name?: string;
      owner_final_cost?: number;
      ai_estimated_cost?: number;
    }> | null;

    if (!modulesSnapshot || !Array.isArray(modulesSnapshot)) continue;

    for (const moduleSnap of modulesSnapshot) {
      if (!moduleSnap.id) continue;

      selectedModuleIds.add(moduleSnap.id);

      const proposedCost =
        moduleSnap.owner_final_cost ?? moduleSnap.ai_estimated_cost ?? 0;
      const proposerData = proposal.proposer as unknown as Array<{
        id: string;
        display_name: string | null;
        avatar_url: string | null;
      }> | { id: string; display_name: string | null; avatar_url: string | null; } | null;
      const proposer = Array.isArray(proposerData) ? proposerData[0] : proposerData;

      if (!moduleToProposers.has(moduleSnap.id)) {
        moduleToProposers.set(moduleSnap.id, []);
      }

      moduleToProposers.get(moduleSnap.id)!.push({
        proposerId: proposal.proposer_id,
        displayName: proposer?.display_name || null,
        avatarUrl: proposer?.avatar_url || null,
        proposedCost,
      });
    }
  }

  // Find conflicts (modules selected by more than one proposer)
  const conflicts: ModuleConflict[] = [];
  for (const [moduleId, proposers] of moduleToProposers.entries()) {
    if (proposers.length > 1) {
      const module = modules.find((m) => m.id === moduleId);
      if (module) {
        conflicts.push({
          moduleId,
          moduleName: module.name,
          originalCost: module.owner_final_cost ?? module.ai_estimated_cost ?? 0,
          proposers: proposers.map((p) => ({
            id: p.proposerId,
            displayName: p.displayName,
            avatarUrl: p.avatarUrl,
            proposedCost: p.proposedCost,
          })),
        });
      }
    }
  }

  // Find unselected modules
  const unselectedModules: UnselectedModule[] = modules
    .filter((m) => !selectedModuleIds.has(m.id))
    .map((m) => ({
      id: m.id,
      name: m.name,
      originalCost: m.owner_final_cost ?? m.ai_estimated_cost ?? 0,
    }));

  // Build proposal data with module conflict flags
  const proposalData = proposals.map((proposal) => {
    const proposerData = proposal.proposer as unknown as Array<{
      id: string;
      display_name: string | null;
      avatar_url: string | null;
      username: string | null;
    }> | { id: string; display_name: string | null; avatar_url: string | null; username: string | null; } | null;
    const proposer = Array.isArray(proposerData) ? proposerData[0] : proposerData;

    const modulesSnapshot = proposal.modules_snapshot as Array<{
      id?: string;
      name?: string;
      owner_final_cost?: number;
      ai_estimated_cost?: number;
    }> | null;

    const proposalModules =
      modulesSnapshot
        ?.filter((m) => m.id)
        .map((moduleSnap) => {
          const originalModule = modules.find((m) => m.id === moduleSnap.id);
          const proposedCost =
            moduleSnap.owner_final_cost ?? moduleSnap.ai_estimated_cost ?? 0;
          const hasConflict =
            (moduleToProposers.get(moduleSnap.id!)?.length ?? 0) > 1;

          return {
            id: moduleSnap.id!,
            name: moduleSnap.name || originalModule?.name || "Unknown Module",
            originalCost:
              originalModule?.owner_final_cost ??
              originalModule?.ai_estimated_cost ??
              0,
            proposedCost,
            hasConflict,
          };
        }) || [];

    const totalProposedCost = proposalModules.reduce(
      (sum, m) => sum + m.proposedCost,
      0
    );

    return {
      id: proposal.id,
      proposerId: proposal.proposer_id,
      proposerName: proposer?.display_name || null,
      proposerAvatar: proposer?.avatar_url || null,
      proposerUsername: proposer?.username || null,
      totalProposedCost,
      modules: proposalModules,
    };
  });

  return {
    proposals: proposalData,
    conflicts,
    unselectedModules,
    allModules: modules.map((m) => ({
      id: m.id,
      name: m.name,
      originalCost: m.owner_final_cost ?? m.ai_estimated_cost ?? 0,
    })),
  };
}


/**
 * Create a new workspace, default channels, and invite team members
 */
export async function createWorkspace(
  projectId: string,
  name: string,
  moduleAssignments?: ModuleAssignment[],
  paymentId?: string
) {
  const supabase = await createServerSupabase();

  // Validate Payment if provided
  if (paymentId) {
      const { data: payment, error: paymentError } = await supabase
          .from("payments")
          .select("*")
          .eq("id", paymentId)
          .eq("project_id", projectId)
          .single();

      if (paymentError || !payment) {
          throw new Error("Invalid payment record");
      }
      
      // If payment is still pending, try to sync from Stripe
      if (payment.status !== "succeeded") {
          const { stripe } = await import("@/lib/stripe/client");
          const stripeId = payment.stripe_payment_intent_id || payment.stripe_checkout_session_id;
          
          if (stripeId && stripeId.startsWith("cs_")) {
              // It's a checkout session ID - retrieve the session to check status
              const session = await stripe.checkout.sessions.retrieve(stripeId);
              
              if (session.payment_status === "paid") {
                  const paymentIntentId = typeof session.payment_intent === "string"
                      ? session.payment_intent
                      : session.payment_intent?.id;
                  
                  await supabase
                      .from("payments")
                      .update({
                          stripe_payment_intent_id: paymentIntentId || stripeId,
                          stripe_checkout_session_id: stripeId,
                          status: "succeeded",
                          completed_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                      })
                      .eq("id", payment.id);
              } else {
                  throw new Error("Payment not successful");
              }
          } else {
              throw new Error("Payment not successful");
          }
      }
      
      if (payment.workspace_id) {
          // Payment already used? 
          // Ideally we check this to prevent reuse, but if user retries creation due to error, we might want to allow re-linking?
          // For now, strict: one payment = one workspace.
          // throw new Error("Payment already associated with a workspace");
      }
  }

  // 1. Create Workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from("project_workspaces")
    .insert({
      project_id: projectId,
      name: name,
      metadata: {},
      payment_status: paymentId ? "paid" : "unpaid",
      payment_id: paymentId,
      total_amount_paid: 0 // Will query payments to update or join
    })
    .select()
    .single();

  if (workspaceError) {
    console.error("Error creating workspace:", workspaceError);
    throw new Error("Failed to create workspace");
  }

  const workspaceId = workspace.id;

  // 2. Create Default Channels (#general, #dev)
  const defaultChannels = [
    {
      workspace_id: workspaceId,
      name: "general",
      description: "General discussion",
    },
    {
      workspace_id: workspaceId,
      name: "dev",
      description: "Development updates and discussion",
    },
  ];

  const { data: createdChannels, error: channelsError } = await supabase
    .from("workspace_channels")
    .insert(defaultChannels)
    .select();

  if (channelsError) {
    console.error("Error creating default channels:", channelsError);
    // Continue anyway, channels are not critical
  }

  // 3. Add Team Members and invite to GitHub (from accepted proposals)
  const acceptedProposals = await getAcceptedProposals(projectId);
  
  // Also get the current user (owner/creator)
  const { data: { user } } = await supabase.auth.getUser();

  if (createdChannels && createdChannels.length > 0) {
    // Add members to channels
    const generalChannel = createdChannels.find(c => c.name === "general");
    if (generalChannel) {
      const channelMembers = [];
      
      // Add workspace creator
      if (user) {
        channelMembers.push({
          channel_id: generalChannel.id,
          user_id: user.id,
          added_by: user.id
        });
      }

      // Add project team members
      acceptedProposals.forEach(p => {
        if (p.proposer_id !== user?.id) { // Avoid duplicates if creator is also a proposer somehow
          channelMembers.push({
            channel_id: generalChannel.id,
            user_id: p.proposer_id,
            added_by: user?.id || null
          });
        }
      });

      if (channelMembers.length > 0) {
        const { error: membersError } = await supabase
          .from("workspace_channel_members")
          .insert(channelMembers);
          
        if (membersError) {
           console.error("Error adding members to general channel:", membersError);
        }
      }
    }
  }

  if (acceptedProposals.length > 0) {
    // Add team members to project_team_members table
    const teamMembers = acceptedProposals.map((p) => ({
      project_id: projectId,
      profile_id: p.proposer_id,
      role: "contributor",
    }));

    const { error: teamError } = await supabase
      .from("project_team_members")
      .upsert(teamMembers, { onConflict: "project_id,profile_id" });

    if (teamError) {
      console.error("Error adding team members:", teamError);
      // Continue anyway, GitHub invites can still work
    }

    // 4. Assign modules to team members (if assignments provided)
    if (moduleAssignments && moduleAssignments.length > 0) {
      for (const assignment of moduleAssignments) {
        const { error: moduleError } = await supabase
          .from("project_modules")
          .update({
            assigned_to: assignment.assigneeId,
            is_assigned: true,
            status: "in_progress",
          })
          .eq("id", assignment.moduleId)
          .eq("project_id", projectId);

        if (moduleError) {
          console.error(
            `Error assigning module ${assignment.moduleId}:`,
            moduleError
          );
          // Continue with other assignments
        }
      }
    }

    // 5. Invite team members as collaborators to GitHub repo (if repo exists)
    const { hasRepo, repo } = await checkProjectRepository(projectId);

    if (hasRepo && repo) {
      // Fetch GitHub usernames for team members
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, github_username")
        .in(
          "id",
          acceptedProposals.map((p) => p.proposer_id)
        );

      if (profiles && profiles.length > 0) {
        // Invite each member with a GitHub username
        for (const profile of profiles) {
          if (profile.github_username) {
            try {
              await inviteCollaboratorToRepo(
                repo.repo_full_name,
                profile.github_username
              );
              console.log(
                `Invited ${profile.github_username} to ${repo.repo_full_name}`
              );
            } catch (error) {
              console.error(
                `Failed to invite ${profile.github_username}:`,
                error
              );
              // Continue with other invitations even if one fails
            }
          }
        }
      }
    }
  }

  revalidatePath(`/project/${projectId}`);
  return { success: true, workspaceId };
}

/**
 * Get workspace details including channels and members
 */
export async function getWorkspaceData(workspaceId: string) {
  const supabase = await createServerSupabase();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch Workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from("project_workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single();

  if (workspaceError) throw new Error("Workspace not found");

  // Fetch Channels
  const { data: channels, error: channelsError } = await supabase
    .from("workspace_channels")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  // Fetch Members (via project_team_members)
  const { data: members, error: membersError } = await supabase
    .from("project_team_members")
    .select(
      `
      *,
      profile:profiles!team_members_profile_fk (
        display_name,
        avatar_url,
        username,
        github_username
      )
    `
    )
    .eq("project_id", workspace.project_id);

  // Determine current user's role
  let userRole: "owner" | "maintainer" | "contributor" | null = null;

  if (user) {
    // Check if user is the project owner
    const { data: project } = await supabase
      .from("projects")
      .select("owner_id")
      .eq("id", workspace.project_id)
      .single();

    if (project?.owner_id === user.id) {
      userRole = "owner";
    } else {
      // Check team membership
      const userMember = members?.find((m) => m.profile_id === user.id);
      if (userMember) {
        userRole = userMember.role as "maintainer" | "contributor";
      }
    }
  }

  return {
    workspace: workspace as WorkspaceRecord,
    channels: (channels || []) as WorkspaceChannel[],
    members: (members || []) as WorkspaceMember[],
    userRole,
  };
}

// Language colors mapping (GitHub's official colors)
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  Go: "#00ADD8",
  Rust: "#dea584",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Shell: "#89e051",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  default: "#8b949e",
};

/**
 * Fetch GitHub statistics for the dashboard
 * Returns stats object on success, or an error object if token is invalid
 */
export async function fetchGitHubStats(
  repoFullName: string
): Promise<
  | GitHubStats
  | { error: string; needsReauth: boolean; errorType?: string }
  | null
> {
  try {
    const token = await getGitHubAccessToken();

    if (!token) {
      console.log("[fetchGitHubStats] No valid GitHub token available");
      return { error: "No GitHub token available", needsReauth: true };
    }

    const tokenPrefix = token.substring(0, 10);
    console.log(
      `[fetchGitHubStats] Using token starting with: ${tokenPrefix}...`
    );

    const octokit = new Octokit({ auth: token });
    const [owner, repo] = repoFullName.split("/");

    console.log("[fetchGitHubStats] Fetching stats for:", owner, "/", repo);

    // Parallel fetch for various stats
    const [
      repoData,
      contributorsData,
      openPullsData,
      closedPullsData,
      commitsData,
      participationData,
      languagesData,
      codeFrequencyData,
      openIssuesData,
      closedIssuesData,
    ] = await Promise.all([
      octokit.rest.repos.get({ owner, repo }),
      octokit.rest.repos.listContributors({ owner, repo, per_page: 10 }),
      octokit.rest.pulls.list({ owner, repo, state: "open", per_page: 100 }),
      octokit.rest.pulls.list({ owner, repo, state: "closed", per_page: 100 }),
      octokit.rest.repos.listCommits({ owner, repo, per_page: 100 }),
      octokit.rest.repos.getCommitActivityStats({ owner, repo }),
      octokit.rest.repos.listLanguages({ owner, repo }),
      octokit.rest.repos
        .getCodeFrequencyStats({ owner, repo })
        .catch(() => ({ data: [] })),
      octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: "open",
        per_page: 100,
      }),
      octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: "closed",
        per_page: 100,
      }),
    ]);

    // Calculate total contributions for percentage
    const totalContributions = contributorsData.data.reduce(
      (sum: number, c: any) => sum + c.contributions,
      0
    );

    // Process Contributors with percentage
    const topContributors: ContributorStat[] = contributorsData.data
      .map((c: any) => ({
        username: c.login,
        avatarUrl: c.avatar_url,
        commits: c.contributions,
        additions: 0,
        deletions: 0,
        percentage:
          totalContributions > 0
            ? Math.round((c.contributions / totalContributions) * 100)
            : 0,
      }))
      .slice(0, 8);

    // Process Commit Activity (Weekly)
    // GitHub's getCommitActivityStats returns last 52 weeks
    // We use it if available, otherwise generate from commits
    let commitActivity: CommitActivity[] = [];

    // Get repo creation date to show full history
    const repoCreatedAt = new Date(repoData.data.created_at);
    const now = new Date();

    if (
      Array.isArray(participationData.data) &&
      participationData.data.length > 0
    ) {
      // Use the stats API data - it contains last 52 weeks
      commitActivity = participationData.data.map((w: any) => ({
        date: new Date(w.week * 1000).toISOString(),
        count: w.total,
      }));
    } else {
      // Fallback: Generate weekly commit activity from commits list
      // Calculate weeks since repo creation (or max 52 weeks for display)
      const weeksSinceCreation = Math.ceil(
        (now.getTime() - repoCreatedAt.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      const weeksToShow = Math.min(weeksSinceCreation, 52); // Cap at 52 weeks for display

      const weeklyCommits: Record<string, number> = {};

      // Initialize weeks from repo creation (or last 52 weeks) with 0 commits
      for (let i = weeksToShow - 1; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - i * 7);
        weekStart.setHours(0, 0, 0, 0);
        // Get the Sunday of that week
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekKey = weekStart.toISOString().split("T")[0];
        weeklyCommits[weekKey] = 0;
      }

      // Count commits per week
      commitsData.data.forEach((commit: any) => {
        const commitDate = new Date(
          commit.commit.author?.date || commit.commit.committer?.date
        );
        // Get the Sunday of the commit's week
        const weekStart = new Date(commitDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekKey = weekStart.toISOString().split("T")[0];

        if (weeklyCommits.hasOwnProperty(weekKey)) {
          weeklyCommits[weekKey]++;
        }
      });

      // Convert to array sorted by date
      commitActivity = Object.entries(weeklyCommits)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([date, count]) => ({
          date: new Date(date).toISOString(),
          count,
        }));
    }

    // Process Languages
    const totalBytes = Object.values(
      languagesData.data as Record<string, number>
    ).reduce((a, b) => a + b, 0);
    const languages: LanguageStat[] = Object.entries(
      languagesData.data as Record<string, number>
    )
      .map(([name, bytes]) => ({
        name,
        bytes,
        percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0,
        color: LANGUAGE_COLORS[name] || LANGUAGE_COLORS.default,
      }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 6);

    // Process Code Frequency (last 10 weeks)
    const codeFrequency: CodeFrequency[] = Array.isArray(codeFrequencyData.data)
      ? codeFrequencyData.data.slice(-12).map((w: any) => ({
          week: new Date(w[0] * 1000).toISOString(),
          additions: w[1] || 0,
          deletions: Math.abs(w[2] || 0),
        }))
      : [];

    // Process Recent Activity from commits
    const recentActivity: RecentActivity[] = commitsData.data
      .slice(0, 5)
      .map((c: any) => ({
        type: "commit" as const,
        title:
          c.commit.message.split("\n")[0].substring(0, 60) +
          (c.commit.message.length > 60 ? "..." : ""),
        author: c.author?.login || c.commit.author?.name || "Unknown",
        authorAvatar: c.author?.avatar_url || "",
        date: c.commit.author?.date || "",
        url: c.html_url,
      }));

    // Count merged PRs (closed PRs that were merged)
    const mergedPullRequests = closedPullsData.data.filter(
      (pr: any) => pr.merged_at !== null
    ).length;

    // Filter out PRs from issues count
    const actualOpenIssues = openIssuesData.data.filter(
      (issue: any) => !issue.pull_request
    ).length;
    const actualClosedIssues = closedIssuesData.data.filter(
      (issue: any) => !issue.pull_request
    ).length;

    return {
      commits: commitsData.data.length,
      contributors: contributorsData.data.length,
      pullRequests: openPullsData.data.length + closedPullsData.data.length,
      openPullRequests: openPullsData.data.length,
      closedPullRequests: closedPullsData.data.length - mergedPullRequests,
      mergedPullRequests,
      issues: actualOpenIssues + actualClosedIssues,
      openIssues: actualOpenIssues,
      closedIssues: actualClosedIssues,
      stars: repoData.data.stargazers_count,
      forks: repoData.data.forks_count,
      watchers: repoData.data.subscribers_count,
      lastUpdate: repoData.data.updated_at,
      defaultBranch: repoData.data.default_branch,
      repoSize: repoData.data.size,
      languages,
      topContributors,
      commitActivity,
      codeFrequency,
      recentActivity,
    };
  } catch (error: any) {
    // Handle expected errors silently, only log unexpected ones
    if (error.status === 401) {
      console.error(
        "[fetchGitHubStats] Bad credentials - token may be invalid or corrupted"
      );
      return {
        error:
          "GitHub authentication failed. Please reconnect your GitHub account.",
        needsReauth: true,
      };
    }

    if (error.status === 403) {
      return {
        error: "GitHub API rate limit exceeded or insufficient permissions.",
        needsReauth: false,
      };
    }

    if (error.status === 404) {
      // Expected for contributors without repo access - don't log
      return {
        error:
          "Repository not found or you don't have access. Please check your email and accept github collaboration invite or check your GitHub notifications.",
        needsReauth: false,
        errorType: "REPO_NOT_FOUND",
      };
    }

    // Log unexpected errors for debugging
    console.error("[fetchGitHubStats] Unexpected error:", error);
    return null;
  }
}

/**
 * Link a created GitHub repository to the project
 */
export async function linkProjectRepo(
  projectId: string,
  repoUrl: string,
  repoFullName: string
) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { error } = await supabase.from("project_repos").insert({
    project_id: projectId,
    provider: "github",
    repo_full_name: repoFullName,
    repo_url: repoUrl,
    is_private: true, // Default assumption, can be updated if we pass visibility
    creation_status: "created",
    created_by: user.id,
  });

  if (error) {
    console.error("Error linking project repo:", error);
    throw new Error("Failed to link repository to project");
  }

  revalidatePath(`/project/${projectId}`);
  revalidatePath(`/workspace/create/${projectId}`);
  return { success: true };
}
