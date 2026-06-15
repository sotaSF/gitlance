"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, FileText, DollarSign, Layers, ArrowLeft, Save, Rocket, Loader2 } from "lucide-react";
import { ProjectData } from "./ProjectCreationWizard";

interface ProjectReviewStepProps {
  data: ProjectData;
  onBack: () => void;
  onSaveDraft: () => void;
  onCreateProject: () => void;
  isLoading: boolean;
}

export function ProjectReviewStep({
  data,
  onBack,
  onSaveDraft,
  onCreateProject,
  isLoading,
}: ProjectReviewStepProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Review & Create</h2>
        <p className="text-muted-foreground">
          Review your project details before finalizing.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Title</h4>
                <p className="text-lg font-medium">{data.title}</p>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Short Description</h4>
                <p className="text-sm">{data.shortDescription || "N/A"}</p>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                <p className="text-sm whitespace-pre-wrap">{data.userStory}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Deadline</h4>
                  <p className="text-sm">{data.deadline ? new Date(data.deadline).toLocaleDateString() : "No deadline"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Attachments</h4>
                  <p className="text-sm">{data.attachments?.length || 0} files</p>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {data.tags?.length > 0 ? data.tags.map(tag => (
                    <span key={tag} className="text-xs bg-muted px-2 py-1 rounded-md">{tag}</span>
                  )) : <span className="text-sm text-muted-foreground">No tags</span>}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {data.requiredSkills?.length > 0 ? data.requiredSkills.map(skill => (
                    <span key={skill} className="text-xs bg-emerald-600/10 text-emerald-600 px-2 py-1 rounded-md">{skill}</span>
                  )) : <span className="text-sm text-muted-foreground">No specific skills listed</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Modules ({data.modules.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.modules.map((module, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{module.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{module.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${module.owner_final_cost.toLocaleString()}</p>
                      {module.is_mandatory && <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600">Core</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-emerald-600/5 border-emerald-600/20">
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Modules</span>
                <span className="font-bold">{data.modules.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Estimated Budget</span>
                <span className="font-bold">${data.estimatedBudget?.toLocaleString() || "N/A"}</span>
              </div>
              <Separator className="bg-emerald-600/20" />
              <div className="flex justify-between items-center text-lg">
                <span className="font-medium">Final Total</span>
                <span className="font-bold text-emerald-600">${data.finalTotal.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Button
              onClick={onCreateProject}
              className="w-full shadow-sm bg-emerald-600 text-white hover:bg-emerald-700"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
              Create & Publish Project
            </Button>
            <Button
              onClick={onSaveDraft}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save as Draft
            </Button>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Button variant="ghost" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    </div>
  );
}
