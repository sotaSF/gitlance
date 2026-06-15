"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Code2, Pencil, Star } from "lucide-react";
import { UserSkill } from "../actions";
import { EditSkillsDrawer } from "./EditSkillsDrawer";

interface SkillsSectionProps {
  skills: UserSkill[];
  profileId: string;
  isOwnProfile: boolean;
}

// Star rating component
function StarRating({
  rating,
  maxRating = 5,
}: {
  rating: number;
  maxRating?: number;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => {
        const starIndex = i + 1;
        const isFilled = starIndex <= rating;
        return (
          <Star
            key={i}
            className={`h-4 w-4 transition-colors ${
              isFilled
                ? "text-amber-500 fill-amber-500"
                : "text-muted-foreground/30"
            }`}
          />
        );
      })}
    </div>
  );
}

export function SkillsSection({
  skills,
  profileId,
  isOwnProfile,
}: SkillsSectionProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [currentSkills, setCurrentSkills] = useState(skills);

  const handleSkillsUpdated = (newSkills: UserSkill[]) => {
    setCurrentSkills(newSkills);
  };

  if (currentSkills.length === 0 && !isOwnProfile) {
    return null;
  }

  return (
    <>
      {/* Skills content - integrated with profile card via faded border */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-brand" />
            <h3 className="text-lg font-semibold">Skills & Expertise</h3>
          </div>
          {isOwnProfile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditDrawerOpen(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>

        {currentSkills.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No skills added yet.</p>
            {isOwnProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDrawerOpen(true)}
                className="mt-3"
              >
                Add Skills
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {currentSkills.map((skill) => (
              <div
                key={skill.skill_id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors"
              >
                <span className="font-medium text-sm">{skill.name}</span>
                <StarRating rating={skill.proficiency} />
              </div>
            ))}
          </div>
        )}
      </div>

      {isOwnProfile && (
        <EditSkillsDrawer
          open={isEditDrawerOpen}
          onOpenChange={setIsEditDrawerOpen}
          profileId={profileId}
          currentSkills={currentSkills}
          onSkillsUpdated={handleSkillsUpdated}
        />
      )}
    </>
  );
}
