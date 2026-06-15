"use client";

import { Badge } from "@/components/ui/badge";
import { GitBranch, Star, GitFork, Eye, ExternalLink, HardDrive, Calendar } from "lucide-react";
import Link from "next/link";

interface RepositoryInfoProps {
  repoFullName: string;
  stars: number;
  forks: number;
  watchers: number;
  defaultBranch: string;
  repoSize: number;
  lastUpdate: string;
}

function formatBytes(kb: number): string {
  if (kb < 1024) return `${kb} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function RepositoryInfo({
  repoFullName,
  stars,
  forks,
  watchers,
  defaultBranch,
  repoSize,
  lastUpdate
}: RepositoryInfoProps) {
  const [owner, repo] = repoFullName.split('/');

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/30 p-6">
      {/* Decorative background circles */}
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-violet-500/5 blur-2xl" />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: Repo identity */}
        <div className="flex items-center gap-4">
          {/* GitHub-style avatar */}
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 ring-1 ring-white/10 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-primary">
              {repo?.charAt(0).toUpperCase() || 'R'}
            </span>
          </div>

          <div>
            <Link
              href={`https://github.com/${repoFullName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2"
            >
              <span className="text-sm text-muted-foreground">{owner} /</span>
              <span className="text-lg font-bold hover:text-primary transition-colors">
                {repo}
              </span>
              <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
            </Link>

            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                <span>{defaultBranch}</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                <span>{formatBytes(repoSize)}</span>
              </div>
              <span className="hidden sm:inline">·</span>
              <div className="hidden sm:flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Updated {formatDate(lastUpdate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Stats pills */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20 transition-colors">
            <Star className="h-3.5 w-3.5" />
            <span className="font-semibold">{stars.toLocaleString()}</span>
          </Badge>
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20 transition-colors">
            <GitFork className="h-3.5 w-3.5" />
            <span className="font-semibold">{forks.toLocaleString()}</span>
          </Badge>
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
            <Eye className="h-3.5 w-3.5" />
            <span className="font-semibold">{watchers.toLocaleString()}</span>
          </Badge>
        </div>
      </div>
    </div>
  );
}
