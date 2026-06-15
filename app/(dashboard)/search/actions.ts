"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { Project } from "@/components/project/project-card";
import {
  ProjectSearchFilters,
  UserSearchFilters,
  SearchResult,
} from "@/types/search";

export type UserProfile = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  headline: string | null;
  location: string | null;
  years_experience: number | null;
  seniority: string | null;
  primary_role: string | null;
  is_user_verified: boolean;
  skills?: string[];
  rating?: number;
  review_count?: number;
};

export async function searchProjects(
  filters: ProjectSearchFilters
): Promise<SearchResult<Project>> {
  const supabase = await createServerSupabase();
  const {
    query,
    tags,
    minBudget,
    maxBudget,
    collaborationType,
    experienceLevel,
    paymentType,
    status,
    isPublished,
    deadlineStart,
    deadlineEnd,
    sortBy = "recent",
    page = 1,
    limit = 10,
  } = filters;

  let dbQuery = supabase
    .from("projects")
    .select(
      `
      id,
      title,
      short_description,
      owner_estimated_budget,
      tags,
      created_at,
      owner_id,
      collaboration_type,
      experience_level,
      payment_type,
      status,
      deadline,
      profiles:owner_id (
        display_name,
        avatar_url
      )
    `,
      { count: "exact" }
    )
    .eq("status", "open");

  // Apply filters
  if (query) {
    dbQuery = dbQuery.or(
      `title.ilike.%${query}%,short_description.ilike.%${query}%`
    );
  }

  if (tags && tags.length > 0) {
    dbQuery = dbQuery.contains("tags", tags);
  }

  if (minBudget !== undefined) {
    dbQuery = dbQuery.gte("owner_estimated_budget", minBudget);
  }

  if (maxBudget !== undefined) {
    dbQuery = dbQuery.lte("owner_estimated_budget", maxBudget);
  }

  if (collaborationType && collaborationType.length > 0) {
    dbQuery = dbQuery.in("collaboration_type", collaborationType);
  }

  if (experienceLevel && experienceLevel.length > 0) {
    dbQuery = dbQuery.in("experience_level", experienceLevel);
  }

  if (paymentType && paymentType.length > 0) {
    dbQuery = dbQuery.in("payment_type", paymentType);
  }

  if (status && status.length > 0) {
    dbQuery = dbQuery.in("status", status);
  }

  if (isPublished !== undefined) {
    dbQuery = dbQuery.eq("is_published", isPublished);
  } else {
    // Default to published only if not specified
    dbQuery = dbQuery.eq("is_published", true);
  }

  if (deadlineStart) {
    dbQuery = dbQuery.gte("deadline", deadlineStart);
  }

  if (deadlineEnd) {
    dbQuery = dbQuery.lte("deadline", deadlineEnd);
  }

  // Apply sorting
  switch (sortBy) {
    case "budget_high":
      dbQuery = dbQuery.order("owner_estimated_budget", { ascending: false });
      break;
    case "budget_low":
      dbQuery = dbQuery.order("owner_estimated_budget", { ascending: true });
      break;
    case "deadline":
      dbQuery = dbQuery.order("deadline", { ascending: true });
      break;
    case "recent":
    default:
      dbQuery = dbQuery.order("created_at", { ascending: false });
      break;
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  dbQuery = dbQuery.range(from, to);

  const { data, error, count } = await dbQuery;

  if (error) {
    console.error("Error searching projects:", error);
    throw new Error("Failed to search projects");
  }

  const projects: Project[] = data.map((p: any) => ({
    id: p.id,
    title: p.title,
    short_description: p.short_description || "",
    budget_min: p.owner_estimated_budget,
    budget_max: p.owner_estimated_budget,
    tags: p.tags || [],
    posted_at: p.created_at,
    owner_id: p.owner_id,
    client: {
      name: p.profiles?.display_name || "Unknown Client",
      avatar: p.profiles?.avatar_url,
    },
  }));

  return {
    data: projects,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function searchUsers(
  filters: UserSearchFilters
): Promise<SearchResult<UserProfile>> {
  const supabase = await createServerSupabase();
  const {
    query,
    skills,
    minExperience,
    maxExperience,
    seniority,
    primaryRole,
    location,
    isVerified,
    sortBy = "recent",
    page = 1,
    limit = 10,
  } = filters;

  // Start building the query on profiles
  let dbQuery = supabase.from("profiles").select(
    `
      id,
      display_name,
      username,
      avatar_url,
      headline,
      location,
      years_experience,
      seniority,
      primary_role,
      is_user_verified,
      created_at,
      user_skills (
        skills (
          name
        )
      )
    `,
    { count: "exact" }
  );

  // Apply filters
  if (query) {
    dbQuery = dbQuery.or(
      `display_name.ilike.%${query}%,headline.ilike.%${query}%`
    );
  }

  // ... (rest of the filters)

  // Apply sorting
  switch (sortBy) {
    case "experience":
      dbQuery = dbQuery.order("years_experience", { ascending: false });
      break;
    case "recent":
    default:
      dbQuery = dbQuery.order("created_at", { ascending: false });
      break;
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  dbQuery = dbQuery.range(from, to);

  const { data, error, count } = await dbQuery;

  if (error) {
    console.error(
      "Error searching users (FULL):",
      JSON.stringify(error, null, 2)
    );
    console.error("Error details:", error.message, error.details, error.hint);
    throw new Error(`Failed to search users: ${error.message}`);
  }

  // Process the data to flatten skills
  const users: UserProfile[] = data.map((p: any) => ({
    id: p.id,
    display_name: p.display_name,
    username: p.username,
    avatar_url: p.avatar_url,
    headline: p.headline,
    location: p.location,
    years_experience: p.years_experience,
    seniority: p.seniority,
    primary_role: p.primary_role,
    is_user_verified: p.is_user_verified,
    skills:
      p.user_skills
        ?.flatMap((us: any) => {
          if (!us?.skills) return [];
          if (Array.isArray(us.skills)) {
            return us.skills.map((s: any) => s?.name).filter(Boolean);
          }

          if (
            typeof us.skills === "object" &&
            us.skills !== null &&
            "name" in us.skills
          ) {
            return us.skills.name ? [us.skills.name] : [];
          }

          return [];
        })
        .filter(Boolean) || [],
  }));

  return {
    data: users,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function getAvailableTags(): Promise<string[]> {
  const supabase = await createServerSupabase();

  // This is a bit heavy if we have many projects.
  // Ideally we should have a tags table or a materialized view.
  // For now, we'll fetch distinct tags from recent projects.
  const { data, error } = await supabase
    .from("projects")
    .select("tags")
    .limit(100);

  if (error) return [];

  const allTags = data.flatMap((p: any) => p.tags || []);
  return Array.from(new Set(allTags)).sort();
}

export async function getAvailableSkills(): Promise<string[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("skills")
    .select("name")
    .order("name");

  if (error) return [];

  return data.map((s: any) => s.name);
}
