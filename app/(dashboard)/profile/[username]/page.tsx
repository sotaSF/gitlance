import { createServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  Github,
  Star,
  Briefcase,
  Clock,
  MapPin,
  Linkedin,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  Activity,
  DollarSign,
  BadgeCheck,
  ShieldAlert,
} from "lucide-react";
import {
  fetchGitHubStats,
  fetchGitHubContributionGraph,
  getUserSkills,
  type GithubStats,
  type UserSkill,
} from "./actions";
import { ReviewsSidebar } from "./components/ReviewsSidebar";
import { ContributionGraph } from "@/components/smoothui/contribution-graph";
import { ProfileDescription } from "./components/ProfileDescription";
import { SkillsSection } from "./components/SkillsSection";
import { WriteReviewButton } from "./components/WriteReviewButton";
import { ReviewVoteButtons } from "./components/ReviewVoteButtons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Generate dynamic metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createServerSupabase();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, headline, avatar_url, primary_role, location")
    .eq("username", username)
    .single();

  if (!profile) {
    return {
      title: "Profile Not Found | GitLance",
    };
  }

  const title = profile.display_name
    ? `${profile.display_name} (@${username}) | GitLance`
    : `@${username} | GitLance`;

  const description =
    profile.headline ||
    `${profile.display_name || username}${profile.primary_role ? ` - ${profile.primary_role}` : ""
    }${profile.location ? ` from ${profile.location}` : ""} on GitLance`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  };
}

// Type definitions for Supabase query results
type ProfileData = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  description: string | null;
  github_username: string | null;
  github_stats: unknown;
  location: string | null;
  timezone: string | null;
  linkedin_url: string | null;
  years_experience: number | null;
  seniority: string | null;
  primary_role: string | null;
  is_user_verified: boolean | null;
  [key: string]: unknown;
};

type ProposalData = {
  id: string;
  status: string;
  created_at: string;
  proposed_budget: number | null;
  project: Array<{
    id: string;
    title: string;
    short_description: string | null;
    owner_id: string | null;
  }> | null;
};

type ReviewData = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  reviewer: Array<{
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  }> | null;
  project: Array<{
    id: string;
    title: string;
  }> | null;
};

type ProjectEnrollment = {
  id: string;
  status: string;
  created_at: string;
  proposed_budget: number | null;
  project: {
    id: string;
    title: string;
    short_description: string | null;
    owner_id: string | null;
  };
};

type Review = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  reviewer: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  project: {
    id: string;
    title: string;
  } | null;
  upvotes: number;
  downvotes: number;
  userVote: 1 | -1 | null;
};

