"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Chrome, Github, Lock, Loader2, Mail, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  updatePassword,
  linkOAuthProvider,
  unlinkOAuthProvider,
} from "@/app/settings/actions";
import type { LinkedProvider } from "@/types/settings";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

interface SecuritySettingsProps {
  linkedProviders: LinkedProvider[];
}

export function SecuritySettings({ linkedProviders }: SecuritySettingsProps) {
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const { toast } = useToast();

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setIsPasswordLoading(true);
    try {
      const result = await updatePassword(data.currentPassword, data.newPassword);

      if (result.success) {
        toast({
          title: "Success",
          description: "Your password has been updated successfully.",
        });
        passwordForm.reset();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleLinkProvider = async (provider: "github" | "google") => {
    setLinkingProvider(provider);
    try {
      const result = await linkOAuthProvider(provider, window.location.href);

      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to link ${provider}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLinkingProvider(null);
    }
  };

  const handleUnlinkProvider = async (provider: "github" | "google") => {
    try {
      const result = await unlinkOAuthProvider(provider);

      if (result.success) {
        toast({
          title: "Success",
          description: `${provider} has been unlinked successfully.`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to unlink ${provider}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const hasProvider = (provider: string) =>
    linkedProviders.some((p) => p.provider === provider);
  const canUnlink = linkedProviders.length > 1;

  return (
    <div className="space-y-10">
      {/* Password Change Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Change Password</h3>
          <p className="text-sm text-muted-foreground">
            Update your account password to keep your account secure
          </p>
        </div>
        <Separator />
        <Form {...passwordForm}>
          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="space-y-4 max-w-xl"
          >
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isPasswordLoading}>
                {isPasswordLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Password
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Linked Accounts Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Linked Accounts</h3>
          <p className="text-sm text-muted-foreground">
            Manage your authentication methods and connected providers
          </p>
        </div>
        <Separator />
        
        <div className="grid gap-4 max-w-2xl">
          {/* Email Provider */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="font-medium">Email</div>
                <div className="text-sm text-muted-foreground">
                  Sign in with email and password
                </div>
              </div>
            </div>
            <Badge variant={hasProvider("email") ? "default" : "secondary"}>
              {hasProvider("email") ? "Connected" : "Not Connected"}
            </Badge>
          </div>

          {/* GitHub Provider */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-100">
                <Github className="h-5 w-5 text-white dark:text-gray-900" />
              </div>
              <div>
                <div className="font-medium">GitHub</div>
                <div className="text-sm text-muted-foreground">
                  Sign in with your GitHub account
                </div>
              </div>
            </div>
            {hasProvider("github") ? (
              <div className="flex items-center gap-3">
                <Badge variant="default">Connected</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnlinkProvider("github")}
                  disabled={!canUnlink}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Unlink
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLinkProvider("github")}
                disabled={linkingProvider === "github"}
              >
                {linkingProvider === "github" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Link Account
              </Button>
            )}
          </div>

          {/* Google Provider */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border">
                <Chrome className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">Google</div>
                <div className="text-sm text-muted-foreground">
                  Sign in with your Google account
                </div>
              </div>
            </div>
            {hasProvider("google") ? (
              <div className="flex items-center gap-3">
                <Badge variant="default">Connected</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnlinkProvider("google")}
                  disabled={!canUnlink}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Unlink
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLinkProvider("google")}
                disabled={linkingProvider === "google"}
              >
                {linkingProvider === "google" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Link Account
              </Button>
            )}
          </div>
        </div>

        {!canUnlink && (
          <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 max-w-2xl">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="text-sm text-amber-700 dark:text-amber-400">
              You must have at least one authentication method linked to your account.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
