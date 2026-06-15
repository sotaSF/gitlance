"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteWorkspaceChannel } from "../actions";
import { toast } from "sonner";
import { WorkspaceChannel } from "@/types/workspace";

interface DeleteChannelDialogProps {
    channel: WorkspaceChannel | null;
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
}

export function DeleteChannelDialog({
    channel,
    isOpen,
    onClose,
    workspaceId,
}: DeleteChannelDialogProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    if (!channel) return null;

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDeleting(true);

        try {
            const result = await deleteWorkspaceChannel(workspaceId, channel.id);

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success("Channel deleted successfully");
            router.push(`/workspace/${workspaceId}`); // Navigate away from the channel
            router.refresh();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete channel");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the{" "}
                        <span className="font-semibold text-foreground">
                            #{channel.name}
                        </span>{" "}
                        channel and remove all messages and data inside it.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? "Deleting..." : "Delete Channel"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
