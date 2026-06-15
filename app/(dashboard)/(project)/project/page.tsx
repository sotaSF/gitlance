import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ProjectCard from "@/components/project/project-card";
import { getMyProjects } from "./actions";
import { Plus, FolderKanban } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My Projects | GitLance",
  description: "Manage your posted projects",
};

export const dynamic = "force-dynamic";

export default async function MyProjectsPage() {
  const { success, projects, error } = await getMyProjects();
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage the projects you have posted on GitLance.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/project/new-project">
            <Plus className="h-4 w-4" />
            Post New Project
          </Link>
        </Button>
      </div>

      {error && (
        <div className="p-4 mb-6 text-sm text-red-500 bg-red-50 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {!success || !projects || projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed bg-muted/30">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FolderKanban className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No projects found</h3>
          <p className="text-muted-foreground max-w-sm mt-2 mb-6">
            You haven't posted any projects yet. Create your first project to get started.
          </p>
          <Button asChild>
            <Link href="/project/new-project">Create Project</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
