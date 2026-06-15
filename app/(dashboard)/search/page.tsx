import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { SearchHeader } from "@/components/search/search-header";
import { ProjectFilters } from "@/components/search/project-filters";
import { UserFilters } from "@/components/search/user-filters";
import ProjectCard from "@/components/project/project-card";
import { UserCard } from "@/components/search/user-card";
import { Button } from "@/components/ui/button";
import {
  searchProjects,
  searchUsers,
  getAvailableTags,
  getAvailableSkills,
  type UserProfile,
} from "./actions";
import {
  ProjectSearchFilters,
  UserSearchFilters,
  SearchResult,
} from "@/types/search";

export const metadata: Metadata = {
  title: "Search | GitLance",
  description: "Find projects and professionals on GitLance",
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const activeTab = (params.tab as "projects" | "users") || "projects";
  const page = Number(params.page) || 1;
  const limit = 12;

  const availableTagsPromise = getAvailableTags();
  const availableSkillsPromise = getAvailableSkills();

  let projectFilters: ProjectSearchFilters | null = null;
  let userFilters: UserSearchFilters | null = null;

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (activeTab === "projects") {
    projectFilters = {
      query: params.q as string,
      tags:
        typeof params.tags === "string"
          ? [params.tags]
          : (params.tags as string[]),
      minBudget: params.minBudget ? Number(params.minBudget) : undefined,
      maxBudget: params.maxBudget ? Number(params.maxBudget) : undefined,
      collaborationType:
        typeof params.collaborationType === "string"
          ? [params.collaborationType]
          : (params.collaborationType as string[]),
      experienceLevel:
        typeof params.experienceLevel === "string"
          ? [params.experienceLevel]
          : (params.experienceLevel as string[]),
      paymentType:
        typeof params.paymentType === "string"
          ? [params.paymentType]
          : (params.paymentType as string[]),
      status:
        typeof params.status === "string"
          ? [params.status]
          : (params.status as string[]),
      isPublished: true, // Always show published projects
      sortBy: params.sort as any,
      page,
      limit,
    };
  } else {
    userFilters = {
      query: params.q as string,
      skills:
        typeof params.skills === "string"
          ? [params.skills]
          : (params.skills as string[]),
      minExperience: params.minExperience
        ? Number(params.minExperience)
        : undefined,
      maxExperience: params.maxExperience
        ? Number(params.maxExperience)
        : undefined,
      seniority:
        typeof params.seniority === "string"
          ? [params.seniority]
          : (params.seniority as string[]),
      location: params.location as string,
      isVerified: params.isVerified === "true",
      sortBy: params.sort as any,
      page,
      limit,
    };
  }

  const projectResultsPromise = projectFilters
    ? searchProjects(projectFilters)
    : null;
  const userResultsPromise = userFilters ? searchUsers(userFilters) : null;
  const activeResultsPromise = (projectResultsPromise ?? userResultsPromise)!;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<HeaderSkeleton />}>
          <ResultsHeader
            activeTab={activeTab}
            resultsPromise={activeResultsPromise}
          />
        </Suspense>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Filters Sidebar */}
          <aside className="hidden lg:block space-y-6">
            <Suspense fallback={<FiltersSkeleton />}>
              <FiltersSidebar
                activeTab={activeTab}
                availableTagsPromise={availableTagsPromise}
                availableSkillsPromise={availableSkillsPromise}
              />
            </Suspense>
          </aside>

          {/* Results Grid */}
          <main className="space-y-6">
            {/* Mobile Filter Trigger (Visible only on mobile) */}
            <div className="lg:hidden">
              {/* This would be a Sheet trigger in a real implementation */}
              <div className="p-4 rounded-lg border bg-muted/30 mb-4">
                <p className="text-sm text-muted-foreground text-center">
                  Filters are available on desktop view. Mobile filters coming
                  soon.
                </p>
              </div>
            </div>

            <Suspense fallback={<ResultsSkeleton />}>
              {activeTab === "projects" ? (
                <ProjectResults
                  promise={projectResultsPromise!}
                  currentUserId={user?.id}
                  params={params}
                  page={page}
                  limit={limit}
                />
              ) : (
                <UserResults
                  promise={userResultsPromise!}
                  params={params}
                  page={page}
                  limit={limit}
                />
              )}
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}

