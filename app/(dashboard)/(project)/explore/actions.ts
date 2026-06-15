"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { Project } from "@/components/project/project-card";

const PAGE_SIZE = 20;

export async function getProjects(page: number = 1): Promise<{
  success: boolean;
  projects?: Project[];
  error?: string;
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
}> {
  try {
    const supabase = await createServerSupabase();

    // Calculate offset for pagination
    const offset = (page - 1) * PAGE_SIZE;
    const rangeEnd = offset + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from("projects")
      .select(`
        id,
        title,
        short_description,
        owner_estimated_budget,
        owner_id,
        tags,
        created_at,
        profiles:owner_id (
          display_name,
          avatar_url
        )
      `, { count: "exact" })
      .eq("is_published", true) // Only fetch published projects
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .range(offset, rangeEnd);

    if (error) {
      console.error("Error fetching projects:", error);
      return { success: false, error: error.message };
    }

    const projects: Project[] = data.map((p: any) => ({
      id: p.id,
      title: p.title,
      short_description: p.short_description || "",
      budget_min: p.owner_estimated_budget,
      budget_max: p.owner_estimated_budget,
      tags: p.tags || [],
      posted_at: p.created_at,
      owner_id: p.owner_id,
      client: {
        name: p.profiles?.display_name || "Unknown Client",
        avatar: p.profiles?.avatar_url,
      },
    }));

    const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 0;

    return { 
      success: true, 
      projects,
      totalCount: count || 0,
      totalPages,
      currentPage: page
    };
  } catch (error) {
    console.error("Unexpected error fetching projects:", error);
    return {
      success: false,
      error: "An unexpected error occurred while fetching projects.",
    };
  }
}

export async function submitProposal(prevState: any, formData: FormData) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be logged in to submit a proposal." };
    }

    const projectId = formData.get("projectId") as string;
    const coverLetter = formData.get("coverLetter") as string;
    const proposedBudget = parseFloat(formData.get("proposedBudget") as string);
    const proposedTimeline = parseInt(formData.get("proposedTimeline") as string);

    if (!projectId || !coverLetter || isNaN(proposedBudget) || isNaN(proposedTimeline)) {
      return { success: false, error: "Invalid input data." };
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("github_username")
      .eq("id", user.id)
      .single();

    if (!profile?.github_username) {
      return {
        success: false,
        error: "You must link your GitHub account before submitting a proposal",
      };
    }

    const { error } = await supabase.from("proposals").insert({
      project_id: projectId,
      proposer_id: user.id,
      cover_letter: coverLetter,
      proposed_budget: proposedBudget,
      proposed_timeline_days: proposedTimeline,
      status: "submitted",
    });

    if (error) {
      console.error("Error submitting proposal:", error);
      return { success: false, error: error.message };
    }

    return { success: true, message: "Proposal submitted successfully!" };
  } catch (error) {
    console.error("Unexpected error submitting proposal:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getProjectModules(projectId: string): Promise<{
  success: boolean;
  modules?: Array<{
    id: string;
    name: string;
    owner_final_cost?: number;
    ai_estimated_cost?: number;
    is_assigned?: boolean;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("project_modules")
      .select("id, name, owner_final_cost, ai_estimated_cost, is_assigned")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching project modules:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      modules: data || [],
    };
  } catch (error) {
    console.error("Unexpected error fetching project modules:", error);
    return {
      success: false,
      error: "An unexpected error occurred while fetching modules.",
    };
  }
}
