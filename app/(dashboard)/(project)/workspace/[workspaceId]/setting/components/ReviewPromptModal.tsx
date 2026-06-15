"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, PartyPopper, ArrowRight, CheckCircle2 } from "lucide-react";
import { WriteReviewModal } from "@/app/(dashboard)/profile/[username]/components/WriteReviewModal";

interface Contributor {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    username: string | null;
}

interface ReviewPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    ownerId: string | null;
    contributors: Contributor[];
    currentUserId: string;
    currentUserRole: "owner" | "maintainer" | "contributor";
    reviewedUserIds?: string[];
}

export function ReviewPromptModal({
    isOpen,
    onClose,
    projectId,
    ownerId,
    contributors,
    currentUserId,
    currentUserRole,
    reviewedUserIds = [],
}: ReviewPromptModalProps) {
    const [reviewTarget, setReviewTarget] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [localReviewedIds, setLocalReviewedIds] = useState<string[]>([]);

    const isOwner = currentUserRole === "owner" || currentUserId === ownerId;

    // Combine server-side and local reviewed IDs
    const allReviewedIds = [...new Set([...reviewedUserIds, ...localReviewedIds])];

    // Determine who the current user can review
    const reviewableUsers: Array<{ id: string; name: string; avatar: string | null; username: string | null }> = [];

    if (isOwner) {
        contributors.forEach((c) => {
            if (c.id !== currentUserId) {
                reviewableUsers.push({
                    id: c.id,
                    name: c.displayName || c.username || "Unknown",
                    avatar: c.avatarUrl,
                    username: c.username,
                });
            }
        });
    } else {
        if (ownerId && ownerId !== currentUserId) {
            // Try to find owner info from contributors list
            const ownerContrib = contributors.find(c => c.id === ownerId);
            reviewableUsers.push({
                id: ownerId,
                name: ownerContrib?.displayName || ownerContrib?.username || "Project Owner",
                avatar: ownerContrib?.avatarUrl || null,
                username: ownerContrib?.username || null,
            });
        }
        contributors.forEach((c) => {
            if (c.id !== currentUserId && c.id !== ownerId) {
                reviewableUsers.push({
                    id: c.id,
                    name: c.displayName || c.username || "Unknown",
                    avatar: c.avatarUrl,
                    username: c.username,
                });
            }
        });
    }

    const allReviewed = reviewableUsers.length > 0 && reviewableUsers.every(u => allReviewedIds.includes(u.id));

    return (
        <>
            <Dialog open={isOpen && !reviewTarget} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <PartyPopper className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">Project Complete! 🎉</DialogTitle>
                                <DialogDescription className="text-sm">
                                    {allReviewed
                                        ? "You've reviewed all your team members. Thank you!"
                                        : "All modules have been completed. Take a moment to review your team."}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-2 py-2">
                        <p className="text-sm font-medium text-muted-foreground mb-3">
                            {isOwner ? "Review your contributors:" : "Leave a review:"}
                        </p>

                        {reviewableUsers.map((user) => {
                            const isReviewed = allReviewedIds.includes(user.id);
                            return (
                                <button
                                    key={user.id}
                                    onClick={() => !isReviewed && setReviewTarget({ id: user.id, name: user.name })}
                                    disabled={isReviewed}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${isReviewed
                                            ? "border-green-500/30 bg-green-500/5 cursor-default"
                                            : "border-border/50 hover:bg-accent/50 hover:border-brand/30 group"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={user.avatar || undefined} />
                                            <AvatarFallback className="text-xs font-medium bg-brand/10 text-brand">
                                                {user.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-left">
                                            <p className="text-sm font-medium">{user.name}</p>
                                            {user.username && (
                                                <p className="text-xs text-muted-foreground">@{user.username}</p>
                                            )}
                                        </div>
                                    </div>
                                    {isReviewed ? (
                                        <div className="flex items-center gap-1.5 text-green-500">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span className="text-xs font-medium">Reviewed</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-brand transition-colors">
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star key={s} className="h-3 w-3" />
                                                ))}
                                            </div>
                                            <ArrowRight className="h-4 w-4" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}

                        {reviewableUsers.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No team members to review.
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
                            {allReviewed ? "Close" : "Remind Me Later"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reuse existing WriteReviewModal */}
            {reviewTarget && (
                <WriteReviewModal
                    isOpen={!!reviewTarget}
                    onClose={() => {
                        // Mark as locally reviewed after closing the modal
                        setLocalReviewedIds(prev => [...prev, reviewTarget.id]);
                        setReviewTarget(null);
                    }}
                    revieweeId={reviewTarget.id}
                    revieweeName={reviewTarget.name}
                    preselectedProjectId={projectId}
                />
            )}
        </>
    );
}
