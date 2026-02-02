import { Skeleton } from '@/components/ui/Skeleton';

export default function LogEventLoading() {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      {/* Header skeleton */}
      <div className="mb-8 space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Form skeleton */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
        {/* Event type selector */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* Form fields placeholder */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>

      {/* Actions skeleton */}
      <div className="flex items-center justify-end gap-3 mt-6">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}
