"use server";

import { Octokit } from "octokit";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UserSkill = {
  skill_id: number;
  name: string;
  proficiency: number;
  category: string;
};

export type SkillInput = {
  skill_id: number;
  name: string;
  proficiency: number;
};

export type GithubStats = {
  contributions: number;
  repositories: number;
  stars: number;
  followers: number;
};

export type ContributionDay = {
  date: string;
  count: number;
  level: number;
};

export type ContributionGraphData = {
  contributions: ContributionDay[];
  totalContributions: number;
};

/**
 * Fetch GitHub stats for a user using Octokit
 * This uses the GitHub REST and GraphQL APIs to fetch comprehensive user statistics
 */
export async function fetchGitHubStats(
  githubUsername: string
): Promise<{ success: boolean; stats?: GithubStats; error?: string }> {
  try {
    if (!githubUsername) {
      return { success: false, error: "GitHub username is required" };
    }

    // Initialize Octokit with optional authentication for higher rate limits
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
      request: {
        fetch: (url: string, options: any) => {
          return fetch(url, {
            ...options,
            next: { revalidate: 3600 }, // Cache for 1 hour
          });
        },
      },
    });

    // Fetch user data using Octokit REST API
    const { data: userData } = await octokit.rest.users.getByUsername({
      username: githubUsername,
    });

    // Fetch repositories to calculate total stars
    const { data: repos } = await octokit.rest.repos.listForUser({
      username: githubUsername,
      per_page: 100,
      sort: "updated",
    });

    const totalStars = repos.reduce(
      (sum, repo) => sum + (repo.stargazers_count || 0),
      0
    );

    // Fetch contributions using GraphQL API
    let contributions = 0;

    try {
      const contributionsQuery = `
        query($username: String!) {
          user(login: $username) {
            contributionsCollection {
              contributionCalendar {
                totalContributions
              }
            }
          }
        }
      `;

      const graphqlResponse: any = await octokit.graphql(contributionsQuery, {
        username: githubUsername,
      });

      contributions =
        graphqlResponse?.user?.contributionsCollection?.contributionCalendar
          ?.totalContributions || 0;
    } catch (graphqlError) {
      console.warn(
        "Could not fetch contributions via GraphQL, falling back to stored data:",
        graphqlError
      );

      // Fallback: Try to get contributions from stored profile data
      const supabase = await createServerSupabase();
      const { data: profile } = await supabase
        .from("profiles")
        .select("github_stats")
        .eq("github_username", githubUsername)
        .single();

      if (profile?.github_stats) {
        const storedStats = profile.github_stats as Partial<GithubStats>;
        contributions = storedStats.contributions || 0;
      }
    }

    const stats: GithubStats = {
      contributions,
      repositories: userData.public_repos || 0,
      stars: totalStars,
      followers: userData.followers || 0,
    };

    return { success: true, stats };
  } catch (error: any) {
    console.error("Error fetching GitHub stats:", error);

    // Handle specific Octokit errors
    if (error.status === 404) {
      return { success: false, error: "GitHub user not found" };
    }

    if (error.status === 403) {
      return {
        success: false,
        error: "GitHub API rate limit exceeded. Please try again later.",
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred while fetching GitHub stats",
    };
  }
}

/**
 * Update GitHub stats in the user profile
 */
