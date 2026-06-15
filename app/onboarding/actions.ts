"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/data/user";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  getLocationFromIP,
  formatLocation,
  type LocationData,
} from "@/lib/services/geolocation";
import { getTestIP } from "@/lib/services/geolocation.test-config";

interface BasicDetailsData {
  username: string;
  display_name: string;
  pronouns: string;
  headline: string;
  description: string;
  location: string;
  timezone: string;
  country?: string;
  city?: string;
  region?: string;
  country_code?: string;
  avatar_url?: string;
}

interface RoleData {
  primary_role: "developer" | "client";
}

interface DeveloperDetailsData {
  years_experience: number;
  seniority: "junior" | "mid" | "senior" | "lead";
  linkedin_url: string;
  availability: any; // JSON
}

interface SkillData {
  skill_id: number;
  proficiency: number;
  years_experience?: number;
}

/**
 * Update basic profile details
 */
export async function updateBasicDetails(
  data: BasicDetailsData
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabase();

    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", data.username.trim().toLowerCase())
      .neq("id", user.id)
      .single();

    if (existingUser) {
      return { success: false, error: "Username is already taken" };
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        username: data.username.trim().toLowerCase(),
        display_name: data.display_name.trim(),
        pronouns: data.pronouns.trim(),
        headline: data.headline.trim(),
        description: data.description.trim(),
        location: data.location.trim(),
        timezone: data.timezone.trim(),
        country: data.country?.trim(),
        city: data.city?.trim(),
        region: data.region?.trim(),
        country_code: data.country_code?.trim(),
        avatar_url: data.avatar_url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error("Error updating basic details:", error);
      return { success: false, error: "Failed to update profile details" };
    }

    revalidatePath("/onboarding");
    return { success: true };
  } catch (error) {
    console.error("Error in updateBasicDetails:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update user role (developer or client)
 */
export async function updateUserRole(
  data: RoleData
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabase();

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        primary_role: data.primary_role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error("Error updating user role:", error);
      return { success: false, error: "Failed to update role" };
    }

    revalidatePath("/onboarding");
    return { success: true };
  } catch (error) {
    console.error("Error in updateUserRole:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update developer-specific details
 */
export async function updateDeveloperDetails(
  data: DeveloperDetailsData
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabase();

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        years_experience: data.years_experience,
        seniority: data.seniority,
        linkedin_url: data.linkedin_url.trim(),
        availability: data.availability,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error("Error updating developer details:", error);
      return { success: false, error: "Failed to update developer details" };
    }

    revalidatePath("/onboarding");
    return { success: true };
  } catch (error) {
    console.error("Error in updateDeveloperDetails:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Create a custom skill if it doesn't exist
 */
export async function createCustomSkill(
  name: string,
  category: string = "general"
): Promise<{
  success: boolean;
  skill?: { id: number; name: string; category: string };
  error?: string;
}> {
  try {
    await requireUser();
    const supabase = await createServerSupabase();

    // Check if skill already exists
    const { data: existing } = await supabase
      .from("skills")
      .select("id, name, category")
      .ilike("name", name.trim())
      .single();

    if (existing) {
      return { success: true, skill: existing };
    }

    // Create new skill
    const { data, error } = await supabase
      .from("skills")
      .insert({ name: name.trim(), category })
      .select("id, name, category")
      .single();

    if (error) {
      console.error("Error creating custom skill:", error);
      return { success: false, error: "Failed to create custom skill" };
    }

    return { success: true, skill: data };
  } catch (error) {
    console.error("Error in createCustomSkill:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Add or update user skills
 */
export async function updateUserSkills(
  skills: SkillData[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabase();

    // First, delete existing skills
    await supabase.from("user_skills").delete().eq("user_id", user.id);

    // Insert new skills (only those with positive IDs from database)
    if (skills.length > 0) {
      const validSkills = skills.filter((s) => s.skill_id > 0);

      if (validSkills.length > 0) {
        // Only insert columns that exist in the table to avoid schema errors.
        const skillsToInsert = validSkills.map((skill) => ({
          user_id: user.id,
          skill_id: skill.skill_id,
          proficiency: skill.proficiency,
        }));

        const { error } = await supabase
          .from("user_skills")
          .insert(skillsToInsert);

        if (error) {
          console.error("Error updating user skills:", error);
          return { success: false, error: "Failed to update skills" };
        }
      }
    }

    revalidatePath("/onboarding");
    return { success: true };
  } catch (error) {
    console.error("Error in updateUserSkills:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get available skills from the database
 */
export async function getAvailableSkills(): Promise<{
  success: boolean;
  skills?: Array<{ id: number; name: string; category: string }>;
  error?: string;
}> {
  try {
    await requireUser();
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("skills")
      .select("id, name, category")
      .order("name");

    if (error) {
      console.error("Error fetching skills:", error);
      return { success: false, error: "Failed to fetch skills" };
    }

    return { success: true, skills: data || [] };
  } catch (error) {
    console.error("Error in getAvailableSkills:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Mark onboarding as completed
 */
export async function completeOnboarding(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabase();

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error("Error completing onboarding:", error);
      return { success: false, error: "Failed to complete onboarding" };
    }

    revalidatePath("/onboarding");
    revalidatePath("/explore");
    return { success: true };
  } catch (error) {
    console.error("Error in completeOnboarding:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get current user profile data
 */
export async function getUserProfile(): Promise<{
  success: boolean;
  profile?: any;
  error?: string;
}> {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching user profile:", error);
      return { success: false, error: "Failed to fetch profile" };
    }

    return { success: true, profile: data };
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Detect user location based on their IP address
 * Uses ipapi.co free API
 */
export async function detectUserLocation(): Promise<{
  success: boolean;
  location?: LocationData;
  error?: string;
}> {
  try {
    await requireUser();

    // Check for test IP first (development only)
    const testIP = getTestIP();
    
    if (testIP) {
      // Use mock IP for testing
      const locationData = await getLocationFromIP(testIP);
      
      if (!locationData) {
        return {
          success: false,
          error: "Unable to detect location from test IP address",
        };
      }
      
      return { success: true, location: locationData };
    }

    // Get client IP from headers
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");

    // Extract IP (x-forwarded-for can contain multiple IPs, take the first one)
    const clientIp = forwardedFor?.split(",")[0].trim() || realIp || undefined;

    // Fetch location data
    const locationData = await getLocationFromIP(clientIp);

    if (!locationData) {
      return {
        success: false,
        error: "Unable to detect location from IP address",
      };
    }

    return { success: true, location: locationData };
  } catch (error) {
    console.error("Error in detectUserLocation:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Upload profile picture to Supabase storage
 */
export async function uploadProfilePicture(
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabase();

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
      };
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return {
        success: false,
        error: "File size exceeds 5MB limit.",
      };
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

    // Delete old avatar if exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    if (profile?.avatar_url) {
      // Extract old filename from URL
      const oldFileName = profile.avatar_url.split("/").pop();
      if (oldFileName) {
        const oldFilePath = `${user.id}/${oldFileName}`;
        await supabase.storage.from("profilepicbucket").remove([oldFilePath]);
      }
    }

    // Upload file to Supabase storage
    const { data, error: uploadError } = await supabase.storage
      .from("profilepicbucket")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return { success: false, error: "Failed to upload file" };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("profilepicbucket")
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("Error in uploadProfilePicture:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Sync GitHub username from linked identity
 */
export async function syncGitHubProfile(): Promise<{
  success: boolean;
  github_username?: string;
  error?: string;
}> {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabase();

    // Get user's identities
    const { data: { user: fullUser } } = await supabase.auth.getUser();
    
    if (!fullUser) {
      return { success: false, error: "User not found" };
    }

    // Find GitHub identity
    const githubIdentity = fullUser.identities?.find(
      (identity) => identity.provider === "github"
    );

    if (!githubIdentity) {
      // Not an error - user just hasn't linked GitHub yet
      return { success: true };
    }

    // Extract GitHub username from identity data
    // Try multiple possible field names
    const githubUsername = 
      githubIdentity.identity_data?.user_name || 
      githubIdentity.identity_data?.preferred_username ||
      githubIdentity.identity_data?.login;

    if (!githubUsername) {
      console.error("GitHub identity data:", githubIdentity.identity_data);
      return { success: false, error: "GitHub username not found in identity data" };
    }

    console.log("Syncing GitHub username:", githubUsername);

    // Update profile with GitHub username
    const { error } = await supabase
      .from("profiles")
      .update({
        github_username: githubUsername as string,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating GitHub username:", error);
      return { success: false, error: "Failed to update profile" };
    }

    console.log("Successfully synced GitHub username");
    // Don't call revalidatePath here as this function may be called during SSR
    // The caller should handle revalidation if needed
    return { success: true, github_username: githubUsername as string };
  } catch (error) {
    console.error("Error in syncGitHubProfile:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
