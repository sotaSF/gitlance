import {
  buildProjectEmbeddingText,
  embedText,
} from "@/lib/rag/embeddings";
import { getRagSupabase } from "@/lib/rag/client";
import type { ProjectEmbeddingMatch, SimilarProject } from "@/lib/rag/types";

const DEFAULT_MATCH_COUNT = 5;
const MIN_SIMILARITY = 0.35;

async function vectorSearch(
  queryText: string,
  options?: {
    contentType?: "project" | "module";
    matchCount?: number;
  }
): Promise<ProjectEmbeddingMatch[]> {
  const embedding = await embedText(queryText, "RETRIEVAL_QUERY");
  if (!embedding) return [];

  const supabase = await getRagSupabase();
  const { data, error } = await supabase.rpc("match_project_embeddings", {
    query_embedding: embedding,
    match_count: options?.matchCount ?? DEFAULT_MATCH_COUNT,
    content_type_filter: options?.contentType ?? null,
    min_similarity: MIN_SIMILARITY,
  });

  if (error) {
    console.error("Vector search error:", error);
    return [];
  }

  return (data || []) as ProjectEmbeddingMatch[];
}

async function fetchProjectsWithModules(
  projectIds: string[]
): Promise<SimilarProject[]> {
  if (projectIds.length === 0) return [];

  const supabase = await getRagSupabase();
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      title,
      user_story,
      tags,
      required_skills,
      owner_final_total,
      owner_estimated_budget,
      project_modules (
        name,
        description,
        owner_final_cost,
        ai_estimated_cost,
        complexity
      )
    `
    )
    .in("id", projectIds);

  if (error || !data) {
    console.error("Failed to fetch similar projects:", error);
    return [];
  }

  return data.map((project: any) => ({
    id: project.id,
    title: project.title,
    user_story: project.user_story,
    tags: project.tags || [],
    required_skills: project.required_skills || [],
    owner_final_total: project.owner_final_total,
    owner_estimated_budget: project.owner_estimated_budget,
    modules: (project.project_modules || []).map((m: any) => ({
      name: m.name,
      description: m.description,
      owner_final_cost: m.owner_final_cost,
      ai_estimated_cost: m.ai_estimated_cost,
      complexity: m.complexity,
    })),
  }));
}

async function fallbackTagSearch(input: {
  title: string;
  userStory: string;
  tags: string[];
  requiredSkills: string[];
  estimatedBudget: number | null;
}): Promise<SimilarProject[]> {
  const supabase = await getRagSupabase();

  let query = supabase
    .from("projects")
    .select(
      `
      id,
      title,
      user_story,
      tags,
      required_skills,
      owner_final_total,
      owner_estimated_budget,
      project_modules (
        name,
        description,
        owner_final_cost,
        ai_estimated_cost,
        complexity
      )
    `
    )
    .not("owner_final_total", "is", null)
    .limit(DEFAULT_MATCH_COUNT);

  if (input.tags.length > 0) {
    query = query.overlaps("tags", input.tags);
  }

  if (input.estimatedBudget) {
    const minBudget = Math.floor(input.estimatedBudget * 0.5);
    const maxBudget = Math.ceil(input.estimatedBudget * 1.5);
    query = query
      .gte("owner_estimated_budget", minBudget)
      .lte("owner_estimated_budget", maxBudget);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error || !data?.length) {
    const { data: recentProjects } = await supabase
      .from("projects")
      .select(
        `
        id,
        title,
        user_story,
        tags,
        required_skills,
        owner_final_total,
        owner_estimated_budget,
        project_modules (
          name,
          description,
          owner_final_cost,
          ai_estimated_cost,
          complexity
        )
      `
      )
      .not("owner_final_total", "is", null)
      .limit(DEFAULT_MATCH_COUNT)
      .order("created_at", { ascending: false });

    return (recentProjects || []).map((project: any) => ({
      id: project.id,
      title: project.title,
      user_story: project.user_story,
      tags: project.tags || [],
      required_skills: project.required_skills || [],
      owner_final_total: project.owner_final_total,
      owner_estimated_budget: project.owner_estimated_budget,
      modules: (project.project_modules || []).map((m: any) => ({
        name: m.name,
        description: m.description,
        owner_final_cost: m.owner_final_cost,
        ai_estimated_cost: m.ai_estimated_cost,
        complexity: m.complexity,
      })),
    }));
  }

  return data.map((project: any) => ({
    id: project.id,
    title: project.title,
    user_story: project.user_story,
    tags: project.tags || [],
    required_skills: project.required_skills || [],
    owner_final_total: project.owner_final_total,
    owner_estimated_budget: project.owner_estimated_budget,
    modules: (project.project_modules || []).map((m: any) => ({
      name: m.name,
      description: m.description,
      owner_final_cost: m.owner_final_cost,
      ai_estimated_cost: m.ai_estimated_cost,
      complexity: m.complexity,
    })),
  }));
}

function formatProjectBenchmarks(
  projects: SimilarProject[],
  similarities?: Map<string, number>
): string {
  if (projects.length === 0) return "";

  const sections = projects.map((project) => {
    const similarity = similarities?.get(project.id);
    const similarityLabel =
      similarity !== undefined
        ? ` (similarity: ${(similarity * 100).toFixed(0)}%)`
        : "";

    const moduleLines = project.modules
      .map((m) => {
        const cost = m.owner_final_cost ?? m.ai_estimated_cost ?? 0;
        return `  - ${m.name}: $${cost} (complexity ${m.complexity ?? "?"}) — ${m.description}`;
      })
      .join("\n");

    return [
      `Project: "${project.title}"${similarityLabel}`,
      `Budget: $${project.owner_estimated_budget ?? "N/A"} | Final total: $${project.owner_final_total ?? "N/A"}`,
      `Tags: ${project.tags.join(", ") || "none"}`,
      `Modules:`,
      moduleLines || "  (no modules)",
    ].join("\n");
  });

  return `=== HISTORICAL BENCHMARKS (similar past projects from database) ===
Use these real project outcomes to calibrate module structure and costs.
Prefer historical data over generic benchmarks when a close match exists.

${sections.join("\n\n")}`;
}

function formatModuleBenchmarks(matches: ProjectEmbeddingMatch[]): string {
  if (matches.length === 0) return "";

  const normalizeName = (value: string) =>
    value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");

  const groupedMatches = new Map<string, ProjectEmbeddingMatch[]>();

  for (const match of matches) {
    const name = String(match.metadata.module_name || "Unknown module");
    const key = normalizeName(name);
    const existing = groupedMatches.get(key) || [];
    existing.push(match);
    groupedMatches.set(key, existing);
  }

  const lines = [...groupedMatches.entries()]
    .sort((a, b) => {
      const aBest = Math.max(...a[1].map((match) => match.similarity));
      const bBest = Math.max(...b[1].map((match) => match.similarity));
      return bBest - aBest;
    })
    .map(([groupName, groupMatches]) => {
      const bestMatch = groupMatches.reduce((best, current) =>
        current.similarity > best.similarity ? current : best
      );

      const costs = groupMatches
        .map((match) =>
          Number(match.metadata.owner_final_cost ?? match.metadata.ai_estimated_cost)
        )
        .filter((value) => Number.isFinite(value) && value > 0);

      const consensusCost = costs.length > 0 ? Math.min(...costs) : "N/A";
      const complexity = bestMatch.metadata.complexity ?? "?";
      const projectTitles = [...new Set(
        groupMatches.map((match) => match.metadata.project_title || "Unknown project")
      )];

      return `- ${bestMatch.metadata.module_name || groupName} consensus: $${consensusCost} (seen in ${groupMatches.length} project(s), complexity ${complexity}) from ${projectTitles.join(", ")} [best ${(bestMatch.similarity * 100).toFixed(0)}% match]: ${bestMatch.content_text.split("Description: ").pop()}`;
    });

  return `=== SIMILAR MODULE BENCHMARKS (from database) ===
Historical module benchmarks below are the primary pricing signal.
If a module appears more than once, use the consensus cost from those matches before considering the generic benchmark table.
${lines.join("\n")}`;
}

export async function retrieveProjectRAGContext(input: {
  title: string;
  userStory: string;
  tags: string[];
  requiredSkills: string[];
  estimatedBudget: number | null;
}): Promise<string> {
  try {
    const queryText = buildProjectEmbeddingText({
      title: input.title,
      userStory: input.userStory,
      tags: input.tags,
      requiredSkills: input.requiredSkills,
      budget: input.estimatedBudget,
    });

    const matches = await vectorSearch(queryText, {
      contentType: "project",
      matchCount: DEFAULT_MATCH_COUNT,
    });

    let projects: SimilarProject[] = [];
    const similarityMap = new Map<string, number>();

    if (matches.length > 0) {
      const projectIds = [...new Set(matches.map((m) => m.project_id))];
      matches.forEach((m) => {
        const existing = similarityMap.get(m.project_id) ?? 0;
        if (m.similarity > existing) {
          similarityMap.set(m.project_id, m.similarity);
        }
      });

      projects = await fetchProjectsWithModules(projectIds);
      projects.sort(
        (a, b) =>
          (similarityMap.get(b.id) ?? 0) - (similarityMap.get(a.id) ?? 0)
      );
    }

    if (projects.length === 0) {
      projects = await fallbackTagSearch(input);
    }

    return formatProjectBenchmarks(projects, similarityMap);
  } catch (error) {
    console.error("RAG retrieval error:", error);
    return "";
  }
}

export async function retrieveModuleRAGContext(
  userPrompt: string,
  projectContext: string
): Promise<string> {
  try {
    const queryText = `${projectContext}\n\nUser request: ${userPrompt}`;
    const matches = await vectorSearch(queryText, {
      contentType: "module",
      matchCount: 8,
    });

    return formatModuleBenchmarks(matches);
  } catch (error) {
    console.error("Module RAG retrieval error:", error);
    return "";
  }
}
