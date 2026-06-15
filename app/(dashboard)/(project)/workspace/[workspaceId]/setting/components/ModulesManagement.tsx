"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Loader2,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  User,
  X,
  Star,
  PartyPopper
} from "lucide-react";
import { TeamRole, ModuleStatus } from "@/types/workspace";
import { markModuleAsDone, confirmModuleCompletion, assignModule, unassignModule, getProjectReviewData } from "../actions";
import { ReviewPromptModal } from "./ReviewPromptModal";

interface ModulesManagementProps {
  workspaceId: string;
  modules: Array<{
    id: string;
    name: string;
    description?: string;
    ai_estimated_cost?: number;
    owner_final_cost?: number;
    currency?: string;
    is_mandatory: boolean;
    complexity: number;
    is_assigned: boolean;
    assigned_to?: string;
    status: ModuleStatus;
    progress?: number;
    assignee?: {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
      username: string | null;
    };
  }>;
  members: Array<{
    id: string;
    profile_id: string;
    role: string;
    profile: {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
      username: string | null;
    };
  }>;
  userRole: TeamRole;
  currentUserId: string;
}

const statusConfig: Record<ModuleStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  pending: { label: "Pending", variant: "outline", icon: <Clock className="h-3 w-3" /> },
  in_progress: { label: "In Progress", variant: "secondary", icon: <Package className="h-3 w-3" /> },
  pending_review: { label: "Pending Review", variant: "default", icon: <AlertCircle className="h-3 w-3" /> },
  completed: { label: "Completed", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
};

