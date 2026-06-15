"use client";

import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Github, Linkedin, Briefcase, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import NumberFlow from "@/components/smoothui/number-flow";

interface DeveloperSkillsStepProps {
  onDataChange: (data: DeveloperSkillsData) => void;
  initialData?: DeveloperSkillsData;
  availableSkills: Array<{ id: number; name: string; category: string }>;
}

export interface DeveloperSkillsData {
  years_experience: number;
  seniority: "junior" | "mid" | "senior" | "lead" | "";
  linkedin_url: string;
  availability: { types: string[]; hours_per_week: number | string };
  selectedSkills: Array<{
    skill_id: number;
    name: string;
    proficiency: number;
  }>;
}

const seniorityLevels = [
  { value: "junior", label: "Junior", description: "0-2 years" },
  { value: "mid", label: "Mid-Level", description: "2-5 years" },
  { value: "senior", label: "Senior", description: "5-10 years" },
  { value: "lead", label: "Lead", description: "10+ years" },
];

const availabilityOptions = [
  { value: "full-time", label: "Full Time" },
  { value: "part-time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
];

export function DeveloperSkillsStep({
  onDataChange,
  initialData,
  availableSkills,
}: DeveloperSkillsStepProps) {
  const [formData, setFormData] = useState<DeveloperSkillsData>(
    initialData || {
      years_experience: 0,
      seniority: "",
      linkedin_url: "",
      availability: { types: [], hours_per_week: 40 },
      selectedSkills: [],
    }
  );

  const [newSkillName, setNewSkillName] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const handleChange = (field: keyof DeveloperSkillsData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvailabilityToggle = (type: string) => {
    // Make availability single-select: selecting an option replaces the previous selection.
    const currentTypes = formData.availability?.types || [];
    const newTypes = currentTypes.includes(type) ? [] : [type];

    handleChange("availability", {
      ...formData.availability,
      types: newTypes,
    });
  };

  const toggleSkill = (skill: { id: number; name: string }) => {
    // placeholder: skills selection is handled in a separate SkillsStep component
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
    } else {
      setFormData((prev) => ({
        ...prev,
        selectedSkills: [
          ...prev.selectedSkills,
          { skill_id: skill.id, name: skill.name, proficiency: 3 },
        ],
      }));
    }
  };

  const addCustomSkill = () => {
    if (!newSkillName.trim()) return;

    // Check if skill already exists
    const existingSkill = availableSkills.find(
      (s) => s.name.toLowerCase() === newSkillName.toLowerCase()
    );

    if (existingSkill) {
      toggleSkill(existingSkill);
    } else {
      // Add as custom skill with negative ID to distinguish from DB skills
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
  };

  const updateSkillProficiency = (skillId: number, proficiency: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedSkills: prev.selectedSkills.map((s) =>
        s.skill_id === skillId ? { ...s, proficiency } : s
      ),
    }));
  };

  const removeSkill = (skillId: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedSkills: prev.selectedSkills.filter((s) => s.skill_id !== skillId),
    }));
  };

  // Group skills by category
  const skillsByCategory = availableSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
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
          Developer Profile
        </h2>
        <p className="text-[var(--color-brand-secondary)]">
          Tell us about your experience and availability
        </p>
      </div>

      <div className="space-y-6">
        {/* Experience & Seniority */}
        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <Label
              htmlFor="years_experience"
              className="flex items-center gap-2"
            >
              <Briefcase className="h-4 w-4" />
              Years of Experience *
            </Label>
            <div className="max-w-xs">
              <NumberFlow
                value={formData.years_experience}
                onChange={(val) => handleChange("years_experience", val)}
                min={0}
                max={80}
                className="!min-h-0"
                digitClassName=""
                buttonClassName=""
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-2"
          >
            <Label className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Seniority Level *
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {seniorityLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => handleChange("seniority", level.value)}
                  className={cn(
                    "rounded-lg border-2 p-3 text-left transition-all hover:border-[var(--color-brand)]/50",
                    formData.seniority === level.value
                      ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5"
                      : "border-border"
                  )}
                >
                  <div className="text-sm font-medium">{level.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {level.description}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Availability */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <Label className="text-base font-semibold">Availability *</Label>
          <div className="flex flex-wrap gap-2">
            {availabilityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleAvailabilityToggle(option.value)}
                className={cn(
                  "rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all",
                  formData.availability?.types?.includes(option.value)
                    ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5 text-[var(--color-brand)]"
                    : "border-border hover:border-[var(--color-brand)]/50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="hours_per_week">Hours per Week</Label>
            <Input
              id="hours_per_week"
              type="number"
              inputMode="numeric"
              min={1}
              max={168}
              step={1}
              value={formData.availability?.hours_per_week ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                // allow empty to let user type
                if (v === "") {
                  handleChange("availability", {
                    ...formData.availability,
                    hours_per_week: "",
                  });
                  return;
                }

                let parsed = parseInt(v, 10);
                if (isNaN(parsed)) parsed = 0;
                // Clamp to valid range
                const minVal = 1;
                const maxVal = 168;
                if (parsed < minVal) parsed = minVal;
                if (parsed > maxVal) parsed = maxVal;

                handleChange("availability", {
                  ...formData.availability,
                  hours_per_week: parsed,
                });
              }}
            />
          </div>
        </motion.div>

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-4"
        >
          <Label className="text-base font-semibold">
            LinkedIn Profile *
          </Label>

          <div className="space-y-2">
            <Label htmlFor="linkedin_url" className="flex items-center gap-2">
              <Linkedin className="h-4 w-4" />
              LinkedIn URL *
            </Label>
            <Input
              id="linkedin_url"
              type="url"
              placeholder="https://linkedin.com/in/yourprofile"
              value={formData.linkedin_url}
              onChange={(e) => handleChange("linkedin_url", e.target.value)}
              required
            />
          </div>
        </motion.div>

        {/* Note: skills selection moved to a dedicated Skills step */}
      </div>
    </motion.div>
  );
}
