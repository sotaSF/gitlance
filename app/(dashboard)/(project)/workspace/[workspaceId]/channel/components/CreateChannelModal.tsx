"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createWorkspaceChannel } from "../actions";
import { toast } from "sonner";

interface CreateChannelModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
}

export function CreateChannelModal({
    isOpen,
    onClose,
    workspaceId,
}: CreateChannelModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            // Format canonical name (lowercase, no spaces, no special chars)
            const formattedName = name
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");

            const result = await createWorkspaceChannel(
                workspaceId,
                formattedName,
                description.trim() || undefined
            );

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success("Channel created successfully");
            router.refresh();

            // Reset form
            setName("");
            setDescription("");
            onClose();

            // Navigate to the new channel (optional)
            if (result.channel) {
                router.push(`/workspace/${workspaceId}/channel/${result.channel.id}`);
            }
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create a channel</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Channel Name</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">
                                #
                            </span>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. general"
                                className="pl-7"
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Names must be lowercase, without spaces or periods.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Description <span className="text-muted-foreground font-normal">(optional)</span>
                        </Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this channel about?"
                            disabled={isLoading}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !name.trim()}>
                            {isLoading ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
