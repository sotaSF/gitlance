"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ExternalLink, Github, Linkedin, Loader2 } from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";
import { updateSocialLinks } from "@/app/settings/actions";
import type { SocialLinksFormData } from "@/types/settings";

const socialLinksSchema = z.object({
  github_username: z.string().optional().nullable(),
  linkedin_url: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) =>
        !val ||
        val.startsWith("https://linkedin.com/") ||
        val.startsWith("https://www.linkedin.com/"),
      "Must be a valid LinkedIn URL"
    ),
});

type SocialLinksFormValues = z.infer<typeof socialLinksSchema>;

interface SocialLinksFormProps {
  initialData: SocialLinksFormData;
}

export function SocialLinksForm({ initialData }: SocialLinksFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SocialLinksFormValues>({
    resolver: zodResolver(socialLinksSchema),
    defaultValues: {
      github_username: initialData.github_username || "",
      linkedin_url: initialData.linkedin_url || "",
    },
  });



  const onSubmit = async (data: SocialLinksFormValues) => {
    setIsLoading(true);
    try {
      const result = await updateSocialLinks(data as SocialLinksFormData);

      if (result.success) {
        toast({
          title: "Success",
          description: "Your social links have been updated successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update social links",
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

  const githubUsername = form.watch("github_username");
  const linkedinUrl = form.watch("linkedin_url");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* GitHub Username */}
        <FormField
          control={form.control}
          name="github_username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-100">
                  <Github className="h-4 w-4 text-white dark:text-gray-900" />
                </div>
                GitHub Username
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="octocat"
                  {...field}
                  value={field.value || ""}
                  className="text-base"
                  disabled={true}
                />
              </FormControl>
              <FormDescription>
                GitHub username is managed via your connected account.
              </FormDescription>

              {githubUsername && (
                <a
                  href={`https://github.com/${githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  Preview: github.com/{githubUsername}
                </a>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* LinkedIn URL */}
        <FormField
          control={form.control}
          name="linkedin_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                  <Linkedin className="h-4 w-4 text-white" />
                </div>
                LinkedIn Profile
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="https://linkedin.com/in/yourprofile"
                  {...field}
                  value={field.value || ""}
                  className="text-base"
                />
              </FormControl>
              <FormDescription>
                Your full LinkedIn profile URL
              </FormDescription>
              {linkedinUrl && (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  Preview profile
                </a>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading} size="lg">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
