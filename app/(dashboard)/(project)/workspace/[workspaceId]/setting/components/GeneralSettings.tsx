"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Pause, Play, Save } from "lucide-react";
import { WorkspaceMetadata } from "@/types/workspace";
import { updateWorkspaceSettings, pauseWorkspace, unpauseWorkspace } from "../actions";

interface GeneralSettingsProps {
  workspaceId: string;
  workspace: {
    id: string;
    name: string;
    project_id: string;
  };
  metadata: WorkspaceMetadata;
  canManageSettings: boolean;
}

export function GeneralSettings({
  workspaceId,
  workspace,
  metadata,
  canManageSettings,
}: GeneralSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(metadata.description || "");
  const [isPaused, setIsPaused] = useState(metadata.is_paused || false);

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateWorkspaceSettings(workspaceId, {
        name,
        description,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Settings saved successfully");
      }
    });
  };

  const handlePauseToggle = () => {
    startTransition(async () => {
      const result = isPaused
        ? await unpauseWorkspace(workspaceId)
        : await pauseWorkspace(workspaceId);

      if (result.error) {
        toast.error(result.error);
      } else {
        setIsPaused(!isPaused);
        toast.success(isPaused ? "Workspace resumed" : "Workspace paused");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Workspace Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>
            Basic information about your workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canManageSettings || isPending}
              placeholder="Enter workspace name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-description">Description</Label>
            <Textarea
              id="workspace-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canManageSettings || isPending}
              placeholder="Describe your workspace..."
              rows={3}
            />
          </div>

          {canManageSettings && (
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Pause Status Card */}
      <Card className={isPaused ? "border-destructive/50 bg-destructive/5" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Workspace Status
                {isPaused && (
                  <Badge variant="destructive">
                    <Pause className="mr-1 h-3 w-3" />
                    Paused
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isPaused
                  ? "This workspace is currently paused. Only the #general channel allows messages."
                  : "Workspace is active. All channels are operational."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isPaused && metadata.paused_at && (
            <p className="text-sm text-muted-foreground mb-4" suppressHydrationWarning>
              Paused on {new Date(metadata.paused_at).toLocaleDateString()} at{" "}
              {new Date(metadata.paused_at).toLocaleTimeString()}
            </p>
          )}

          {canManageSettings && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant={isPaused ? "default" : "outline"}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : isPaused ? (
                    <Play className="mr-2 h-4 w-4" />
                  ) : (
                    <Pause className="mr-2 h-4 w-4" />
                  )}
                  {isPaused ? "Resume Workspace" : "Pause Workspace"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {isPaused ? "Resume Workspace?" : "Pause Workspace?"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {isPaused
                      ? "This will allow messages in all channels again."
                      : "When paused, only the #general channel will allow messages. All other channels will be read-only."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handlePauseToggle}>
                    {isPaused ? "Resume" : "Pause"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {!canManageSettings && (
            <p className="text-sm text-muted-foreground">
              Only workspace owners can change the pause status.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

