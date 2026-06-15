import { createServerSupabase } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import ProposalForm from "./components/ProposalForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ projectid: string }>;
}) {
  const { projectid } = await params;
  const supabase = await createServerSupabase();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/sign-in?redirect=/proposal/${projectid}`);
  }

  // Fetch user profile for connections
  const { data: profile } = await supabase
    .from("profiles")
    .select("github_username, stripe_connect_id")
    .eq("id", user.id)
    .single();

  let hasGitHubConnected = false;
  if (profile?.github_username || user.identities?.some((id) => id.provider === "github")) {
    hasGitHubConnected = true;
  }

  const hasStripeConnected = !!profile?.stripe_connect_id;

  // Fetch project with modules
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(`
      *,
      profiles:owner_id (
        id,
        display_name,
        avatar_url
      )
    `)
    .eq("id", projectid)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Check if user is the project owner
  if (project.owner_id === user.id) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You cannot submit a proposal to your own project.
          </AlertDescription>
        </Alert>
        <div className="mt-6">
          <Link href={`/project/${projectid}`}>
            <Button variant="outline">Back to Project</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Fetch project modules
  const { data: modules, error: modulesError } = await supabase
    .from("project_modules")
    .select("*")
    .eq("project_id", projectid)
    .order("created_at", { ascending: true });

  // Check for existing active proposal
  const { data: existingProposal } = await supabase
    .from("proposals")
    .select("id, status")
    .eq("project_id", projectid)
    .eq("proposer_id", user.id)
    .in("status", ["submitted", "updated"])
    .maybeSingle();

  if (existingProposal) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You already have an active proposal for this project.
          </AlertDescription>
        </Alert>
        <div className="mt-6 flex gap-3">
          <Link href={`/proposal/${projectid}/${existingProposal.id}`}>
            <Button>View Your Proposal</Button>
          </Link>
          <Link href={`/project/${projectid}`}>
            <Button variant="outline">Back to Project</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Submit Proposal</h1>
        <p className="text-muted-foreground mt-2">
          Send a proposal for: <span className="font-semibold">{project.title}</span>
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Project Overview</CardTitle>
          <CardDescription>{project.short_description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Owner:</span>{" "}
              <span className="font-medium">
                {project.profiles?.display_name || "Unknown"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Budget:</span>{" "}
              <span className="font-medium">
                ${project.owner_final_total?.toLocaleString() || project.ai_estimated_total?.toLocaleString() || "N/A"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProposalForm
        projectId={projectid}
        modules={modules || []}
        projectTitle={project.title}
        hasGitHubConnected={hasGitHubConnected}
        hasStripeConnected={hasStripeConnected}
      />
    </div>
  );
}