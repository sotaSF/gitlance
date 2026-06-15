"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { voteOnReview } from "../actions";
import { toast } from "sonner";

interface ReviewVoteButtonsProps {
    reviewId: string;
    initialUpvotes: number;
    initialDownvotes: number;
    userVote: 1 | -1 | null; // null = no vote
}

export function ReviewVoteButtons({
    reviewId,
    initialUpvotes,
    initialDownvotes,
    userVote,
}: ReviewVoteButtonsProps) {
    const [upvotes, setUpvotes] = useState(initialUpvotes);
    const [downvotes, setDownvotes] = useState(initialDownvotes);
    const [currentVote, setCurrentVote] = useState<1 | -1 | null>(userVote);
    const [isVoting, setIsVoting] = useState(false);

    const handleVote = async (vote: 1 | -1) => {
        setIsVoting(true);
        try {
            const result = await voteOnReview(reviewId, vote);
            if (result.error) {
                toast.error(result.error);
                return;
            }

            // Optimistic update
            if (currentVote === vote) {
                // Toggle off
                if (vote === 1) setUpvotes((v) => v - 1);
                else setDownvotes((v) => v - 1);
                setCurrentVote(null);
            } else {
                // Switch or set new vote
                if (currentVote === 1) setUpvotes((v) => v - 1);
                if (currentVote === -1) setDownvotes((v) => v - 1);
                if (vote === 1) setUpvotes((v) => v + 1);
                else setDownvotes((v) => v + 1);
                setCurrentVote(vote);
            }
        } catch {
            toast.error("Failed to vote");
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <div className="flex items-center gap-1">
            <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 gap-1 text-xs ${currentVote === 1
                        ? "text-green-600 bg-green-500/10 hover:bg-green-500/20"
                        : "text-muted-foreground hover:text-green-600"
                    }`}
                onClick={() => handleVote(1)}
                disabled={isVoting}
            >
                <ThumbsUp className="h-3.5 w-3.5" />
                {upvotes > 0 && <span>{upvotes}</span>}
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 gap-1 text-xs ${currentVote === -1
                        ? "text-red-600 bg-red-500/10 hover:bg-red-500/20"
                        : "text-muted-foreground hover:text-red-600"
                    }`}
                onClick={() => handleVote(-1)}
                disabled={isVoting}
            >
                <ThumbsDown className="h-3.5 w-3.5" />
                {downvotes > 0 && <span>{downvotes}</span>}
            </Button>
        </div>
    );
}
