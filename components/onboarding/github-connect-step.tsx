"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Github, CheckCircle2, AlertCircle } from "lucide-react";
import { authorizeGitHub } from "@/app/settings/actions";
import { toast } from "sonner";

interface GitHubConnectStepProps {
  isConnected: boolean;
  githubUsername?: string;
  onSkip?: () => void;
}

export function GitHubConnectStep({
  isConnected,
  githubUsername,
  onSkip,
}: GitHubConnectStepProps) {
  const [isLinking, setIsLinking] = useState(false);

  const handleConnectGitHub = async () => {
    setIsLinking(true);
    try {
      // Use authorizeGitHub which handles both new linking and re-authorization with scopes
      const redirectUrl = `${window.location.origin}/onboarding`;

      const result = await authorizeGitHub("repo user:email", redirectUrl);

      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.error || "Failed to connect GitHub");
        setIsLinking(false);
      }
    } catch (error) {
      console.error("Error connecting GitHub:", error);
      toast.error("Something went wrong. Please try again.");
      setIsLinking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 py-8"
    >
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-[var(--color-brand)]">
          Connect Your GitHub
        </h2>
        <p className="text-[var(--color-brand-secondary)]">
          Link your GitHub account to submit proposals and collaborate on projects
        </p>
      </div>

      <div className="mx-auto max-w-md space-y-6">
        {isConnected ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl border-2 border-green-500/20 bg-green-500/5 p-6 text-center"
          >
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-600 dark:text-green-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">GitHub Connected!</h3>
            {githubUsername && (
              <p className="text-muted-foreground">
                Connected as <span className="font-mono font-medium">@{githubUsername}</span>
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border-2 border-border bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-[var(--color-brand)]/10 p-3">
                  <Github className="h-6 w-6 text-[var(--color-brand)]" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold">Why connect GitHub?</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-[var(--color-brand)]">✓</span>
                      <span>Required to submit proposals</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-[var(--color-brand)]">✓</span>
                      <span>Get invited as a collaborator on projects</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-[var(--color-brand)]">✓</span>
                      <span>Showcase your GitHub activity on your profile</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={handleConnectGitHub}
              disabled={isLinking}
              className="w-full h-12 text-base bg-[#24292e] hover:bg-[#1b1f23] text-white dark:bg-[#f6f8fa] dark:hover:bg-[#e1e4e8] dark:text-[#24292e]"
            >
              {isLinking ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Connecting...
                </>
              ) : (
                <>
                  <Github className="mr-2 h-5 w-5" />
                  Connect with GitHub
                </>
              )}
            </Button>

            {onSkip && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-amber-600 dark:text-amber-400">
                      You can skip this step
                    </p>
                    <p className="text-amber-600/80 dark:text-amber-400/80 mt-1">
                      However, you'll need to connect GitHub later from settings before you can submit proposals.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
