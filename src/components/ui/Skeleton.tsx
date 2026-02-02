import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton component with pulse animation
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800',
        className
      )}
    />
  );
}

/**
 * Skeleton for text lines
 */
export function SkeletonText({ className, lines = 1 }: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for campaign cards on dashboard
 */
export function SkeletonCampaignCard() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          {/* Title row */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-10 rounded" />
          </div>
          {/* Description */}
          <Skeleton className="h-4 w-2/3" />
          {/* Metadata row */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        {/* Status badge */}
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      {/* Next step */}
      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

/**
 * Skeleton for campaign detail header
 */
export function SkeletonCampaignHeader() {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-5 w-12 rounded" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      {/* Stats grid */}
      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Skeleton for event timeline
 */
export function SkeletonEventTimeline({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {/* Timeline dot and line */}
          <div className="flex flex-col items-center">
            <Skeleton className="h-3 w-3 rounded-full" />
            {i < count - 1 && <Skeleton className="h-16 w-0.5 mt-2" />}
          </div>
          {/* Event content */}
          <div className="flex-1 pb-6 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for stats cards (archive page)
 */
export function SkeletonStatsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
        >
          <Skeleton className="h-7 w-20 mb-1" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for archived campaign card
 */
export function SkeletonArchivedCard() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-10 rounded" />
          </div>
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-6 mb-4">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>

      {/* Timeline preview */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-2 w-10 mt-1" />
              </div>
              {i < 4 && <Skeleton className="w-8 sm:w-12 md:w-16 h-px mx-1" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for loading button state
 */
export function ButtonSpinner({ className }: SkeletonProps) {
  return (
    <svg
      className={cn('w-4 h-4 animate-spin', className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
