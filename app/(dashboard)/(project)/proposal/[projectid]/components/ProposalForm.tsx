"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitProposal } from "../actions";
import ModuleSelector from "./ModuleSelector";

interface ProposalFormProps {
  projectId: string;
  modules: any[];
  projectTitle: string;
  hasGitHubConnected: boolean;
  hasStripeConnected: boolean;
}

export default function ProposalForm({
  projectId,
  modules,
  projectTitle,
  hasGitHubConnected,
  hasStripeConnected,
}: ProposalFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [proposedBudget, setProposedBudget] = useState("");
  const [proposedTimeline, setProposedTimeline] = useState("");
  const [selectedModules, setSelectedModules] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (coverLetter.length < 100) {
        toast.error("Cover letter must be at least 100 characters");
        setIsSubmitting(false);
        return;
      }

      if (coverLetter.length > 2000) {
        toast.error("Cover letter must not exceed 2000 characters");
        setIsSubmitting(false);
        return;
      }

      if (selectedModules.length === 0) {
        toast.error("Please select at least one module");
        setIsSubmitting(false);
        return;
      }

      const budget = parseFloat(proposedBudget);
      const timeline = parseInt(proposedTimeline);

      if (isNaN(budget) || budget <= 0) {
        toast.error("Please enter a valid budget");
        setIsSubmitting(false);
        return;
      }

      if (isNaN(timeline) || timeline <= 0) {
        toast.error("Please enter a valid timeline");
        setIsSubmitting(false);
        return;
      }

      const result = await submitProposal({
        projectId,
        coverLetter,
        proposedBudget: budget,
        proposedTimelineDays: timeline,
        selectedModules,
      });

      if (result.success) {
        toast.success(result.message || "Proposal submitted successfully!");
        router.push(`/proposal/${projectId}/${result.proposalId}`);
      } else {
        toast.error(result.error || "Failed to submit proposal");
      }
    } catch (error) {
      console.error("Error submitting proposal:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Proposal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!hasGitHubConnected && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
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
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
              <p className="font-medium">Payment Account Required</p>
              <p className="text-sm mt-1">
                You must connect a Stripe account in your settings before you can submit a proposal.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3 border-amber-500/30 hover:bg-amber-500/20">
                <a href="/settings" target="_blank">Connect Stripe</a>
              </Button>
            </div>
          )}

          {/* Cover Letter */}
          <div className="space-y-2">
            <Label htmlFor="coverLetter">
              Cover Letter <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="coverLetter"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Introduce yourself and explain why you're the best fit for this project..."
              className="min-h-[200px]"
              required
            />
            <p className="text-sm text-muted-foreground">
              {coverLetter.length} / 2000 characters (minimum 100)
            </p>
          </div>

          {/* Module Selection */}
          <div className="space-y-2">
            <Label>
              Select Modules <span className="text-red-500">*</span>
            </Label>
            <ModuleSelector
              modules={modules}
              selectedModules={selectedModules}
              onSelectionChange={setSelectedModules}
            />
          </div>

          {/* Proposed Budget */}
          <div className="space-y-2">
            <Label htmlFor="proposedBudget">
              Proposed Budget (USD) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="proposedBudget"
              type="number"
              step="0.01"
              min="1"
              value={proposedBudget}
              onChange={(e) => setProposedBudget(e.target.value)}
              placeholder="5000"
              required
            />
            <p className="text-sm text-muted-foreground">
              Enter your proposed budget for the selected modules
            </p>
          </div>

          {/* Proposed Timeline */}
          <div className="space-y-2">
            <Label htmlFor="proposedTimeline">
              Proposed Timeline (Days) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="proposedTimeline"
              type="number"
              min="1"
              value={proposedTimeline}
              onChange={(e) => setProposedTimeline(e.target.value)}
              placeholder="30"
              required
            />
            <p className="text-sm text-muted-foreground">
              How many days will you need to complete the work?
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !hasGitHubConnected || !hasStripeConnected}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Proposal"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
