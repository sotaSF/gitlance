"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  DollarSign,
  Clock,
  FileText,
  Trash2,
  Edit,
} from "lucide-react";
import ProposalStatusBadge from "./ProposalStatusBadge";
import { withdrawProposal } from "../../actions";
import { toast } from "sonner";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProposalDetailsProps {
  proposal: any;
  isProposer: boolean;
  isProjectOwner: boolean;
}

export default function ProposalDetails({
  proposal,
  isProposer,
  isProjectOwner,
}: ProposalDetailsProps) {
  const router = useRouter();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  });

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) {
      return "—";
    }
    return dateFormatter.format(new Date(value));
  };

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    try {
      const result = await withdrawProposal(proposal.id);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const canUpdate =
    isProposer && ["submitted", "updated"].includes(proposal.status);
  const canWithdraw =
    isProposer &&
    !["withdrawn", "accepted", "rejected", "cancelled"].includes(
      proposal.status
    );

  const modulesSnapshot = proposal.modules_snapshot || [];
  const totalModuleCost = modulesSnapshot.reduce(
    (sum: number, m: any) =>
      sum + (m.owner_final_cost || m.ai_estimated_cost || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Proposal Details
          </h1>
          <p className="text-muted-foreground mt-2">
            For project:{" "}
            <Link
              href={`/project/${proposal.project?.id}`}
              className="font-semibold hover:underline"
            >
              {proposal.project?.title}
            </Link>
          </p>
        </div>
        <ProposalStatusBadge status={proposal.status} />
      </div>

      {/* Action Buttons */}
      {(canUpdate || canWithdraw) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              {canUpdate && (
                <Button variant="outline" asChild>
                  <Link
                    href={`/proposal/${proposal.project_id}/edit/${proposal.id}`}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Update Proposal
                  </Link>
                </Button>
              )}
              {canWithdraw && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isWithdrawing}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Withdraw Proposal
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Withdraw Proposal?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. Your proposal will be
                        marked as withdrawn and you won't be able to update it
                        anymore.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleWithdraw}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Withdraw
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proposer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Proposer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold">
              {proposal.proposer?.display_name
                ? proposal.proposer.display_name.substring(0, 2).toUpperCase()
                : "UN"}
            </div>
            <div>
              <p className="font-semibold">
                {proposal.proposer?.display_name || "Unknown"}
              </p>
              <p className="text-sm text-muted-foreground">Freelancer</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cover Letter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Cover Letter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
            {proposal.cover_letter}
          </p>
        </CardContent>
      </Card>

      {/* Proposal Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Proposed Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">
              ${proposal.proposed_budget?.toLocaleString()}{" "}
              {proposal.currency || "USD"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Proposed Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {proposal.proposed_timeline_days} Days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Selected Modules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selected Modules</CardTitle>
          <CardDescription>
            {modulesSnapshot.length} module
            {modulesSnapshot.length !== 1 ? "s" : ""} selected
          </CardDescription>
        </CardHeader>
        <CardContent>
          {modulesSnapshot.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No modules selected
            </p>
          ) : (
            <div className="space-y-4">
              {modulesSnapshot.map((module: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{module.name}</h4>
                    <span className="text-emerald-600 font-semibold">
                      $
                      {(
                        module.owner_final_cost ||
                        module.ai_estimated_cost ||
                        0
                      ).toLocaleString()}
                    </span>
                  </div>
                  {module.description && (
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    {module.is_mandatory && (
                      <Badge variant="default" className="text-xs">
                        Mandatory
                      </Badge>
                    )}
                    {module.complexity && (
                      <Badge variant="outline" className="text-xs">
                        Complexity: {module.complexity}/5
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between items-center pt-2">
                <span className="font-semibold">Total Module Cost:</span>
                <span className="text-2xl font-bold text-emerald-600">
                  ${totalModuleCost.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Submitted:</span>
            <span className="font-medium">
              {formatDateTime(proposal.created_at)}
            </span>
          </div>
          {proposal.updated_at !== proposal.created_at && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="font-medium">
                {formatDateTime(proposal.updated_at)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/project/${proposal.project?.id}`}>View Project</Link>
        </Button>
      </div>
    </div>
  );
}
