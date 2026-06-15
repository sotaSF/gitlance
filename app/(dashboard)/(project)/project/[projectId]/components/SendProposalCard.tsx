"use client";

import { useState, useTransition } from "react";
import {
  ExpandableScreen,
  ExpandableScreenTrigger,
  ExpandableScreenContent,
} from "@/components/ui/expandable-screen";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitProposal } from "../../../proposal/[projectid]/actions";
import ModuleSelector from "../../../proposal/[projectid]/components/ModuleSelector";
import { ProjectModule } from "@/types/projects";
import { useRouter } from "next/navigation";

interface SendProposalCardProps {
  projectId: string;
  projectTitle: string;
  modules: ProjectModule[];
  autoExpand?: boolean;
  hasGitHubConnected: boolean;
  hasStripeConnected: boolean;
}

export function SendProposalCard({
  projectId,
  projectTitle,
  modules,
  autoExpand = false,
  hasGitHubConnected,
  hasStripeConnected,
}: SendProposalCardProps) {
  const router = useRouter();
  const [isSubmitting, startTransition] = useTransition();
  const [coverLetter, setCoverLetter] = useState("");
  const [proposedBudget, setProposedBudget] = useState("");
  const [proposedTimeline, setProposedTimeline] = useState("");
  const [selectedModules, setSelectedModules] = useState<ProjectModule[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (coverLetter.length < 100) {
      toast.error("Cover letter must be at least 100 characters");
      return;
    }

    if (coverLetter.length > 2000) {
      toast.error("Cover letter must not exceed 2000 characters");
      return;
    }

    if (selectedModules.length === 0) {
      toast.error("Please select at least one module");
      return;
    }

    const budget = parseFloat(proposedBudget);
    const timeline = parseInt(proposedTimeline);

    if (isNaN(budget) || budget <= 0) {
      toast.error("Please enter a valid budget");
      return;
    }

    if (isNaN(timeline) || timeline <= 0) {
      toast.error("Please enter a valid timeline");
      return;
    }

    startTransition(async () => {
      const result = await submitProposal({
        projectId,
        coverLetter,
        proposedBudget: budget,
        proposedTimelineDays: timeline,
        selectedModules,
      });

      if (result.success) {
        toast.success(result.message || "Proposal submitted successfully!");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to submit proposal");
      }
    });
  };

  return (
    <ExpandableScreen
      layoutId={`send-proposal-${projectId}`}
      triggerRadius="20px"
      contentRadius="32px"
      defaultExpanded={autoExpand}
    >
      <ExpandableScreenTrigger className="w-full">
        <div className="group flex items-center justify-between rounded-2xl border-2 border-dashed border-border/60 bg-card/40 px-6 py-8 transition-all hover:border-primary/60 hover:bg-card/80">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-semibold text-foreground">
              Submit Your Proposal
            </h3>
            <p className="text-sm text-muted-foreground">
              Share your expertise and win this project
            </p>
          </div>
          <Button
            size="lg"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Send className="h-5 w-5 mr-2" />
            Send Proposal
          </Button>
        </div>
      </ExpandableScreenTrigger>

      <ExpandableScreenContent className="bg-background text-foreground border border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-[32px] bg-card p-6 sm:p-10">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Submit Proposal
            </h2>
            <p className="text-muted-foreground mt-1">
              For: <span className="font-semibold">{projectTitle}</span>
            </p>
          </div>

          {!hasGitHubConnected && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400 mb-4">
              <p className="font-medium">GitHub Connection Required</p>
              <p className="text-sm mt-1">
                You must link your GitHub account before submitting a proposal. This allows project owners to invite you as a collaborator.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3 border-amber-500/30 hover:bg-amber-500/20">
                <a href="/settings" target="_blank">Link GitHub Account</a>
              </Button>
            </div>
          )}

          {!hasStripeConnected && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400 mb-4">
              <p className="font-medium">Payment Account Required</p>
              <p className="text-sm mt-1">
                You must connect a Stripe account in your settings before submitting a proposal. This is required to receive payouts for completed modules.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3 border-amber-500/30 hover:bg-amber-500/20">
                <a href="/settings" target="_blank">Connect Stripe</a>
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cover Letter */}
            <div className="rounded-2xl border border-border/60 p-5">
              <Label htmlFor="coverLetter" className="text-base font-semibold">
                Cover Letter <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-muted-foreground mt-1 mb-3">
                Introduce yourself and explain why you&apos;re the best fit
              </p>
              <Textarea
                id="coverLetter"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="I'm excited to work on this project because..."
                className="min-h-[200px] resize-none"
                required
              />
              <p className="text-sm text-muted-foreground mt-2">
                {coverLetter.length} / 2000 characters (minimum 100)
              </p>
            </div>

            {/* Module Selection */}
            <div className="rounded-2xl border border-border/60 p-5">
              <Label className="text-base font-semibold">
                Select Modules <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Choose which modules you&apos;ll deliver
              </p>
              <ModuleSelector
                modules={modules}
                selectedModules={selectedModules}
                onSelectionChange={setSelectedModules}
              />
            </div>

            {/* Budget and Timeline */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 p-5">
                <Label htmlFor="proposedBudget" className="text-base font-semibold">
                  Proposed Budget (USD) <span className="text-red-500">*</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  Your quote for selected modules
                </p>
                <Input
                  id="proposedBudget"
                  type="number"
                  step="0.01"
                  min="1"
                  value={proposedBudget}
                  onChange={(e) => setProposedBudget(e.target.value)}
                  placeholder="5000"
                  className="text-lg"
                  required
                />
              </div>

              <div className="rounded-2xl border border-border/60 p-5">
                <Label htmlFor="proposedTimeline" className="text-base font-semibold">
                  Timeline (Days) <span className="text-red-500">*</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  Estimated delivery time
                </p>
                <Input
                  id="proposedTimeline"
                  type="number"
                  min="1"
                  value={proposedTimeline}
                  onChange={(e) => setProposedTimeline(e.target.value)}
                  placeholder="30"
                  className="text-lg"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || !hasGitHubConnected || !hasStripeConnected}
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 h-12 text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Submit Proposal
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </ExpandableScreenContent>
    </ExpandableScreen>
  );
}
