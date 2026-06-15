import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-[200px]" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-11 flex-1" />
            <Skeleton className="h-11 w-[180px]" />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar Skeleton */}
          <aside className="hidden lg:block space-y-6">
            <div className="p-6 rounded-xl border bg-card/50">
              <div className="space-y-6">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
          </aside>

          {/* Results Grid Skeleton */}
          <main className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card text-card-foreground shadow-sm h-[280px] p-6 space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="pt-4 flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
