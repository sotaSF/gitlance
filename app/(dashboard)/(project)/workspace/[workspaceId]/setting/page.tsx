import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getWorkspaceSettings, getTeamMembers, getWorkspaceRepository, getWorkspaceModules } from "./actions";
import { SettingsTabs } from "./components/SettingsTabs";
import { Skeleton } from "@/components/ui/skeleton";

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const [settingsResult, membersResult, repoResult, modulesResult] = await Promise.all([
    getWorkspaceSettings(workspaceId),
    getTeamMembers(workspaceId),
    getWorkspaceRepository(workspaceId),
    getWorkspaceModules(workspaceId),
  ]);

  if (settingsResult.error === "Unauthorized") {
    redirect(`/workspace/${workspaceId}`);
  }

  if (settingsResult.error || !settingsResult.workspace) {
    notFound();
  }

  return (
    <div className="container max-w-5xl py-8 px-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Workspace Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your workspace configuration, team, and permissions
        </p>
      </div>

      {/* Settings Content */}
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsTabs
          workspaceId={workspaceId}
          workspace={settingsResult.workspace}
          metadata={settingsResult.metadata!}
          userRole={settingsResult.userRole!}
          canManageSettings={settingsResult.canManageSettings!}
          members={membersResult.members}
          repo={repoResult.repo}
          modules={modulesResult.modules}
          currentUserId={settingsResult.userId!}
        />
      </Suspense>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

