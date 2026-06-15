"use client";

import { motion } from "motion/react";
import { Rocket, Sparkles } from "lucide-react";

interface WelcomeStepProps {
  userName?: string;
}

export function WelcomeStep({ userName }: WelcomeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center space-y-6 py-12 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="relative"
      >
        <div className="absolute -inset-4 rounded-full bg-primary/20 blur-2xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/50">
          <Rocket className="h-12 w-12 text-primary-foreground" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl text-[var(--color-brand)]">
          Welcome to GitLance{userName ? `, ${userName}` : ""}!
        </h1>
        <p className="mx-auto max-w-md text-lg text-muted-foreground">
          Let's set up your profile so you can start connecting with amazing
          developers and clients.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3"
      >
        <Sparkles className="h-5 w-5 text-brand color-brand" />
        <p className="text-sm text-muted-foreground">
          This will only take a few minutes
        </p>
      </motion.div>
    </motion.div>
  );
}
