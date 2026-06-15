
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createServerSupabase } from "@/lib/supabase/server";
import { EditProjectForm } from "./components/EditProjectForm";
import { ArrowLeft } from "lucide-react";

export default async function EditPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error || !project) {
    notFound();
  }

  if (project.owner_id !== user.id) {
    redirect(`/project/${projectId}`);
  }

  const { data: modules } = await supabase
    .from("project_modules")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Project</h1>
          <p className="text-muted-foreground mt-2">
            Update your project details, requirements, and attachments.
          </p>
        </div>
        <Link href={`/project/${projectId}`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </Button>
        </Link>
      </div>

      <EditProjectForm project={project} modules={modules || []} />
    </div>
  );
}
