"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContributorStat } from "@/types/workspace";
import Link from "next/link";
import { Crown, Medal, Award } from "lucide-react";

interface ContributorListProps {
  contributors: ContributorStat[];
}

const rankConfig = [
  { icon: Crown, color: "text-amber-400", bg: "bg-amber-400/10", ring: "ring-amber-400/30" },
  { icon: Medal, color: "text-slate-300", bg: "bg-slate-300/10", ring: "ring-slate-300/30" },
  { icon: Award, color: "text-amber-600", bg: "bg-amber-600/10", ring: "ring-amber-600/30" },
];

export function ContributorList({ contributors }: ContributorListProps) {
  const totalCommits = contributors.reduce((sum, c) => sum + c.commits, 0);

  return (
    <Card className="col-span-3 border-border/50 bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Top Contributors</CardTitle>
          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
            {contributors.length} total
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {contributors.map((contributor, index) => {
            const percentage = totalCommits > 0
              ? Math.round((contributor.commits / totalCommits) * 100)
              : 0;
            const rank = rankConfig[index];

            return (
              <Link
                key={contributor.username}
                href={`https://github.com/${contributor.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 group p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Rank */}
                <div className="w-6 flex justify-center">
                  {rank ? (
                    <div className={`p-1 rounded-md ${rank.bg} ring-1 ${rank.ring}`}>
                      <rank.icon className={`h-3 w-3 ${rank.color}`} />
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground w-5 text-center">
                      {index + 1}
                    </span>
                  )}
                </div>

                <Avatar className="h-7 w-7 ring-2 ring-background">
                  <AvatarImage src={contributor.avatarUrl} alt={contributor.username} />
                  <AvatarFallback className="text-xs">
                    {contributor.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {contributor.username}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-7 text-right font-medium">
                      {percentage}%
                    </span>
                  </div>
                </div>

                <span className="text-xs font-semibold text-foreground tabular-nums">
                  {contributor.commits.toLocaleString()}
                </span>
              </Link>
            );
          })}

          {contributors.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No contributors found
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
