export type EmbeddingContentType = "project" | "module";

export type ProjectEmbeddingMatch = {
  project_id: string;
  content_type: EmbeddingContentType;
  content_text: string;
  metadata: Record<string, unknown>;
  similarity: number;
};

export type SimilarProject = {
  id: string;
  title: string;
  user_story: string;
  tags: string[];
  required_skills: string[];
  owner_final_total: number | null;
  owner_estimated_budget: number | null;
  modules: Array<{
    name: string;
    description: string;
    owner_final_cost: number | null;
    ai_estimated_cost: number | null;
    complexity: number | null;
  }>;
};
