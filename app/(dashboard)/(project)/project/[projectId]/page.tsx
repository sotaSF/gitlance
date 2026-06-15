import { createServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProjectHeader } from "./components/ProjectHeader";
import { ProjectDetails } from "./components/ProjectDetails";
import { ProposalsList } from "./components/ProposalsList";
import { ProposalSection } from "./components/ProposalSection";
import { ProjectModule, ProjectRecord } from "@/types/projects";
import { ProposalWithProposer } from "@/types/proposals";

export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createServerSupabase();

  // 1. Get Current User
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Fetch Project Details
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    notFound();
  }
  const typedProject = project as ProjectRecord;

  // 3. Fetch Project Modules
  const { data: modules, error: modulesError } = await supabase
    .from("project_modules")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (modulesError) {
    console.error("Failed to load project modules", modulesError.message);
  }

  const typedModules = (modules || []) as ProjectModule[];

  // 4. Check if all modules are assigned
  const allModulesAssigned =
    typedModules.length > 0 &&
    typedModules.every((module) => module.is_assigned === true);

  // 5. Check Ownership
  const isOwner = user?.id === project.owner_id;

  // 6. Fetch Proposals (Only if owner)
  let proposals: ProposalWithProposer[] = [];
  if (isOwner) {
    // Check if proposals table exists first or handle error gracefully
    // For now assuming it exists or we'll get an error which we can catch
    const { data: proposalsData } = await supabase
      .from("proposals")
      .select(
        `
        *,
        proposer:profiles!proposals_proposer_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          headline
        )
      `
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (proposalsData) {
      proposals = proposalsData as ProposalWithProposer[];
    }
  }

  // 7. Fetch User's Proposal (Only if not owner)
  let userProposal: ProposalWithProposer | null = null;
  if (!isOwner && user) {
    const { data: proposalData } = await supabase
      .from("proposals")
      .select(
        `
        *,
        proposer:profiles!proposals_proposer_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          headline
        )
      `
      )
      .eq("project_id", projectId)
      .eq("proposer_id", user.id)
      .maybeSingle();
    if (proposalData) {
      userProposal = proposalData as ProposalWithProposer;
    }
  }

  // 8. Check for Workspace
  const { data: workspace } = await supabase
    .from("project_workspaces")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();

  // 9. Check GitHub and stripe-connect Connection
  let hasGitHubConnected = false;
  let hasStripeConnected = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("github_username, stripe_connect_id")
      .eq("id", user.id)
      .single();

    if (profile?.github_username) {
      hasGitHubConnected = true;
    } else if (user.identities?.some((id) => id.provider === "github")) {
      // Fallback: Check if linked in auth identities even if profile sync failed
      hasGitHubConnected = true;
    }

    if (profile?.stripe_connect_id) {
      hasStripeConnected = true;
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <ProjectHeader
        project={typedProject}
        isOwner={isOwner}
        workspaceId={workspace?.id}
        allModulesAssigned={allModulesAssigned}
      />

      <ProjectDetails project={typedProject} modules={typedModules} />

      {isOwner ? (
        <div className="mt-12">
          <ProposalsList projectId={projectId} proposals={proposals} />
        </div>
      ) : (
        <div className="mt-12">
          <ProposalSection
            projectId={projectId}
            projectTitle={typedProject.title}
            modules={typedModules}
            userProposal={userProposal}
            hasGitHubConnected={hasGitHubConnected}
            hasStripeConnected={hasStripeConnected}
          />
        </div>
      )}
    </div>
  );
}
