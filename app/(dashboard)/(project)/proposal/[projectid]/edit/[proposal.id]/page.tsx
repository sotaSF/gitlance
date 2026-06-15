import { createServerSupabase } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import ProposalEditForm from "./components/ProposalEditForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProposalEditPage({
  params,
}: {
  params: Promise<{ projectid: string; "proposal.id": string }>;
}) {
  const { projectid, "proposal.id": proposalId } = await params;
  const supabase = await createServerSupabase();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/sign-in?redirect=/proposal/${projectid}/edit/${proposalId}`);
  }

  // Fetch proposal with related data
  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .select(`
      *,
      project:projects (
        id,
        title,
        owner_id,
        short_description
      )
    `)
    .eq("id", proposalId)
    .eq("project_id", projectid)
    .single();

  if (proposalError || !proposal) {
    notFound();
  }

  // Check permission: must be the proposer
  if (proposal.proposer_id !== user.id) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to edit this proposal.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if proposal can be edited
  const editableStatuses = ["submitted", "updated"];
  if (!editableStatuses.includes(proposal.status)) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This proposal cannot be edited. Status: {proposal.status}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch project modules
  const { data: modules } = await supabase
    .from("project_modules")
    .select("*")
    .eq("project_id", projectid)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Proposal</h1>
        <p className="text-muted-foreground mt-2">
          Update your proposal for: <span className="font-semibold">{proposal.project?.title}</span>
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Current Status: {proposal.status}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You can update your proposal details, module selection, budget, and timeline below.
            Once updated, the proposal status will be changed to "updated".
          </p>
        </CardContent>
      </Card>

      <ProposalEditForm
        projectId={projectid}
        proposalId={proposalId}
        proposal={proposal}
        modules={modules || []}
        projectTitle={proposal.project?.title || ""}
      />
    </div>
  );
}
