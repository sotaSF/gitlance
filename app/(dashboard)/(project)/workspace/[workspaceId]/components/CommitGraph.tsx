"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommitActivity } from "@/types/workspace";
import { useMemo } from "react";
import { GitCommit } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface CommitGraphProps {
  data: CommitActivity[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return "1 month ago";
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-xl px-3 py-2 text-xs">
        <p className="font-semibold text-foreground">{payload[0].value} commits</p>
        <p className="text-muted-foreground">{label}</p>
      </div>
    );
  }
  return null;
}

export function CommitGraph({ data }: CommitGraphProps) {
  const stats = useMemo(() => {
    if (data.length === 0) return { total: 0, firstDate: "", lastDate: "" };
    const counts = data.map((d) => d.count);
    const total = counts.reduce((a, b) => a + b, 0);
    return {
      total,
      firstDate: data[0]?.date || "",
      lastDate: data[data.length - 1]?.date || "",
    };
  }, [data]);

  const chartData = useMemo(
    () => data.map((d) => ({ name: formatDate(d.date), commits: d.count })),
    [data]
  );

  if (data.length === 0) {
    return (
      <Card className="col-span-4 border-border/50 bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Commit Activity</CardTitle>
            <span className="text-sm text-muted-foreground">0 total</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[180px] flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <GitCommit className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No commit data available</p>
              <p className="text-xs mt-1">Stats may take a moment to load</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-4 border-border/50 bg-card overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Commit Activity</CardTitle>
          <span className="text-sm text-muted-foreground">
            {stats.total.toLocaleString()} total
          </span>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="commitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-1, 160 60% 45%))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1, 160 60% 45%))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="commits"
                stroke="hsl(var(--chart-1, 160 60% 45%))"
                strokeWidth={2}
                fill="url(#commitGradient)"
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between mt-1 text-xs text-muted-foreground px-1">
          <span>{stats.firstDate ? getRelativeTime(stats.firstDate) : ""}</span>
          <span>{stats.lastDate ? getRelativeTime(stats.lastDate) : "Today"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
