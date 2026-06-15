"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageStat } from "@/types/workspace";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface LanguageChartProps {
  languages: LanguageStat[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-xl px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
          <span className="font-semibold">{data.name}</span>
        </div>
        <p className="text-muted-foreground mt-0.5">{data.percentage}%</p>
      </div>
    );
  }
  return null;
}

export function LanguageChart({ languages }: LanguageChartProps) {
  if (languages.length === 0) {
    return (
      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Languages</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">No language data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Languages</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[160px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={languages}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="percentage"
                nameKey="name"
                animationDuration={1200}
                animationEasing="ease-out"
              >
                {languages.map((lang, index) => (
                  <Cell key={`cell-${index}`} fill={lang.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
          {languages.slice(0, 6).map((lang) => (
            <div key={lang.name} className="flex items-center justify-between text-xs group">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/10"
                  style={{ backgroundColor: lang.color }}
                />
                <span className="truncate group-hover:text-foreground transition-colors text-muted-foreground">
                  {lang.name}
                </span>
              </div>
              <span className="font-medium text-foreground ml-1">{lang.percentage}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