export async function updateGitHubStats(
  userId: string,
  stats: GithubStats
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    const { error } = await supabase
      .from("profiles")
      .update({
        github_stats: stats,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Error updating GitHub stats:", error);
      return { success: false, error: "Failed to update GitHub stats" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in updateGitHubStats:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Fetch GitHub contribution graph data for the last year
 */
export async function fetchGitHubContributionGraph(
  githubUsername: string
): Promise<{ success: boolean; data?: ContributionGraphData; error?: string }> {
  try {
    if (!githubUsername) {
      return { success: false, error: "GitHub username is required" };
    }

    // Initialize Octokit
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
      request: {
        fetch: (url: string, options: any) => {
          return fetch(url, {
            ...options,
            next: { revalidate: 3600 }, // Cache for 1 hour
          });
        },
      },
    });

    // Fetch contribution graph using GraphQL API
    const contributionGraphQuery = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }
    `;

    const graphqlResponse: any = await octokit.graphql(contributionGraphQuery, {
      username: githubUsername,
    });

    const calendar =
      graphqlResponse?.user?.contributionsCollection?.contributionCalendar;

    if (!calendar) {
      return { success: false, error: "No contribution data available" };
    }

    // Flatten the weeks array to get all contribution days
    const contributions: ContributionDay[] = [];
    let maxContributions = 0;

    // Find max contributions for level calculation
    calendar.weeks.forEach((week: any) => {
      week.contributionDays.forEach((day: any) => {
        if (day.contributionCount > maxContributions) {
          maxContributions = day.contributionCount;
        }
      });
    });

    // Process contribution days and calculate levels
    calendar.weeks.forEach((week: any) => {
      week.contributionDays.forEach((day: any) => {
        const count = day.contributionCount;
        let level = 0;

        // Calculate level based on contribution count
        // Level 0: 0 contributions
        // Level 1: 1-3 contributions
        // Level 2: 4-6 contributions
        // Level 3: 7-9 contributions
        // Level 4: 10+ contributions
        if (count === 0) {
          level = 0;
        } else if (count <= 3) {
          level = 1;
        } else if (count <= 6) {
          level = 2;
        } else if (count <= 9) {
          level = 3;
        } else {
          level = 4;
        }

        contributions.push({
          date: day.date,
          count,
          level,
        });
      });
    });

    return {
      success: true,
      data: {
        contributions,
        totalContributions: calendar.totalContributions,
      },
    };
  } catch (error: any) {
    console.error("Error fetching GitHub contribution graph:", error);

    // Handle specific errors
    if (error.status === 404) {
      return { success: false, error: "GitHub user not found" };
    }

    if (error.status === 403) {
      return {
        success: false,
        error: "GitHub API rate limit exceeded. Please try again later.",
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred while fetching contribution graph",
    };
  }
}

/**
 * Get user skills with proficiency for a profile
 */
export async function getUserSkills(
  userId: string
): Promise<{ success: boolean; skills?: UserSkill[]; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("user_skills")
      .select(
        `
        skill_id,
        proficiency,
        skills (
          id,
          name,
          category
        )
      `
      )
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user skills:", error);
      return { success: false, error: "Failed to fetch skills" };
    }

    const skills: UserSkill[] = (data || []).map((item: any) => ({
      skill_id: item.skill_id,
      name: item.skills?.name || "Unknown",
      proficiency: item.proficiency || 3,
      category: item.skills?.category || "general",
    }));

    return { success: true, skills };
  } catch (error) {
    console.error("Error in getUserSkills:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all available skills from the database
 */
export async function getAvailableSkills(): Promise<{
  success: boolean;
  skills?: Array<{ id: number; name: string; category: string }>;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("skills")
      .select("id, name, category")
      .order("name");

    if (error) {
      console.error("Error fetching available skills:", error);
      return { success: false, error: "Failed to fetch skills" };
    }

    return { success: true, skills: data || [] };
  } catch (error) {
    console.error("Error in getAvailableSkills:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Create a custom skill if it doesn't exist
 */
export async function createCustomSkillForProfile(
  name: string,
  category: string = "general"
): Promise<{
  success: boolean;
  skill?: { id: number; name: string; category: string };
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

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
    console.error("Error in createCustomSkillForProfile:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update user skills for a profile (only allowed on own profile)
 */
export async function updateProfileSkills(
  profileId: string,
  skills: SkillInput[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Ensure user can only update their own profile
    if (user.id !== profileId) {
      return { success: false, error: "Unauthorized to update this profile" };
    }

    // Get the user's username for revalidation
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", profileId)
      .single();

    // Delete existing skills
    await supabase.from("user_skills").delete().eq("user_id", profileId);

    // Insert new skills (only those with positive IDs from database)
    if (skills.length > 0) {
      const validSkills = skills.filter((s) => s.skill_id > 0);

      if (validSkills.length > 0) {
        const skillsToInsert = validSkills.map((skill) => ({
          user_id: profileId,
          skill_id: skill.skill_id,
          proficiency: skill.proficiency,
        }));

        const { error } = await supabase
          .from("user_skills")
          .insert(skillsToInsert);

        if (error) {
          console.error("Error updating profile skills:", error);
          return { success: false, error: "Failed to update skills" };
        }
      }
    }

    // Revalidate using username for SEO-friendly URL
    if (profile?.username) {
      revalidatePath(`/profile/${profile.username}`);
    }
    return { success: true };
  } catch (error) {
    console.error("Error in updateProfileSkills:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ========================
// REVIEW SERVER ACTIONS
// ========================

/**
 * Get shared projects between the current user and a target user.
 * Used to populate the project dropdown in the WriteReviewModal.
 */
export async function getSharedProjects(
  targetUserId: string
): Promise<{
  success: boolean;
  projects?: Array<{ id: string; title: string }>;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    if (user.id === targetUserId) {
      return { success: false, error: "Cannot review yourself" };
    }

    // Find projects where BOTH users are involved
    // A user is involved if they are the project owner OR a team member
    const { data: myProjects } = await supabase
      .from("projects")
      .select("id, title, owner_id")
      .or(`owner_id.eq.${user.id}`);

    const { data: myTeamProjects } = await supabase
      .from("project_team_members")
      .select("project_id, projects(id, title)")
      .eq("profile_id", user.id);

    // Combine owned + team projects for current user
    const myProjectIds = new Set<string>();
    const projectMap = new Map<string, string>();

    myProjects?.forEach((p) => {
      myProjectIds.add(p.id);
      projectMap.set(p.id, p.title);
    });
    myTeamProjects?.forEach((tp: any) => {
      if (tp.projects) {
        myProjectIds.add(tp.projects.id);
        projectMap.set(tp.projects.id, tp.projects.title);
      }
    });

    // Now find which of those projects the target user is also in
    const { data: targetOwnedProjects } = await supabase
      .from("projects")
      .select("id")
      .eq("owner_id", targetUserId);

    const { data: targetTeamProjects } = await supabase
      .from("project_team_members")
      .select("project_id")
      .eq("profile_id", targetUserId);

    const targetProjectIds = new Set<string>();
    targetOwnedProjects?.forEach((p) => targetProjectIds.add(p.id));
    targetTeamProjects?.forEach((tp) => targetProjectIds.add(tp.project_id));

    // Intersection
    const shared: Array<{ id: string; title: string }> = [];
    myProjectIds.forEach((pid) => {
      if (targetProjectIds.has(pid)) {
        shared.push({ id: pid, title: projectMap.get(pid) || "Untitled" });
      }
    });

    return { success: true, projects: shared };
  } catch (error) {
    console.error("Error in getSharedProjects:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Submit a review for another user
 */
export async function submitReview(
  revieweeId: string,
  projectId: string,
  rating: number,
  title: string,
  comment: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    if (user.id === revieweeId) {
      return { success: false, error: "You cannot review yourself" };
    }

    if (rating < 1 || rating > 5) {
      return { success: false, error: "Rating must be between 1 and 5" };
    }

    if (!comment.trim()) {
      return { success: false, error: "Comment is required" };
    }

    // Check for duplicate review on the same project
    const { data: existing } = await supabase
      .from("user_reviews")
      .select("id")
      .eq("reviewer_id", user.id)
      .eq("reviewee_id", revieweeId)
      .eq("project_id", projectId)
      .single();

    if (existing) {
      return {
        success: false,
        error: "You have already reviewed this user for this project",
      };
    }

    // Verify both users share the project
    const sharedResult = await getSharedProjects(revieweeId);
    if (
      !sharedResult.success ||
      !sharedResult.projects?.some((p) => p.id === projectId)
    ) {
      return {
        success: false,
        error: "You can only review users you have worked with on a shared project",
      };
    }

    const { error } = await supabase.from("user_reviews").insert({
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      project_id: projectId,
      rating,
      title: title.trim() || null,
      comment: comment.trim(),
    });

    if (error) {
      console.error("Error submitting review:", error);
      return { success: false, error: "Failed to submit review" };
    }

    // Get reviewee username for revalidation
    const { data: reviewee } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", revieweeId)
      .single();

    if (reviewee?.username) {
      revalidatePath(`/profile/${reviewee.username}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error in submitReview:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete a review (only own reviews)
 */
export async function deleteReview(
  reviewId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    // Verify ownership
    const { data: review } = await supabase
      .from("user_reviews")
      .select("id, reviewer_id, reviewee_id")
      .eq("id", reviewId)
      .single();

    if (!review) return { success: false, error: "Review not found" };
    if (review.reviewer_id !== user.id) {
      return { success: false, error: "You can only delete your own reviews" };
    }

    const { error } = await supabase
      .from("user_reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      return { success: false, error: "Failed to delete review" };
    }

    // Revalidate reviewee profile
    const { data: reviewee } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", review.reviewee_id)
      .single();

    if (reviewee?.username) {
      revalidatePath(`/profile/${reviewee.username}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteReview:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Vote on a review (upvote/downvote toggle)
 */
export async function voteOnReview(
  reviewId: string,
  vote: 1 | -1
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    // Check for existing vote
    const { data: existingVote } = await supabase
      .from("user_review_votes")
      .select("id, vote")
      .eq("review_id", reviewId)
      .eq("user_id", user.id)
      .single();

    if (existingVote) {
      if (existingVote.vote === vote) {
        // Same vote => remove (toggle off)
        await supabase
          .from("user_review_votes")
          .delete()
          .eq("id", existingVote.id);
      } else {
        // Different vote => update
        await supabase
          .from("user_review_votes")
          .update({ vote })
          .eq("id", existingVote.id);
      }
    } else {
      // No existing vote => insert
      await supabase.from("user_review_votes").insert({
        review_id: reviewId,
        user_id: user.id,
        vote,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error in voteOnReview:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
