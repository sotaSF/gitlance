"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { SendProposalCard } from "./SendProposalCard";
import { ProposalExpandableCard } from "./ProposalExpandableCard";
import { ProjectModule } from "@/types/projects";
import { ProposalWithProposer } from "@/types/proposals";

interface ProposalSectionProps {
  projectId: string;
  projectTitle: string;
  modules: ProjectModule[];
  userProposal: ProposalWithProposer | null;
  hasGitHubConnected: boolean;
  hasStripeConnected: boolean;
}

export function ProposalSection({
  projectId,
  projectTitle,
  modules,
  userProposal,
  hasGitHubConnected,
  hasStripeConnected,
}: ProposalSectionProps) {
  const searchParams = useSearchParams();
  const shouldAutoExpand = searchParams.get("sendProposal") === "true";

  useEffect(() => {
    // If user clicked "Send Proposal" but already has a proposal, show toast
    if (shouldAutoExpand && userProposal) {
      // toast show only if there is no other toast 

      toast.info("Your proposal was submitted", {
        description: "You can view your proposal below",
      });
    }
  }, [shouldAutoExpand, userProposal]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          {userProposal ? "Your Proposal" : "Submit a Proposal"}
        </h2>
      </div>

      {!userProposal ? (
        <SendProposalCard
          projectId={projectId}
          projectTitle={projectTitle}
          modules={modules}
          autoExpand={shouldAutoExpand}
          hasGitHubConnected={hasGitHubConnected}
          hasStripeConnected={hasStripeConnected}
        />
      ) : (
        <ProposalExpandableCard
          projectId={projectId}
          proposal={userProposal}
          isProposerView={true}
        />
      )}
    </div>
  );
}
