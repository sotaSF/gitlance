"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getProjectWithModules(projectId: string) {
  try {
    const supabase = await createServerSupabase();

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        `
        *,
        profiles:owner_id (
          id,
          display_name,
          avatar_url
        )
      `
      )
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return { success: false, error: "Project not found" };
    }

    // Fetch project modules
    const { data: modules, error: modulesError } = await supabase
      .from("project_modules")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (modulesError) {
      return { success: false, error: "Failed to fetch project modules" };
    }

    return {
      success: true,
      project,
      modules: modules || [],
    };
  } catch (error) {
    console.error("Error fetching project with modules:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

export async function submitProposal(data: {
  projectId: string;
  coverLetter: string;
  proposedBudget: number;
  proposedTimelineDays: number;
  selectedModules: any[];
  attachments?: any[];
}) {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Check if user has linked GitHub account
    const { data: profile } = await supabase
      .from("profiles")
      .select("github_username")
      .eq("id", user.id)
      .single();

    const hasGithubIdentity = user.identities?.some((id) => id.provider === "github");

    if (!profile?.github_username && !hasGithubIdentity) {
      return {
        success: false,
        error: "You must link your GitHub account before submitting a proposal",
      };
    }

    // Verify project exists and get owner
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("owner_id")
      .eq("id", data.projectId)
      .single();

    if (projectError || !project) {
      return { success: false, error: "Project not found" };
    }

    // Check if user is not the project owner
    if (project.owner_id === user.id) {
      return {
        success: false,
        error: "You cannot submit a proposal to your own project",
      };
    }

    // Check for existing active proposal
    const { data: existingProposal } = await supabase
      .from("proposals")
      .select("id, status")
      .eq("project_id", data.projectId)
      .eq("proposer_id", user.id)
      .in("status", ["submitted", "updated"])
      .maybeSingle();

    if (existingProposal) {
      return {
        success: false,
        error: "You already have an active proposal for this project",
      };
    }

    // Validate at least one module is selected
    if (!data.selectedModules || data.selectedModules.length === 0) {
      return {
        success: false,
        error: "Please select at least one module",
      };
    }

    // Insert proposal
    const { data: proposal, error: insertError } = await supabase
      .from("proposals")
      .insert({
        project_id: data.projectId,
        proposer_id: user.id,
        cover_letter: data.coverLetter,
        proposed_budget: data.proposedBudget,
        currency: "USD",
        proposed_timeline_days: data.proposedTimelineDays,
        modules_snapshot: data.selectedModules,
        attachments: data.attachments || [],
        status: "submitted",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error submitting proposal:", insertError);
      return { success: false, error: insertError.message };
    }

    revalidatePath(`/project/${data.projectId}`);
    revalidatePath("/explore");

    return {
      success: true,
      proposalId: proposal.id,
      message: "Proposal submitted successfully!",
    };
  } catch (error) {
    console.error("Unexpected error submitting proposal:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

export async function getProposal(proposalId: string) {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Fetch proposal with related data
    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select(
        `
        *,
        project:projects (
          id,
          title,
          owner_id,
          short_description
        ),
        proposer:profiles!proposals_proposer_id_fkey (
          id,
          display_name,
          avatar_url
        )
      `
      )
      .eq("id", proposalId)
      .single();

    if (proposalError || !proposal) {
      return { success: false, error: "Proposal not found" };
    }

    // Check permission: must be proposer or project owner
    const isProposer = proposal.proposer_id === user.id;
    const isProjectOwner = proposal.project?.owner_id === user.id;

    if (!isProposer && !isProjectOwner) {
      return {
        success: false,
        error: "You don't have permission to view this proposal",
      };
    }

    return {
      success: true,
      proposal,
      isProposer,
      isProjectOwner,
    };
  } catch (error) {
    console.error("Error fetching proposal:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

export async function updateProposal(
  proposalId: string,
  data: {
    coverLetter: string;
    proposedBudget: number;
    proposedTimelineDays: number;
    selectedModules: any[];
    attachments?: any[];
  }
) {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }
    console.log(
      `UPDATING PROPOSAL with ${data.coverLetter}  ${data.proposedBudget} ${data.proposedTimelineDays}  ${data.selectedModules}  `
    );
    // Fetch proposal to verify ownership and status
    const { data: proposal, error: fetchError } = await supabase
      .from("proposals")
      .select("proposer_id, status, project_id")
      .eq("id", proposalId)
      .single();

    if (fetchError || !proposal) {
      return { success: false, error: "Proposal not found" };
    }

    // Verify user is the proposer
    if (proposal.proposer_id !== user.id) {
      return {
        success: false,
        error: "You can only update your own proposals",
      };
    }

    // Check if proposal can be updated
    if (!["submitted", "updated"].includes(proposal.status)) {
      return {
        success: false,
        error: `Cannot update a proposal with status: ${proposal.status}`,
      };
    }

    // Validate at least one module is selected
    if (!data.selectedModules || data.selectedModules.length === 0) {
      return {
        success: false,
        error: "Please select at least one module",
      };
    }

    console.log("UPDATING");

    // Update proposal
    const { error: updateError } = await supabase
      .from("proposals")
      .update({
        cover_letter: data.coverLetter,
        proposed_budget: data.proposedBudget,
        proposed_timeline_days: data.proposedTimelineDays,
        modules_snapshot: data.selectedModules,
        attachments: data.attachments || [],
        status: "updated",
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId);

    if (updateError) {
      console.error("Error updating proposal:", updateError);
      return { success: false, error: updateError.message };
    }
    console.log("updateError");

    revalidatePath(`/proposal/${proposal.project_id}/${proposalId}`);
    revalidatePath(`/project/${proposal.project_id}`);

    return {
      success: true,
      message: "Proposal updated successfully!",
    };
  } catch (error) {
    console.error("Unexpected error updating proposal:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

export async function withdrawProposal(proposalId: string) {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Fetch proposal to verify ownership
    const { data: proposal, error: fetchError } = await supabase
      .from("proposals")
      .select("proposer_id, status, project_id")
      .eq("id", proposalId)
      .single();

    if (fetchError || !proposal) {
      return { success: false, error: "Proposal not found" };
    }

    // Verify user is the proposer
    if (proposal.proposer_id !== user.id) {
      return {
        success: false,
        error: "You can only withdraw your own proposals",
      };
    }

    // Check if proposal can be withdrawn
    if (
      ["withdrawn", "accepted", "rejected", "cancelled"].includes(
        proposal.status
      )
    ) {
      return {
        success: false,
        error: `Cannot withdraw a proposal with status: ${proposal.status}`,
      };
    }

    // Update proposal status to withdrawn
    const { error: updateError } = await supabase
      .from("proposals")
      .update({
        status: "withdrawn",
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId);

    if (updateError) {
      console.error("Error withdrawing proposal:", updateError);
      return { success: false, error: updateError.message };
    }

    revalidatePath(`/proposal/${proposal.project_id}/${proposalId}`);
    revalidatePath(`/project/${proposal.project_id}`);

    return {
      success: true,
      message: "Proposal withdrawn successfully",
    };
  } catch (error) {
    console.error("Unexpected error withdrawing proposal:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

type OwnerProposalStatus = "accepted" | "rejected";

async function changeProposalStatusAsOwner(
  proposalId: string,
  nextStatus: OwnerProposalStatus
) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data: proposal, error: fetchError } = await supabase
      .from("proposals")
      .select("id, status, project_id, proposer_id")
      .eq("id", proposalId)
      .single();

    if (fetchError || !proposal) {
      return { success: false, error: "Proposal not found" };
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("owner_id")
      .eq("id", proposal.project_id)
      .single();

    if (projectError || !project || project.owner_id !== user.id) {
      return {
        success: false,
        error: "Only the project owner can manage proposals",
      };
    }

    if (["accepted", "rejected"].includes(proposal.status)) {
      return {
        success: false,
        error: `Proposal already ${proposal.status}`,
      };
    }

    if (["withdrawn", "cancelled"].includes(proposal.status)) {
      return {
        success: false,
        error: `Cannot modify a proposal with status: ${proposal.status}`,
      };
    }

    const { error: updateError } = await supabase
      .from("proposals")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId);

    if (updateError) {
      console.error(
        `Error updating proposal status to ${nextStatus}:`,
        updateError
      );
      return { success: false, error: updateError.message };
    }

    revalidatePath(`/proposal/${proposal.project_id}/${proposalId}`);
    revalidatePath(`/project/${proposal.project_id}`);

    return {
      success: true,
      message: `Proposal ${nextStatus}`,
    };
  } catch (error) {
    console.error(
      `Unexpected error updating proposal status to ${nextStatus}:`,
      error
    );
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

export async function acceptProposal(proposalId: string) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // 1. Fetch proposal AND project owner in one go
    const { data: proposal, error: fetchError } = await supabase
      .from("proposals")
      .select(
        `
        id, 
        status, 
        project_id, 
        proposer_id, 
        modules_snapshot,
        project:projects (
          owner_id
        )
      `
      )
      .eq("id", proposalId)
      .single();

    if (fetchError || !proposal) {
      return { success: false, error: "Proposal not found" };
    }

    // 2. Validate permissions and status
    // @ts-ignore - Supabase types might not infer the nested project correctly without full generation
    const projectOwnerId = proposal.project?.owner_id;

    if (!projectOwnerId || projectOwnerId !== user.id) {
      return {
        success: false,
        error: "Only the project owner can manage proposals",
      };
    }

    if (["accepted", "rejected"].includes(proposal.status)) {
      return {
        success: false,
        error: `Proposal already ${proposal.status}`,
      };
    }

    if (["withdrawn", "cancelled"].includes(proposal.status)) {
      return {
        success: false,
        error: `Cannot modify a proposal with status: ${proposal.status}`,
      };
    }

    // 3. Extract module IDs
    const moduleIds: string[] = [];
    if (Array.isArray(proposal.modules_snapshot)) {
      proposal.modules_snapshot.forEach((module: any) => {
        if (module.id) {
          moduleIds.push(module.id);
        }
      });
    }

    // 4. Update proposal status
    const { error: updateError } = await supabase
      .from("proposals")
      .update({
        status: "accepted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId);

    if (updateError) {
      console.error("Error updating proposal status to accepted:", updateError);
      return { success: false, error: updateError.message };
    }

    // 5. Mark modules as assigned
    if (moduleIds.length > 0) {
      const { error: moduleUpdateError } = await supabase
        .from("project_modules")
        .update({
          is_assigned: true,
          updated_at: new Date().toISOString(),
        })
        .in("id", moduleIds);

      if (moduleUpdateError) {
        console.error("Error marking modules as assigned:", moduleUpdateError);
        return {
          success: true,
          message:
            "Proposal accepted, but some modules may not have been marked as assigned. Please verify.",
          warning: moduleUpdateError.message,
        };
      }
    }

    // 6. Check if ALL modules for this project are now assigned
    // Optimization: Instead of fetching all modules, count how many are UNASSIGNED.
    // If count is 0, then all are assigned.
    const { count, error: countError } = await supabase
      .from("project_modules")
      .select("*", { count: "exact", head: true })
      .eq("project_id", proposal.project_id)
      .eq("is_assigned", false);

    if (!countError && count === 0) {
      // All modules are assigned, update project status
      const { error: projectUpdateError } = await supabase
        .from("projects")
        .update({
          status: "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposal.project_id);

      if (projectUpdateError) {
        console.error(
          "Error updating project status to in_progress:",
          projectUpdateError
        );
        return {
          success: true,
          message:
            "Proposal accepted, but project may not have been marked as in_progress. Please verify.",
          warning: projectUpdateError.message,
        };
      }
    }

    revalidatePath(`/proposal/${proposal.project_id}/${proposalId}`);
    revalidatePath(`/project/${proposal.project_id}`);

    return {
      success: true,
      message: "Proposal accepted and modules marked as assigned",
    };
  } catch (error) {
    console.error("Unexpected error accepting proposal:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

export async function rejectProposal(proposalId: string) {
  return changeProposalStatusAsOwner(proposalId, "rejected");
}
