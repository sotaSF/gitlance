"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { Project } from "@/components/project/project-card";

export async function getMyProjects(): Promise<{
  success: boolean;
  projects?: Project[];
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be logged in to view your projects." };
    }

    const { data, error } = await supabase
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
      `)
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching my projects:", error);
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

    return { success: true, projects };
  } catch (error) {
    console.error("Unexpected error fetching my projects:", error);
    return {
      success: false,
      error: "An unexpected error occurred while fetching your projects.",
    };
  }
}
