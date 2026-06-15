import { NextResponse } from "next/server";
import { backfillAllProjectEmbeddings } from "@/lib/rag/indexing";

/**
 * Dev-only endpoint to backfill RAG embeddings for all projects.
 * Do not expose this in production.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "Backfill endpoint is disabled in production" },
      { status: 403 }
    );
  }

  const result = await backfillAllProjectEmbeddings();

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
