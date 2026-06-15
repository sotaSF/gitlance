"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
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
    Package,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    Target,
    TrendingUp,
    Zap,
    ArrowRight,
    User,
    Star,
    PartyPopper,
} from "lucide-react";
import { TeamRole, ModuleStatus } from "@/types/workspace";
import {
    markModuleAsDone,
    confirmModuleCompletion,
    updateModuleProgress,
    getProjectReviewData,
} from "../setting/actions";
import { ReviewPromptModal } from "../setting/components/ReviewPromptModal";

interface Module {
    id: string;
    name: string;
    description?: string;
    status: ModuleStatus;
    progress: number;
    assigned_to?: string;
    owner_final_cost?: number;
    ai_estimated_cost?: number;
    currency?: string;
    assignee?: {
        id: string;
        display_name: string | null;
        avatar_url: string | null;
        username: string | null;
    };
}

interface PersonalizedDashboardProps {
    workspaceId: string;
    modules: Module[];
    userRole: TeamRole;
    userId: string;
}

const statusConfig: Record<ModuleStatus, { label: string; color: string; icon: React.ReactNode; bg: string; ring: string }> = {
    pending: { label: "Pending", color: "text-muted-foreground", icon: <Clock className="h-3.5 w-3.5" />, bg: "bg-muted/50", ring: "ring-muted" },
    in_progress: { label: "In Progress", color: "text-blue-500", icon: <TrendingUp className="h-3.5 w-3.5" />, bg: "bg-blue-500/10", ring: "ring-blue-500/30" },
    pending_review: { label: "In Review", color: "text-amber-500", icon: <AlertCircle className="h-3.5 w-3.5" />, bg: "bg-amber-500/10", ring: "ring-amber-500/30" },
    completed: { label: "Completed", color: "text-emerald-500", icon: <CheckCircle2 className="h-3.5 w-3.5" />, bg: "bg-emerald-500/10", ring: "ring-emerald-500/30" },
};

function CircularProgress({ value, size = 40, strokeWidth = 3.5, status }: { value: number; size?: number; strokeWidth?: number; status: ModuleStatus }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    const colorMap: Record<ModuleStatus, string> = {
        pending: "#6b7280",
        in_progress: "#3b82f6",
        pending_review: "#f59e0b",
        completed: "#10b981",
    };

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-muted/30"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={colorMap[status]}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold">{value}%</span>
            </div>
        </div>
    );
}