async function FiltersSidebar({
  activeTab,
  availableTagsPromise,
  availableSkillsPromise,
}: {
  activeTab: "projects" | "users";
  availableTagsPromise: Promise<string[]>;
  availableSkillsPromise: Promise<string[]>;
}) {
  return (
    <div className="sticky top-24 p-6 rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm">
      {activeTab === "projects" ? (
        <ProjectFilters availableTags={await availableTagsPromise} />
      ) : (
        <UserFilters availableSkills={await availableSkillsPromise} />
      )}
    </div>
  );
}

async function ResultsHeader({
  activeTab,
  resultsPromise,
}: {
  activeTab: "projects" | "users";
  resultsPromise: Promise<SearchResult<any>>;
}) {
  const results = await resultsPromise;
  return <SearchHeader activeTab={activeTab} totalResults={results.total} />;
}

async function ProjectResults({
  promise,
  currentUserId,
  params,
  page,
  limit,
}: {
  promise: Promise<SearchResult<any>>;
  currentUserId?: string;
  params: SearchParams;
  page: number;
  limit: number;
}) {
  const projectResults = await promise;

  if (!projectResults.data.length) {
    return <EmptyState type="projects" />;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projectResults.data.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            currentUserId={currentUserId}
          />
        ))}
      </div>
      <ResultsPagination
        total={projectResults.total}
        page={page}
        limit={limit}
        params={params}
      />
    </>
  );
}

async function UserResults({
  promise,
  params,
  page,
  limit,
}: {
  promise: Promise<SearchResult<UserProfile>>;
  params: SearchParams;
  page: number;
  limit: number;
}) {
  const userResults = await promise;

  if (!userResults.data.length) {
    return <EmptyState type="users" />;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {userResults.data.map((userProfile) => (
          <UserCard key={userProfile.id} user={userProfile} />
        ))}
      </div>
      <ResultsPagination
        total={userResults.total}
        page={page}
        limit={limit}
        params={params}
      />
    </>
  );
}

function ResultsPagination({
  total,
  page,
  limit,
  params,
}: {
  total: number;
  page: number;
  limit: number;
  params: SearchParams;
}) {
  if (total <= limit) return null;

  const totalPages = Math.ceil(total / limit);
  const prevQuery = buildSearchParams(params, { page: String(page - 1) });
  const nextQuery = buildSearchParams(params, { page: String(page + 1) });

  return (
    <div className="flex justify-center mt-12">
      <div className="flex items-center gap-2">
        {page > 1 && (
          <Link href={`?${prevQuery}`}>
            <Button variant="outline">Previous</Button>
          </Link>
        )}
        <div className="text-sm font-medium">
          Page {page} of {totalPages}
        </div>
        {page < totalPages && (
          <Link href={`?${nextQuery}`}>
            <Button variant="outline">Next</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function buildSearchParams(
  params: SearchParams,
  overrides: Record<string, string>
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, item));
      return;
    }
    searchParams.set(key, value);
  });

  Object.entries(overrides).forEach(([key, value]) => {
    searchParams.set(key, value);
  });

  return searchParams.toString();
}

function EmptyState({ type }: { type: "projects" | "users" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed bg-muted/30">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <SearchIcon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">No {type} found</h3>
      <p className="text-muted-foreground max-w-sm mt-2 mb-6">
        We couldn't find any {type} matching your search criteria. Try adjusting
        your filters or search terms.
      </p>
      <Link href="/search">
        <Button variant="outline">Clear Search</Button>
      </Link>
    </div>
  );
}

function SearchIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function FiltersSkeleton() {
  return (
    <div className="sticky top-24 p-6 rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm animate-pulse space-y-4">
      <div className="h-4 w-1/2 bg-muted rounded" />
      <div className="h-10 w-full bg-muted rounded" />
      <div className="h-10 w-full bg-muted rounded" />
      <div className="h-10 w-4/5 bg-muted rounded" />
    </div>
  );
}

function HeaderSkeleton() {
  return <div className="h-10 w-64 rounded-full bg-muted animate-pulse" />;
}

function ResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-48 rounded-xl border bg-card animate-pulse"
          />
        ))}
      </div>
      <div className="h-8 w-40 mx-auto rounded-full bg-muted animate-pulse" />
    </div>
  );
}
