import { createServerSupabase } from "@/lib/supabase/server";
import { WorkspaceRepoConnect } from "./components/WorkspaceRepoConnect";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import {
  checkProjectRepository,
  getAcceptedProposals,
  getModuleAssignmentData,
} from "../../actions";
import { CreateWorkspaceForm } from "./components/CreateWorkspaceForm";

export default async function CreateWorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createServerSupabase();

  // 1. Check Project Existence & Ownership
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== project.owner_id) {
    redirect(`/project/${projectId}`);
  }

  // 2. Check if workspace already exists
  const { data: existingWorkspace } = await supabase
    .from("project_workspaces")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();

  if (existingWorkspace) {
    redirect(`/workspace/${existingWorkspace.id}`);
  }

  // 3. Check Repository
  const { hasRepo } = await checkProjectRepository(projectId);

  // 4. Get Accepted Proposals and Module Assignment Data
  const acceptedProposals = await getAcceptedProposals(projectId);
  const moduleAssignmentData = hasRepo
    ? await getModuleAssignmentData(projectId)
    : null;

  // Determine total steps based on state
  const hasModulesToAssign =
    moduleAssignmentData &&
    moduleAssignmentData.proposals.length > 0 &&
    moduleAssignmentData.allModules.length > 0;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href={`/project/${projectId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors gap-2 group mb-6"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Project
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Set up Workspace
          </h1>
        </div>

        {/* Subtitle with project name */}
        <p className="text-muted-foreground mb-6">
          Configure workspace for <span className="font-medium text-foreground">{project.title}</span>
        </p>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {/* Step 1: Repo */}
          <div className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all ${!hasRepo
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-primary/30 bg-primary/10 text-primary"
                }`}
            >
              1
            </div>
            <span className={`text-sm ${!hasRepo ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              Repository
            </span>
          </div>

          <div className={`flex-1 h-0.5 max-w-12 ${hasRepo ? "bg-primary" : "bg-border"}`} />

          {/* Step 2: Module Assignment (if applicable) */}
          {hasModulesToAssign && (
            <>
              <div className="flex items-center gap-2">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all ${hasRepo
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground"
                    }`}
                >
                  2
                </div>
                <span className={`text-sm ${hasRepo ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  Assignments
                </span>
              </div>
              <div className="flex-1 h-0.5 max-w-12 bg-border" />
            </>
          )}

          {/* Step 3 (or 2): Workspace Details */}
          <div className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all ${hasRepo && !hasModulesToAssign
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground"
                }`}
            >
              {hasModulesToAssign ? "3" : "2"}
            </div>
            <span className={`text-sm ${hasRepo && !hasModulesToAssign ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              Details
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {!hasRepo ? (
            <WorkspaceRepoConnect
              projectId={projectId}
              projectTitle={project.title}
              projectDescription={
                project.short_description || project.user_story || ""
              }
            />
          ) : (
            <CreateWorkspaceForm
              projectId={projectId}
              acceptedProposals={acceptedProposals as any}
              moduleAssignmentData={moduleAssignmentData}
            />
          )}
        </div>
      </div>
    </div>
  );
}