export function PersonalizedDashboard({
    workspaceId,
    modules,
    userRole,
    userId,
}: PersonalizedDashboardProps) {
    const [isPending, startTransition] = useTransition();
    const [loadingModule, setLoadingModule] = useState<string | null>(null);
    const [reviewPromptData, setReviewPromptData] = useState<{
        projectId: string;
        ownerId: string | null;
        contributors: Array<{ id: string; displayName: string | null; avatarUrl: string | null; username: string | null }>;
        reviewedUserIds: string[];
    } | null>(null);
    const [progressValues, setProgressValues] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        modules.forEach(m => {
            initial[m.id] = m.progress ?? 0;
        });
        return initial;
    });

    const isOwner = userRole === "owner";

    const myModules = isOwner
        ? modules
        : modules.filter(m => m.assigned_to === userId);

    const pendingApprovals = modules.filter(m => m.status === "pending_review");
    const inProgressModules = myModules.filter(m => m.status === "in_progress");
    const completedModules = myModules.filter(m => m.status === "completed");
    const allCompleted = modules.length > 0 && modules.every(m => m.status === "completed");

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
            }
        });
    };

    const handleProgressChange = (moduleId: string, value: number[]) => {
        setProgressValues(prev => ({ ...prev, [moduleId]: value[0] }));
    };

    const handleProgressSave = (moduleId: string) => {
        const progress = progressValues[moduleId];
        setLoadingModule(moduleId);
        startTransition(async () => {
            const result = await updateModuleProgress(workspaceId, moduleId, progress);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Progress updated");
            }
            setLoadingModule(null);
        });
    };

    const handleMarkAsDone = (moduleId: string, moduleName: string) => {
        setLoadingModule(moduleId);
        startTransition(async () => {
            setProgressValues(prev => ({ ...prev, [moduleId]: 100 }));
            await updateModuleProgress(workspaceId, moduleId, 100);
            const result = await markModuleAsDone(workspaceId, moduleId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`"${moduleName}" submitted for approval`);
            }
            setLoadingModule(null);
        });
    };

    const handleApprove = (moduleId: string, moduleName: string) => {
        setLoadingModule(moduleId);
        startTransition(async () => {
            const result = await confirmModuleCompletion(workspaceId, moduleId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`"${moduleName}" approved and completed`);
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

    const chipStats = [
        { icon: Target, value: myModules.length, label: "Total", color: "text-primary" },
        { icon: TrendingUp, value: inProgressModules.length, label: "Active", color: "text-blue-500" },
        { icon: Zap, value: pendingApprovals.length, label: "Review", color: "text-amber-500" },
        { icon: CheckCircle2, value: completedModules.length, label: "Done", color: "text-emerald-500" },
    ];

    return (
        <div className="space-y-5">
            {/* Review Team Banner - shows when all modules completed */}
            {allCompleted && (
                <Card className="border-green-500/30 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
                    <CardContent className="flex items-center justify-between py-4 px-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <PartyPopper className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">All Modules Completed! 🎉</h3>
                                <p className="text-xs text-muted-foreground">Take a moment to review your team members.</p>
                            </div>
                        </div>
                        <Button
                            onClick={handleOpenReviewPrompt}
                            disabled={isPending}
                            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                        >
                            <Star className="h-4 w-4" />
                            Review Team
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Header with inline stat chip */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold">
                        {isOwner ? "Module Completion Dashboard" : "My Assigned Modules"}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {isOwner
                            ? "Track progress and approve completed modules"
                            : "Update your progress and submit completed work"}
                    </p>
                </div>

                {/* Horizontal Stats Chip */}
                <div className="flex items-center gap-0 bg-muted/30 rounded-full border border-border/50 px-1 py-1 shrink-0">
                    {chipStats.map((stat, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-muted/50 transition-colors cursor-default"
                            title={stat.label}
                        >
                            <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                            <span className="text-sm font-bold tabular-nums">{stat.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Owner: Pending Approvals - Compact Alert Bar */}
            {isOwner && pendingApprovals.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1 rounded-md bg-amber-500/10 ring-1 ring-amber-500/30">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                        <span className="text-sm font-semibold text-amber-500">
                            {pendingApprovals.length} Pending Approval{pendingApprovals.length > 1 ? "s" : ""}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {pendingApprovals.map((module) => (
                            <div
                                key={module.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-background/60 backdrop-blur-sm border border-border/30 hover:border-amber-500/30 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    {module.assignee ? (
                                        <Avatar className="h-7 w-7 ring-1 ring-amber-500/20">
                                            <AvatarImage src={module.assignee.avatar_url || ""} />
                                            <AvatarFallback className="text-[10px] bg-amber-500/10">
                                                {module.assignee.display_name?.substring(0, 2).toUpperCase() || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                    ) : (
                                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium">{module.name}</p>
                                        <p className="text-[11px] text-muted-foreground">
                                            by {module.assignee?.display_name || module.assignee?.username || "Unknown"}
                                        </p>
                                    </div>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400"
                                            disabled={loadingModule === module.id}
                                        >
                                            {loadingModule === module.id ? (
                                                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="mr-1.5 h-3 w-3" />
                                            )}
                                            Approve
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Approve Module Completion?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will mark &quot;{module.name}&quot; as completed and release <span className="font-semibold text-foreground">{new Intl.NumberFormat("en-US", { style: "currency", currency: module.currency || "USD" }).format(module.owner_final_cost ?? module.ai_estimated_cost ?? 0)}</span> to the assigned developer.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleApprove(module.id, module.name)}
                                                className="bg-emerald-600 hover:bg-emerald-700"
                                            >
                                                Approve
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Developer: In Progress Modules with Progress Slider */}
            {!isOwner && inProgressModules.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-blue-500/10 ring-1 ring-blue-500/30">
                            <Package className="h-3.5 w-3.5 text-blue-500" />
                        </div>
                        <span className="text-sm font-semibold">My Active Modules</span>
                    </div>
                    {inProgressModules.map((module) => {
                        const currentProgress = progressValues[module.id] ?? 0;
                        const isLoading = loadingModule === module.id;

                        return (
                            <div key={module.id} className="p-4 rounded-xl border border-border/50 hover:border-blue-500/20 transition-all bg-gradient-to-r from-blue-500/[0.03] to-transparent space-y-3">
                                <div className="flex items-center gap-3">
                                    <CircularProgress value={currentProgress} status="in_progress" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{module.name}</p>
                                        {module.description && (
                                            <p className="text-[11px] text-muted-foreground line-clamp-1">{module.description}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5 px-1">
                                    <Slider
                                        value={[currentProgress]}
                                        onValueChange={(v) => handleProgressChange(module.id, v)}
                                        max={100}
                                        step={5}
                                        disabled={isLoading}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                        <span>0%</span>
                                        <span>50%</span>
                                        <span>100%</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => handleProgressSave(module.id)}
                                        disabled={isLoading || currentProgress === module.progress}
                                    >
                                        {isLoading ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : null}
                                        Save
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                                                <CheckCircle2 className="mr-1.5 h-3 w-3" />
                                                Mark Done
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Submit for Approval?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will submit &quot;{module.name}&quot; for owner approval. Make sure your work is complete.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleMarkAsDone(module.id, module.name)}>
                                                    Submit
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Developer: Awaiting Approval */}
            {!isOwner && pendingApprovals.filter(m => m.assigned_to === userId).length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-sm font-semibold text-amber-500">Awaiting Approval</span>
                    </div>
                    <div className="space-y-2">
                        {pendingApprovals.filter(m => m.assigned_to === userId).map((module) => (
                            <div key={module.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background/60 border border-border/30">
                                <p className="text-sm font-medium">{module.name}</p>
                                <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 bg-amber-500/5 px-2 py-0.5">
                                    <Clock className="mr-1 h-2.5 w-2.5" />
                                    Pending
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Owner: All Modules - Creative Grid */}
            {isOwner && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">All Modules</h3>
                        <span className="text-[11px] text-muted-foreground">{modules.length} modules</span>
                    </div>
                    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {modules.map((module) => {
                            const status = statusConfig[module.status];
                            return (
                                <div
                                    key={module.id}
                                    className={`group relative p-4 rounded-xl border border-border/40 hover:border-border/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/5 bg-gradient-to-br from-card to-card/50`}
                                >
                                    {/* Top accent */}
                                    <div className={`absolute top-0 left-3 right-3 h-[2px] rounded-b-full ${status.bg}`} />

                                    <div className="flex items-start gap-3">
                                        <CircularProgress
                                            value={module.progress}
                                            size={44}
                                            strokeWidth={4}
                                            status={module.status}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{module.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {module.assignee ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <Avatar className="h-4 w-4">
                                                            <AvatarImage src={module.assignee.avatar_url || ""} />
                                                            <AvatarFallback className="text-[8px]">
                                                                {module.assignee.display_name?.substring(0, 2).toUpperCase() || "U"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-[11px] text-muted-foreground truncate">
                                                            {module.assignee.display_name || module.assignee.username}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-muted-foreground">Unassigned</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom status badge */}
                                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/30">
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] px-2 py-0 h-5 ${status.color} border-current/20 ${status.bg} ring-1 ${status.ring}`}
                                        >
                                            {status.icon}
                                            <span className="ml-1">{status.label}</span>
                                        </Badge>
                                        {module.owner_final_cost && (
                                            <span className="text-[11px] font-medium text-muted-foreground">
                                                {new Intl.NumberFormat("en-US", {
                                                    style: "currency",
                                                    currency: module.currency || "USD",
                                                    maximumFractionDigits: 0,
                                                }).format(module.owner_final_cost)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Empty state for developer with no modules */}
            {!isOwner && myModules.length === 0 && (
                <div className="rounded-xl border border-dashed border-border/50 p-10 text-center">
                    <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-white/10 flex items-center justify-center mb-3">
                        <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-medium mb-1">No Modules Assigned</h3>
                    <p className="text-xs text-muted-foreground">
                        You don&apos;t have any modules assigned to you yet.
                    </p>
                </div>
            )}

            {/* Review Prompt Modal */}
            {reviewPromptData && (
                <ReviewPromptModal
                    isOpen={!!reviewPromptData}
                    onClose={() => setReviewPromptData(null)}
                    projectId={reviewPromptData.projectId}
                    ownerId={reviewPromptData.ownerId}
                    contributors={reviewPromptData.contributors}
                    currentUserId={userId}
                    currentUserRole={userRole}
                    reviewedUserIds={reviewPromptData.reviewedUserIds}
                />
            )}
        </div>
    );
}
