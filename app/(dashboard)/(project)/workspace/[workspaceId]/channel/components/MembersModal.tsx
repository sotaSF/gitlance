"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { UserPlus, X } from "lucide-react";

interface MembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    channelId: string;
    workspaceId: string;
    projectId: string;
}

type UserWithAccess = {
    id: string; // The profile/user id
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
    isMember: boolean;
};

export function MembersModal({
    isOpen,
    onClose,
    channelId,
    workspaceId,
    projectId,
}: MembersModalProps) {
    const router = useRouter();
    const [users, setUsers] = useState<UserWithAccess[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    const supabase = createClient();

    const loadData = async () => {
        setIsLoading(true);
        try {
            // 1. Get all members of the channel
            const { data: channelMembers, error: membersError } = await supabase
                .from("workspace_channel_members")
                .select("user_id")
                .eq("channel_id", channelId);

            if (membersError) throw membersError;
            const memberIds = new Set(channelMembers?.map((m) => m.user_id) || []);

            // 2. Get the workspace owner
            const { data: project } = await supabase
                .from("projects")
                .select("owner_id")
                .eq("id", projectId)
                .single();

            if (project?.owner_id) {
                memberIds.add(project.owner_id); // Owner implicitly has access
            }

            // 3. Get all people who are part of the team (from project_team_members)
            const { data: teamMembers, error: teamError } = await supabase
                .from("project_team_members")
                .select(`
          profile_id,
          role,
          profiles:profiles!team_members_profile_fk (
            id,
            display_name,
            avatar_url,
            username
          )
        `)
                .eq("project_id", projectId);

            if (teamError) throw teamError;

            // Filter/map to our UI shape
            const teamList: UserWithAccess[] = [];

            // Assume teamMembers has the profile data
            if (teamMembers) {
                for (const tm of teamMembers) {
                    const profile = tm.profiles as any; // Cast for simplicity since Supabase returns object/array
                    if (profile && profile.id !== project?.owner_id) {
                        teamList.push({
                            id: profile.id,
                            display_name: profile.display_name,
                            avatar_url: profile.avatar_url,
                            username: profile.username,
                            isMember: memberIds.has(profile.id),
                        });
                    }
                }
            }

            setUsers(teamList);
        } catch (error: any) {
            toast.error("Failed to load members: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, channelId, projectId]);

    const handleAddMember = async (userId: string) => {
        setActionInProgress(userId);
        try {
            const { data: currentUser } = await supabase.auth.getUser();
            const { error } = await supabase
                .from("workspace_channel_members")
                .insert([{
                    channel_id: channelId,
                    user_id: userId,
                    added_by: currentUser.user?.id
                }]);

            if (error) throw error;
            toast.success("Member added to channel");

            // Update local state instead of doing a full reload
            setUsers((prev) =>
                prev.map(u => u.id === userId ? { ...u, isMember: true } : u)
            );
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to add member");
        } finally {
            setActionInProgress(null);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        setActionInProgress(userId);
        try {
            const { error } = await supabase
                .from("workspace_channel_members")
                .delete()
                .eq("channel_id", channelId)
                .eq("user_id", userId);

            if (error) throw error;
            toast.success("Member removed from channel");

            // Update local state instead of doing a full reload
            setUsers((prev) =>
                prev.map(u => u.id === userId ? { ...u, isMember: false } : u)
            );
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to remove member");
        } finally {
            setActionInProgress(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Manage Channel Members</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center gap-2">
                            <UserPlus className="h-8 w-8 opacity-20" />
                            There are no team members in this workspace yet.
                        </div>
                    ) : (
                        users.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors border">
                                <div className="flex items-center gap-3 min-w-0 pr-4">
                                    <Avatar className="h-10 w-10 shrink-0">
                                        <AvatarImage src={user.avatar_url || ""} />
                                        <AvatarFallback>{user.display_name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-medium text-sm truncate">{user.display_name}</span>
                                        <span className="text-xs text-muted-foreground truncate">@{user.username || "user"}</span>
                                    </div>
                                </div>

                                {user.isMember ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveMember(user.id)}
                                        disabled={actionInProgress === user.id}
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                                    >
                                        {actionInProgress === user.id ? (
                                            <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
                                        ) : (
                                            <>
                                                <X className="h-4 w-4 mr-1" />
                                                Remove
                                            </>
                                        )}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleAddMember(user.id)}
                                        disabled={actionInProgress === user.id}
                                        className="shrink-0"
                                    >
                                        {actionInProgress === user.id ? (
                                            <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
                                        ) : (
                                            <>
                                                <UserPlus className="h-4 w-4 mr-1" />
                                                Add
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
