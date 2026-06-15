"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RecentActivity as RecentActivityType } from "@/types/workspace";
import { GitCommit, GitPullRequest, CircleDot, Tag } from "lucide-react";
import Link from "next/link";

interface RecentActivityProps {
  activities: RecentActivityType[];
}

const activityConfig = {
  commit: { icon: GitCommit, color: "text-emerald-500", bg: "bg-emerald-500", line: "bg-emerald-500/30" },
  pr: { icon: GitPullRequest, color: "text-violet-500", bg: "bg-violet-500", line: "bg-violet-500/30" },
  issue: { icon: CircleDot, color: "text-blue-500", bg: "bg-blue-500", line: "bg-blue-500/30" },
  release: { icon: Tag, color: "text-amber-500", bg: "bg-amber-500", line: "bg-amber-500/30" },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {activities.map((activity, index) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;
            const isLast = index === activities.length - 1;

            return (
              <Link
                key={`${activity.type}-${index}`}
                href={activity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 group relative pb-4 last:pb-0"
              >
                {/* Timeline line + dot */}
                <div className="relative flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full ${config.bg} ring-2 ring-background z-10 mt-1.5 shrink-0`} />
                  {!isLast && (
                    <div className={`w-[1.5px] flex-1 ${config.line} mt-1`} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-1">
                  <p className="text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {activity.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {activity.authorAvatar && (
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={activity.authorAvatar} />
                        <AvatarFallback className="text-[8px]">
                          {activity.author.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <span className="text-xs text-muted-foreground">{activity.author}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.date)}</span>
                  </div>
                </div>
              </Link>
            );
          })}

          {activities.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
