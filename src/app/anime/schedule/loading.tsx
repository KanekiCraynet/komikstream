import { GridSkeleton } from "@/components/ui/Skeleton";

export default function ScheduleLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="bg-muted h-10 w-64 animate-pulse rounded" />
        <div className="bg-muted mt-2 h-5 w-48 animate-pulse rounded" />
      </div>
      <div className="space-y-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="bg-muted mb-4 h-7 w-32 animate-pulse rounded" />
            <GridSkeleton count={6} />
          </div>
        ))}
      </div>
    </div>
  );
}
