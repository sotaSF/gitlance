"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, UserPlus, Trash2, Crown, Shield, User } from "lucide-react";
import { TeamRole } from "@/types/workspace";
import { updateMemberRole, removeMember, inviteMember } from "../actions";

interface TeamManagementProps {
  workspaceId: string;
  members: Array<{
    id: string;
    profile_id: string;
    role: string;
    joined_at: string | null;
    active: boolean;
    profile: {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
      username: string | null;
      github_username?: string | null;
    };
  }>;
  userRole: TeamRole;
  canManageSettings: boolean;
}

const roleIcons: Record<string, React.ReactNode> = {
  owner: <Crown className="h-3 w-3" />,
  maintainer: <Shield className="h-3 w-3" />,
  contributor: <User className="h-3 w-3" />,
};

const roleBadgeVariants: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  maintainer: "secondary",
  contributor: "outline",
};

export function TeamManagement({
  workspaceId,
  members,
  userRole,
  canManageSettings,
}: TeamManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteRole, setInviteRole] = useState<"maintainer" | "contributor">("contributor");

  const handleRoleChange = (memberId: string, newRole: "maintainer" | "contributor") => {
    startTransition(async () => {
      const result = await updateMemberRole(workspaceId, memberId, newRole);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Role updated successfully");
      }
    });
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    startTransition(async () => {
      const result = await removeMember(workspaceId, memberId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${memberName} has been removed from the team`);
      }
    });
  };

  const handleInvite = () => {
    if (!inviteUsername.trim()) {
      toast.error("Please enter a username");
      return;
    }

    startTransition(async () => {
      const result = await inviteMember(workspaceId, inviteUsername.trim(), inviteRole);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${inviteUsername} has been added to the team`);
        setInviteOpen(false);
        setInviteUsername("");
        setInviteRole("contributor");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Team Overview Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              {members.length} member{members.length !== 1 ? "s" : ""} in this workspace
            </CardDescription>
          </div>
          {userRole === "owner" && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Add a new member to your workspace team.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Enter username"
                      value={inviteUsername}
                      onChange={(e) => setInviteUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={inviteRole}
                      onValueChange={(value: "maintainer" | "contributor") => setInviteRole(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maintainer">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Maintainer
                          </div>
                        </SelectItem>
                        <SelectItem value="contributor">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Contributor
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {inviteRole === "maintainer"
                        ? "Can manage settings, invite members, and create channels"
                        : "Regular team member with limited permissions"}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInvite} disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Invitation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                {canManageSettings && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profile?.avatar_url || ""} />
                        <AvatarFallback>
                          {member.profile?.display_name?.substring(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.profile?.display_name || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{member.profile?.username || "unknown"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.role === "owner" || !canManageSettings ? (
                      <Badge variant={roleBadgeVariants[member.role] || "outline"}>
                        {roleIcons[member.role]}
                        <span className="ml-1 capitalize">{member.role}</span>
                      </Badge>
                    ) : (
                      <Select
                        value={member.role}
                        onValueChange={(value: "maintainer" | "contributor") =>
                          handleRoleChange(member.id, value)
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="maintainer">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Maintainer
                            </div>
                          </SelectItem>
                          <SelectItem value="contributor">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Contributor
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    {member.joined_at
                      ? new Date(member.joined_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.active !== false ? "default" : "secondary"}>
                      {member.active !== false ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  {canManageSettings && (
                    <TableCell className="text-right">
                      {member.role !== "owner" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              disabled={isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove{" "}
                                <strong>{member.profile?.display_name}</strong> from the team?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleRemoveMember(
                                    member.id,
                                    member.profile?.display_name || "Member"
                                  )
                                }
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

