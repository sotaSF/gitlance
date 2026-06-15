"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, List, Search, Briefcase, ArrowRight } from "lucide-react";
import { UserWorkspace } from "../actions";
import { cn } from "@/lib/utils";

// Pastel colors for professional look
const AVATAR_COLORS = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-orange-100 text-orange-700",
    "bg-pink-100 text-pink-700",
    "bg-indigo-100 text-indigo-700",
];

function getAvatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

interface WorkspacesListProps {
    initialWorkspaces: UserWorkspace[];
}

export function WorkspacesList({ initialWorkspaces }: WorkspacesListProps) {
    const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedMode = localStorage.getItem("workspacesViewMode");
        if (savedMode === "list" || savedMode === "grid") {
            setViewMode(savedMode);
        }
    }, []);

    const toggleView = (mode: "list" | "grid") => {
        setViewMode(mode);
        localStorage.setItem("workspacesViewMode", mode);
    };

    const filteredWorkspaces = initialWorkspaces.filter((ws) =>
        ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ws.project.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!mounted) {
        return null; // Prevent hydration mismatch
    }

    return (
        <div className="space-y-6">
            {/* Filters & Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search workspaces..."
                        className="pl-9 h-9 bg-muted/50 border-none focus-visible:ring-1"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/20 self-end sm:self-auto">
                    <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-7 w-7 rounded-sm"
                        onClick={() => toggleView("list")}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-7 w-7 rounded-sm"
                        onClick={() => toggleView("grid")}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Workspace List */}
            {filteredWorkspaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg bg-muted/5 border-dashed">
                    <div className="bg-muted/30 p-4 rounded-full mb-4">
                        <Briefcase className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-medium">No workspaces found</h3>
                    <p className="text-muted-foreground max-w-sm mt-2 mb-6 text-sm">
                        {searchQuery
                            ? "Try adjusting your search query."
                            : "You haven't joined or created any workspaces yet."}
                    </p>
                    {!searchQuery && (
                        <Button asChild variant="outline" size="sm">
                            <Link href="/project/new-project">Create Project</Link>
                        </Button>
                    )}
                </div>
            ) : (
                <div
                    className={cn(
                        "grid gap-4",
                        viewMode === "grid"
                            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                            : "grid-cols-1"
                    )}
                >
                    {filteredWorkspaces.map((workspace) => {
                        const avatarColorClass = getAvatarColor(workspace.name);
                        return (
                            <Link
                                key={workspace.id}
                                href={`/workspace/${workspace.id}`}
                                className={cn(
                                    "group relative flex transition-all hover:shadow-md border border-border/40 bg-card hover:border-primary/20",
                                    viewMode === "grid"
                                        ? "flex-col p-6 rounded-xl items-start gap-4"
                                        : "items-center justify-between p-4 rounded-lg hover:bg-muted/30"
                                )}
                            >
                                <div className={cn("flex items-center gap-4 min-w-0", viewMode === "grid" ? "w-full" : "")}>
                                    <Avatar className={cn("border border-border/50", viewMode === "grid" ? "h-12 w-12" : "h-10 w-10")}>
                                        <AvatarImage
                                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${workspace.name}`}
                                            className="opacity-90"
                                        />
                                        <AvatarFallback className={`rounded-md font-medium text-xs ${avatarColorClass}`}>
                                            {getInitials(workspace.name)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                                                {workspace.name}
                                            </h3>
                                            {workspace.role === "owner" && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] h-4 px-1.5 font-normal text-muted-foreground bg-muted/50"
                                                >
                                                    Owner
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 inline-block" />
                                            {workspace.project.title}
                                        </p>
                                    </div>
                                </div>

                                <div className={cn("flex items-center text-xs text-muted-foreground", viewMode === "grid" ? "w-full justify-between mt-2 pt-4 border-t border-border/30" : "gap-6")}>
                                    <div className="flex items-center gap-1.5">
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {/* Mock avatars for members - in real app would map actual members */}
                                            <div className="h-5 w-5 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[8px]">
                                                {workspace.member_count}
                                            </div>
                                        </div>
                                        <span className="tabular-nums">{workspace.member_count} member{workspace.member_count !== 1 ? 's' : ''}</span>
                                    </div>

                                    <div className={cn("flex items-center text-primary opacity-0 group-hover:opacity-100 transition-all duration-300", viewMode === "grid" ? "translate-x-2 group-hover:translate-x-0" : "")}>
                                        <span className="mr-1 font-medium">Open</span>
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
