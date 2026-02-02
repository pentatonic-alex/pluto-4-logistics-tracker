import { SkeletonStatsGrid, SkeletonArchivedCard, Skeleton } from '@/components/ui/Skeleton';

export default function ArchiveLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-7 w-24" />
          </div>
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      {/* Stats grid skeleton */}
      <div className="mb-6">
        <SkeletonStatsGrid />
      </div>

      {/* Search skeleton */}
      <div className="mb-6">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      {/* Archived cards skeleton */}
      <div className="space-y-3">
        <SkeletonArchivedCard />
        <SkeletonArchivedCard />
        <SkeletonArchivedCard />
      </div>
    </div>
  );
}
