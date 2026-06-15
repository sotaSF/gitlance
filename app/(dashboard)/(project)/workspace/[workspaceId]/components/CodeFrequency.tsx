"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeFrequency as CodeFrequencyType } from "@/types/workspace";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface CodeFrequencyProps {
  data: CodeFrequencyType[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-xl px-3 py-2 text-xs">
        <p className="text-muted-foreground mb-1">{label}</p>
        <p className="text-emerald-500 font-semibold">+{payload[0]?.value?.toLocaleString() || 0}</p>
        <p className="text-rose-500 font-semibold">-{Math.abs(payload[1]?.value || 0).toLocaleString()}</p>
      </div>
    );
  }
  return null;
}

export function CodeFrequency({ data }: CodeFrequencyProps) {
  const stats = useMemo(() => {
    const totalAdditions = data.reduce((sum, d) => sum + d.additions, 0);
    const totalDeletions = data.reduce((sum, d) => sum + d.deletions, 0);
    return { totalAdditions, totalDeletions };
  }, [data]);

  const chartData = useMemo(
    () =>
      data.map((week) => ({
        name: new Date(week.week).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        additions: week.additions,
        deletions: -week.deletions, // Negative for visual effect
      })),
    [data]
  );

  if (data.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Code Frequency</CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span className="text-emerald-500 font-semibold">
                +{stats.totalAdditions.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              <span className="text-rose-500 font-semibold">
                -{stats.totalDeletions.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              stackOffset="sign"
            >
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
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
              <Bar
                dataKey="additions"
                fill="#10b981"
                radius={[3, 3, 0, 0]}
                animationDuration={1200}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="deletions"
                fill="#f43f5e"
                radius={[0, 0, 3, 3]}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-1">
          <span className="text-[10px] text-muted-foreground">{data.length} weeks</span>
        </div>
      </CardContent>
    </Card>
  );
}
