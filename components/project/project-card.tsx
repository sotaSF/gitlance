"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Check, X, RotateCw, Loader2 } from "lucide-react";
import { getProjectModules } from "@/app/(dashboard)/(project)/explore/actions";

type ProjectModule = {
  id: string;
  name: string;
  owner_final_cost?: number;
  ai_estimated_cost?: number;
  is_assigned?: boolean;
};

export type Project = {
  id: string;
  title: string;
  short_description: string;
  budget_min?: number;
  budget_max?: number;
  tags?: string[];
  posted_at?: string;
  client?: { name: string; avatar?: string };
  repo?: string;
  owner_id?: string;
};

export default function ProjectCard({
  project,
  className = "",
  currentUserId,
}: {
  project: Project;
  className?: string;
  currentUserId?: string | null;
}) {
  const {
    title,
    short_description,
    budget_min,
    budget_max,
    tags = [],
    client,
    posted_at,
    owner_id,
  } = project;

  const [isFlipped, setIsFlipped] = useState(false);
  const [modules, setModules] = useState<ProjectModule[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [hasLoadedModules, setHasLoadedModules] = useState(false);

  const isOwnProject = currentUserId && owner_id === currentUserId;

  const handleFlip = async () => {
    if (!isFlipped && !hasLoadedModules) {
      // Fetch modules when flipping to back for the first time
      setIsLoadingModules(true);
      const result = await getProjectModules(project.id);
      if (result.success && result.modules) {
        setModules(result.modules);
      }
      setHasLoadedModules(true);
      setIsLoadingModules(false);
    }
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      className={cn(
        "group/flipping-card [perspective:1000px] h-[300px] w-full",
        className
      )}
    >
      <div
        className={cn(
          "relative rounded-xl  bg-white shadow-lg transition-all duration-700 [transform-style:preserve-3d] dark:border-neutral-800 dark:bg-neutral-950",
          "h-full w-full",
          isFlipped && "[transform:rotateY(180deg)]"
        )}
      >
        {/* Front Face */}
        <div className="absolute  inset-0  [transform:rotateY(0deg)] rounded-[inherit] bg-white text-neutral-950 [backface-visibility:hidden] [transform-style:preserve-3d] dark:bg-zinc-950 dark:text-neutral-50">
          <div className=" h-full [transform:translateZ(70px)_scale(.93)]">
            <Card className="h-full flex flex-col border-0 shadow-none">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base md:text-lg line-clamp-1">{title}</CardTitle>
                    <CardDescription className="mt-1 text-sm line-clamp-2">
                      {short_description}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={handleFlip}
                    title="View modules"
                  >
                    {isLoadingModules ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pb-3">
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 4).map((t) => (
                    <Badge key={t} className="text-xs" variant="outline">
                      {t}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={client?.avatar || undefined} className="object-cover" />
                      <AvatarFallback className="bg-gray-300 text-gray-700 text-xs font-semibold">
                        {client?.name
                          ? client.name
                            .split(" ")
                            .map((s) => s[0])
                            .slice(0, 2)
                            .join("")
                          : "CL"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">
                        {client?.name ?? "Unknown Client"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {posted_at
                          ? new Date(posted_at).toISOString().split('T')[0]
                          : "Unknown"}
                      </div>
                    </div>
                  </div>

                  <div className="ml-auto">
                    <div className="text-sm font-medium">
                      {budget_min != null && budget_max != null
                        ? `$${budget_min.toLocaleString()} - $${budget_max.toLocaleString()}`
                        : budget_min != null
                          ? `$${budget_min.toLocaleString()}`
                          : "Budget not set"}
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="mt-auto pt-3">
                <div className="w-full flex items-center gap-3">
                  {currentUserId ? (
                    <>
                      <Link href={`/project/${project.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          View Project
                        </Button>
                      </Link>
                      {!isOwnProject && (
                        <Link href={`/project/${project.id}?sendProposal=true`} className="flex-1">
                          <Button className="w-full">Send Proposal</Button>
                        </Link>
                      )}
                    </>
                  ) : (
                    <Button variant="secondary" className="w-full" asChild>
                      <Link href="/auth/sign-in">Sign in to View</Link>
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Back Face */}
        <div className="absolute inset-0 h-full w-full [transform:rotateY(180deg)] rounded-[inherit] bg-white text-neutral-950 [backface-visibility:hidden] [transform-style:preserve-3d] dark:bg-zinc-950 dark:text-neutral-50">
          <div className="h-full w-full [transform:translateZ(70px)_scale(.93)]">
            <Card className="h-full flex flex-col border-0 shadow-none">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base md:text-lg">Project Modules</CardTitle>
                    <CardDescription className="text-xs">
                      {modules.length} {modules.length === 1 ? "module" : "modules"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={handleFlip}
                    title="Flip back"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto px-6 py-4">
                {isLoadingModules ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : modules.length > 0 ? (
                  <div className="space-y-1">
                    {modules.map((module) => {
                      const cost = module.owner_final_cost || module.ai_estimated_cost || 0;
                      const isAssigned = module.is_assigned === true;

                      return (
                        <div
                          key={module.id}
                          className="flex items-center justify-between py-2 group hover:bg-accent/50 px-2 -mx-2 rounded transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {isAssigned ? (
                              <X className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-600" />
                            ) : (
                              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-500" />
                            )}
                            <span
                              className={cn(
                                "text-sm truncate",
                                isAssigned
                                  ? "text-gray-500 dark:text-gray-500"
                                  : "text-foreground dark:text-foreground"
                              )}
                            >
                              {module.name}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "text-sm font-medium shrink-0 ml-3",
                              isAssigned
                                ? "text-gray-500 dark:text-gray-500"
                                : "text-foreground dark:text-foreground"
                            )}
                          >
                            ${cost.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    No modules available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
