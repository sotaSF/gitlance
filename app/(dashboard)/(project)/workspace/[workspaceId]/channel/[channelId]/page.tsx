import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Hash, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ChatInterface } from "../components/ChatInterface";
import { MembersModalClient } from "../components/MembersModalClient";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ workspaceId: string; channelId: string }>;
}) {
  const { workspaceId, channelId } = await params;
  const supabase = await createServerSupabase();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect('/login');

  // 1. Fetch channel details along with workspace metadata
  const { data: channel, error: channelError } = await supabase
    .from("workspace_channels")
    .select("*, workspace:project_workspaces(project_id, metadata)")
    .eq("id", channelId)
    .eq("workspace_id", workspaceId)
    .single();

  if (channelError) {
    console.error("Error fetching channel:", channelError);
  }

  if (!channel) notFound();

  const projectId = channel.workspace.project_id;
  const workspaceMetadata = channel.workspace.metadata as any;
  const isWorkspacePaused = workspaceMetadata?.is_paused === true;

  // 2. Access control check
  // Is this user a project owner?
  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .single();

  const isOwner = project?.owner_id === userData.user.id;

  // If not owner, check if user is in channel_members (or if it's general/dev which might be open to all team members)
  let hasAccess = isOwner;

  if (!hasAccess) {
    if (channel.name === "general" || channel.name === "dev") {
      // Check if they are part of the workspace team
      const { data: teamMember } = await supabase
        .from("project_team_members")
        .select("profile_id")
        .eq("project_id", projectId)
        .eq("profile_id", userData.user.id)
        .single();

      if (teamMember) {
        hasAccess = true;

        // Ensure team members have an explicit channel membership row so
        // RLS policies on workspace_channel_messages (which check
        // workspace_channel_members) allow them to post.
        const { data: existingMember } = await supabase
          .from("workspace_channel_members")
          .select("id")
          .eq("channel_id", channelId)
          .eq("user_id", userData.user.id)
          .maybeSingle();

        if (!existingMember) {
          const admin = createAdminSupabase();
          await admin.from("workspace_channel_members").insert([
            { channel_id: channelId, user_id: userData.user.id, added_by: userData.user.id },
          ]);
        }
      }
    } else {
      // Check explicit channel membership
      const { data: member } = await supabase
        .from("workspace_channel_members")
        .select("id")
        .eq("channel_id", channelId)
        .eq("user_id", userData.user.id)
        .single();

      if (member) hasAccess = true;
    }
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center">
        <div className="bg-muted p-6 rounded-full mb-6">
          <Hash className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">
          You do not have permission to view this channel. The project owner needs to add you.
        </p>
      </div>
    );
  }

  // 3. Fetch initial messages
  const { data: initialMessages, error: initialMessagesError } = await supabase
    .from("workspace_channel_messages")
    .select(`
      *,
      profiles (
        display_name,
        avatar_url
      )
    `)
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (initialMessages) {
    initialMessages.reverse();
  }

  if (initialMessagesError) {
    console.error("Error fetching initial messages:", initialMessagesError);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Channel Header */}
      <div className="flex h-14 items-center border-b px-6 justify-between shrink-0 bg-background z-10">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-semibold">{channel.name}</h1>
          {channel.description && (
            <>
              <Separator orientation="vertical" className="h-4 mx-2 hidden md:block" />
              <span className="text-sm text-muted-foreground hidden md:block">{channel.description}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isOwner && (
            <MembersModalClient
              channelId={channel.id}
              workspaceId={workspaceId}
              projectId={projectId}
            />
          )}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <ChatInterface
          channelId={channelId}
          workspaceId={workspaceId}
          initialMessages={initialMessages || []}
          currentUserId={userData.user.id}
          isPaused={isWorkspacePaused && channel.name !== "general"}
        />
      </div>
    </div>
  );
}
