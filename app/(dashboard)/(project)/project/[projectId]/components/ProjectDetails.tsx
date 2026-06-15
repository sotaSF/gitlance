"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Layers, AlertCircle } from "lucide-react";
import { ProjectModule, ProjectRecord } from "@/types/projects";

interface ProjectDetailsProps {
  project: ProjectRecord;
  modules: ProjectModule[];
}

export function ProjectDetails({ project, modules }: ProjectDetailsProps) {
  const formatCurrency = (value?: number | null) =>
    value ? `$${value.toLocaleString()}` : "N/A";

  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString("en-US") : "—";

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {project.short_description && (
              <div className="p-4 bg-muted/30 rounded-lg border">
                <h4 className="font-medium text-sm mb-1 text-muted-foreground">
                  Summary
                </h4>
                <p className="text-base">{project.short_description}</p>
              </div>
            )}

            <div>
              <h4 className="font-medium text-sm mb-2 text-muted-foreground">
                Detailed User Story
              </h4>
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {project.user_story}
              </p>
            </div>

            {project.attachments && project.attachments.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-3 text-muted-foreground">
                  Attachments
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {project.attachments.map((file, index) => (
                    <a
                      key={index}
                      href={file.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                    >
                      <div className="h-8 w-8 rounded bg-emerald-600/10 flex items-center justify-center text-emerald-600">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-emerald-600 transition-colors">
                          {file.name || "Attachment"}
                        </p>
                        {!!file.size && (
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">Project Modules</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modules.map((module) => (
                <div
                  key={module.id}
                  className={`p-4 rounded-lg border ${
                    module.is_assigned
                      ? "border-muted bg-muted/30 opacity-75"
                      : module.is_mandatory
                      ? "border-emerald-600/20 bg-emerald-600/5"
                      : "bg-muted/30"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-base">{module.name}</h4>
                      <div className="flex gap-2 mt-1">
                        {module.is_mandatory && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                            Core Module
                          </span>
                        )}
                        {module.is_assigned && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Assigned
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-medium block">
                        {formatCurrency(module.owner_final_cost)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Est. Cost
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {module.description}
                  </p>
                  <div className="flex gap-2">
                    {typeof module.complexity === "number" && (
                      <Badge variant="outline" className="text-xs font-normal">
                        Complexity: {module.complexity}/5
                      </Badge>
                    )}
                    {typeof module.ai_confidence === "number" && (
                      <Badge variant="outline" className="text-xs font-normal">
                        Confidence: {Math.round(module.ai_confidence * 100)}%
                      </Badge>
                    )}
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
            <CardTitle className="text-lg">Project Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Modules</span>
                <span className="font-bold">{modules.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Est. Duration</span>
                <span className="font-bold">4-6 Weeks</span>
              </div>
              {project.deadline && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Deadline</span>
                  <span className="font-bold">
                    {formatDate(project.deadline)}
                  </span>
                </div>
              )}
              <Separator className="bg-emerald-600/20" />
              <div className="flex justify-between items-center text-lg">
                <span className="font-medium">Total Budget</span>
                <span className="font-bold text-emerald-600">
                  {formatCurrency(project.owner_final_total)}
                </span>
              </div>
            </div>

            {((project.tags?.length ?? 0) > 0 ||
              (project.required_skills?.length ?? 0) > 0) && (
              <>
                <Separator />
                <div className="space-y-4">
                  {(project.tags?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Tags
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {project.tags?.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs font-normal"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(project.required_skills?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Required Skills
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {project.required_skills?.map((skill) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className="text-xs font-normal border-emerald-600/30 text-emerald-600 bg-emerald-600/5"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
              <p className="text-muted-foreground">
                This project has been analyzed and scoped by AI. The budget and
                modules are estimated based on the requirements.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
