"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CommitActivity,
  LanguageStat,
  CodeFrequency as CodeFrequencyType,
  RecentActivity as RecentActivityType,
} from "@/types/workspace";

// Skeleton component for charts
function ChartSkeleton({
  title,
  height = "180px",
  className = "",
}: {
  title: string;
  height?: string;
  className?: string;
}) {
  return (
    <Card className={`border-border bg-card ${className}`}>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height }} />
      </CardContent>
    </Card>
  );
}

// Lazy load heavy chart components for better initial page load
export const LazyCommitGraph = dynamic(
  () => import("./CommitGraph").then((mod) => ({ default: mod.CommitGraph })),
  {
    loading: () => (
      <ChartSkeleton
        title="Commit Activity"
        className="col-span-4"
        height="140px"
      />
    ),
    ssr: false,
  }
);

export const LazyLanguageChart = dynamic(
  () =>
    import("./LanguageChart").then((mod) => ({ default: mod.LanguageChart })),
  {
    loading: () => <ChartSkeleton title="Languages" height="180px" />,
    ssr: false,
  }
);

export const LazyPullRequestChart = dynamic(
  () =>
    import("./PullRequestChart").then((mod) => ({
      default: mod.PullRequestChart,
    })),
  {
    loading: () => <ChartSkeleton title="Pull Requests" height="180px" />,
    ssr: false,
  }
);

export const LazyRecentActivity = dynamic(
  () =>
    import("./RecentActivity").then((mod) => ({ default: mod.RecentActivity })),
  {
    loading: () => <ChartSkeleton title="Recent Activity" height="180px" />,
    ssr: false,
  }
);

export const LazyCodeFrequency = dynamic(
  () =>
    import("./CodeFrequency").then((mod) => ({ default: mod.CodeFrequency })),
  {
    loading: () => (
      <ChartSkeleton title="Code Frequency" height="200px" className="w-full" />
    ),
    ssr: false,
  }
);

// Wrapper components with proper typing
interface CommitGraphWrapperProps {
  data: CommitActivity[];
}

export function CommitGraphWrapper({ data }: CommitGraphWrapperProps) {
  return <LazyCommitGraph data={data} />;
}

interface LanguageChartWrapperProps {
  languages: LanguageStat[];
}

export function LanguageChartWrapper({ languages }: LanguageChartWrapperProps) {
  return <LazyLanguageChart languages={languages} />;
}

interface PullRequestChartWrapperProps {
  open: number;
  closed: number;
  merged: number;
  total: number;
}

export function PullRequestChartWrapper(props: PullRequestChartWrapperProps) {
  return <LazyPullRequestChart {...props} />;
}

interface RecentActivityWrapperProps {
  activities: RecentActivityType[];
}

export function RecentActivityWrapper({
  activities,
}: RecentActivityWrapperProps) {
  return <LazyRecentActivity activities={activities} />;
}

interface CodeFrequencyWrapperProps {
  data: CodeFrequencyType[];
}

export function CodeFrequencyWrapper({ data }: CodeFrequencyWrapperProps) {
  return <LazyCodeFrequency data={data} />;
}
