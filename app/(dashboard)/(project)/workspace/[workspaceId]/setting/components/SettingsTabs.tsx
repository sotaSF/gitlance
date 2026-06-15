"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, Github, Package, AlertTriangle } from "lucide-react";
import { WorkspaceMetadata, TeamRole, ProjectRepository } from "@/types/workspace";
import { GeneralSettings } from "./GeneralSettings";
import { TeamManagement } from "./TeamManagement";
import { GitHubManagement } from "./GitHubManagement";
import { ModulesManagement } from "./ModulesManagement";
import { DangerZone } from "./DangerZone";

interface SettingsTabsProps {
  workspaceId: string;
  workspace: {
    id: string;
    name: string;
    project_id: string;
    metadata?: Record<string, any>;
  };
  metadata: WorkspaceMetadata;
  userRole: TeamRole;
  canManageSettings: boolean;
  members: any[];
  repo: ProjectRepository | null;
  modules: any[];
  currentUserId: string;
}

export function SettingsTabs({
  workspaceId,
  workspace,
  metadata,
  userRole,
  canManageSettings,
  members,
  repo,
  modules,
  currentUserId,
}: SettingsTabsProps) {
  // Only owner can see GitHub tab
  const isOwner = userRole === "owner";

  // Calculate number of visible tabs for grid
  const tabCount = 3 + (isOwner ? 1 : 0) + (canManageSettings ? 1 : 0); // general, team, modules + github (owner) + danger (owner)

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className={`grid w-full lg:w-auto lg:inline-grid`} style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}>
        <TabsTrigger value="general" className="gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">General</span>
        </TabsTrigger>
        <TabsTrigger value="team" className="gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Team</span>
        </TabsTrigger>
        {isOwner && (
          <TabsTrigger value="github" className="gap-2">
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
          </TabsTrigger>
        )}
        <TabsTrigger value="modules" className="gap-2">
          <Package className="h-4 w-4" />
          <span className="hidden sm:inline">Modules</span>
        </TabsTrigger>
        {canManageSettings && (
          <TabsTrigger value="danger" className="gap-2 text-destructive data-[state=active]:text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Danger</span>
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="general" className="space-y-6">
        <GeneralSettings
          workspaceId={workspaceId}
          workspace={workspace}
          metadata={metadata}
          canManageSettings={canManageSettings}
        />
      </TabsContent>

      <TabsContent value="team" className="space-y-6">
        <TeamManagement
          workspaceId={workspaceId}
          members={members}
          userRole={userRole}
          canManageSettings={canManageSettings}
        />
      </TabsContent>

      {isOwner && (
        <TabsContent value="github" className="space-y-6">
          <GitHubManagement
            workspaceId={workspaceId}
            repo={repo}
            members={members}
            canManageSettings={canManageSettings}
          />
        </TabsContent>
      )}

      <TabsContent value="modules" className="space-y-6">
        <ModulesManagement
          workspaceId={workspaceId}
          modules={modules}
          members={members}
          userRole={userRole}
          currentUserId={currentUserId}
        />
      </TabsContent>

      {canManageSettings && (
        <TabsContent value="danger" className="space-y-6">
          <DangerZone
            workspaceId={workspaceId}
            workspaceName={workspace.name}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}

