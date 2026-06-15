"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, CircleX } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DeveloperSkillsData {
  seniority: "junior" | "mid" | "senior" | "lead" | "";
  linkedin_url: string;
  availability: { types: string[]; hours_per_week: number | string };
  selectedSkills: Array<{
    skill_id: number;
    name: string;
    proficiency: number;
  }>;
}

interface SkillsStepProps {
  onDataChange: (data: DeveloperSkillsData) => void;
  initialData?: DeveloperSkillsData;
  availableSkills: Array<{ id: number; name: string; category: string }>;
}

export function SkillsStep({
  onDataChange,
  initialData,
  availableSkills,
}: SkillsStepProps) {
  const [formData, setFormData] = useState<DeveloperSkillsData>(
    initialData || {
      seniority: "",
      linkedin_url: "",
      availability: { types: [], hours_per_week: 40 },
      selectedSkills: [],
    }
  );

  const [newSkillName, setNewSkillName] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  // Group skills by category
  const skillsByCategory = availableSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, typeof availableSkills>);

  const categories = Object.keys(skillsByCategory);
  const displaySkills =
    activeCategory === "all"
      ? availableSkills
      : skillsByCategory[activeCategory] || [];

  const unselectedSkills = displaySkills.filter(
    (skill) => !formData.selectedSkills.some((s) => s.skill_id === skill.id)
  );

  const toggleSkill = (skill: { id: number; name: string }) => {
    const isSelected = formData.selectedSkills.some(
      (s) => s.skill_id === skill.id
    );
    if (isSelected) {
      setFormData((prev) => ({
        ...prev,
        selectedSkills: prev.selectedSkills.filter(
          (s) => s.skill_id !== skill.id
        ),
      }));
      setError(null);
      return;
    }

    if (formData.selectedSkills.length >= 6) {
      setError("You can select up to 6 skills.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      selectedSkills: [
        ...prev.selectedSkills,
        { skill_id: skill.id, name: skill.name, proficiency: 3 },
      ],
    }));
  };

  const addCustomSkill = () => {
    if (!newSkillName.trim()) return;

    if (formData.selectedSkills.length >= 6) {
      setError("You can select up to 6 skills.");
      return;
    }

    const existing = availableSkills.find(
      (s) => s.name.toLowerCase() === newSkillName.toLowerCase()
    );
    if (existing) {
      toggleSkill(existing);
    } else {
      const customId = -Date.now();
      setFormData((prev) => ({
        ...prev,
        selectedSkills: [
          ...prev.selectedSkills,
          { skill_id: customId, name: newSkillName.trim(), proficiency: 3 },
        ],
      }));
    }

    setNewSkillName("");
    setError(null);
  };

  const removeSkill = (skillId: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedSkills: prev.selectedSkills.filter((s) => s.skill_id !== skillId),
    }));
    setError(null);
  };

  const updateSkillProficiency = (skillId: number, proficiency: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedSkills: prev.selectedSkills.map((s) =>
        s.skill_id === skillId ? { ...s, proficiency } : s
      ),
    }));
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
          Your Skills
        </h2>
        <p className="text-[var(--color-brand-secondary)]">
          Select up to 6 skills and rate your proficiency.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Selected Skills ({formData.selectedSkills.length}/6)
          </p>
          <AnimatePresence>
            <div className="flex min-h-[80px] w-full flex-wrap items-start gap-2 rounded-xl border border-[var(--color-brand)]/20 bg-background p-4">
              {formData.selectedSkills.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Click skills below to add them
                </p>
              ) : (
                formData.selectedSkills.map((skill) => (
                  <motion.div
                    key={skill.skill_id}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: 20, opacity: 0, filter: "blur(4px)" }}
                    initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
                    layout
                    transition={{ duration: 0.3, bounce: 0, type: "spring" }}
                    className="group flex cursor-pointer items-center gap-2 rounded-md border bg-[var(--color-brand)] px-3 py-1.5 text-sm text-white transition-all hover:bg-[var(--color-brand-secondary)]"
                    onClick={() => removeSkill(skill.skill_id)}
                  >
                    {skill.name}
                    <CircleX size={14} />
                  </motion.div>
                ))
              )}
            </div>
          </AnimatePresence>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Add custom skill..."
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomSkill()}
          />
          <Button
            type="button"
            onClick={addCustomSkill}
            variant="outline"
            className="whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={cn(
              "rounded-lg px-3 py-1 text-sm font-medium transition-all",
              activeCategory === "all"
                ? "bg-[var(--color-brand)] text-white"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "rounded-lg px-3 py-1 text-sm font-medium capitalize transition-all",
                activeCategory === category
                  ? "bg-[var(--color-brand)] text-white"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {unselectedSkills.map((skill) => (
            <motion.div
              key={skill.id}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
              initial={{ y: -20, opacity: 0, filter: "blur(4px)" }}
              layout
              transition={{ duration: 0.3, bounce: 0, type: "spring" }}
              className="group flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm transition-all hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)]/5"
              onClick={() => toggleSkill(skill)}
            >
              {skill.name}
            </motion.div>
          ))}
        </div>

        {formData.selectedSkills.length > 0 && (
          <div className="space-y-3 rounded-lg border border-[var(--color-brand)]/20 p-4">
            <Label className="text-sm font-medium">
              Rate Your Proficiency (1-5)
            </Label>
            {formData.selectedSkills.map((skill) => (
              <div
                key={skill.skill_id}
                className="flex items-center justify-between gap-4"
              >
                <span className="text-sm font-medium">{skill.name}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        updateSkillProficiency(skill.skill_id, level)
                      }
                      className={cn(
                        "h-8 w-8 rounded transition-all hover:scale-110",
                        skill.proficiency >= level
                          ? "bg-[var(--color-brand)] text-white"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <div className="text-sm text-destructive">{error}</div>}
      </div>
    </motion.div>
  );
}

export default SkillsStep;
