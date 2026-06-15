"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Upload, X, User as UserIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  updateProfileSettings,
  checkUsernameAvailability,
  uploadProfilePicture,
} from "@/app/settings/actions";
import type { ProfileSettingsFormData } from "@/types/settings";

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const profileSchema = z.object({
  display_name: z.string().min(2, "Display name must be at least 2 characters").nullable(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores")
    .nullable(),
  headline: z.string().max(100, "Headline must be less than 100 characters").nullable(),
  description: z.string().max(2000, "Description must be less than 2000 characters").nullable(),
  location: z.string().max(100, "Location must be less than 100 characters").nullable(),
  timezone: z.string().nullable(),
  pronouns: z.string().max(50, "Pronouns must be less than 50 characters").nullable(),
  years_experience: z.number().min(0, "Years of experience must be positive").max(70, "Invalid years of experience").nullable(),
  seniority: z.enum(["junior", "mid", "senior", "lead"]).nullable(),
  primary_role: z.string().max(100, "Primary role must be less than 100 characters").nullable(),
  avatar_url: z.string().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileSettingsFormProps {
  initialData: ProfileSettingsFormData;
}

export function ProfileSettingsForm({ initialData }: ProfileSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData.avatar_url);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: initialData.display_name || "",
      username: initialData.username || "",
      headline: initialData.headline || "",
      description: initialData.description || "",
      location: initialData.location || "",
      timezone: initialData.timezone || "",
      pronouns: initialData.pronouns || "",
      years_experience: initialData.years_experience || 0,
      seniority: initialData.seniority || null,
      primary_role: initialData.primary_role || "",
      avatar_url: initialData.avatar_url || null,
    },
  });

  // Check username availability on change
  const checkUsername = async (username: string) => {
    if (!username || username === initialData.username) return;

    setUsernameChecking(true);
    try {
      const result = await checkUsernameAvailability(username);
      if (!result.available) {
        form.setError("username", {
          type: "manual",
          message: "Username is already taken",
        });
      }
    } catch (error) {
      console.error("Error checking username:", error);
    } finally {
      setUsernameChecking(false);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      const result = await updateProfileSettings(data as ProfileSettingsFormData);

      if (result.success) {
        toast({
          title: "Success",
          description: "Your profile has been updated successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update profile",
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
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only JPEG, PNG, and WebP images are allowed.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "File size must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      const uploadResult = await uploadProfilePicture(file);

      if (uploadResult.success && uploadResult.url) {
        // Update form value
        form.setValue("avatar_url", uploadResult.url);
        
        // Immediately save to database
        const formValues = form.getValues();
        const updateResult = await updateProfileSettings({
          ...formValues,
          avatar_url: uploadResult.url,
        } as ProfileSettingsFormData);

        if (updateResult.success) {
          toast({
            title: "Success",
            description: "Profile picture uploaded and saved successfully.",
          });
        } else {
          toast({
            title: "Warning",
            description: "Picture uploaded but failed to save to profile. " + (updateResult.error || ""),
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: uploadResult.error || "Failed to upload profile picture",
          variant: "destructive",
        });
        setAvatarPreview(initialData.avatar_url);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred during upload",
        variant: "destructive",
      });
      setAvatarPreview(initialData.avatar_url);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploading(true);
    try {
      setAvatarPreview(null);
      form.setValue("avatar_url", null);
      
      // Immediately save to database
      const formValues = form.getValues();
      const updateResult = await updateProfileSettings({
        ...formValues,
        avatar_url: null,
      } as ProfileSettingsFormData);

      if (updateResult.success) {
        toast({
          title: "Success",
          description: "Profile picture removed successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: updateResult.error || "Failed to remove profile picture",
          variant: "destructive",
        });
        // Revert on error
        setAvatarPreview(initialData.avatar_url);
        form.setValue("avatar_url", initialData.avatar_url);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      // Revert on error
      setAvatarPreview(initialData.avatar_url);
      form.setValue("avatar_url", initialData.avatar_url);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getInitialsFromName = () => {
    const displayName = form.watch("display_name") || form.watch("username") || "U";
    const names = displayName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center gap-4 p-6 bg-muted/30 rounded-2xl border">
          <div className="relative">
            <div className="h-32 w-32 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-background">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile picture"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{getInitialsFromName()}</span>
              )}
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {isUploading ? "Uploading..." : "Upload Picture"}
            </Button>
            {avatarPreview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveAvatar}
                disabled={isUploading}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Upload a profile picture (JPEG, PNG, or WebP, max 5MB)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Display Name */}
          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} value={field.value || ""} />
                </FormControl>
                <FormDescription>
                  This is how others will see your name
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Username */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="johndoe"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e);
                        checkUsername(e.target.value);
                      }}
                    />
                    {usernameChecking && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                    )}
                  </div>
                </FormControl>
                <FormDescription>Your unique username</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Headline */}
        <FormField
          control={form.control}
          name="headline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Headline</FormLabel>
              <FormControl>
                <Input
                  placeholder="Full Stack Developer | React & Node.js Specialist"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                A brief professional tagline
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description/Bio with MDEditor */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <div data-color-mode="dark">
                  <MDEditor
                    value={field.value || ""}
                    onChange={(value) => field.onChange(value || "")}
                    preview="edit"
                    height={250}
                    textareaProps={{
                      placeholder: "Tell us about yourself, your experience, and what you're looking for..."
                    }}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Your professional background and expertise (Markdown supported)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="San Francisco, CA" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Timezone */}
          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timezone</FormLabel>
                <FormControl>
                  <Input placeholder="America/Los_Angeles" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pronouns */}
          <FormField
            control={form.control}
            name="pronouns"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pronouns</FormLabel>
                <FormControl>
                  <Input placeholder="he/him, she/her, they/them" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Years of Experience */}
          <FormField
            control={form.control}
            name="years_experience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Years of Experience</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="5"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Seniority */}
          <FormField
            control={form.control}
            name="seniority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seniority Level</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="mid">Mid-Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Primary Role */}
        <FormField
          control={form.control}
          name="primary_role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Role</FormLabel>
              <FormControl>
                <Input
                  placeholder="Frontend Developer, Backend Engineer, DevOps, etc."
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Your main area of expertise or job title
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
