import { GridSkeleton } from "@/components/ui/Skeleton";

export default function GenreSlugLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="bg-muted h-10 w-48 animate-pulse rounded" />
        <div className="bg-muted mt-2 h-5 w-32 animate-pulse rounded" />
      </div>
      <GridSkeleton count={12} />
    </div>
  );
}
