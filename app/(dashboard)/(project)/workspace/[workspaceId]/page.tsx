import {
  getWorkspaceData,
  checkProjectRepository,
  fetchGitHubStats,
} from "../actions";
import { checkGitHubScopesStatus } from "@/app/(dashboard)/workspaces/actions";
import { GitHubScopeBanner } from "@/app/(dashboard)/workspaces/components/GitHubScopeBanner";
import { GitHubStats } from "@/types/workspace";
import { StatsCard } from "./components/StatsCard";
import { ContributorList } from "./components/ContributorList";
import { RepositoryInfo } from "./components/RepositoryInfo";
import {
  CommitGraphWrapper,
  LanguageChartWrapper,
  PullRequestChartWrapper,
  RecentActivityWrapper,
  CodeFrequencyWrapper,
} from "./components/LazyCharts";
import { AlertCircle, Github } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getWorkspaceModules } from "./setting/actions";
import { PersonalizedDashboard } from "./components/PersonalizedDashboard";
import { DashboardAnimator } from "./components/DashboardAnimator";

type ErrorResult = { error: string; needsReauth: boolean; errorType?: string };

function isErrorResult(
  result: GitHubStats | ErrorResult | null
): result is ErrorResult {
  return result !== null && "error" in result && "needsReauth" in result;
}

function isValidStats(
  result: GitHubStats | ErrorResult | null
): result is GitHubStats {
  return result !== null && !("error" in result) && "commits" in result;
}

export default async function WorkspaceDashboardPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  // Parallel data fetching for better performance
  const [workspaceResult, repoResult, scopeStatus, modulesResult] = await Promise.all([
    getWorkspaceData(workspaceId),
    getWorkspaceData(workspaceId).then(({ workspace }) =>
      checkProjectRepository(workspace.project_id)
    ),
    checkGitHubScopesStatus(),
    getWorkspaceModules(workspaceId),
  ]);

  const { workspace, userRole } = workspaceResult;
  const { hasRepo, repo } = repoResult;
  const modules = modulesResult.modules || [];

  // Get current user ID for PersonalizedDashboard
  const userId = workspaceResult.members?.find(
    m => m.role === userRole && userRole !== "owner"
  )?.profile_id || "";
  const currentUserId = userRole === "owner" ? "owner" : userId;

  if (!hasRepo || !repo?.repo_full_name) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Repository Linked</AlertTitle>
          <AlertDescription className="mt-2">
            This workspace is not linked to a GitHub repository. Stats cannot be
            displayed.
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link href={`/project/${workspace.project_id}/settings`}>
                  Link Repository
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  let statsResult;
  try {
    statsResult = await fetchGitHubStats(repo.repo_full_name);
  } catch (error) {
    statsResult = { error: "Repository access error", needsReauth: false, errorType: "REPO_NOT_FOUND" };
  }

  if (isErrorResult(statsResult)) {
    if (!scopeStatus.hasRequiredScopes) {
      return (
        <div className="p-6 space-y-6">
          <GitHubScopeBanner status={scopeStatus} />
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Repository Stats Unavailable</AlertTitle>
            <AlertDescription>
              Grant the required GitHub permissions above to access repository statistics for{" "}
              <span className="font-mono">{repo.repo_full_name}</span>.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    if (statsResult.errorType === "REPO_NOT_FOUND") {
      const canSeeSettings = userRole === "owner" || userRole === "maintainer";
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/50 ring-1 ring-white/10 mb-4">
            <Github className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Repository Access Needed
          </h2>
          <p className="text-muted-foreground max-w-md mb-6">
            We couldn&apos;t access{" "}
            <span className="font-mono text-foreground">
              {repo.repo_full_name}
            </span>
            . You may need to accept the collaboration invitation.
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <Link
                href="https://github.com/notifications"
                target="_blank"
                rel="noopener noreferrer"
              >
                Check GitHub Notifications
              </Link>
            </Button>
            {canSeeSettings && (
              <Button asChild variant="outline">
                <Link href={`/project/${workspace.project_id}/settings`}>
                  Project Settings
                </Link>
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <Alert variant={statsResult.needsReauth ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {statsResult.needsReauth
              ? "GitHub Connection Required"
              : "Stats Unavailable"}
          </AlertTitle>
          <AlertDescription className="mt-2">
            {statsResult.error}
            {statsResult.needsReauth && (
              <div className="mt-4">
                <Button asChild size="sm">
                  <Link href="/settings">
                    <Github className="mr-2 h-4 w-4" />
                    Reconnect GitHub
                  </Link>
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isValidStats(statsResult)) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Stats Unavailable</AlertTitle>
          <AlertDescription>
            Could not fetch GitHub statistics. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const stats = statsResult as GitHubStats;

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto w-full">
      {/* GitHub Scope Banner */}
      <GitHubScopeBanner status={scopeStatus} />

      <DashboardAnimator>
        {/* Header */}
        <div className="dash-animate">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Repository overview and insights
          </p>
        </div>

        {/* Personalized Dashboard for module progress */}
        {userRole && modules.length > 0 && (
          <div className="dash-animate">
            <PersonalizedDashboard
              workspaceId={workspaceId}
              modules={modules.map(m => ({
                id: m.id,
                name: m.name,
                description: m.description,
                status: m.status,
                progress: m.progress ?? 0,
                assigned_to: m.assigned_to,
                assignee: m.assignee,
                owner_final_cost: m.owner_final_cost,
                ai_estimated_cost: m.ai_estimated_cost,
                currency: m.currency,
              }))}
              userRole={userRole}
              userId={currentUserId}
            />
          </div>
        )}

        {/* Repository Info */}
        <div className="dash-animate">
          <RepositoryInfo
            repoFullName={repo.repo_full_name}
            stars={stats.stars}
            forks={stats.forks}
            watchers={stats.watchers}
            defaultBranch={stats.defaultBranch}
            repoSize={stats.repoSize}
            lastUpdate={stats.lastUpdate}
          />
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 dash-animate">
          <StatsCard
            title="Commits"
            value={stats.commits}
            iconName="git-commit"
            description="Recent commits"
          />
          <StatsCard
            title="Pull Requests"
            value={stats.pullRequests}
            iconName="git-pull-request"
            description={`${stats.openPullRequests} open`}
          />
          <StatsCard
            title="Issues"
            value={stats.issues}
            iconName="circle-dot"
            description={`${stats.openIssues} open`}
          />
          <StatsCard
            title="Contributors"
            value={stats.contributors}
            iconName="users"
            description="Active contributors"
          />
        </div>

        {/* Commit Graph & Contributors */}
        <div className="grid gap-4 lg:grid-cols-7 dash-animate">
          <CommitGraphWrapper data={stats.commitActivity} />
          <ContributorList contributors={stats.topContributors} />
        </div>

        {/* Languages, PRs, Activity */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 dash-animate">
          <LanguageChartWrapper languages={stats.languages} />
          <PullRequestChartWrapper
            open={stats.openPullRequests}
            closed={stats.closedPullRequests}
            merged={stats.mergedPullRequests}
            total={stats.pullRequests}
          />
          <RecentActivityWrapper activities={stats.recentActivity} />
        </div>

        {/* Code Frequency */}
        {stats.codeFrequency.length > 0 && (
          <div className="dash-animate">
            <CodeFrequencyWrapper data={stats.codeFrequency} />
          </div>
        )}
      </DashboardAnimator>
    </div>
  );
}
