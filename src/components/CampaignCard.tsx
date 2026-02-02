import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import type { Campaign } from '@/types';

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const lastUpdate = campaign.lastEventAt
    ? formatRelativeTime(new Date(campaign.lastEventAt))
    : formatRelativeTime(new Date(campaign.createdAt));

  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="block bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Campaign code and material type */}
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {campaign.legoCampaignCode}
            </h3>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {campaign.materialType}
            </span>
          </div>

          {/* Description */}
          {campaign.description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1 mb-2">
              {campaign.description}
            </p>
          )}

          {/* Metadata row */}
          <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            {campaign.currentWeightKg && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
                {campaign.currentWeightKg.toLocaleString()} kg
              </span>
            )}
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {lastUpdate}
            </span>
            {campaign.echaApproved && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                ECHA
              </span>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0">
          <StatusBadge status={campaign.status} />
        </div>
      </div>

      {/* Next step indicator */}
      {campaign.nextExpectedStep && (
        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            Next: <span className="text-zinc-600 dark:text-zinc-300">{campaign.nextExpectedStep}</span>
          </span>
        </div>
      )}
    </Link>
  );
}

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}
