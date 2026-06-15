"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
  isLoading?: boolean;
  isNextDisabled?: boolean;
  nextLabel?: string;
  showSkip?: boolean;
}

export function OnboardingNavigation({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onSkip,
  isLoading = false,
  isNextDisabled = false,
  nextLabel,
  showSkip = false,
}: OnboardingNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  const getNextLabel = () => {
    if (nextLabel) return nextLabel;
    if (isLastStep) return "Complete";
    return "Next";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex items-center justify-between border-t pt-6"
    >
      <div className="flex items-center gap-4">
        {!isFirstStep && (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}

        {showSkip && onSkip && (
          <Button
            variant="ghost"
            onClick={onSkip}
            disabled={isLoading}
            className="text-brand"
          >
            Skip
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Progress Indicator */}
        <div className="hidden items-center gap-2 sm:flex">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 rounded-full transition-all",
                i + 1 === currentStep
                  ? "w-8 bg-[var(--color-brand)]"
                  : i + 1 < currentStep
                  ? "w-2 bg-[var(--color-brand-secondary)]"
                  : "w-2 bg-brand"
              )}
            />
          ))}
        </div>

        <Button
          onClick={onNext}
          disabled={isNextDisabled || isLoading}
          className={cn(
            "gap-2 transition-all",
            isLastStep && "bg-brand text-white hover:bg-brand-brand/90"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {getNextLabel()}
              {!isLastStep && <ArrowRight className="h-4 w-4" />}
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
