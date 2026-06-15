import { Skeleton } from "@/components/ui/skeleton";

export default function ChannelLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* Channel Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48 ml-2" />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`flex gap-3 ${i % 3 === 0 ? "justify-end" : ""}`}
          >
            {i % 3 !== 0 && (
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            )}
            <div className={`space-y-2 ${i % 3 === 0 ? "items-end" : ""}`}>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="space-y-1">
                <Skeleton className={`h-4 ${i % 2 === 0 ? "w-72" : "w-48"}`} />
                {i % 2 === 0 && <Skeleton className="h-4 w-56" />}
              </div>
            </div>
            {i % 3 === 0 && (
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>
    </div>
  );
}
