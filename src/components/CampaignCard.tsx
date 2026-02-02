import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import type { Campaign, CampaignStatus } from '@/types';

interface CampaignCardProps {
  campaign: Campaign;
}

// Timeline steps in order
const TIMELINE_STEPS = [
  { key: 'inbound', label: 'Inbound', statuses: ['inbound_shipment_recorded'] },
  { key: 'granulation', label: 'Granulation', statuses: ['granulation_complete'] },
  { key: 'metal', label: 'Metal', statuses: ['metal_removal_complete'] },
  { key: 'purification', label: 'Purify', statuses: ['polymer_purification_complete'] },
  { key: 'extrusion', label: 'Extrusion', statuses: ['extrusion_complete'] },
  { key: 'echa', label: 'ECHA', statuses: ['echa_approved'] },
  { key: 'transfer', label: 'To RGE', statuses: ['transferred_to_rge'] },
  { key: 'manufacturing', label: 'Mfg', statuses: ['manufacturing_started', 'manufacturing_complete'] },
  { key: 'return', label: 'Return', statuses: ['returned_to_lego'] },
  { key: 'complete', label: 'Done', statuses: ['completed'] },
] as const;

// Status order for comparison
const STATUS_ORDER: CampaignStatus[] = [
  'created',
  'inbound_shipment_recorded',
  'granulation_complete',
  'metal_removal_complete',
  'polymer_purification_complete',
  'extrusion_complete',
  'echa_approved',
  'transferred_to_rge',
  'manufacturing_started',
  'manufacturing_complete',
  'returned_to_lego',
  'completed',
];

function getStepState(step: typeof TIMELINE_STEPS[number], currentStatus: CampaignStatus): 'completed' | 'current' | 'pending' {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  
  // Find the highest status index that this step covers
  const stepStatuses = step.statuses as readonly CampaignStatus[];
  const stepIndices = stepStatuses.map(s => STATUS_ORDER.indexOf(s));
  const maxStepIndex = Math.max(...stepIndices);
  const minStepIndex = Math.min(...stepIndices);
  
  if (currentIndex > maxStepIndex) {
    return 'completed';
  } else if (currentIndex >= minStepIndex && currentIndex <= maxStepIndex) {
    return 'current';
  }
  return 'pending';
}

// Format date as short format: "15 Jan" or "15/1"
function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

// Step dates type - maps step key to date string
type StepDates = Partial<Record<typeof TIMELINE_STEPS[number]['key'], string | null>>;

interface CampaignTimelineProps {
  status: CampaignStatus;
  stepDates: StepDates;
}

function CampaignTimeline({ status, stepDates }: CampaignTimelineProps) {
  return (
    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 overflow-x-auto -mx-5 px-5">
      <div className="flex items-start gap-0.5 min-w-[500px]">
        {TIMELINE_STEPS.map((step, index) => {
          const state = getStepState(step, status);
          const date = stepDates[step.key];
          const showDate = state !== 'pending';
          
          return (
            <div key={step.key} className="flex items-start flex-1 min-w-0">
              {/* Step indicator */}
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div
                  className={`
                    w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors
                    ${state === 'completed' ? 'bg-green-500 dark:bg-green-400' : ''}
                    ${state === 'current' ? 'bg-blue-500 dark:bg-blue-400 ring-2 ring-blue-200 dark:ring-blue-900' : ''}
                    ${state === 'pending' ? 'bg-zinc-200 dark:bg-zinc-700' : ''}
                  `}
                />
                <span
                  className={`
                    text-[9px] mt-1 truncate max-w-full text-center leading-tight
                    ${state === 'completed' ? 'text-green-600 dark:text-green-400 font-medium' : ''}
                    ${state === 'current' ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}
                    ${state === 'pending' ? 'text-zinc-400 dark:text-zinc-500' : ''}
                  `}
                >
                  {step.label}
                </span>
                {/* Date below label */}
                <span
                  className={`
                    text-[8px] truncate max-w-full text-center leading-tight
                    ${state === 'completed' ? 'text-green-500/70 dark:text-green-400/60' : ''}
                    ${state === 'current' ? 'text-blue-500/70 dark:text-blue-400/60' : ''}
                    ${state === 'pending' ? 'text-zinc-300 dark:text-zinc-600' : ''}
                  `}
                >
                  {showDate ? formatShortDate(date ?? null) : '—'}
                </span>
              </div>
              
              {/* Connector line */}
              {index < TIMELINE_STEPS.length - 1 && (
                <div
                  className={`
                    h-0.5 flex-shrink-0 w-1 -mx-0.5 mt-1
                    ${state === 'completed' ? 'bg-green-300 dark:bg-green-600' : 'bg-zinc-200 dark:bg-zinc-700'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
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

      {/* Timeline */}
      <CampaignTimeline 
        status={campaign.status} 
        stepDates={getStepDatesFromCampaign(campaign)}
      />
    </Link>
  );
}

// Map campaign data to step dates
// Currently we only have lastEventAt, so we show it for the current step
// In the future, the Campaign projection could be extended with individual step dates
function getStepDatesFromCampaign(campaign: Campaign): StepDates {
  const dates: StepDates = {};
  
  // Map the current status to its step and set the date
  const statusToStep: Record<string, typeof TIMELINE_STEPS[number]['key']> = {
    'inbound_shipment_recorded': 'inbound',
    'granulation_complete': 'granulation',
    'metal_removal_complete': 'metal',
    'polymer_purification_complete': 'purification',
    'extrusion_complete': 'extrusion',
    'echa_approved': 'echa',
    'transferred_to_rge': 'transfer',
    'manufacturing_started': 'manufacturing',
    'manufacturing_complete': 'manufacturing',
    'returned_to_lego': 'return',
    'completed': 'complete',
  };
  
  const currentStepKey = statusToStep[campaign.status];
  if (currentStepKey && campaign.lastEventAt) {
    dates[currentStepKey] = campaign.lastEventAt;
  }
  
  return dates;
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
