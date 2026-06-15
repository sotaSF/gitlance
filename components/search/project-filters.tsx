"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface ProjectFiltersProps {
  availableTags: string[];
}

export function ProjectFilters({ availableTags }: ProjectFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for filters
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 10000]);
  
  // Initialize state from URL
  useEffect(() => {
    const min = Number(searchParams.get("minBudget")) || 0;
    const max = Number(searchParams.get("maxBudget")) || 10000;
    setBudgetRange([min, max]);
  }, [searchParams]);

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset pagination
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

  const handleBudgetChange = (value: number[]) => {
    setBudgetRange([value[0], value[1]]);
  };

  const applyBudgetFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("minBudget", budgetRange[0].toString());
    params.set("maxBudget", budgetRange[1].toString());
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

      <Accordion type="multiple" defaultValue={["budget", "type", "tags"]} className="w-full">
        {/* Budget Filter */}
        <AccordionItem value="budget">
          <AccordionTrigger>Budget Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <Slider
                defaultValue={[0, 10000]}
                value={budgetRange}
                max={20000}
                step={100}
                onValueChange={handleBudgetChange}
                onValueCommit={applyBudgetFilter}
                className="py-4"
              />
              <div className="flex items-center gap-4">
                <div className="grid gap-1.5 flex-1">
                  <Label className="text-xs text-muted-foreground">Min ($)</Label>
                  <Input
                    type="number"
                    value={budgetRange[0]}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setBudgetRange([val, budgetRange[1]]);
                    }}
                    onBlur={applyBudgetFilter}
                    className="h-8"
                  />
                </div>
                <div className="grid gap-1.5 flex-1">
                  <Label className="text-xs text-muted-foreground">Max ($)</Label>
                  <Input
                    type="number"
                    value={budgetRange[1]}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setBudgetRange([budgetRange[0], val]);
                    }}
                    onBlur={applyBudgetFilter}
                    className="h-8"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Collaboration Type */}
        <AccordionItem value="type">
          <AccordionTrigger>Collaboration Type</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {[
                { id: "fixed_price", label: "Fixed Price" },
                { id: "hourly", label: "Hourly" },
                { id: "milestone_based", label: "Milestone Based" },
                { id: "equity", label: "Equity" },
              ].map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type.id}`}
                    checked={searchParams.getAll("collaborationType").includes(type.id)}
                    onCheckedChange={() => toggleArrayFilter("collaborationType", type.id)}
                  />
                  <Label htmlFor={`type-${type.id}`} className="text-sm font-normal cursor-pointer">
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Experience Level */}
        <AccordionItem value="experience">
          <AccordionTrigger>Experience Level</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {[
                { id: "beginner", label: "Beginner" },
                { id: "intermediate", label: "Intermediate" },
                { id: "expert", label: "Expert" },
                { id: "any", label: "Any Experience" },
              ].map((level) => (
                <div key={level.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`exp-${level.id}`}
                    checked={searchParams.getAll("experienceLevel").includes(level.id)}
                    onCheckedChange={() => toggleArrayFilter("experienceLevel", level.id)}
                  />
                  <Label htmlFor={`exp-${level.id}`} className="text-sm font-normal cursor-pointer">
                    {level.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Tags */}
        <AccordionItem value="tags">
          <AccordionTrigger>Tags</AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-2">
                {availableTags.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag}`}
                      checked={searchParams.getAll("tags").includes(tag)}
                      onCheckedChange={() => toggleArrayFilter("tags", tag)}
                    />
                    <Label htmlFor={`tag-${tag}`} className="text-sm font-normal cursor-pointer">
                      {tag}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>

        {/* Payment Type */}
        <AccordionItem value="payment">
          <AccordionTrigger>Payment Type</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {[
                { id: "full_upfront", label: "Full Upfront" },
                { id: "milestone", label: "Milestone" },
                { id: "escrow", label: "Escrow" },
                { id: "completion", label: "On Completion" },
              ].map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`pay-${type.id}`}
                    checked={searchParams.getAll("paymentType").includes(type.id)}
                    onCheckedChange={() => toggleArrayFilter("paymentType", type.id)}
                  />
                  <Label htmlFor={`pay-${type.id}`} className="text-sm font-normal cursor-pointer">
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Status */}
        <AccordionItem value="status">
          <AccordionTrigger>Status</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {[
                { id: "open", label: "Open" },
                { id: "in_progress", label: "In Progress" },
                { id: "completed", label: "Completed" },
              ].map((status) => (
                <div key={status.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status.id}`}
                    checked={searchParams.getAll("status").includes(status.id)}
                    onCheckedChange={() => toggleArrayFilter("status", status.id)}
                  />
                  <Label htmlFor={`status-${status.id}`} className="text-sm font-normal cursor-pointer">
                    {status.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
