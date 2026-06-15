import { createServerSupabase } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import ProposalDetails from "./components/ProposalDetails";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function ProposalViewPage({
  params,
}: {
  params: Promise<{ projectid: string; proposalid: string }>;
}) {
  const { projectid, proposalid } = await params;
  const supabase = await createServerSupabase();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/sign-in?redirect=/proposal/${projectid}/${proposalid}`);
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
      ),
      proposer:profiles!proposals_proposer_id_fkey (
        id,
        display_name,
        avatar_url
      )
    `)
    .eq("id", proposalid)
    .single();

  if (proposalError || !proposal) {
    
    notFound();
  }

  // Check permission: must be proposer or project owner
  const isProposer = proposal.proposer_id === user.id;
  const isProjectOwner = proposal.project?.owner_id === user.id;

  if (!isProposer && !isProjectOwner) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view this proposal.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <ProposalDetails
        proposal={proposal}
        isProposer={isProposer}
        isProjectOwner={isProjectOwner}
      />
    </div>
  );
}