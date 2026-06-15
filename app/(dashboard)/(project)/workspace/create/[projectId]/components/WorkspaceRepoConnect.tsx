"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Github, CheckCircle2, AlertCircle, Lock, Globe, Loader2 } from "lucide-react";
import { oauthSignIn } from "@/app/auth/actions";
import { useState, useEffect } from "react";
import { checkGitHubConnection, createAndLinkGitHubRepo } from "@/app/(dashboard)/(project)/project/new-project/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface WorkspaceRepoConnectProps {
  projectId: string;
  projectTitle: string;
  projectDescription: string;
}

type ConnectionStatus = "checking" | "not_connected" | "connected_no_scope" | "connected_with_scope";

export function WorkspaceRepoConnect({ projectId, projectTitle, projectDescription }: WorkspaceRepoConnectProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("checking");
  const [username, setUsername] = useState<string | undefined>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [repoVisibility, setRepoVisibility] = useState<"private" | "public">("private");
  const router = useRouter();

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

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const currentPath = window.location.pathname;
      await oauthSignIn("github", {
        isAuthorization: true,
        redirectPath: currentPath
      });
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
      const result = await createAndLinkGitHubRepo(projectId, {
        name: projectTitle,
        description: projectDescription,
        isPrivate: repoVisibility === "private",
      });

      if (result.success && result.repoUrl) {
        toast.success("GitHub repository created and linked!");
        setShowConfirmDialog(false);
        router.refresh();
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

  if (connectionStatus === "checking") {
    return (
      <Card className="border-2 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center gap-4 py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-muted-foreground font-medium">
            Checking GitHub connection...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (connectionStatus === "not_connected") {
    return (
      <Card className="border-2 shadow-xl bg-card/50 backdrop-blur-sm hover:shadow-2xl transition-shadow">
        <CardHeader className="text-center pb-4 space-y-4">
          <div className="mx-auto bg-gradient-to-br from-primary/20 to-primary/10 p-6 rounded-2xl w-fit ring-4 ring-primary/10">
            <Github className="h-10 w-10 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl mb-2">Connect GitHub Account</CardTitle>
            <CardDescription className="text-base">
              To create a workspace, you need a GitHub repository. Connect your account to get started.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 pt-4 pb-8">
          <Button
            size="lg"
            className="w-full max-w-sm h-12 gap-2 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            <Github className="h-5 w-5" />
            {isConnecting ? "Connecting..." : "Connect GitHub Account"}
          </Button>

          <div className="text-xs text-muted-foreground text-center max-w-sm bg-muted/50 p-3 rounded-lg">
            By connecting, you grant us permission to create repositories on your behalf.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (connectionStatus === "connected_no_scope") {
    return (
      <Card className="border-2 border-yellow-500/50 shadow-xl bg-gradient-to-br from-yellow-500/5 to-card/50 backdrop-blur-sm">
        <CardHeader className="text-center pb-4 space-y-4">
          <div className="mx-auto bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 p-6 rounded-2xl w-fit ring-4 ring-yellow-500/10">
            <AlertCircle className="h-10 w-10 text-yellow-600" />
          </div>
          <div>
            <CardTitle className="text-2xl mb-2">Additional Permissions Required</CardTitle>
            <CardDescription className="text-base">
              You're connected as <strong className="text-foreground">{username}</strong>, but we need permission to create repositories.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 pt-4 pb-8">
          <Button
            size="lg"
            className="w-full max-w-sm h-12 gap-2 text-base font-semibold bg-gradient-to-r from-yellow-600 to-yellow-600/80 hover:from-yellow-600/90 hover:to-yellow-600/70 shadow-lg hover:shadow-xl transition-all"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? "Authorizing..." : "Grant Repository Access"}
          </Button>

          <div className="text-xs text-muted-foreground text-center max-w-sm bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
            We need the "repo" scope to create and manage repositories for your projects.
          </div>
        </CardContent>
      </Card>
    );
  }

  // connected_with_scope
  return (
    <>
      <Card className="border-2 border-green-500/50 shadow-xl bg-gradient-to-br from-green-500/5 to-card/50 backdrop-blur-sm">
        <CardHeader className="text-center pb-4 space-y-4">
          <div className="mx-auto bg-gradient-to-br from-green-500/20 to-green-500/10 p-6 rounded-2xl w-fit ring-4 ring-green-500/10">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-2xl mb-2">GitHub Connected</CardTitle>
            <CardDescription className="text-base">
              Connected as <strong className="text-foreground">{username}</strong>. Ready to create your project repository!
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 pt-4 pb-8">
          <div className="w-full max-w-md space-y-4">
            <div className="p-6 bg-muted/50 rounded-xl border-2 space-y-3">
              <div className="text-base font-semibold flex items-center gap-2">
                <Github className="h-5 w-5 text-primary" />
                Repository Details
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <strong className="text-foreground min-w-24">Name:</strong>
                  <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
                    {projectTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <strong className="text-foreground min-w-24">Description:</strong>
                  <span className="line-clamp-2">{projectDescription || "No description"}</span>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full h-12 gap-2 text-base font-semibold bg-gradient-to-r from-green-600 to-green-600/80 hover:from-green-600/90 hover:to-green-600/70 shadow-lg hover:shadow-xl transition-all"
              onClick={handleCreateRepository}
            >
              <Github className="h-5 w-5" />
              Create Repository
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-lg border-2">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl">Create GitHub Repository</DialogTitle>
            <DialogDescription className="text-base">
              Confirm the details for your new repository
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Repository Name</Label>
              <div className="p-3 bg-muted border-2 rounded-lg text-sm font-mono">
                {projectTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Description</Label>
              <div className="p-3 bg-muted border-2 rounded-lg text-sm max-h-24 overflow-y-auto">
                {projectDescription || "No description provided"}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Visibility</Label>
              <RadioGroup value={repoVisibility} onValueChange={(value: string) => setRepoVisibility(value as "private" | "public")}>
                <div className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-muted/50 hover:ring-primary/50 cursor-pointer transition-all">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-semibold">Private</div>
                        <div className="text-xs text-muted-foreground">Only you and collaborators can see this repository</div>
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-muted/50 hover:border-primary/50 cursor-pointer transition-all">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-semibold">Public</div>
                        <div className="text-xs text-muted-foreground">Anyone can see this repository</div>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isCreating} className="border-2">
              Cancel
            </Button>
            <Button onClick={handleConfirmCreate} disabled={isCreating} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Repository"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
