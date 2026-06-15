"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Github, AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import { authorizeGitHub } from "@/app/settings/actions";
import { GitHubScopesStatus } from "../actions";

interface GitHubScopeBannerProps {
    status: GitHubScopesStatus;
}

export function GitHubScopeBanner({ status }: GitHubScopeBannerProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Don't show banner if user has all required scopes
    if (status.hasGitHub && status.hasRequiredScopes) {
        return null;
    }

    const handleAuthorize = async () => {
        setIsLoading(true);
        try {
            const result = await authorizeGitHub("repo user:email", "/workspaces");
            if (result.success && result.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            console.error("Failed to authorize GitHub:", error);
            setIsLoading(false);
        }
    };

    // User doesn't have GitHub linked at all
    if (!status.hasGitHub) {
        return (
            <Alert className="mb-6 border-primary/30 bg-primary/5">
                <Github className="h-5 w-5 text-primary" />
                <AlertTitle className="text-base font-semibold">
                    Connect Your GitHub Account
                </AlertTitle>
                <AlertDescription className="mt-2">
                    <p className="text-sm text-muted-foreground mb-4">
                        Link your GitHub account to unlock workspace features like repository creation and team collaboration.
                    </p>
                    <Button
                        onClick={handleAuthorize}
                        disabled={isLoading}
                        size="sm"
                        className="gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Github className="h-4 w-4" />
                        )}
                        Connect GitHub
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    // User has GitHub but missing required scopes
    return (
        <Alert className="mb-6 border-amber-500/30 bg-amber-500/5">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-base font-semibold">
                Additional GitHub Permissions Required
            </AlertTitle>
            <AlertDescription className="mt-2">
                <p className="text-sm text-muted-foreground mb-4">
                    {status.githubUsername ? (
                        <>
                            Your GitHub account <span className="font-medium text-foreground">@{status.githubUsername}</span> needs additional permissions.
                            Please re-authorize to enable repository management and full workspace functionality.
                        </>
                    ) : (
                        <>
                            Your GitHub account needs additional permissions.
                            Please re-authorize to enable repository management and full workspace functionality.
                        </>
                    )}
                </p>
                <Button
                    onClick={handleAuthorize}
                    disabled={isLoading}
                    size="sm"
                    variant="outline"
                    className="gap-2 border-amber-500/50 hover:bg-amber-500/10"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <ExternalLink className="h-4 w-4" />
                    )}
                    Grant Permissions
                </Button>
            </AlertDescription>
        </Alert>
    );
}
