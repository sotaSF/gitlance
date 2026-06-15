"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Github, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Lock, Globe } from "lucide-react";
import { authorizeGitHub, syncGitHubUsername } from "@/app/settings/actions";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { checkGitHubConnection, createGitHubRepo } from "../actions";
import { toast } from "sonner";

interface GitHubConnectStepProps {
  onBack: () => void;
  onNext: (repoUrl?: string) => void;
  onSkip: () => void;
  projectTitle: string;
  projectDescription: string;
}

type ConnectionStatus = "checking" | "not_connected" | "connected_no_scope" | "connected_with_scope";

export function GitHubConnectStep({ onBack, onNext, onSkip, projectTitle, projectDescription }: GitHubConnectStepProps) {
  const searchParams = useSearchParams();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("checking");
  const [username, setUsername] = useState<string | undefined>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [repoVisibility, setRepoVisibility] = useState<"private" | "public">("private");

  // Check GitHub connection status on mount
  useEffect(() => {
    const checkConnection = async () => {
      const result = await checkGitHubConnection();

      if (!result.connected) {
        setConnectionStatus("not_connected");
      } else if (!result.hasRepoScope) {
        setConnectionStatus("connected_no_scope");
        setUsername(result.username);
      } else {
        setConnectionStatus("connected_with_scope");
        setUsername(result.username);
      }
    };

    checkConnection();
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      const syncGitHub = async () => {
        // Clear code from URL immediately
        window.history.replaceState({}, document.title, window.location.pathname);

        toast.info("Syncing GitHub account...");

        // Sync GitHub username
        const result = await syncGitHubUsername();
        if (result.success && result.github_username) {
          toast.success(`GitHub connected as @${result.github_username}`);
          setUsername(result.github_username);

          // CRITICAL: Sync GitHub token to database for persistent storage
          const { syncGitHubTokenToDatabase } = await import('@/app/settings/actions');
          const tokenResult = await syncGitHubTokenToDatabase();

          if (tokenResult.success) {
            if (tokenResult.stored) {
              console.log('✅ GitHub token stored successfully');
            } else if (tokenResult.alreadyStored) {
              console.log('ℹ GitHub token already stored');
            }
          } else {
            console.error('❌ Failed to sync GitHub token:', tokenResult.error);
            // Don't show error to user - username sync succeeded
          }

          // Re-check connection to update scope status
          const connectionResult = await checkGitHubConnection();
          if (!connectionResult.connected) {
            setConnectionStatus("not_connected");
          } else if (!connectionResult.hasRepoScope) {
            setConnectionStatus("connected_no_scope");
          } else {
            setConnectionStatus("connected_with_scope");
          }
        } else {
          toast.error(result.error || "Failed to sync GitHub profile");
        }
      };
      syncGitHub();
    }
  }, [searchParams]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Save current state before redirecting
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('project_wizard_restore', 'true');
      }

      const redirectUrl = `${window.location.origin}/project/new-project`;
      // Use smart authorization that handles both linking and re-authorization
      const result = await authorizeGitHub("repo user:email", redirectUrl);

      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.error || "Failed to connect GitHub");
        setIsConnecting(false);
      }
    } catch (error) {
      console.error("GitHub connection failed:", error);
      toast.error("Failed to connect to GitHub");
      setIsConnecting(false);
    }
  };

  const handleCreateRepository = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmCreate = async () => {
    setIsCreating(true);
    try {
      const result = await createGitHubRepo({
        name: projectTitle,
        description: projectDescription,
        isPrivate: repoVisibility === "private",
      });

      if (result.success && result.repoUrl) {
        toast.success("GitHub repository created successfully!");
        setShowConfirmDialog(false);
        // Pass the repo URL to the next step
        onNext(result.repoUrl);
      } else {
        toast.error(result.error || "Failed to create repository");
      }
    } catch (error) {
      console.error("Repository creation error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const renderContent = () => {
    if (connectionStatus === "checking") {
      return (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="animate-pulse text-muted-foreground">
              Checking GitHub connection...
            </div>
          </CardContent>
        </Card>
      );
    }

    if (connectionStatus === "not_connected") {
      return (
        <Card className="border-2 border-dashed">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-muted p-4 rounded-full w-fit mb-4">
              <Github className="h-8 w-8" />
            </div>
            <CardTitle>Connect GitHub Account</CardTitle>
            <CardDescription>
              To create a repository for your project, we need access to your GitHub account.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pt-4">
            <Button
              size="lg"
              className="w-full max-w-sm gap-2"
              onClick={handleConnect}
              disabled={isConnecting}
            >
              <Github className="h-4 w-4" />
              {isConnecting ? "Connecting..." : "Connect GitHub Account"}
            </Button>

            <div className="text-xs text-muted-foreground text-center max-w-sm">
              By connecting, you grant us permission to create repositories on your behalf.
            </div>
          </CardContent>
        </Card>
      );
    }

    if (connectionStatus === "connected_no_scope") {
      return (
        <Card className="border-2 border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-yellow-500/10 p-4 rounded-full w-fit mb-4">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle>Additional Permissions Required</CardTitle>
            <CardDescription>
              You're connected as <strong>{username}</strong>, but we need permission to create repositories.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pt-4">
            <Button
              size="lg"
              className="w-full max-w-sm gap-2"
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? "Authorizing..." : "Grant Repository Access"}
            </Button>

            <div className="text-xs text-muted-foreground text-center max-w-sm">
              We need the "repo" scope to create and manage repositories for your projects.
            </div>
          </CardContent>
        </Card>
      );
    }

    // connected_with_scope
    return (
      <Card className="border-2 border-green-500/50 bg-green-500/5">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-green-500/10 p-4 rounded-full w-fit mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle>GitHub Connected</CardTitle>
          <CardDescription>
            Connected as <strong>{username}</strong>. Ready to create your project repository!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pt-4">
          <div className="w-full max-w-sm space-y-3">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="text-sm font-medium">Repository Details:</div>
              <div className="text-sm text-muted-foreground">
                <div><strong>Name:</strong> {projectTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")}</div>
                <div className="line-clamp-2"><strong>Description:</strong> {projectDescription}</div>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full gap-2"
              onClick={handleCreateRepository}
            >
              <Github className="h-4 w-4" />
              Create Repository
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-8 py-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">GitHub Repository</h2>
          <p className="text-muted-foreground">
            Create a GitHub repository to store your project code and collaborate with developers.
          </p>
        </div>

        {renderContent()}

        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onSkip()}>
              Skip (Draft Only)
            </Button>
            {connectionStatus === "connected_with_scope" && (
              <Button onClick={() => onNext()} variant="secondary">
                Continue Without Repository
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create GitHub Repository</DialogTitle>
            <DialogDescription>
              Confirm the details for your new repository
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Repository Name</Label>
              <div className="p-3 bg-muted rounded-md text-sm font-mono">
                {projectTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <div className="p-3 bg-muted rounded-md text-sm max-h-24 overflow-y-auto">
                {projectDescription}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Visibility</Label>
              <RadioGroup value={repoVisibility} onValueChange={(value: string) => setRepoVisibility(value as "private" | "public")}>
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Private</div>
                        <div className="text-xs text-muted-foreground">Only you and collaborators can see this repository</div>
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Public</div>
                        <div className="text-xs text-muted-foreground">Anyone can see this repository</div>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleConfirmCreate} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Repository"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
