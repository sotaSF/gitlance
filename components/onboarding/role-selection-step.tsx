"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Code2, Briefcase, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleSelectionStepProps {
  onRoleChange: (role: "developer" | "client") => void;
  initialRole?: "developer" | "client";
}

export function RoleSelectionStep({
  onRoleChange,
  initialRole,
}: RoleSelectionStepProps) {
  const [selectedRole, setSelectedRole] = useState<
    "developer" | "client" | null
  >(initialRole || null);

  const handleRoleSelect = (role: "developer" | "client") => {
    setSelectedRole(role);
    onRoleChange(role);
  };

  const roles = [
    {
      id: "developer" as const,
      icon: Code2,
      title: "Developer",
      description: "I want to work on projects and showcase my skills",
      features: [
        "Build your portfolio",
        "Connect with clients",
        "Showcase your skills",
        "Get hired for projects",
      ],
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      id: "client" as const,
      icon: Briefcase,
      title: "Client",
      description: "I'm looking to hire talented developers",
      features: [
        "Post projects",
        "Find skilled developers",
        "Manage collaborations",
        "Build your team",
      ],
      gradient: "from-purple-500 to-pink-500",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 py-8"
    >
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-[var(--color-brand)]">
          Choose your role
        </h2>
        <p className="text-[var(--color-brand-secondary)]">
          How would you like to use GitLance?
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {roles.map((role, index) => (
          <motion.button
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleRoleSelect(role.id)}
            className={cn(
              "group relative overflow-hidden rounded-xl border-2 p-6 text-left transition-all hover:scale-[1.02]",
              selectedRole === role.id
                ? "border-primary bg-primary/5 shadow-lg"
                : "border-border hover:border-primary/50"
            )}
          >
            {selectedRole === role.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
              >
                <Check className="h-5 w-5" />
              </motion.div>
            )}

            <div className="space-y-4">
              <div
                className={cn(
                  "inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br transition-transform group-hover:scale-110",
                  role.gradient
                )}
              >
                <role.icon className="h-7 w-7 text-white" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{role.title}</h3>
                <p className="text-[var(--color-brand-secondary)]">
                  {role.description}
                </p>
              </div>

              <ul className="space-y-2">
                {role.features.map((feature, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {feature}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