const FALLBACK_GITHUB_STATS: GithubStats = {
  contributions: 0,
  repositories: 0,
  stars: 0,
  followers: 0,
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createServerSupabase();

  // First, fetch the profile by username to get the user ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  // Type-safe profile data
  const profileData = profile as ProfileData;
  const userId = profileData.id;

  // Get current user for checking if viewing own profile
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  const isOwnProfile = currentUser?.id === userId;

  // Parallel data fetching using Promise.all for better performance
  const [
    { data: proposalEnrollments },
    { data: reviews },
    { count: reviewCount },
    skillsResult,
  ] = await Promise.all([
    supabase
      .from("proposals")
      .select(
        `id, status, created_at, proposed_budget, project:projects(id, title, short_description, owner_id)`
      )
      .eq("proposer_id", userId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("user_reviews")
      .select(
        `
        id,
        rating,
        title,
        comment,
        created_at,
        reviewer:profiles!user_reviews_reviewer_id_fkey(
          id,
          display_name,
          avatar_url
        ),
        project:projects(
          id,
          title
        )
      `
      )
      .eq("reviewee_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("user_reviews")
      .select("id", { count: "exact", head: true })
      .eq("reviewee_id", userId),
    getUserSkills(userId),
  ]);

  const totalReviewCount = reviewCount ?? 0;
  const userSkills: UserSkill[] = skillsResult.success
    ? skillsResult.skills || []
    : [];

  // Fetch vote data for each review
  const reviewIds = (reviews as ReviewData[] | null)?.map((r) => r.id) || [];
  let voteCounts: Record<string, { up: number; down: number }> = {};
  let userVotes: Record<string, 1 | -1> = {};

  if (reviewIds.length > 0) {
    const { data: allVotes } = await supabase
      .from("user_review_votes")
      .select("review_id, vote, user_id")
      .in("review_id", reviewIds);

    if (allVotes) {
      for (const v of allVotes) {
        if (!voteCounts[v.review_id]) {
          voteCounts[v.review_id] = { up: 0, down: 0 };
        }
        if (v.vote === 1) voteCounts[v.review_id].up++;
        else if (v.vote === -1) voteCounts[v.review_id].down++;

        if (currentUser && v.user_id === currentUser.id) {
          userVotes[v.review_id] = v.vote as 1 | -1;
        }
      }
    }
  }

  // Extract GitHub username and check if linked
  const githubUsername =
    (profileData.github_username as string | null)?.trim() || null;
  const isGithubLinked = Boolean(githubUsername);

  // Fetch GitHub stats in parallel if GitHub is linked
  let githubStats: GithubStats = FALLBACK_GITHUB_STATS;
  let contributionGraphData: any[] = [];

  if (isGithubLinked && githubUsername) {
    const [statsResult, graphResult] = await Promise.all([
      fetchGitHubStats(githubUsername),
      fetchGitHubContributionGraph(githubUsername),
    ]);

    // Process stats
    if (statsResult.success && statsResult.stats) {
      githubStats = statsResult.stats;
    } else {
      // Fallback to stored stats if API call fails
      const profileGithubStats =
        (profileData.github_stats as Partial<GithubStats> | null) || {};
      githubStats = {
        contributions:
          profileGithubStats.contributions ??
          FALLBACK_GITHUB_STATS.contributions,
        repositories:
          profileGithubStats.repositories ?? FALLBACK_GITHUB_STATS.repositories,
        stars: profileGithubStats.stars ?? FALLBACK_GITHUB_STATS.stars,
        followers:
          profileGithubStats.followers ?? FALLBACK_GITHUB_STATS.followers,
      };
    }

    // Process contribution graph
    if (graphResult.success && graphResult.data) {
      contributionGraphData = graphResult.data.contributions;
    }
  }

  // Transform proposal data to typed format
  const enrolledProjects: ProjectEnrollment[] =
    (proposalEnrollments as ProposalData[] | null)
      ?.filter(
        (proposal) => proposal.project && Array.isArray(proposal.project)
      )
      .map((proposal) => ({
        id: proposal.id,
        status: proposal.status,
        created_at: proposal.created_at,
        proposed_budget: proposal.proposed_budget,
        project: proposal.project![0],
      })) ?? [];

  // Transform review data to typed format
  const typedReviews: Review[] =
    (reviews as ReviewData[] | null)?.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      created_at: review.created_at,
      reviewer:
        review.reviewer && Array.isArray(review.reviewer)
          ? review.reviewer[0]
          : null,
      project:
        review.project && Array.isArray(review.project)
          ? review.project[0]
          : null,
      upvotes: voteCounts[review.id]?.up || 0,
      downvotes: voteCounts[review.id]?.down || 0,
      userVote: userVotes[review.id] || null,
    })) ?? [];
  const totalReviews = totalReviewCount;

  const githubUrl = isGithubLinked
    ? `https://github.com/${githubUsername}`
    : undefined;

  const avatarFallbackLabel = profileData.display_name
    ? profileData.display_name.substring(0, 2).toUpperCase()
    : "UN";

  // Calculate average rating
  const averageRating =
    typedReviews.length > 0
      ? typedReviews.reduce((sum, review) => sum + review.rating, 0) /
      typedReviews.length
      : 0;

  return (
    <div className="w-full min-h-screen bg-muted/10 relative">
      {/* Background Decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none dark:bg-muted/20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand/10 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-secondary/10 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-blob animation-delay-2000 dark:bg-brand-secondary/20"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-blob animation-delay-4000 dark:bg-blue-500/20"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:[mask-image:linear-gradient(180deg,black,rgba(0,0,0,0))]"></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Header Section - Combined Profile + Performance + Skills */}
        <div className="grid lg:grid-cols-[1fr,350px] gap-8">
          {/* Main Profile Card with integrated Performance and Skills */}
          <div className="space-y-0">
            <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-xl overflow-hidden relative group rounded-b-none border-b-0">
              <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-brand-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <CardContent className="p-8 relative">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="relative shrink-0">
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-brand to-brand-secondary rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
                    <Avatar className="h-32 w-32 border-4 border-background shadow-2xl relative">
                      <AvatarImage
                        src={profileData.avatar_url || undefined}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-brand to-brand-secondary text-white">
                        {avatarFallbackLabel}
                      </AvatarFallback>
                    </Avatar>
                    {profileData.seniority && (
                      <Badge className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-foreground text-background hover:bg-foreground/90 shadow-lg border border-background/20 whitespace-nowrap px-3 py-1 text-xs uppercase tracking-wider font-bold">
                        {profileData.seniority}
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1 space-y-4 pt-2">
                    <div>
                      <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 flex items-center gap-2">
                        {profileData.display_name || "GitLance User"}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                {profileData.is_user_verified && (
                                  <BadgeCheck className="h-8 w-8 text-blue-500 fill-blue-500/10" />
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Verified Account</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </h1>
                      {profileData.username && (
                        <p className="text-sm text-muted-foreground font-mono">
                          @{profileData.username}
                        </p>
                      )}
                      <p className="text-xl text-muted-foreground font-medium mt-1">
                        {profileData.headline || "Building reliable products"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {profileData.location && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                          <MapPin className="h-3.5 w-3.5" />
                          {profileData.location}
                        </div>
                      )}
                      {profileData.primary_role && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                          <Briefcase className="h-3.5 w-3.5" />
                          {profileData.primary_role}
                        </div>
                      )}
                      {profileData.years_experience && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                          <Calendar className="h-3.5 w-3.5" />
                          {profileData.years_experience}+ years
                        </div>
                      )}
                      <div
                        className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-border/50 ${profileData.is_user_verified
                          ? "text-blue-600 bg-blue-500/10 border-blue-200 dark:text-blue-400 dark:border-blue-800"
                          : "text-muted-foreground bg-muted/50"
                          }`}
                      >
                        {profileData.is_user_verified ? (
                          <BadgeCheck className="h-3.5 w-3.5" />
                        ) : (
                          <ShieldAlert className="h-3.5 w-3.5" />
                        )}
                        {profileData.is_user_verified
                          ? "Verified Identity"
                          : "Unverified Identity"}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      {githubUrl && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="rounded-full hover:bg-brand hover:text-white hover:border-brand transition-all duration-300"
                        >
                          <Link
                            href={githubUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Github className="h-4 w-4 mr-2" />
                            GitHub
                          </Link>
                        </Button>
                      )}
                      {profileData.linkedin_url && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="rounded-full hover:bg-[#0077b5] hover:text-white hover:border-[#0077b5] transition-all duration-300"
                        >
                          <Link
                            href={profileData.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Linkedin className="h-4 w-4 mr-2" />
                            LinkedIn
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Performance Stats - Centered & Prominent */}
                <div className="mt-8 pt-8 border-t border-border/30">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Star className="h-6 w-6 text-amber-500 fill-current mb-1" />
                      <span className="text-3xl font-bold">
                        {averageRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Rating
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Briefcase className="h-6 w-6 text-brand mb-1" />
                      <span className="text-3xl font-bold">
                        {enrolledProjects.length}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Projects
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <CheckCircle2 className="h-6 w-6 text-green-500 mb-1" />
                      <span className="text-3xl font-bold">
                        {
                          enrolledProjects.filter(
                            (p) => p.status === "completed"
                          ).length
                        }
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Completed
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Clock className="h-6 w-6 text-blue-500 mb-1" />
                      <span className="text-2xl font-bold">
                        {profileData.timezone?.split("/")[1] || "UTC"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Timezone
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Faded border connector to Skills */}
            <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

            {/* Skills Section - Connected to Profile Card */}
            <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-lg rounded-t-none border-t-0">
              <CardContent className="p-6">
                <SkillsSection
                  skills={userSkills}
                  profileId={userId}
                  isOwnProfile={isOwnProfile}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Reviews Summary */}
          <div className="space-y-4">
            {totalReviews > 0 && (
              <ReviewsSidebar
                userId={userId}
                initialReviews={typedReviews}
                reviewCount={totalReviews}
              />
            )}
          </div>
        </div>

        {/* GitHub & Activity Section */}
        {isGithubLinked && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* GitHub Stats */}
            <Card className="lg:col-span-1 border-border/50 bg-background/60 backdrop-blur-xl shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  GitHub Stats
                </CardTitle>
                <CardDescription>@{githubUsername}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col p-3 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-xs text-muted-foreground mb-1">
                      Repositories
                    </span>
                    <span className="text-xl font-bold">
                      {githubStats.repositories}
                    </span>
                  </div>
                  <div className="flex flex-col p-3 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-xs text-muted-foreground mb-1">
                      Stars
                    </span>
                    <span className="text-xl font-bold">
                      {githubStats.stars}
                    </span>
                  </div>
                  <div className="flex flex-col p-3 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-xs text-muted-foreground mb-1">
                      Followers
                    </span>
                    <span className="text-xl font-bold">
                      {githubStats.followers}
                    </span>
                  </div>
                  <div className="flex flex-col p-3 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-xs text-muted-foreground mb-1">
                      Contributions
                    </span>
                    <span className="text-xl font-bold text-brand">
                      {githubStats.contributions}
                    </span>
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-between group"
                >
                  <Link href={githubUrl!} target="_blank" rel="noreferrer">
                    View GitHub Profile
                    <ArrowUpRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Contribution Graph */}
            <Card className="lg:col-span-2 border-border/50 bg-background/60 backdrop-blur-xl shadow-lg flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-brand" />
                  Activity Graph
                </CardTitle>
                <CardDescription>
                  Contributions over the last year
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center min-h-[200px] overflow-hidden">
                {contributionGraphData.length > 0 ? (
                  <ContributionGraph
                    data={contributionGraphData}
                    year={new Date().getFullYear()}
                    showLegend={true}
                    showTooltips={true}
                    className="w-full"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p>No contribution data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <div>
          <div className="space-y-6">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="w-full justify-start h-auto p-1 bg-muted/30 rounded-full border border-border/50 mb-6">
                <TabsTrigger
                  value="about"
                  className="rounded-full px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  About
                </TabsTrigger>
                <TabsTrigger
                  value="projects"
                  className="rounded-full px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Projects
                  {enrolledProjects.length > 0 && (
                    <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                      {enrolledProjects.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-full px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Reviews
                  {totalReviews > 0 && (
                    <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                      {totalReviews}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-0">
                <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm">
                  <CardContent className="p-6">
                    {profileData.description ? (
                      <ProfileDescription
                        description={profileData.description}
                      />
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <p className="italic">No bio available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects" className="mt-0 space-y-4">
                {enrolledProjects.length === 0 ? (
                  <Card className="border-border/50 bg-background/60 backdrop-blur-xl">
                    <CardContent className="py-16 text-center">
                      <Briefcase className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        No Projects Yet
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Start exploring and apply to projects to build your
                        portfolio
                      </p>
                      <Button asChild>
                        <Link href="/explore">Browse Projects</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  enrolledProjects.map((proposal) => (
                    <Card
                      key={proposal.id}
                      className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300 group"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <CardTitle className="text-lg group-hover:text-brand transition-colors">
                              {proposal.project.title}
                            </CardTitle>
                            <CardDescription className="line-clamp-1 mt-1">
                              {proposal.project.short_description ||
                                "No description provided"}
                            </CardDescription>
                          </div>
                          <Badge
                            variant={
                              proposal.status === "completed"
                                ? "default"
                                : proposal.status === "active"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="capitalize"
                          >
                            {proposal.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
                              <DollarSign className="h-3.5 w-3.5" />
                              {proposal.proposed_budget
                                ? `$${proposal.proposed_budget.toLocaleString()}`
                                : "N/A"}
                            </span>
                          </div>
                          <span className="text-xs">
                            Applied{" "}
                            {new Date(proposal.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-0 space-y-4">
                {/* Write Review Button */}
                {!isOwnProfile && currentUser && (
                  <div className="flex justify-end">
                    <WriteReviewButton
                      revieweeId={userId}
                      revieweeName={profileData.display_name || "this user"}
                    />
                  </div>
                )}

                {typedReviews.length === 0 ? (
                  <Card className="border-border/50 bg-background/60 backdrop-blur-xl">
                    <CardContent className="py-16 text-center">
                      <Star className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        No Reviews Yet
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Reviews from collaborators will appear here
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  typedReviews.map((review) => (
                    <Card
                      key={review.id}
                      className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm"
                    >
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <Avatar className="h-10 w-10 border border-border">
                            <AvatarImage
                              src={review.reviewer?.avatar_url || undefined}
                            />
                            <AvatarFallback>
                              {review.reviewer?.display_name
                                ?.substring(0, 2)
                                .toUpperCase() || "RV"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-sm">
                                  {review.reviewer?.display_name ||
                                    "Anonymous Client"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(
                                    review.created_at
                                  ).toLocaleDateString("en-US", {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                              <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3.5 w-3.5 ${i < review.rating
                                      ? "fill-amber-500 text-amber-500"
                                      : "text-muted-foreground/20"
                                      }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.project && (
                              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                                <Briefcase className="h-3 w-3" />
                                Project:{" "}
                                <span className="font-medium text-foreground">
                                  {review.project.title}
                                </span>
                              </div>
                            )}
                            <div className="pt-2">
                              {review.title && (
                                <p className="font-medium text-sm mb-1">
                                  {review.title}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {review.comment || "No comment provided"}
                              </p>
                            </div>

                            {/* Vote Buttons */}
                            <div className="pt-2 flex items-center justify-between">
                              <ReviewVoteButtons
                                reviewId={review.id}
                                initialUpvotes={review.upvotes}
                                initialDownvotes={review.downvotes}
                                userVote={review.userVote}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
