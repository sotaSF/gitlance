"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Publish a draft project to make it publicly visible
 */
export async function publishProject(projectId: string): Promise<{
  success: boolean;
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
      return { success: false, error: "User not authenticated" };
    }

    // Verify ownership and current status
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("owner_id, status, is_published")
      .eq("id", projectId)
      .single();

    if (fetchError || !project) {
      return { success: false, error: "Project not found" };
    }

    if (project.owner_id !== user.id) {
      return { success: false, error: "Unauthorized: You don't own this project" };
    }

    if (project.is_published) {
      return { success: false, error: "Project is already published" };
    }

    // Update project to published status
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
        visibility: "public",
        status: project.status === "draft" ? "open" : project.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (updateError) {
      console.error("Project publish error:", updateError);
      return { success: false, error: updateError.message };
    }

    // Revalidate paths
    revalidatePath(`/project/${projectId}`);
    revalidatePath("/explore");
    revalidatePath("/project/listing");

    return { success: true };
  } catch (error) {
    console.error("Project publish error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to publish project",
    };
  }
}
