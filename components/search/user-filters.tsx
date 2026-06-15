"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState, useEffect } from "react";

interface UserFiltersProps {
  availableSkills: string[];
}

export function UserFilters({ availableSkills }: UserFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for filters
  const [experienceRange, setExperienceRange] = useState<[number, number]>([0, 20]);
  const [location, setLocation] = useState(searchParams.get("location") || "");

  // Initialize state from URL
  useEffect(() => {
    const min = Number(searchParams.get("minExperience")) || 0;
    const max = Number(searchParams.get("maxExperience")) || 20;
    setExperienceRange([min, max]);
    setLocation(searchParams.get("location") || "");
  }, [searchParams]);

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const toggleArrayFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll(key);
    
    if (current.includes(value)) {
      const newValues = current.filter((v) => v !== value);
      params.delete(key);
      newValues.forEach((v) => params.append(key, v));
    } else {
      params.append(key, value);
    }
    
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const handleExperienceChange = (value: number[]) => {
    setExperienceRange([value[0], value[1]]);
  };

  const applyExperienceFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("minExperience", experienceRange[0].toString());
    params.set("maxExperience", experienceRange[1].toString());
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const handleLocationSubmit = () => {
    updateFilter("location", location || null);
  };

  const toggleVerified = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set("isVerified", "true");
    } else {
      params.delete("isVerified");
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    const tab = searchParams.get("tab");
    if (q) params.set("q", q);
    if (tab) params.set("tab", tab);
    router.push(`?${params.toString()}`);
  };

  const hasActiveFilters = Array.from(searchParams.keys()).some(
    (key) => !["q", "tab", "sort", "page"].includes(key)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2 py-2">
        <Switch
          id="verified-users"
          checked={searchParams.get("isVerified") === "true"}
          onCheckedChange={toggleVerified}
        />
        <Label htmlFor="verified-users" className="font-medium cursor-pointer">
          Verified Users Only
        </Label>
      </div>

      <Accordion type="multiple" defaultValue={["skills", "experience", "seniority"]} className="w-full">
        {/* Skills */}
        <AccordionItem value="skills">
          <AccordionTrigger>Skills</AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-2">
                {availableSkills.map((skill) => (
                  <div key={skill} className="flex items-center space-x-2">
                    <Checkbox
                      id={`skill-${skill}`}
                      checked={searchParams.getAll("skills").includes(skill)}
                      onCheckedChange={() => toggleArrayFilter("skills", skill)}
                    />
                    <Label htmlFor={`skill-${skill}`} className="text-sm font-normal cursor-pointer">
                      {skill}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>

        {/* Experience Years */}
        <AccordionItem value="experience">
          <AccordionTrigger>Years of Experience</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <Slider
                defaultValue={[0, 20]}
                value={experienceRange}
                max={30}
                step={1}
                onValueChange={handleExperienceChange}
                onValueCommit={applyExperienceFilter}
                className="py-4"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{experienceRange[0]} years</span>
                <span>{experienceRange[1]}+ years</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Seniority */}
        <AccordionItem value="seniority">
          <AccordionTrigger>Seniority Level</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {[
                { id: "junior", label: "Junior" },
                { id: "mid", label: "Mid-Level" },
                { id: "senior", label: "Senior" },
                { id: "lead", label: "Lead" },
              ].map((level) => (
                <div key={level.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`seniority-${level.id}`}
                    checked={searchParams.getAll("seniority").includes(level.id)}
                    onCheckedChange={() => toggleArrayFilter("seniority", level.id)}
                  />
                  <Label htmlFor={`seniority-${level.id}`} className="text-sm font-normal cursor-pointer">
                    {level.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Location */}
        <AccordionItem value="location">
          <AccordionTrigger>Location</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-1">
              <Input
                placeholder="e.g. New York, Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLocationSubmit()}
                onBlur={handleLocationSubmit}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
