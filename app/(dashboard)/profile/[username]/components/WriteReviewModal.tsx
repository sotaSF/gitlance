"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { submitReview, getSharedProjects } from "../actions";

interface WriteReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    revieweeId: string;
    revieweeName: string;
    preselectedProjectId?: string;
}

export function WriteReviewModal({
    isOpen,
    onClose,
    revieweeId,
    revieweeName,
    preselectedProjectId,
}: WriteReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [title, setTitle] = useState("");
    const [comment, setComment] = useState("");
    const [projectId, setProjectId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [projects, setProjects] = useState<
        Array<{ id: string; title: string }>
    >([]);
    const [loadingProjects, setLoadingProjects] = useState(false);

    useEffect(() => {
        if (isOpen && preselectedProjectId) {
            setProjectId(preselectedProjectId);
            setProjects([]);
            setLoadingProjects(false);
        } else if (isOpen) {
            setLoadingProjects(true);
            getSharedProjects(revieweeId)
                .then((result) => {
                    if (result.success && result.projects) {
                        setProjects(result.projects);
                    } else {
                        setProjects([]);
                    }
                })
                .finally(() => setLoadingProjects(false));
        }
    }, [isOpen, revieweeId, preselectedProjectId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }
        if (!projectId) {
            toast.error("Please select a project");
            return;
        }
        if (!comment.trim()) {
            toast.error("Please write a comment");
            return;
        }

        setIsLoading(true);
        try {
            const result = await submitReview(
                revieweeId,
                projectId,
                rating,
                title,
                comment
            );

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success("Review submitted successfully!");
            resetForm();
            onClose();
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setRating(0);
        setHoverRating(0);
        setTitle("");
        setComment("");
        setProjectId("");
    };

    const displayRating = hoverRating || rating;

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    resetForm();
                    onClose();
                }
            }}
        >
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Review {revieweeName}</DialogTitle>
                    <DialogDescription>
                        Share your experience working with this person.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Star Rating */}
                    <div className="space-y-2">
                        <Label>Rating</Label>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <Star
                                        className={`h-8 w-8 transition-colors ${star <= displayRating
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-muted-foreground/30"
                                            }`}
                                    />
                                </button>
                            ))}
                            {displayRating > 0 && (
                                <span className="ml-2 text-sm text-muted-foreground">
                                    {displayRating}/5
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Project Selector - hidden when preselected */}
                    {!preselectedProjectId && (
                        <div className="space-y-2">
                            <Label htmlFor="project">Project</Label>
                            {loadingProjects ? (
                                <div className="h-10 rounded-md border bg-muted/30 animate-pulse" />
                            ) : projects.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-2">
                                    No shared projects found. You can only review users you&apos;ve
                                    collaborated with.
                                </p>
                            ) : (
                                <Select value={projectId} onValueChange={setProjectId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a shared project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map((project) => (
                                            <SelectItem key={project.id} value={project.id}>
                                                {project.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    )}

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">
                            Title{" "}
                            <span className="text-muted-foreground font-normal">
                                (optional)
                            </span>
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Summarize your experience"
                            disabled={isLoading}
                            maxLength={100}
                        />
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                        <Label htmlFor="comment">Comment</Label>
                        <Textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Describe your experience working with this person..."
                            disabled={isLoading}
                            rows={4}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                resetForm();
                                onClose();
                            }}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                isLoading ||
                                rating === 0 ||
                                !projectId ||
                                !comment.trim() ||
                                (!preselectedProjectId && projects.length === 0)
                            }
                        >
                            {isLoading ? "Submitting..." : "Submit Review"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
