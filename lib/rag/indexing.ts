import {
  buildModuleEmbeddingText,
  buildProjectEmbeddingText,
  embedText,
} from "@/lib/rag/embeddings";
import { getRagSupabase } from "@/lib/rag/client";

type ProjectRow = {
  id: string;
  title: string;
  user_story: string;
  tags: string[] | null;
  required_skills: string[] | null;
  owner_estimated_budget: number | null;
  owner_final_total: number | null;
  is_published: boolean;
};

type ModuleRow = {
  id: string;
  name: string;
  description: string;
  owner_final_cost: number | null;
  ai_estimated_cost: number | null;
  complexity: number | null;
};

export async function indexProjectWithModules(projectId: string): Promise<void> {
  try {
    const supabase = await getRagSupabase();

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        "id, title, user_story, tags, required_skills, owner_estimated_budget, owner_final_total, is_published"
      )
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      console.error("RAG index: project not found", projectError);
      return;
    }

    const { data: modules, error: modulesError } = await supabase
      .from("project_modules")
      .select(
        "id, name, description, owner_final_cost, ai_estimated_cost, complexity"
      )
      .eq("project_id", projectId);

    if (modulesError) {
      console.error("RAG index: failed to fetch modules", modulesError);
      return;
    }

    await supabase
      .from("project_embeddings")
      .delete()
      .eq("project_id", projectId);

    const projectText = buildProjectEmbeddingText({
      title: project.title,
      userStory: project.user_story,
      tags: project.tags || [],
      requiredSkills: project.required_skills || [],
      budget: project.owner_estimated_budget,
    });

    const projectEmbedding = await embedText(projectText, "RETRIEVAL_DOCUMENT");
    if (!projectEmbedding) {
      console.warn("RAG index: failed to embed project", projectId);
      return;
    }

    const rows: Array<{
      project_id: string;
      content_type: "project" | "module";
      content_text: string;
      embedding: number[];
      metadata: Record<string, unknown>;
    }> = [
      {
        project_id: projectId,
        content_type: "project",
        content_text: projectText,
        embedding: projectEmbedding,
        metadata: {
          title: project.title,
          tags: project.tags || [],
          required_skills: project.required_skills || [],
          owner_estimated_budget: project.owner_estimated_budget,
          owner_final_total: project.owner_final_total,
          is_published: project.is_published,
          module_count: modules?.length || 0,
        },
      },
    ];

    for (const module of (modules || []) as ModuleRow[]) {
      const moduleText = buildModuleEmbeddingText({
        projectTitle: project.title,
        moduleName: module.name,
        moduleDescription: module.description,
        tags: project.tags || [],
      });

      const moduleEmbedding = await embedText(moduleText, "RETRIEVAL_DOCUMENT");
      if (!moduleEmbedding) continue;

      rows.push({
        project_id: projectId,
        content_type: "module",
        content_text: moduleText,
        embedding: moduleEmbedding,
        metadata: {
          module_id: module.id,
          module_name: module.name,
          owner_final_cost: module.owner_final_cost,
          ai_estimated_cost: module.ai_estimated_cost,
          complexity: module.complexity,
          project_title: project.title,
          tags: project.tags || [],
        },
      });
    }

    const { error: insertError } = await supabase
      .from("project_embeddings")
      .insert(rows);

    if (insertError) {
      console.error("RAG index: insert failed", insertError);
    }
  } catch (error) {
    console.error("RAG index error:", error);
  }
}

export async function backfillAllProjectEmbeddings(): Promise<{
  success: boolean;
  indexed: number;
  error?: string;
}> {
  try {
    const supabase = await getRagSupabase();

    const { data: projects, error } = await supabase
      .from("projects")
      .select("id")
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, indexed: 0, error: error.message };
    }

    let indexed = 0;
    for (const project of projects || []) {
      await indexProjectWithModules(project.id);
      indexed += 1;
    }

    return { success: true, indexed };
  } catch (error) {
    return {
      success: false,
      indexed: 0,
      error: error instanceof Error ? error.message : "Backfill failed",
    };
  }
}
