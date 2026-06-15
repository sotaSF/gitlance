import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function WorkspaceSettingsLoading() {
  return (
    <div className="container max-w-5xl py-8 px-6">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-md" />
          ))}
        </div>

        {/* Tab Content Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>

            {/* Team Members Table Skeleton */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-9 w-28" />
              </div>
              <div className="border rounded-lg">
                {/* Table Header */}
                <div className="flex items-center gap-4 p-4 border-b bg-muted/30">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24 ml-auto" />
                  <Skeleton className="h-4 w-20" />
                </div>
                {/* Table Rows */}
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20 ml-auto" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
