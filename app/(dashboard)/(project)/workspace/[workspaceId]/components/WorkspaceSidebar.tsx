"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { WorkspaceRecord, WorkspaceChannel, WorkspaceMember, TeamRole, WorkspaceMetadata, ProjectModule } from "@/types/workspace";
import { useState } from "react";
import {
  Hash,
  Settings,
  Users,
  Home,
  Pause,
  Plus,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateChannelModal } from "../channel/components/CreateChannelModal";
import { DeleteChannelDialog } from "../channel/components/DeleteChannelDialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

interface WorkspaceSidebarProps {
  workspace: WorkspaceRecord;
  channels: WorkspaceChannel[];
  members: WorkspaceMember[];
  userRole: TeamRole | null;
  modules: ProjectModule[];
}

export function WorkspaceSidebar({ workspace, channels, members, userRole, modules }: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const metadata = (workspace.metadata || {}) as WorkspaceMetadata;
  const isPaused = metadata.is_paused;
  const canAccessSettings = userRole === 'owner' || userRole === 'maintainer';

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<WorkspaceChannel | null>(null);

  return (
    <Sidebar collapsible="icon">
      {/* Workspace Header */}
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip={workspace.name}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <span className="text-sm font-bold">
                  {workspace.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold truncate">{workspace.name}</span>
                {isPaused && (
                  <span className="text-[10px] text-destructive flex items-center gap-0.5">
                    <Pause className="h-2.5 w-2.5" />
                    Paused
                  </span>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === `/workspace/${workspace.id}`}
                  tooltip="Dashboard"
                >
                  <Link href={`/workspace/${workspace.id}`}>
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {canAccessSettings && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.includes('/setting')}
                    tooltip="Settings"
                  >
                    <Link href={`/workspace/${workspace.id}/setting`}>
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Channels */}
        <SidebarGroup>
          <div className="flex items-center justify-between pr-2">
            <SidebarGroupLabel>Channels</SidebarGroupLabel>
            {canAccessSettings && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="h-5 w-5 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center justify-center text-muted-foreground transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="sr-only">Create Channel</span>
              </button>
            )}
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {channels.map((channel) => (
                <SidebarMenuItem key={channel.id} className="group flex items-center pr-2">
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.includes(`/channel/${channel.id}`)}
                    tooltip={`#${channel.name}`}
                    className="flex-1"
                  >
                    <Link href={`/workspace/${workspace.id}/channel/${channel.id}`}>
                      <Hash className="h-4 w-4" />
                      <span>{channel.name}</span>
                    </Link>
                  </SidebarMenuButton>

                  {canAccessSettings && channel.name !== "general" && channel.name !== "dev" && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setChannelToDelete(channel);
                      }}
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 shrink-0 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-all focus:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Delete {channel.name}</span>
                    </button>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Team Members */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <Users className="h-4 w-4 mr-2" />
            Team
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {members.map((member) => (
                <SidebarMenuItem key={member.id}>
                  <SidebarMenuButton
                    className="cursor-default"
                    tooltip={`${member.profile?.display_name || "Unknown"} (${member.role})`}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={member.profile?.avatar_url || ""} />
                      <AvatarFallback className="text-[8px]">
                        {member.profile?.display_name?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden leading-tight">
                      <span className="text-sm truncate">
                        {member.profile?.display_name || "Unknown"}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate capitalize">
                        {member.role}
                      </span>
                    </div>
                    <div className={cn(
                      "ml-auto h-2 w-2 rounded-full shrink-0",
                      member.active !== false ? 'bg-emerald-500' : 'bg-gray-400'
                    )} />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Rail for collapse/expand */}
      <SidebarRail />

      <CreateChannelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        workspaceId={workspace.id}
      />

      <DeleteChannelDialog
        isOpen={!!channelToDelete}
        onClose={() => setChannelToDelete(null)}
        workspaceId={workspace.id}
        channel={channelToDelete}
      />
    </Sidebar>
  );
}
