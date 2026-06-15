"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  GitCommit,
  GitPullRequest,
  Users,
  Star,
  CircleDot,
  GitFork,
  TrendingUp,
  LucideIcon
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const iconMap: Record<string, LucideIcon> = {
  "git-commit": GitCommit,
  "git-pull-request": GitPullRequest,
  "users": Users,
  "star": Star,
  "circle-dot": CircleDot,
  "git-fork": GitFork,
};

const gradientMap: Record<string, string> = {
  "git-commit": "from-emerald-500/20 to-emerald-500/5",
  "git-pull-request": "from-violet-500/20 to-violet-500/5",
  "users": "from-blue-500/20 to-blue-500/5",
  "star": "from-amber-500/20 to-amber-500/5",
  "circle-dot": "from-rose-500/20 to-rose-500/5",
  "git-fork": "from-cyan-500/20 to-cyan-500/5",
};

const iconColorMap: Record<string, string> = {
  "git-commit": "text-emerald-500",
  "git-pull-request": "text-violet-500",
  "users": "text-blue-500",
  "star": "text-amber-500",
  "circle-dot": "text-rose-500",
  "git-fork": "text-cyan-500",
};

interface StatsCardProps {
  title: string;
  value: string | number;
  iconName: string;
  description?: string;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const duration = 1000;
    const start = performance.now();
    const end = value;

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [value]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
}

export function StatsCard({
  title,
  value,
  iconName,
  description
}: StatsCardProps) {
  const Icon = iconMap[iconName] || GitCommit;
  const gradient = gradientMap[iconName] || "from-primary/20 to-primary/5";
  const iconColor = iconColorMap[iconName] || "text-primary";
  const numericValue = typeof value === 'number' ? value : parseInt(value.toString(), 10);

  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 cursor-default">
      {/* Subtle gradient border accent on top */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${gradient.replace('/20', '/60').replace('/5', '/20')}`} />

      <CardContent className="p-3.5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">
              {!isNaN(numericValue) ? (
                <AnimatedNumber value={numericValue} />
              ) : (
                value
              )}
            </p>
            {description && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <p className="text-[11px] text-muted-foreground">{description}</p>
              </div>
            )}
          </div>
          <div className={`p-2.5 rounded-lg bg-gradient-to-br ${gradient} ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
