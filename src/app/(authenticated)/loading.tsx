import { SkeletonCampaignCard, Skeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-full sm:w-36 rounded-lg" />
      </div>

      {/* Filter tabs skeleton */}
      <Skeleton className="h-10 w-36 rounded-lg mb-6" />

      {/* Campaign cards skeleton */}
      <div className="grid gap-4">
        <SkeletonCampaignCard />
        <SkeletonCampaignCard />
        <SkeletonCampaignCard />
      </div>
    </div>
  );
}
