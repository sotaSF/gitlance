"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";
import { WriteReviewModal } from "./WriteReviewModal";

interface WriteReviewButtonProps {
    revieweeId: string;
    revieweeName: string;
}

export function WriteReviewButton({
    revieweeId,
    revieweeName,
}: WriteReviewButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-2"
                onClick={() => setIsOpen(true)}
            >
                <PenLine className="h-4 w-4" />
                Write a Review
            </Button>

            <WriteReviewModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                revieweeId={revieweeId}
                revieweeName={revieweeName}
            />
        </>
    );
}
