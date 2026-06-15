"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Share2, Calendar, DollarSign, User, Upload } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ProjectRecord } from "@/types/projects";
import { useState } from "react";
import { publishProject } from "../actions";

interface ProjectHeaderProps {
  project: ProjectRecord;
  isOwner: boolean;
  workspaceId?: string;
  allModulesAssigned: boolean;
}

export function ProjectHeader({ project, isOwner, workspaceId, allModulesAssigned }: ProjectHeaderProps) {
  const [isPublishing, setIsPublishing] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const result = await publishProject(project.id);

      if (result.success) {
        toast.success("Project published successfully!");
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to publish project");
      }
    } catch (error) {
      console.error("Publish error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsPublishing(false);
    }
  };

  const formattedBudget = project.owner_final_total
    ? `$${project.owner_final_total.toLocaleString()}`
    : "N/A";

  const createdDate = project.created_at
    ? new Date(project.created_at).toLocaleDateString("en-US")
    : "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {project.title}
            </h1>
            <Badge
              variant={project.status === "open" ? "default" : "secondary"}
              className={
                project.status === "open"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : ""
              }
            >
              {project.status}
            </Badge>
            {project.is_published && (
              <Badge
                variant="outline"
                className="border-emerald-600 text-emerald-600"
              >
                Published
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>Posted by Owner</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{createdDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>Budget: {formattedBudget}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>

          {workspaceId && (
            <Link href={`/workspace/${workspaceId}`}>
              <Button size="sm" variant="secondary">
                <Badge className="mr-2 h-4 w-4 bg-primary/20 text-primary hover:bg-primary/30" />
                Go to Workspace
              </Button>
            </Link>
          )}

          {isOwner && (
            <>
              {!workspaceId && project.status !== "draft" && allModulesAssigned && (
                <Link href={`/workspace/create/${project.id}`}>
                  <Button size="sm" variant="default">
                    <Badge className="mr-2 h-4 w-4" />
                    Create Workspace
                  </Button>
                </Link>
              )}

              {/* Show Publish button if project is draft */}
              {!project.is_published && project.status === "draft" && (
                <Button
                  size="sm"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isPublishing ? "Publishing..." : "Publish Project"}
                </Button>
              )}
              <Link href={`/project/${project.id}/edit`}>
                <Button
                  size="sm"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Project
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
