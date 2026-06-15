"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleSelectorProps {
  modules: any[];
  selectedModules: any[];
  onSelectionChange: (modules: any[]) => void;
}

export default function ModuleSelector({
  modules,
  selectedModules,
  onSelectionChange,
}: ModuleSelectorProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );

  const toggleModuleExpansion = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const handleModuleToggle = (module: any, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedModules, module]);
    } else {
      onSelectionChange(selectedModules.filter((m) => m.id !== module.id));
    }
  };

  const isModuleSelected = (moduleId: string) => {
    return selectedModules.some((m) => m.id === moduleId);
  };

  const totalSelectedCost = selectedModules.reduce(
    (sum, m) => sum + (m.owner_final_cost || m.ai_estimated_cost || 0),
    0
  );

  const complexityColors: Record<number, string> = {
    1: "bg-green-100 text-green-800 border-green-300",
    2: "bg-blue-100 text-blue-800 border-blue-300",
    3: "bg-yellow-100 text-yellow-800 border-yellow-300",
    4: "bg-orange-100 text-orange-800 border-orange-300",
    5: "bg-red-100 text-red-800 border-red-300",
  };

  // Filter out assigned modules
  const availableModules = modules.filter((module) => !module.is_assigned);
  const assignedCount = modules.length - availableModules.length;

  if (!modules || modules.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No modules available for this project
        </CardContent>
      </Card>
    );
  }

  if (availableModules.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            All modules for this project have been assigned to other freelancers.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {assignedCount} {assignedCount === 1 ? "module" : "modules"} already assigned
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Available Modules</CardTitle>
            {assignedCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {availableModules.length} available • {assignedCount} assigned
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableModules.map((module) => {
            const isExpanded = expandedModules.has(module.id);
            const isSelected = isModuleSelected(module.id);
            const cost = module.owner_final_cost || module.ai_estimated_cost || 0;

            return (
              <div
                key={module.id}
                className={cn(
                  "border rounded-lg p-4 transition-colors",
                  isSelected ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`module-${module.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      handleModuleToggle(module, checked as boolean)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <label
                        htmlFor={`module-${module.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {module.name}
                      </label>
                      <button
                        type="button"
                        onClick={() => toggleModuleExpansion(module.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2">
                      {module.is_mandatory && (
                        <Badge variant="default" className="text-xs">
                          Mandatory
                        </Badge>
                      )}
                      {module.complexity && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            complexityColors[module.complexity] ||
                              "bg-gray-100 text-gray-800"
                          )}
                        >
                          Complexity: {module.complexity}/5
                        </Badge>
                      )}
                      <span className="text-sm font-semibold text-emerald-600">
                        ${cost.toLocaleString()}
                      </span>
                    </div>

                    {isExpanded && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {module.description || "No description available"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-emerald-50/50 border-emerald-200 dark:bg-emerald-300/10 dark:border-emerald-800">
        <CardContent className="py-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                Selected Modules: <span className="font-semibold text-foreground">{selectedModules.length}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Estimated Cost</p>
              <p className="text-2xl font-bold text-emerald-600">
                ${totalSelectedCost.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
