"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  ExpandableScreen,
  ExpandableScreenTrigger,
  ExpandableScreenContent,
} from "@/components/ui/expandable-screen";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  acceptProposal,
  rejectProposal,
  withdrawProposal,
} from "../../../proposal/[projectid]/actions";
import { ModuleSnapshot, ProposalWithProposer } from "@/types/proposals";

interface ProposalExpandableCardProps {
  projectId: string;
  proposal: ProposalWithProposer;
  isProposerView?: boolean;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const statusVariants: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800 border-blue-200",
  updated: "bg-amber-100 text-amber-800 border-amber-200",
  withdrawn: "bg-gray-100 text-gray-800 border-gray-200",
  accepted: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-700 border-gray-200",
};

const complexityColors: Record<number, string> = {
  1: "bg-green-100 text-green-800 border-green-200",
  2: "bg-blue-100 text-blue-800 border-blue-200",
  3: "bg-yellow-100 text-yellow-800 border-yellow-200",
  4: "bg-orange-100 text-orange-800 border-orange-200",
  5: "bg-red-100 text-red-800 border-red-200",
};

interface ProfileBlockProps {
  variant: "trigger" | "expanded";
  profileHref?: string;
  avatarUrl?: string | null;
  displayName?: string | null;
  headline?: string | null;
  updatedAt?: string;
  avatarFallbackLabel: string;
}

function ProfileBlock({
  variant,
  profileHref,
  avatarUrl,
  displayName,
  headline,
  updatedAt,
  avatarFallbackLabel,
}: ProfileBlockProps) {
  const avatarClasses = variant === "expanded" ? "h-14 w-14" : "";
  const content = (
    <>
      <Avatar className={avatarClasses}>
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback>{avatarFallbackLabel}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <p
          className={cn(
            "font-semibold leading-tight",
            variant === "expanded" && "text-lg"
          )}
        >
          {displayName || "Unknown freelancer"}
        </p>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {headline || "No headline provided"}
        </p>
        {variant === "expanded" && updatedAt && (
          <p className="text-xs text-muted-foreground">
            Last updated {dateFormatter.format(new Date(updatedAt))}
          </p>
        )}
      </div>
    </>
  );

  if (!profileHref) {
    return <div className="flex items-center gap-4">{content}</div>;
  }

  return (
    <Link
      href={profileHref}
      onClick={(event) => event.stopPropagation()}
      className="flex items-center gap-4"
    >
      {content}
    </Link>
  );
}

