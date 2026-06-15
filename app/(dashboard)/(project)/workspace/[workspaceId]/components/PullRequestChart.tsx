"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from "recharts";

interface PullRequestChartProps {
  open: number;
  closed: number;
  merged: number;
  total: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-xl px-3 py-2 text-xs">
        <p className="font-semibold">{data.name}</p>
        <p className="text-muted-foreground">{data.value} PRs</p>
      </div>
    );
  }
  return null;
}

export function PullRequestChart({ open, closed, merged, total }: PullRequestChartProps) {
  const mergeRate = total > 0 ? Math.round((merged / total) * 100) : 0;

  const chartData = [
    { name: "Closed", value: closed, fill: "hsl(var(--muted-foreground))" },
    { name: "Merged", value: merged, fill: "#8b5cf6" },
    { name: "Open", value: open, fill: "#10b981" },
  ];

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Pull Requests</CardTitle>
          <span className="text-sm text-muted-foreground">{total} total</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[160px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="30%"
              outerRadius="90%"
              barSize={12}
              data={chartData}
              startAngle={180}
              endAngle={-180}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={6}
                animationDuration={1200}
                animationEasing="ease-out"
                background={{ fill: "hsl(var(--muted))" }}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadialBarChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-2xl font-bold">{mergeRate}%</p>
              <p className="text-[10px] text-muted-foreground">Merge Rate</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-2 px-2">
          {[
            { label: "Open", value: open, color: "#10b981" },
            { label: "Merged", value: merged, color: "#8b5cf6" },
            { label: "Closed", value: closed, color: "hsl(var(--muted-foreground))" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
