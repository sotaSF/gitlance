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
import { updateProposal } from "../../../actions";
import ModuleSelector from "../../../components/ModuleSelector";

interface ProposalEditFormProps {
  projectId: string;
  proposalId: string;
  proposal: any;
  modules: any[];
  projectTitle: string;
}

export default function ProposalEditForm({
  projectId,
  proposalId,
  proposal,
  modules,
  projectTitle,
}: ProposalEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize with existing proposal data
  const [coverLetter, setCoverLetter] = useState(proposal.cover_letter || "");
  const [proposedBudget, setProposedBudget] = useState(
    proposal.proposed_budget?.toString() || ""
  );
  const [proposedTimeline, setProposedTimeline] = useState(
    proposal.proposed_timeline_days?.toString() || ""
  );
  
  // Pre-select modules from snapshot
  const [selectedModules, setSelectedModules] = useState<any[]>(
    proposal.modules_snapshot || []
  );

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

      const result = await updateProposal(proposalId, {
        coverLetter,
        proposedBudget: budget,
        proposedTimelineDays: timeline,
        selectedModules,
      });

      if (result.success) {
        toast.success(result.message || "Proposal updated successfully!");
        router.push(`/proposal/${projectId}/${proposalId}`);
      } else {
        
          toast.error(result.error || "Failed to update proposal");
      }
    } catch (error) {
      console.error("Error updating proposal:", error);
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
              onClick={() => router.push(`/proposal/${projectId}/${proposalId}`)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Proposal"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
