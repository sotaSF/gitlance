"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProposalExpandableCard } from "./ProposalExpandableCard";
import { ProposalWithProposer } from "@/types/proposals";

interface ProposalsListProps {
  projectId: string;
  proposals?: ProposalWithProposer[];
}

export function ProposalsList({
  projectId,
  proposals = [],
}: ProposalsListProps) {
  if (proposals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No proposals received yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Received Proposals ({proposals.length})
          <span className="ml-3 text-sm font-normal text-muted-foreground">
            Tap any card to inspect full details
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <ProposalExpandableCard
              key={proposal.id}
              projectId={projectId}
              proposal={proposal}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
