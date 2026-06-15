"use client";

import { motion } from "motion/react";
import { FolderPlus, ArrowRight, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface ClientProjectStepProps {
  onSkip: () => void;
  onComplete: () => Promise<void>;
}

export function ClientProjectStep({ onSkip, onComplete }: ClientProjectStepProps) {
  const router = useRouter();

  const handleCreateProject = async () => {
    // Mark onboarding as complete before navigating away
    await onComplete();
    router.push("/project/new-project");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center space-y-8 py-12 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="relative"
      >
        <div className="absolute -inset-4 rounded-full bg-purple-500/20 blur-2xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
          <FolderPlus className="h-12 w-12 text-white" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <h2 className="text-3xl font-bold tracking-tight text-[var(--color-brand)]">
          Ready to post your first project?
        </h2>
        <p className="mx-auto max-w-md text-lg text-[var(--color-brand-secondary)]">
          You can create a project now or skip this step and do it later from
          your dashboard.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col items-center space-y-4"
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleCreateProject}
          className="group inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-purple-500/30 transition-shadow hover:shadow-purple-500/50"
        >
          <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
          Create a Project
        </motion.button>

        <button
          onClick={onSkip}
          className="group inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          Skip for now
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </motion.div>
    </motion.div>
  );
}
