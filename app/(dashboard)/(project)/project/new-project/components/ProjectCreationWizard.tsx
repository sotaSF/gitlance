"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { createProjectDraft, ConversationMessage } from "../actions";
import { useRouter } from "next/navigation";
import { ProjectInputStep } from "./ProjectInputStep";
import { AIConversationStep } from "./AIConversationStep";
import { AIAnalysisStep } from "./AIAnalysisStep";
import { GitHubConnectStep } from "./GitHubConnectStep";
import { ProjectReviewStep } from "./ProjectReviewStep";

export type ProjectData = {
  title: string;
  userStory: string;
  estimatedBudget: number | null;
  aiAnalysis: any | null;
  modules: any[];
  finalTotal: number;
  adjustmentLimits: any;
  shortDescription: string;
  tags: string[];
  deadline: Date | null;
  requiredSkills: string[];
  attachments: any[];
  githubRepoUrl?: string;
  conversationContext?: ConversationMessage[];
};

export function ProjectCreationWizard() {
  const [step, setStep] = useState<"input" | "conversation" | "analysis" | "github" | "review">("input");
  const [data, setData] = useState<ProjectData>({
    title: "",
    userStory: "",
    estimatedBudget: null,
    aiAnalysis: null,
    modules: [],
    finalTotal: 0,
    adjustmentLimits: null,
    shortDescription: "",
    tags: [],
    deadline: null,
    requiredSkills: [],
    attachments: [],
    githubRepoUrl: undefined,
    conversationContext: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Load state from session storage on mount
  useEffect(() => {
    console.log("ProjectCreationWizard mounted");
    const savedData = sessionStorage.getItem("project_wizard_data");
    const savedStep = sessionStorage.getItem("project_wizard_step");
    const shouldRestore = sessionStorage.getItem("project_wizard_restore");

    if (savedData && shouldRestore) {
      try {
        setData(JSON.parse(savedData));
        // If we were on github step and just came back, we might want to move to review or stay on github
        // For now, let's restore to the saved step, but if it was 'github', the user likely just connected.
        if (savedStep) {
          setStep(savedStep as any);
        }

        // Clear the restore flag so we don't keep restoring if the user navigates away and back
        sessionStorage.removeItem("project_wizard_restore");
      } catch (e) {
        console.error("Failed to parse saved wizard state", e);
      }
    }
  }, []);

  // Save state to session storage whenever it changes
  useEffect(() => {
    if (Object.keys(data).length > 0 && data.title) {
      sessionStorage.setItem("project_wizard_data", JSON.stringify(data));
      sessionStorage.setItem("project_wizard_step", step);
    }
  }, [data, step]);

  const handleInputSubmit = (inputData: Partial<ProjectData>) => {
    setData((prev) => ({ ...prev, ...inputData }));
    setStep("conversation"); // Go to Q&A conversation first
  };

  const handleConversationComplete = (conversationContext: ConversationMessage[]) => {
    setData((prev) => ({ ...prev, conversationContext }));
    setStep("analysis");
  };

  const handleAnalysisComplete = (analysisData: Partial<ProjectData>) => {
    setData((prev) => ({ ...prev, ...analysisData }));
    setStep("github");
  };

  const handleGitHubConnected = (repoUrl?: string) => {
    if (repoUrl) {
      setData((prev) => ({ ...prev, githubRepoUrl: repoUrl }));
    }
    setStep("review");
  };

  const handleSkipGitHub = () => {
    setData((prev) => ({ ...prev, githubRepoUrl: undefined }));
    setStep("review");
  }

  const handleSaveDraft = async () => {
    setIsLoading(true);
    try {
      const result = await createProjectDraft({
        title: data.title,
        user_story: data.userStory,
        owner_estimated_budget: data.estimatedBudget,
        ai_estimated_total: data.aiAnalysis.suggested_total,
        owner_final_total: data.finalTotal,
        ai_estimation_meta: data.aiAnalysis,
        owner_adjustment_limits: data.adjustmentLimits,
        modules: data.modules.map((m: any) => ({
          name: m.name,
          description: m.description,
          ai_estimated_cost: m.estimated_cost,
          owner_final_cost: m.owner_final_cost || m.estimated_cost,
          ai_confidence: m.confidence,
          complexity: m.complexity,
          is_mandatory: m.is_mandatory,
        })),
        status: 'draft',
        is_published: false,
        short_description: data.shortDescription,
        tags: data.tags,
        deadline: data.deadline,
        required_skills: data.requiredSkills,
        attachments: data.attachments,
        github_repo_url: data.githubRepoUrl,
      });

      if (result.success) {
        toast.success("Project saved as draft!");
        router.push(`/project/${result.project_id}`);
      } else {
        toast.error(result.error || "Failed to save draft");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    setIsLoading(true);
    try {
      const result = await createProjectDraft({
        title: data.title,
        user_story: data.userStory,
        owner_estimated_budget: data.estimatedBudget,
        ai_estimated_total: data.aiAnalysis.suggested_total,
        owner_final_total: data.finalTotal,
        ai_estimation_meta: data.aiAnalysis,
        owner_adjustment_limits: data.adjustmentLimits,
        modules: data.modules.map((m: any) => ({
          name: m.name,
          description: m.description,
          ai_estimated_cost: m.estimated_cost,
          owner_final_cost: m.owner_final_cost || m.estimated_cost,
          ai_confidence: m.confidence,
          complexity: m.complexity,
          is_mandatory: m.is_mandatory,
        })),
        status: 'open',
        is_published: true,
        short_description: data.shortDescription,
        tags: data.tags,
        deadline: data.deadline,
        required_skills: data.requiredSkills,
        attachments: data.attachments,
        github_repo_url: data.githubRepoUrl,
      });

      if (result.success) {
        toast.success("Project created and published successfully!");
        router.push(`/project/${result.project_id}`);
      } else {
        toast.error(result.error || "Failed to create project");
      }

    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Create New Project
        </h1>
        <p className="text-muted-foreground mt-2">
          Let AI help you structure and estimate your project.
        </p>
      </div>

      <div className="relative min-h-[600px] bg-card rounded-xl border shadow-sm p-6 overflow-hidden">
        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ProjectInputStep onSubmit={handleInputSubmit} initialData={data} />
            </motion.div>
          )}

          {step === "conversation" && (
            <motion.div
              key="conversation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AIConversationStep
                data={data}
                onBack={() => setStep("input")}
                onComplete={handleConversationComplete}
              />
            </motion.div>
          )}

          {step === "analysis" && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AIAnalysisStep
                data={data}
                onBack={() => setStep("conversation")}
                onComplete={handleAnalysisComplete}
              />
            </motion.div>
          )}

          {step === "github" && (
            <motion.div
              key="github"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GitHubConnectStep
                onBack={() => setStep("analysis")}
                onNext={handleGitHubConnected}
                onSkip={handleSkipGitHub}
                projectTitle={data.title}
                projectDescription={data.userStory}
              />
            </motion.div>
          )}

          {step === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ProjectReviewStep
                data={data}
                onBack={() => setStep("github")}
                onSaveDraft={handleSaveDraft}
                onCreateProject={handleCreateProject}
                isLoading={isLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
