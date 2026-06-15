import { requireUser } from "@/lib/data/user";
import { getUserProfile, syncGitHubProfile } from "./actions";
import { syncGitHubTokenToDatabase } from "@/app/settings/actions";
import { redirect } from "next/navigation";
import { OnboardingClient } from "./onboarding-client";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const user = await requireUser();
  const supabase = await createServerSupabase();

  // Fetch existing profile data
  const profileResult = await getUserProfile();



  // Check if user has GitHub identity but profile doesn't have github_username
  // This happens when user signs up via GitHub OAuth
  const { data: { user: fullUser } } = await supabase.auth.getUser();
  const hasGitHubIdentity = fullUser?.identities?.some((id) => id.provider === "github");

  if (hasGitHubIdentity && !profileResult.profile?.github_username) {
    // Auto-sync GitHub profile to avoid asking user to link again
    console.log("Auto-syncing GitHub profile for user who signed up with GitHub");
    await syncGitHubProfile();

    // Also sync GitHub token to database for persistent access
    console.log("Auto-syncing GitHub token to database");
    const tokenResult = await syncGitHubTokenToDatabase();
    if (tokenResult.success) {
      console.log("✅ Successfully synced GitHub token to database");
    } else {
      console.error("❌ Failed to sync GitHub token:", tokenResult.error);
    }

    // Refetch profile to get updated data
    const updatedProfile = await getUserProfile();
    if (updatedProfile.success) {
      profileResult.profile = updatedProfile.profile;
    }
  }

  // Extract user name from metadata or email
  const userName =
    user.user_metadata?.display_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <OnboardingClient
        userName={userName}
        initialProfile={profileResult.success ? profileResult.profile : undefined}
      />
    </div>
  );
}
