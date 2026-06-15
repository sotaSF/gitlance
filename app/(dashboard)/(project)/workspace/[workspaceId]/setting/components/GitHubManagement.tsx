"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Loader2,
  Github,
  ExternalLink,
  UserPlus,
  UserMinus,
  RefreshCw,
  AlertCircle,
  Check,
  Clock,
  XCircle,
} from "lucide-react";
import { ProjectRepository } from "@/types/workspace";
import {
  inviteToRepository,
  removeFromRepository,
  getMemberGitHubStatus,
  getAllMembersGitHubStatus,
  type GitHubAccessStatus,
} from "../actions";

interface GitHubManagementProps {
  workspaceId: string;
  repo: ProjectRepository | null;
  members: Array<{
    id: string;
    profile_id: string;
    role: string;
    profile: {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
      username: string | null;
      github_username?: string | null;
    };
  }>;
  canManageSettings: boolean;
}

type GitHubStatus = GitHubAccessStatus | "loading";

const statusConfig: Record<
  GitHubStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
  }
> = {
  active: {
    label: "Active",
    variant: "default",
    icon: <Check className="h-3 w-3" />,
  },
  invited: {
    label: "Pending",
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />,
  },
  not_invited: {
    label: "Not Invited",
    variant: "outline",
    icon: <XCircle className="h-3 w-3" />,
  },
  no_github: {
    label: "No GitHub",
    variant: "outline",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  no_repo: {
    label: "No Repo",
    variant: "outline",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  error: {
    label: "Error",
    variant: "destructive",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  loading: {
    label: "Loading",
    variant: "outline",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
};

// Skeleton row for loading state
function MemberRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-28" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-20" />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-16" />
        </div>
      </TableCell>
    </TableRow>
  );
}

export function GitHubManagement({
  workspaceId,
  repo,
  members,
  canManageSettings,
}: GitHubManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [memberStatuses, setMemberStatuses] = useState<
    Record<string, GitHubStatus>
  >({});
  const [loadingMember, setLoadingMember] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load status for all members at once on mount (batch fetch - much faster!)
  useEffect(() => {
    if (!repo?.repo_full_name) {
      setIsInitialLoading(false);
      return;
    }

    const loadStatuses = async () => {
      setIsInitialLoading(true);

      // Set all to loading state
      const loadingStatuses: Record<string, GitHubStatus> = {};
      for (const member of members) {
        loadingStatuses[member.profile_id] = "loading";
      }
      setMemberStatuses(loadingStatuses);

      // Prepare member data for batch fetch
      const memberData = members.map((m) => ({
        profile_id: m.profile_id,
        github_username: m.profile?.github_username || null,
      }));

      // Single batch call to get all statuses at once
      const result = await getAllMembersGitHubStatus(workspaceId, memberData);
      setMemberStatuses(result.statuses as Record<string, GitHubStatus>);
      setIsInitialLoading(false);
    };

    loadStatuses();
  }, [workspaceId, repo, members]);

  const handleInvite = (profileId: string, displayName: string) => {
    setLoadingMember(profileId);
    startTransition(async () => {
      const result = await inviteToRepository(workspaceId, profileId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Invitation sent to ${displayName}`);
        setMemberStatuses((prev) => ({
          ...prev,
          [profileId]: "invited",
        }));
      }
      setLoadingMember(null);
    });
  };

  const handleRemove = (profileId: string, displayName: string) => {
    setLoadingMember(profileId);
    startTransition(async () => {
      const result = await removeFromRepository(workspaceId, profileId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${displayName} has been removed from the repository`);
        setMemberStatuses((prev) => ({
          ...prev,
          [profileId]: "not_invited",
        }));
      }
      setLoadingMember(null);
    });
  };

  const refreshStatus = async (profileId: string) => {
    setMemberStatuses((prev) => ({
      ...prev,
      [profileId]: "loading",
    }));

    try {
      const result = await getMemberGitHubStatus(workspaceId, profileId);
      setMemberStatuses((prev) => ({
        ...prev,
        [profileId]: result.status as GitHubStatus,
      }));
    } catch (error) {
      setMemberStatuses((prev) => ({
        ...prev,
        [profileId]: "error",
      }));
    }
  };

  if (!repo) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Repository Linked</AlertTitle>
        <AlertDescription>
          This workspace is not linked to a GitHub repository. Link a repository
          first to manage collaborators.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Repository Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Repository
          </CardTitle>
          <CardDescription>
            Linked GitHub repository for this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-mono text-lg font-medium">
                {repo.repo_full_name}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant={repo.is_private ? "secondary" : "outline"}>
                  {repo.is_private ? "Private" : "Public"}
                </Badge>
                <Badge variant="outline">{repo.provider}</Badge>
              </div>
            </div>
            {repo.repo_url && (
              <Button variant="outline" asChild>
                <a
                  href={repo.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Collaborators Card */}
      <Card>
        <CardHeader>
          <CardTitle>Repository Access</CardTitle>
          <CardDescription>
            Manage GitHub repository access for team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>GitHub Username</TableHead>
                <TableHead>Access Status</TableHead>
                {canManageSettings && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isInitialLoading
                ? // Show skeleton rows during initial load
                Array.from({ length: Math.min(members.length, 4) }).map(
                  (_, i) => <MemberRowSkeleton key={i} />
                )
                : members.map((member) => {
                  const status =
                    memberStatuses[member.profile_id] || "loading";
                  const statusInfo = statusConfig[status];
                  const isLoading = loadingMember === member.profile_id;

                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={member.profile?.avatar_url || ""}
                            />
                            <AvatarFallback>
                              {member.profile?.display_name
                                ?.substring(0, 2)
                                .toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {member.profile?.display_name || "Unknown"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.role}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.profile?.github_username ? (
                          <span className="font-mono text-sm">
                            @{member.profile.github_username}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Not connected
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant} className="gap-1">
                          {statusInfo.icon}
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      {canManageSettings && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => refreshStatus(member.profile_id)}
                              disabled={status === "loading" || isLoading}
                            >
                              <RefreshCw
                                className={`h-4 w-4 ${status === "loading" ? "animate-spin" : ""
                                  }`}
                              />
                            </Button>

                            {status === "not_invited" &&
                              member.profile?.github_username && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleInvite(
                                      member.profile_id,
                                      member.profile?.display_name || "Member"
                                    )
                                  }
                                  disabled={isLoading || isPending}
                                >
                                  {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <UserPlus className="mr-2 h-4 w-4" />
                                  )}
                                  Invite
                                </Button>
                              )}

                            {status === "invited" &&
                              member.profile?.github_username && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleInvite(
                                      member.profile_id,
                                      member.profile?.display_name || "Member"
                                    )
                                  }
                                  disabled={isLoading || isPending}
                                >
                                  {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                  )}
                                  Resend
                                </Button>
                              )}

                            {(status === "active" ||
                              status === "invited") && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-destructive border-destructive/50 hover:bg-destructive/10"
                                      disabled={isLoading || isPending}
                                    >
                                      {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <UserMinus className="mr-2 h-4 w-4" />
                                      )}
                                      Remove
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Remove Repository Access
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to remove{" "}
                                        <strong>
                                          {member.profile?.display_name}
                                        </strong>{" "}
                                        from the GitHub repository? They will
                                        lose push access to the codebase.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleRemove(
                                            member.profile_id,
                                            member.profile?.display_name ||
                                            "Member"
                                          )
                                        }
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Remove Access
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}

                            {status === "no_github" && (
                              <span className="text-xs text-muted-foreground">
                                User needs to connect GitHub
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>

          {!canManageSettings && (
            <p className="text-sm text-muted-foreground mt-4">
              Only workspace owners can manage GitHub repository access.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
