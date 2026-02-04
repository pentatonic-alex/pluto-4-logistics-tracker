'use client';

import type { CampaignFilters, CampaignStatus } from '@/types';
import { STATUS_LABELS } from '@/lib/constants';

interface FilterChipsProps {
  filters: CampaignFilters;
  onRemove: (key: keyof CampaignFilters, subKey?: string) => void;
}

interface Chip {
  key: keyof CampaignFilters;
  subKey?: string;
  label: string;
}

export function FilterChips({ filters, onRemove }: FilterChipsProps) {
  const chips: Chip[] = [];

  // Status filter (excluding 'active' since it's handled by tabs)
  if (filters.status && filters.status !== 'active') {
    chips.push({
      key: 'status',
      label: `Status: ${STATUS_LABELS[filters.status as CampaignStatus]}`,
    });
  }

  // Material type filter
  if (filters.materialType) {
    chips.push({
      key: 'materialType',
      label: `Material: ${filters.materialType}`,
    });
  }

  // ECHA approved filter
  if (filters.echaApproved !== undefined) {
    chips.push({
      key: 'echaApproved',
      label: filters.echaApproved ? 'ECHA Approved' : 'ECHA Pending',
    });
  }

  // Date range filters
  if (filters.dateRange?.start) {
    const date = new Date(filters.dateRange.start).toLocaleDateString();
    chips.push({
      key: 'dateRange',
      subKey: 'start',
      label: `From: ${date}`,
    });
  }
  if (filters.dateRange?.end) {
    const date = new Date(filters.dateRange.end).toLocaleDateString();
    chips.push({
      key: 'dateRange',
      subKey: 'end',
      label: `To: ${date}`,
    });
  }

  // Weight range filters
  if (filters.weightRange?.min !== undefined) {
    chips.push({
      key: 'weightRange',
      subKey: 'min',
      label: `Min: ${filters.weightRange.min.toLocaleString()} kg`,
    });
  }
  if (filters.weightRange?.max !== undefined) {
    chips.push({
      key: 'weightRange',
      subKey: 'max',
      label: `Max: ${filters.weightRange.max.toLocaleString()} kg`,
    });
  }

  // Campaign code prefix filter
  if (filters.campaignCodePrefix) {
    chips.push({
      key: 'campaignCodePrefix',
      label: `Code: ${filters.campaignCodePrefix}...`,
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {chips.map((chip, index) => (
        <span
          key={`${chip.key}-${chip.subKey || index}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
        >
          {chip.label}
          <button
            onClick={() => onRemove(chip.key, chip.subKey)}
            className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full transition-colors"
            aria-label={`Remove ${chip.label} filter`}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </span>
      ))}
    </div>
  );
}