export function ProposalExpandableCard({
  projectId,
  proposal,
  isProposerView = false,
}: ProposalExpandableCardProps) {
  const [isMutating, startTransition] = useTransition();
  const modules: ModuleSnapshot[] = Array.isArray(proposal.modules_snapshot)
    ? proposal.modules_snapshot
    : [];
  const totalModuleCost = modules.reduce((sum, module) => {
    const price = module.owner_final_cost ?? module.ai_estimated_cost ?? 0;
    return sum + price;
  }, 0);

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: proposal.currency || "USD",
    maximumFractionDigits: 0,
  });

  const avatarLabel = proposal.proposer?.display_name
    ? proposal.proposer.display_name.substring(0, 2).toUpperCase()
    : "UN";
  const profileHref = proposal.proposer?.username
    ? `/profile/${proposal.proposer.username}`
    : proposal.proposer?.id
    ? `/profile/${proposal.proposer.id}`
    : undefined;
  const shouldShowOwnerActions =
    !isProposerView && ["submitted", "updated"].includes(proposal.status);

  const shouldShowProposerActions =
    isProposerView && !["withdrawn", "cancelled"].includes(proposal.status);

  const handleDecision = (nextStatus: "accepted" | "rejected") => {
    startTransition(async () => {
      const action =
        nextStatus === "accepted" ? acceptProposal : rejectProposal;
      const result = await action(proposal.id);
      if (result.success) {
        toast.success(result.message || `Proposal ${nextStatus}`);
      } else {
        toast.error(result.error || "Failed to update proposal status");
      }
    });
  };

  const handleWithdraw = () => {
    startTransition(async () => {
      const result = await withdrawProposal(proposal.id);
      if (result.success) {
        toast.success(result.message || "Proposal withdrawn");
      } else {
        toast.error(result.error || "Failed to withdraw proposal");
      }
    });
  };

  return (
    <ExpandableScreen
      layoutId={`proposal-${proposal.id}`}
      triggerRadius="20px"
      contentRadius="32px"
    >
      <ExpandableScreenTrigger className="w-full">
        <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 px-4 py-3 transition hover:border-primary/60 hover:bg-card">
          <ProfileBlock
            variant="trigger"
            profileHref={profileHref}
            avatarUrl={proposal.proposer?.avatar_url}
            displayName={proposal.proposer?.display_name}
            headline={proposal.proposer?.headline}
            updatedAt={proposal.updated_at}
            avatarFallbackLabel={avatarLabel}
          />
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Budget</p>
              <p className="font-semibold">
                {proposal.proposed_budget
                  ? currencyFormatter.format(proposal.proposed_budget)
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Timeline</p>
              <p className="font-semibold">
                {proposal.proposed_timeline_days
                  ? `${proposal.proposed_timeline_days} days`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Submitted</p>
              <p className="font-semibold">
                {dateFormatter.format(new Date(proposal.created_at))}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "ml-auto",
                statusVariants[proposal.status] ||
                  "bg-slate-100 text-slate-800 border-slate-200"
              )}
            >
              {proposal.status}
            </Badge>
          </div>
        </div>
      </ExpandableScreenTrigger>

      <ExpandableScreenContent className="bg-background text-foreground border border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-[32px] bg-card p-6 sm:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <ProfileBlock
              variant="expanded"
              profileHref={profileHref}
              avatarUrl={proposal.proposer?.avatar_url}
              displayName={proposal.proposer?.display_name}
              headline={proposal.proposer?.headline}
              updatedAt={proposal.updated_at}
              avatarFallbackLabel={avatarLabel}
            />
            {!isProposerView && (
              <Button asChild variant="secondary">
                <Link href={`/proposal/${projectId}/${proposal.id}`}>
                  View full proposal
                </Link>
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 p-4">
              <p className="text-sm text-muted-foreground">Budget</p>
              <p className="text-2xl font-semibold">
                {proposal.proposed_budget
                  ? currencyFormatter.format(proposal.proposed_budget)
                  : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 p-4">
              <p className="text-sm text-muted-foreground">Timeline</p>
              <p className="text-2xl font-semibold">
                {proposal.proposed_timeline_days
                  ? `${proposal.proposed_timeline_days} days`
                  : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 p-4">
              <p className="text-sm text-muted-foreground">Modules selected</p>
              <p className="text-2xl font-semibold">{modules.length}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 p-5">
            <p className="text-sm font-semibold text-muted-foreground">
              Proposal details
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Proposal ID
                </p>
                <p className="font-mono text-sm">{proposal.id}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Project ID
                </p>
                <p className="font-mono text-sm">{proposal.project_id}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Proposer ID
                </p>
                <p className="font-mono text-sm">{proposal.proposer_id}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Status
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    "mt-1 w-fit",
                    statusVariants[proposal.status] ||
                      "bg-slate-100 text-slate-800 border-slate-200"
                  )}
                >
                  {proposal.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Submitted on
                </p>
                <p className="text-sm font-medium">
                  {dateFormatter.format(new Date(proposal.created_at))}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Currency
                </p>
                <p className="text-sm font-medium">
                  {proposal.currency || "USD"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 p-5">
            <p className="text-sm font-semibold text-muted-foreground">
              Cover letter
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {proposal.cover_letter || "No cover letter provided."}
            </p>
          </div>

          {modules.length > 0 && (
            <div className="rounded-2xl border border-border/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-muted-foreground">
                  Selected modules
                </p>
                <p className="text-sm font-semibold text-emerald-600">
                  {currencyFormatter.format(totalModuleCost)} total
                </p>
              </div>
              <Separator className="my-4" />
              <div className="space-y-3">
                {modules.map((module, index) => {
                  const price =
                    module.owner_final_cost ?? module.ai_estimated_cost ?? 0;
                  return (
                    <div
                      key={module.id || index}
                      className="rounded-xl border border-border/40 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">
                            {module.name || "Unnamed module"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {module.description || "No description provided"}
                          </p>
                        </div>
                        <p className="text-base font-semibold text-emerald-600">
                          {currencyFormatter.format(price)}
                        </p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {module.is_mandatory && (
                          <Badge variant="outline">Mandatory</Badge>
                        )}
                        {module.complexity && (
                          <Badge
                            variant="outline"
                            className={cn(
                              complexityColors[module.complexity] ||
                                "bg-slate-100 text-slate-800 border-slate-200"
                            )}
                          >
                            Complexity: {module.complexity}/5
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!!proposal.attachments?.length && (
            <div className="rounded-2xl border border-border/60 p-5">
              <p className="text-sm font-semibold text-muted-foreground">
                Attachments
              </p>
              <div className="mt-3 space-y-2 text-sm">
                {proposal.attachments.map((attachment, index) => (
                  <div
                    key={`${attachment.name}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2"
                  >
                    <span>{attachment.name || `Attachment ${index + 1}`}</span>
                    {attachment.url && (
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {shouldShowOwnerActions && (
            <div className="rounded-2xl border border-border/60 p-5">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-muted-foreground">
                  Owner actions
                </p>
                <p className="text-sm text-muted-foreground">
                  Accepting marks this proposal as the winning submission;
                  rejecting frees you to consider others.
                </p>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={isMutating}
                  onClick={() => handleDecision("accepted")}
                >
                  {isMutating ? "Processing..." : "Accept Proposal"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  disabled={isMutating}
                  onClick={() => handleDecision("rejected")}
                >
                  Reject Proposal
                </Button>
              </div>
            </div>
          )}

          {shouldShowProposerActions && (
            <div className="rounded-2xl border border-border/60 p-5">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-muted-foreground">
                  Your actions
                </p>
                <p className="text-sm text-muted-foreground">
                  {["submitted", "updated"].includes(proposal.status)
                    ? "You can edit your proposal or withdraw it if you're no longer interested."
                    : proposal.status === "accepted"
                    ? "Congratulations! Your proposal has been accepted."
                    : proposal.status === "rejected"
                    ? "This proposal was not accepted."
                    : "This proposal is no longer active."}
                </p>
              </div>
              {["submitted", "updated"].includes(proposal.status) && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    disabled={isMutating}
                  >
                    <Link href={`/proposal/${projectId}/edit/${proposal.id}`}>
                      Edit Proposal
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    disabled={isMutating}
                    onClick={handleWithdraw}
                  >
                    {isMutating ? "Withdrawing..." : "Withdraw Proposal"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </ExpandableScreenContent>
    </ExpandableScreen>
  );
}
