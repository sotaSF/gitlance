import { env } from "@/config/env";

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

export async function embedText(
  text: string,
  taskType: EmbeddingTaskType = "RETRIEVAL_DOCUMENT"
): Promise<number[] | null> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey || !text.trim()) {
    return null;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: `models/${EMBEDDING_MODEL}`,
          content: {
            parts: [{ text: text.trim().slice(0, 8000) }],
          },
          taskType,
          outputDimensionality: EMBEDDING_DIMENSIONS,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Embedding API error:", response.status, errorBody);
      return null;
    }

    const data = await response.json();
    const values = data?.embedding?.values;

    if (!Array.isArray(values) || values.length === 0) {
      return null;
    }

    return values;
  } catch (error) {
    console.error("Failed to generate embedding:", error);
    return null;
  }
}

export function buildProjectEmbeddingText(input: {
  title: string;
  userStory: string;
  tags?: string[];
  requiredSkills?: string[];
  budget?: number | null;
}): string {
  return [
    `Project: ${input.title}`,
    `Description: ${input.userStory}`,
    input.tags?.length ? `Tags: ${input.tags.join(", ")}` : null,
    input.requiredSkills?.length
      ? `Skills: ${input.requiredSkills.join(", ")}`
      : null,
    input.budget ? `Budget: $${input.budget}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildModuleEmbeddingText(input: {
  projectTitle: string;
  moduleName: string;
  moduleDescription: string;
  tags?: string[];
}): string {
  return [
    `Project: ${input.projectTitle}`,
    input.tags?.length ? `Tags: ${input.tags.join(", ")}` : null,
    `Module: ${input.moduleName}`,
    `Description: ${input.moduleDescription}`,
  ]
    .filter(Boolean)
    .join("\n");
}
