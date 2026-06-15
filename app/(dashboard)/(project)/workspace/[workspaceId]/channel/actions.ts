"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createWorkspaceChannel(workspaceId: string, name: string, description?: string) {
    const supabase = await createServerSupabase();

    // Create the channel
    const { data: channel, error } = await supabase
        .from("workspace_channels")
        .insert([{ workspace_id: workspaceId, name, description }])
        .select()
        .single();

    if (error) {
        console.error("Error creating workspace channel:", error);
        return { error: error.message };
    }

    // Add the creator as the first member
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user && channel) {
        await supabase.from("workspace_channel_members").insert([
            { channel_id: channel.id, user_id: userData.user.id, added_by: userData.user.id }
        ]);
    }

    revalidatePath(`/workspace/${workspaceId}`);
    return { channel };
}

export async function deleteWorkspaceChannel(workspaceId: string, channelId: string) {
    const supabase = await createServerSupabase();

    const { error } = await supabase
        .from("workspace_channels")
        .delete()
        .eq("id", channelId)
        .eq("workspace_id", workspaceId);

    if (error) {
        console.error("Error deleting workspace channel:", error);
        return { error: error.message };
    }

    revalidatePath(`/workspace/${workspaceId}`);
    return { success: true };
}

export async function addWorkspaceChannelMember(channelId: string, userId: string, workspaceId: string) {
    const supabase = await createServerSupabase();
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase
        .from("workspace_channel_members")
        .insert([
            { channel_id: channelId, user_id: userId, added_by: userData.user?.id }
        ]);

    if (error) {
        console.error("Error adding member to channel:", error);
        return { error: error.message };
    }

    revalidatePath(`/workspace/${workspaceId}/channel/${channelId}`);
    return { success: true };
}

export async function removeWorkspaceChannelMember(channelId: string, userId: string, workspaceId: string) {
    const supabase = await createServerSupabase();

    const { error } = await supabase
        .from("workspace_channel_members")
        .delete()
        .eq("channel_id", channelId)
        .eq("user_id", userId);

    if (error) {
        console.error("Error removing member from channel:", error);
        return { error: error.message };
    }

    revalidatePath(`/workspace/${workspaceId}/channel/${channelId}`);
    return { success: true };
}

export async function editChannelMessage(messageId: string, newContent: string) {
    const supabase = await createServerSupabase();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) return { error: "Not authenticated" };

    const { data, error } = await supabase
        .from("workspace_channel_messages")
        .update({
            content: newContent,
            edited_at: new Date().toISOString(),
        })
        .eq("id", messageId)
        .eq("user_id", userData.user.id) // ownership check
        .select(`*, profiles(display_name, avatar_url)`)
        .single();

    if (error) {
        console.error("Error editing message:", error);
        return { error: error.message };
    }

    return { message: data };
}

export async function deleteChannelMessage(messageId: string) {
    const supabase = await createServerSupabase();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) return { error: "Not authenticated" };

    const { data, error } = await supabase
        .from("workspace_channel_messages")
        .update({
            is_deleted: true,
            content: "",
            attachment_url: null,
            attachment_name: null,
            attachment_type: null,
            attachment_size: null,
        })
        .eq("id", messageId)
        .eq("user_id", userData.user.id) // ownership check
        .select(`*, profiles(display_name, avatar_url)`)
        .single();

    if (error) {
        console.error("Error deleting message:", error);
        return { error: error.message };
    }

    return { message: data };
}
