"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Brain,
} from "lucide-react";
import { ProjectData } from "./ProjectCreationWizard";
import { analyzeProjectWithAI } from "../actions";
import { toast } from "sonner";
import { EditableModuleList } from "./EditableModuleList";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";

interface AIAnalysisStepProps {
  data: ProjectData;
  onBack: () => void;
  onComplete: (data: Partial<ProjectData>) => void;
}

export function AIAnalysisStep({
  data,
  onBack,
  onComplete,
}: AIAnalysisStepProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [modules, setModules] = useState<any[]>([]);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [budgetAnalysis, setBudgetAnalysis] = useState<any>(null);

  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setIsLoading(true); // Ensure loading state is true when starting

      if (data.aiAnalysis && data.modules.length > 0) {
        setModules(data.modules);
        setAnalysisResult(data.aiAnalysis);
        setTotalCost(data.finalTotal || data.aiAnalysis.suggested_total);
        setBudgetAnalysis(data.aiAnalysis.budget_analysis);
        setIsLoading(false);
        return;
      }

      try {
        const result = await analyzeProjectWithAI(
          data.title,
          data.userStory,
          data.tags,
          data.requiredSkills,
          data.estimatedBudget,
          data.attachments,
          data.conversationContext
        );

        if (result.success && result.modules) {
          setAnalysisResult(result);
          const initialModules = result.modules.map((m) => ({
            ...m,
            owner_final_cost: m.estimated_cost,
          }));
          setModules(initialModules);
          setTotalCost(result.suggested_total || 0);
          setBudgetAnalysis((result as any).budget_analysis);
        } else {
          toast.error(result.error || "Failed to analyze project");
        }
      } catch (error) {
        toast.error("An error occurred during analysis");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [data.title, data.userStory, data.estimatedBudget, retryTrigger]);

  const handleModulesChange = (newModules: any[]) => {
    setModules(newModules);
  };

  const handleTotalCostChange = (newTotal: number) => {
    setTotalCost(newTotal);
  };

  const handleContinue = () => {
    onComplete({
      aiAnalysis: { ...analysisResult, budget_analysis: budgetAnalysis },
      modules: modules,
      finalTotal: totalCost,
      adjustmentLimits: analysisResult?.adjustment_limits,
    });
  };

  const handleRetry = () => {
    setRetryTrigger(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-600/20 blur-3xl rounded-full animate-pulse" />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Brain className="h-12 w-12 text-white animate-pulse" />
            </div>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-2"
        >
          <h3 className="text-2xl font-semibold">Analyzing your project...</h3>
          <p className="text-muted-foreground max-w-md">
            Our AI is breaking down your requirements into modules with
            realistic cost estimates based on freelancer market rates.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>This usually takes 5-10 seconds</span>
        </motion.div>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold">Analysis Failed</h3>
        <p className="text-muted-foreground text-center max-w-md">
          We couldn&apos;t analyze your project. This might be due to a
          temporary issue. Please try again.
        </p>
        <div className="flex gap-4 mt-4">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button onClick={handleRetry} variant="default">
            <Sparkles className="mr-2 h-4 w-4" />
            Retry Analysis
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <h2 className="text-2xl font-bold tracking-tight">
              AI Analysis Results
            </h2>
          </div>
          <p className="text-muted-foreground">
            Review and customize the suggested modules. Click any module to edit
            its details.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 rounded-2xl px-5 py-3 border border-emerald-500/20">
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Budget
            </p>
            <p className="text-3xl font-bold text-emerald-600">
              $
              <NumberFlow
                value={totalCost}
                format={{ maximumFractionDigits: 0 }}
              />
            </p>
          </div>
        </div>
      </div>

      {/* Module List with integrated cost summary */}
      <EditableModuleList
        modules={modules}
        onModulesChange={handleModulesChange}
        onTotalCostChange={handleTotalCostChange}
        budgetAnalysis={budgetAnalysis}
      />

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Input
        </Button>
        <Button
          onClick={handleContinue}
          className="bg-emerald-600 text-white hover:bg-emerald-700 gap-2"
          size="lg"
        >
          Continue to GitHub
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
