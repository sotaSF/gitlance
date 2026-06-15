import { getUserWorkspaces, checkGitHubScopesStatus } from "./actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { WorkspacesList } from "./components/WorkspacesList";
import { GitHubScopeBanner } from "./components/GitHubScopeBanner";

export default async function WorkspacesPage() {
  const [workspaces, scopeStatus] = await Promise.all([
    getUserWorkspaces(),
    checkGitHubScopesStatus(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workspaces</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your projects and team collaborations.
          </p>
        </div>

      </div>

      {/* GitHub Scope Banner */}
      <GitHubScopeBanner status={scopeStatus} />

      <WorkspacesList initialWorkspaces={workspaces} />
    </div>
  );
}
