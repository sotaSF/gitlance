"use client";

import { useState, useTransition, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FamilyDrawerRoot,
  FamilyDrawerPortal,
  FamilyDrawerOverlay,
  FamilyDrawerContent,
  FamilyDrawerAnimatedWrapper,
  FamilyDrawerClose,
} from "@/components/ui/family-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  CircleX,
  Loader2,
  Code2,
  Check,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  UserSkill,
  SkillInput,
  updateProfileSkills,
  createCustomSkillForProfile,
  getAvailableSkills,
} from "../actions";

interface EditSkillsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  currentSkills: UserSkill[];
  onSkillsUpdated: (skills: UserSkill[]) => void;
}

export function EditSkillsDrawer({
  open,
  onOpenChange,
  profileId,
  currentSkills,
  onSkillsUpdated,
}: EditSkillsDrawerProps) {
  const [selectedSkills, setSelectedSkills] = useState<
    Array<{
      skill_id: number;
      name: string;
      proficiency: number;
      category: string;
    }>
  >(currentSkills.map((s) => ({ ...s })));
  const [availableSkills, setAvailableSkills] = useState<
    Array<{ id: number; name: string; category: string }>
  >([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [hasFetchedSkills, setHasFetchedSkills] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [currentView, setCurrentView] = useState<"select" | "rate">("select");

  // Fetch available skills when drawer opens for the first time
  useEffect(() => {
    if (open && !hasFetchedSkills && !isLoadingSkills) {
      setIsLoadingSkills(true);
      getAvailableSkills()
        .then((result) => {
          if (result.success && result.skills) {
            setAvailableSkills(result.skills);
          }
        })
        .finally(() => {
          setIsLoadingSkills(false);
          setHasFetchedSkills(true);
        });
    }
  }, [open, hasFetchedSkills, isLoadingSkills]);

  // Reset state when drawer opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelectedSkills(currentSkills.map((s) => ({ ...s })));
      setError(null);
      setNewSkillName("");
      setActiveCategory("all");
      setCurrentView("select");
    }
    onOpenChange(isOpen);
  };

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
    (skill) => !selectedSkills.some((s) => s.skill_id === skill.id)
  );

  const toggleSkill = (skill: {
    id: number;
    name: string;
    category: string;
  }) => {
    const isSelected = selectedSkills.some((s) => s.skill_id === skill.id);
    if (isSelected) {
      setSelectedSkills((prev) => prev.filter((s) => s.skill_id !== skill.id));
      setError(null);
      return;
    }

    if (selectedSkills.length >= 6) {
      setError("You can select up to 6 skills.");
      return;
    }

    setSelectedSkills((prev) => [
      ...prev,
      {
        skill_id: skill.id,
        name: skill.name,
        proficiency: 3,
        category: skill.category,
      },
    ]);
    setError(null);
  };

  const addCustomSkill = async () => {
    if (!newSkillName.trim()) return;

    if (selectedSkills.length >= 6) {
      setError("You can select up to 6 skills.");
      return;
    }

    const existing = availableSkills.find(
      (s) => s.name.toLowerCase() === newSkillName.toLowerCase()
    );
    if (existing) {
      toggleSkill(existing);
    } else {
      const result = await createCustomSkillForProfile(
        newSkillName.trim(),
        "general"
      );
      if (result.success && result.skill) {
        setSelectedSkills((prev) => [
          ...prev,
          {
            skill_id: result.skill!.id,
            name: result.skill!.name,
            proficiency: 3,
            category: result.skill!.category,
          },
        ]);
      } else {
        setError(result.error || "Failed to create custom skill");
        return;
      }
    }

    setNewSkillName("");
    setError(null);
  };

  const removeSkill = (skillId: number) => {
    setSelectedSkills((prev) => prev.filter((s) => s.skill_id !== skillId));
    setError(null);
  };

  const updateSkillProficiency = (skillId: number, proficiency: number) => {
    setSelectedSkills((prev) =>
      prev.map((s) => (s.skill_id === skillId ? { ...s, proficiency } : s))
    );
  };

  const handleSave = () => {
    startTransition(async () => {
      const skillsToSave: SkillInput[] = selectedSkills.map((s) => ({
        skill_id: s.skill_id,
        name: s.name,
        proficiency: s.proficiency,
      }));

      const result = await updateProfileSkills(profileId, skillsToSave);

      if (result.success) {
        onSkillsUpdated(
          selectedSkills.map((s) => ({
            skill_id: s.skill_id,
            name: s.name,
            proficiency: s.proficiency,
            category: s.category,
          }))
        );
        onOpenChange(false);
      } else {
        setError(result.error || "Failed to update skills");
      }
    });
  };

  return (
    <FamilyDrawerRoot open={open} onOpenChange={handleOpenChange}>
      <FamilyDrawerPortal>
        <FamilyDrawerOverlay />
        <FamilyDrawerContent className="max-w-[500px]" title="Edit Skills">
          <FamilyDrawerAnimatedWrapper className="px-5 pb-5 pt-3">
            <AnimatePresence mode="wait" initial={false}>
              {currentView === "select" ? (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="space-y-4"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-brand/10">
                        <Code2 className="h-5 w-5 text-brand" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">Edit Skills</h2>
                        <p className="text-xs text-muted-foreground">
                          Select up to 6 skills
                        </p>
                      </div>
                    </div>
                    <FamilyDrawerClose />
                  </div>

                  {/* Selected Skills */}
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Selected ({selectedSkills.length}/6)
                    </p>
                    <div className="flex min-h-[50px] w-full flex-wrap items-start gap-2 rounded-xl border border-border/50 bg-muted/30 p-3">
                      {selectedSkills.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Click skills below to add them
                        </p>
                      ) : (
                        selectedSkills.map((skill) => (
                          <motion.div
                            key={skill.skill_id}
                            layout
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="group flex cursor-pointer items-center gap-1.5 rounded-full border bg-brand px-3 py-1 text-xs text-white transition-all hover:bg-brand/80"
                            onClick={() => removeSkill(skill.skill_id)}
                          >
                            {skill.name}
                            <CircleX size={12} />
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Add Custom Skill */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom skill..."
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCustomSkill()}
                      className="h-9 text-sm"
                    />
                    <Button
                      type="button"
                      onClick={addCustomSkill}
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Category Filter */}
                  {isLoadingSkills ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        Loading skills...
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveCategory("all")}
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-medium transition-all",
                            activeCategory === "all"
                              ? "bg-brand text-white"
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
                              "rounded-full px-3 py-1 text-xs font-medium capitalize transition-all",
                              activeCategory === category
                                ? "bg-brand text-white"
                                : "bg-muted hover:bg-muted/80"
                            )}
                          >
                            {category}
                          </button>
                        ))}
                      </div>

                      {/* Available Skills */}
                      <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
                        {unselectedSkills.map((skill) => (
                          <div
                            key={skill.id}
                            className="cursor-pointer rounded-full border bg-background px-3 py-1 text-xs transition-all hover:border-brand hover:bg-brand/5"
                            onClick={() => toggleSkill(skill)}
                          >
                            {skill.name}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {error && <p className="text-xs text-destructive">{error}</p>}

                  {/* Next Button */}
                  <Button
                    onClick={() => setCurrentView("rate")}
                    disabled={selectedSkills.length === 0}
                    className="w-full rounded-full"
                  >
                    Next: Rate Proficiency
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="rate"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="space-y-4"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentView("select")}
                        className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <div>
                        <h2 className="text-lg font-semibold">
                          Rate Proficiency
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Set your skill levels (1-5)
                        </p>
                      </div>
                    </div>
                    <FamilyDrawerClose />
                  </div>

                  {/* Proficiency Rating */}
                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                    {selectedSkills.map((skill) => (
                      <div
                        key={skill.skill_id}
                        className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {skill.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {skill.proficiency}/5
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <button
                              key={level}
                              type="button"
                              onClick={() =>
                                updateSkillProficiency(skill.skill_id, level)
                              }
                              className={cn(
                                "flex-1 h-8 rounded-lg text-xs font-medium transition-all hover:scale-105",
                                skill.proficiency >= level
                                  ? "bg-brand text-white"
                                  : "bg-muted hover:bg-muted/80"
                              )}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                        <Progress
                          value={(skill.proficiency / 5) * 100}
                          className="h-1.5"
                        />
                      </div>
                    ))}
                  </div>

                  {error && <p className="text-xs text-destructive">{error}</p>}

                  {/* Save Button */}
                  <Button
                    onClick={handleSave}
                    disabled={isPending}
                    className="w-full rounded-full"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save Skills
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </FamilyDrawerAnimatedWrapper>
        </FamilyDrawerContent>
      </FamilyDrawerPortal>
    </FamilyDrawerRoot>
  );
}
