import { SkeletonCampaignHeader, SkeletonEventTimeline, Skeleton } from '@/components/ui/Skeleton';

export default function CampaignDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb skeleton */}
      <nav className="mb-6">
        <Skeleton className="h-4 w-32" />
      </nav>

      {/* Campaign header skeleton */}
      <SkeletonCampaignHeader />

      {/* Actions skeleton */}
      <div className="flex items-center justify-between mt-8 mb-4">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Event timeline skeleton */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <SkeletonEventTimeline count={3} />
      </div>

      {/* Metadata footer skeleton */}
      <div className="mt-6 space-y-1">
        <Skeleton className="h-3 w-72" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}
