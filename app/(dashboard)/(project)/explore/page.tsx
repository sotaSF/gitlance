import ProjectCard from "@/components/project/project-card";
import { Button } from "@/components/ui/button";
import { getProjects } from "./actions";
import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || "1", 10);
  const { projects, error, totalPages, totalCount } = await getProjects(currentPage);
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="w-full mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Explore Projects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse projects and join open collaborations — no sign-in
            required to view.
          </p>
        </div>


      </div>

      <div className="mt-6 space-y-6">


        {error && (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            Failed to load projects: {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project) => (
            <ProjectCard key={project.id} project={project} currentUserId={user?.id} />
          ))}
          {!projects?.length && !error && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No projects found. Be the first to post one!
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages !== undefined && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            {currentPage > 1 ? (
              <Link href={`?page=${currentPage - 1}`}>
                <Button variant="outline" size="sm">
                  ← Prev
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                ← Prev
              </Button>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{currentPage}</span>
              <span>/</span>
              <span>{totalPages}</span>
              <span className="ml-2">({totalCount} projects)</span>
            </div>

            {currentPage < totalPages ? (
              <Link href={`?page=${currentPage + 1}`}>
                <Button variant="outline" size="sm">
                  Next →
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Next →
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