export function ModulesManagement({
  workspaceId,
  modules,
  members,
  userRole,
  currentUserId,
}: ModulesManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<"all" | ModuleStatus>("all");
  const [loadingModule, setLoadingModule] = useState<string | null>(null);
  const [reviewPromptData, setReviewPromptData] = useState<{
    projectId: string;
    ownerId: string | null;
    contributors: Array<{ id: string; displayName: string | null; avatarUrl: string | null; username: string | null }>;
    reviewedUserIds: string[];
  } | null>(null);

  // Calculate stats
  const completedCount = modules.filter(m => m.status === "completed").length;
  const totalCount = modules.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const filteredModules = statusFilter === "all"
    ? modules
    : modules.filter(m => m.status === statusFilter);

  const canManage = userRole === "owner" || userRole === "maintainer";
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  const handleOpenReviewPrompt = () => {
    startTransition(async () => {
      const result = await getProjectReviewData(workspaceId);
      if (result.allModulesCompleted && result.projectId) {
        setReviewPromptData({
          projectId: result.projectId,
          ownerId: result.ownerId || null,
          contributors: result.contributors || [],
          reviewedUserIds: result.reviewedUserIds || [],
        });
      } else {
        toast.error("Not all modules are completed yet.");
      }
    });
  };

  const handleMarkAsDone = (moduleId: string, moduleName: string) => {
    setLoadingModule(moduleId);
    startTransition(async () => {
      const result = await markModuleAsDone(workspaceId, moduleId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`"${moduleName}" marked as done`);
      }
      setLoadingModule(null);
    });
  };

  const handleConfirmCompletion = (moduleId: string, moduleName: string) => {
    setLoadingModule(moduleId);
    startTransition(async () => {
      const result = await confirmModuleCompletion(workspaceId, moduleId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`"${moduleName}" confirmed as completed`);

        // Check if all modules are now completed
        if (result.allModulesCompleted && result.projectId) {
          setReviewPromptData({
            projectId: result.projectId,
            ownerId: result.ownerId || null,
            contributors: result.contributors || [],
            reviewedUserIds: result.reviewedUserIds || [],
          });
        }
      }
      setLoadingModule(null);
    });
  };

  const handleAssign = (moduleId: string, assigneeId: string) => {
    setLoadingModule(moduleId);
    startTransition(async () => {
      const result = await assignModule(workspaceId, moduleId, assigneeId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Module assigned successfully");
      }
      setLoadingModule(null);
    });
  };

  const handleUnassign = (moduleId: string, moduleName: string) => {
    setLoadingModule(moduleId);
    startTransition(async () => {
      const result = await unassignModule(workspaceId, moduleId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`"${moduleName}" unassigned successfully`);
      }
      setLoadingModule(null);
    });
  };

  const formatCost = (cost?: number, currency?: string) => {
    if (!cost) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(cost);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Modules Overview
          </CardTitle>
          <CardDescription>
            Track progress and manage module completion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {completedCount} of {totalCount} completed
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />

          <div className="grid grid-cols-4 gap-4 pt-2">
            {(Object.keys(statusConfig) as ModuleStatus[]).map(status => {
              const count = modules.filter(m => m.status === status).length;
              const config = statusConfig[status];
              return (
                <div key={status} className="text-center">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    {config.icon}
                    {config.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Review Team Button - shows when all modules completed */}
          {allCompleted && (
            <div className="pt-3 border-t">
              <Button
                onClick={handleOpenReviewPrompt}
                disabled={isPending}
                className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <Star className="h-4 w-4" />
                Review Your Team
                <PartyPopper className="h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                All modules are complete! Leave reviews for your team members.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modules List Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Modules</CardTitle>
            <CardDescription>
              {filteredModules.length} module{filteredModules.length !== 1 ? "s" : ""}
              {statusFilter !== "all" && ` with status "${statusConfig[statusFilter].label}"`}
            </CardDescription>
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as "all" | ModuleStatus)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {(Object.keys(statusConfig) as ModuleStatus[]).map(status => (
                <SelectItem key={status} value={status}>
                  {statusConfig[status].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModules.map((module) => {
                const statusInfo = statusConfig[module.status];
                const isLoading = loadingModule === module.id;

                return (
                  <TableRow key={module.id}>
                    <TableCell>
                      <p className="font-medium">{module.name}</p>
                    </TableCell>
                    <TableCell>
                      {module.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={module.assignee.avatar_url || ""} />
                            <AvatarFallback className="text-xs">
                              {module.assignee.display_name?.substring(0, 2).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {module.assignee.display_name || module.assignee.username}
                          </span>
                          {userRole === "owner" && module.status !== "completed" && module.status !== "pending_review" && (module.progress ?? 0) === 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-muted-foreground hover:text-destructive"
                              onClick={() => handleUnassign(module.id, module.name)}
                              disabled={isLoading}
                              title="Unassign module"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ) : canManage ? (
                        <Select
                          onValueChange={(value) => handleAssign(module.id, value)}
                          disabled={isPending}
                        >
                          <SelectTrigger className="w-[150px] h-8 text-xs">
                            <SelectValue placeholder="Assign..." />
                          </SelectTrigger>
                          <SelectContent>
                            {members
                              .filter(m => m.role !== "owner")
                              .map(member => (
                                <SelectItem key={member.profile_id} value={member.profile_id}>
                                  <div className="flex items-center gap-2">
                                    <User className="h-3 w-3" />
                                    {member.profile?.display_name || member.profile?.username}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={module.progress ?? 0} className="h-2 w-16" />
                        <span className="text-xs text-muted-foreground">
                          {module.progress ?? 0}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusInfo.variant}
                        className={`gap-1 ${module.status === "completed" ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}`}
                      >
                        {statusInfo.icon}
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        {formatCost(module.owner_final_cost || module.ai_estimated_cost, module.currency)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {module.status === "in_progress" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                              )}
                              Mark Done
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Mark Module as Done?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will mark "{module.name}" as done and send it for review.
                                The project owner or maintainer will need to confirm completion.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleMarkAsDone(module.id, module.name)}
                              >
                                Mark as Done
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {module.status === "pending_review" && canManage && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="default"
                              size="sm"
                              disabled={isLoading}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                              )}
                              Confirm
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Module Completion?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will mark "{module.name}" as completed and release <span className="font-semibold text-foreground">{formatCost(module.owner_final_cost || module.ai_estimated_cost, module.currency)}</span> to the assigned developer. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleConfirmCompletion(module.id, module.name)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Confirm Completion
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {module.status === "completed" && (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          Done
                        </span>
                      )}

                      {module.status === "pending" && !module.assigned_to && (
                        <span className="text-xs text-muted-foreground">
                          Needs assignment
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredModules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-muted-foreground">
                      No modules found{statusFilter !== "all" ? " with this status" : ""}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Review Prompt Modal */}
      {reviewPromptData && (
        <ReviewPromptModal
          isOpen={!!reviewPromptData}
          onClose={() => setReviewPromptData(null)}
          projectId={reviewPromptData.projectId}
          ownerId={reviewPromptData.ownerId}
          contributors={reviewPromptData.contributors}
          currentUserId={currentUserId}
          currentUserRole={userRole}
          reviewedUserIds={reviewPromptData.reviewedUserIds}
        />
      )}
    </div>
  );
}

