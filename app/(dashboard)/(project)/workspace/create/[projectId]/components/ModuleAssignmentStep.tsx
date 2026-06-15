"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Package,
    User,
    DollarSign,
    Users,
    Layers,
} from "lucide-react";
import type {
    ModuleAssignmentData,
    ModuleAssignment,
} from "../../../actions";

interface ModuleAssignmentStepProps {
    data: ModuleAssignmentData;
    onComplete: (assignments: ModuleAssignment[]) => void;
    onBack: () => void;
}

export function ModuleAssignmentStep({
    data,
    onComplete,
    onBack,
}: ModuleAssignmentStepProps) {
    // State for conflict resolutions: moduleId -> assigneeId
    const [conflictResolutions, setConflictResolutions] = useState<
        Record<string, string>
    >({});

    // Calculate assignments based on proposals and conflict resolutions
    const { assignments, unresolvedConflicts, canProceed, totalProposedCost } = useMemo(() => {
        const assignmentMap: Record<
            string,
            { assigneeId: string; proposedCost: number }
        > = {};

        // First, process non-conflicting modules (auto-assign)
        for (const proposal of data.proposals) {
            for (const module of proposal.modules) {
                if (!module.hasConflict) {
                    assignmentMap[module.id] = {
                        assigneeId: proposal.proposerId,
                        proposedCost: module.proposedCost,
                    };
                }
            }
        }

        // Then, apply conflict resolutions
        for (const conflict of data.conflicts) {
            const resolvedAssigneeId = conflictResolutions[conflict.moduleId];
            if (resolvedAssigneeId) {
                const proposer = conflict.proposers.find(
                    (p) => p.id === resolvedAssigneeId
                );
                if (proposer) {
                    assignmentMap[conflict.moduleId] = {
                        assigneeId: resolvedAssigneeId,
                        proposedCost: proposer.proposedCost,
                    };
                }
            }
        }

        const assignments: ModuleAssignment[] = Object.entries(assignmentMap).map(
            ([moduleId, { assigneeId, proposedCost }]) => ({
                moduleId,
                assigneeId,
                proposedCost,
            })
        );

        const unresolvedConflicts = data.conflicts.filter(
            (c) => !conflictResolutions[c.moduleId]
        );

        // Calculate total proposed cost from resolved assignments
        const totalProposedCost = Object.values(assignmentMap).reduce(
            (sum, { proposedCost }) => sum + proposedCost,
            0
        );

        // Can proceed only if: no unselected modules AND all conflicts are resolved
        const canProceed =
            data.unselectedModules.length === 0 && unresolvedConflicts.length === 0;

        return { assignments, unresolvedConflicts, canProceed, totalProposedCost };
    }, [data, conflictResolutions]);

    const handleConflictResolve = (moduleId: string, assigneeId: string) => {
        setConflictResolutions((prev) => ({
            ...prev,
            [moduleId]: assigneeId,
        }));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Calculate original total cost
    const originalTotalCost = data.allModules.reduce(
        (sum, m) => sum + m.originalCost,
        0
    );

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{data.proposals.length}</p>
                                <p className="text-xs text-muted-foreground">Freelancers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Layers className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{data.allModules.length}</p>
                                <p className="text-xs text-muted-foreground">Modules</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <DollarSign className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{formatCurrency(totalProposedCost)}</p>
                                <p className="text-xs text-muted-foreground">
                                    <span className="line-through">{formatCurrency(originalTotalCost)}</span>
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Status Overview */}
            <Card>
                <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        {/* Conflicts Status */}
                        <div className="flex items-center gap-2">
                            {data.conflicts.length > 0 ? (
                                unresolvedConflicts.length > 0 ? (
                                    <>
                                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                        <span className="text-sm">
                                            <span className="font-medium text-amber-600 dark:text-amber-400">
                                                {unresolvedConflicts.length} conflict{unresolvedConflicts.length > 1 ? "s" : ""}
                                            </span>
                                            <span className="text-muted-foreground"> to resolve</span>
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <span className="text-sm text-green-600 dark:text-green-400">All conflicts resolved</span>
                                    </>
                                )
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-muted-foreground">No conflicts detected</span>
                                </>
                            )}
                        </div>

                        {/* Unselected Modules Status */}
                        {data.unselectedModules.length > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-destructive" />
                                <span className="text-sm">
                                    <span className="font-medium text-destructive">
                                        {data.unselectedModules.length} module{data.unselectedModules.length > 1 ? "s" : ""}
                                    </span>
                                    <span className="text-muted-foreground"> unassigned</span>
                                </span>
                            </div>
                        )}

                        {/* Assigned Count */}
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-sm text-muted-foreground">
                                {assignments.length}/{data.allModules.length} assigned
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Unselected Modules Warning */}
            {data.unselectedModules.length > 0 && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Cannot Create Workspace</AlertTitle>
                    <AlertDescription>
                        The following modules have not been selected by any freelancer. You need to accept more proposals
                        or adjust the project scope.
                        <ul className="mt-2 list-disc list-inside">
                            {data.unselectedModules.map((module) => (
                                <li key={module.id} className="text-sm">
                                    {module.name} ({formatCurrency(module.originalCost)})
                                </li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {/* Conflict Resolution Cards */}
            {data.conflicts.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Resolve Conflicts</h3>
                        <Badge variant={unresolvedConflicts.length > 0 ? "outline" : "secondary"} className="text-xs">
                            {data.conflicts.length - unresolvedConflicts.length}/{data.conflicts.length} resolved
                        </Badge>
                    </div>
                    {data.conflicts.map((conflict) => {
                        const isResolved = !!conflictResolutions[conflict.moduleId];
                        const selectedAssignee = conflictResolutions[conflict.moduleId];

                        return (
                            <Card
                                key={conflict.moduleId}
                                className={isResolved ? "border-green-500/50" : "border-amber-500/50"}
                            >
                                <CardHeader className="pb-2 pt-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {isResolved ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            )}
                                            <CardTitle className="text-sm font-medium">
                                                {conflict.moduleName}
                                            </CardTitle>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">Original:</span>
                                            <Badge variant="outline" className="text-xs">
                                                {formatCurrency(conflict.originalCost)}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-4">
                                    <Select
                                        value={selectedAssignee || ""}
                                        onValueChange={(value) =>
                                            handleConflictResolve(conflict.moduleId, value)
                                        }
                                    >
                                        <SelectTrigger
                                            className={`h-9 ${isResolved ? "border-green-500/50" : "border-amber-500/50"
                                                }`}
                                        >
                                            <SelectValue placeholder="Select who should work on this..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {conflict.proposers.map((proposer) => (
                                                <SelectItem key={proposer.id} value={proposer.id}>
                                                    <div className="flex items-center justify-between gap-4 w-full">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-5 w-5">
                                                                <AvatarImage src={proposer.avatarUrl || ""} />
                                                                <AvatarFallback className="text-[10px]">
                                                                    {proposer.displayName?.charAt(0).toUpperCase() || "U"}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span>{proposer.displayName || "Unknown"}</span>
                                                        </div>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {formatCurrency(proposer.proposedCost)}
                                                        </Badge>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Freelancer Overview */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium">Team Overview</h3>
                {data.proposals.map((proposal) => {
                    // Calculate which modules this proposer is assigned
                    const assignedModules = proposal.modules.filter((m) => {
                        if (m.hasConflict) {
                            return conflictResolutions[m.id] === proposal.proposerId;
                        }
                        return true;
                    });

                    const totalAssignedCost = assignedModules.reduce(
                        (sum, m) => sum + m.proposedCost,
                        0
                    );

                    return (
                        <Card key={proposal.id}>
                            <CardHeader className="pb-2 pt-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={proposal.proposerAvatar || ""} />
                                            <AvatarFallback className="text-xs">
                                                {proposal.proposerName?.charAt(0).toUpperCase() || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-sm font-medium">
                                                {proposal.proposerName || "Unknown"}
                                            </CardTitle>
                                            {proposal.proposerUsername && (
                                                <p className="text-xs text-muted-foreground">
                                                    @{proposal.proposerUsername}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium">
                                            {formatCurrency(totalAssignedCost)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {assignedModules.length} module{assignedModules.length !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <div className="space-y-1.5">
                                    {proposal.modules.map((module) => {
                                        const isAssignedToThis = module.hasConflict
                                            ? conflictResolutions[module.id] === proposal.proposerId
                                            : true;
                                        const conflictResolved =
                                            module.hasConflict && conflictResolutions[module.id];
                                        const conflictResolvedToOther =
                                            conflictResolved &&
                                            conflictResolutions[module.id] !== proposal.proposerId;

                                        return (
                                            <div
                                                key={module.id}
                                                className={`flex items-center justify-between py-1.5 px-2.5 rounded border text-sm ${conflictResolvedToOther
                                                        ? "opacity-40 bg-muted/30 border-transparent"
                                                        : module.hasConflict && !conflictResolved
                                                            ? "border-amber-500/30 bg-amber-500/5"
                                                            : "border-border"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {module.hasConflict ? (
                                                        conflictResolvedToOther ? (
                                                            <User className="h-3 w-3 text-muted-foreground" />
                                                        ) : isAssignedToThis ? (
                                                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                        ) : (
                                                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                                                        )
                                                    ) : (
                                                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                    )}
                                                    <span
                                                        className={
                                                            conflictResolvedToOther
                                                                ? "line-through text-muted-foreground"
                                                                : ""
                                                        }
                                                    >
                                                        {module.name}
                                                    </span>
                                                    {module.hasConflict && !conflictResolved && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] border-amber-500/50 text-amber-600 dark:text-amber-400 px-1.5 py-0"
                                                        >
                                                            Conflict
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground line-through">
                                                        {formatCurrency(module.originalCost)}
                                                    </span>
                                                    <span className="text-xs font-medium">
                                                        {formatCurrency(module.proposedCost)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-2 pb-4">
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button onClick={() => onComplete(assignments)} disabled={!canProceed}>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
