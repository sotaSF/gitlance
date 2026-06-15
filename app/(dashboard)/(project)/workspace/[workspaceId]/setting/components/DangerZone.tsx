"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, Archive, Trash2, AlertTriangle } from "lucide-react";
import { archiveWorkspace, deleteWorkspace } from "../actions";

interface DangerZoneProps {
  workspaceId: string;
  workspaceName: string;
}

export function DangerZone({ workspaceId, workspaceName }: DangerZoneProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleArchive = () => {
    startTransition(async () => {
      const result = await archiveWorkspace(workspaceId);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Workspace archived successfully");
        setArchiveDialogOpen(false);
        if (result.redirectTo) {
          router.push(result.redirectTo);
        }
      }
    });
  };

  const handleDelete = () => {
    if (deleteConfirmation !== workspaceName) {
      toast.error("Please type the workspace name correctly");
      return;
    }

    startTransition(async () => {
      const result = await deleteWorkspace(workspaceId);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Workspace deleted permanently");
        setDeleteDialogOpen(false);
        if (result.redirectTo) {
          router.push(result.redirectTo);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <h3 className="font-semibold text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mt-1">
              The actions below are destructive and cannot be easily undone. Please proceed with caution.
            </p>
          </div>
        </div>
      </div>

      {/* Archive Workspace Card */}
      <Card className="border-orange-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <Archive className="h-5 w-5" />
            Archive Workspace
          </CardTitle>
          <CardDescription>
            Archiving will hide this workspace from your list but preserve all data.
            You can unarchive it later if needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-orange-500/50 text-orange-600 hover:bg-orange-500/10">
                <Archive className="mr-2 h-4 w-4" />
                Archive Workspace
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive "{workspaceName}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This workspace will be archived and hidden from your workspace list.
                  All data, channels, and messages will be preserved. You can unarchive it later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleArchive}
                  disabled={isPending}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Archive Workspace
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Delete Workspace Card */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Workspace
          </CardTitle>
          <CardDescription>
            Permanently delete this workspace and all its data. This action is irreversible.
            All channels, messages, and settings will be lost forever.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Workspace
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive">
                  Delete "{workspaceName}" permanently?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>
                    This action is <strong>permanent and cannot be undone</strong>. 
                    This will immediately delete:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>All workspace channels</li>
                    <li>All messages and files</li>
                    <li>All workspace settings</li>
                  </ul>
                  <p className="pt-2">
                    Type <strong className="font-mono">{workspaceName}</strong> to confirm:
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <Label htmlFor="delete-confirm" className="sr-only">
                  Confirmation
                </Label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Enter workspace name"
                  className="font-mono"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isPending || deleteConfirmation !== workspaceName}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete Permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

