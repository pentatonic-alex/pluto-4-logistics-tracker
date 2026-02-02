import { Skeleton } from '@/components/ui/Skeleton';

export default function NewCampaignLoading() {
  return (
    <div className="max-w-xl">
      {/* Header skeleton */}
      <div className="mb-8 space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Form skeleton */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
        {/* Campaign code field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-3 w-56" />
        </div>

        {/* Material type field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-3 w-48" />
        </div>

        {/* Description field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>

      {/* Actions skeleton */}
      <div className="flex items-center justify-end gap-3 mt-6">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
    </div>
  );
}
