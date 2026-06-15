"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { MembersModal } from "./MembersModal";

interface MembersModalClientProps {
    channelId: string;
    workspaceId: string;
    projectId: string;
}

export function MembersModalClient({ channelId, workspaceId, projectId }: MembersModalClientProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsOpen(true)}
            >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Members</span>
            </Button>

            <MembersModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                channelId={channelId}
                workspaceId={workspaceId}
                projectId={projectId}
            />
        </>
    );
}
