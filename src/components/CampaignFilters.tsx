'use client';

import { useState, useRef, useEffect } from 'react';
import type { CampaignFilters, CampaignStatus, MaterialType } from '@/types';
import { STATUS_LABELS, CAMPAIGN_STATUSES } from '@/lib/constants';

interface CampaignFiltersProps {
  filters: CampaignFilters;
  onChange: (filters: CampaignFilters) => void;
  activeFilterCount: number;
}

// Status options for dropdown - derived from shared constants
const STATUS_OPTIONS: { value: CampaignStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  ...CAMPAIGN_STATUSES.map(status => ({
    value: status,
    label: STATUS_LABELS[status],
  })),
];

export function CampaignFilters({ filters, onChange, activeFilterCount }: CampaignFiltersProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = <K extends keyof CampaignFilters>(
    key: K,
    value: CampaignFilters[K] | undefined
  ) => {
    const newFilters = { ...filters };
    if (value === undefined || value === '' || (typeof value === 'object' && Object.keys(value).length === 0)) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onChange(newFilters);
  };

  const clearAllFilters = () => {
    onChange({});
  };

  const handleMaterialTypeChange = (type: MaterialType | null) => {
    updateFilter('materialType', type ?? undefined);
  };

  const handleEchaChange = (approved: boolean | null) => {
    updateFilter('echaApproved', approved ?? undefined);
  };

  const handleStatusChange = (status: CampaignStatus | '') => {
    if (status === '') {
      updateFilter('status', undefined);
    } else {
      updateFilter('status', status);
    }
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const current = filters.dateRange || {};
    const updated = { ...current, [field]: value || undefined };
    // Clean up empty values
    if (!updated.start) delete updated.start;
    if (!updated.end) delete updated.end;
    updateFilter('dateRange', Object.keys(updated).length > 0 ? updated : undefined);
  };

  const handleWeightRangeChange = (field: 'min' | 'max', value: string) => {
    const current = filters.weightRange || {};
    const numValue = value ? parseFloat(value) : undefined;
    const updated = { ...current, [field]: numValue };
    // Clean up empty values
    if (updated.min === undefined) delete updated.min;
    if (updated.max === undefined) delete updated.max;
    updateFilter('weightRange', Object.keys(updated).length > 0 ? updated : undefined);
  };

  const handleCodePrefixChange = (value: string) => {
    updateFilter('campaignCodePrefix', value || undefined);
  };

  // Handle Escape key to close panel and return focus
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus trap - keep focus within panel when open
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const panel = panelRef.current;

    // Focus first element when panel opens
    const focusableElements = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      // Get all focusable elements within the panel
      const focusableElements = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      // Shift+Tab on first element - wrap to last
      if (e.shiftKey && activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // Tab on last element - wrap to first
      else if (!e.shiftKey && activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    panel.addEventListener('keydown', handleKeyDown);
    return () => panel.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className="mb-4">
      {/* Filter toggle button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="campaign-filters-panel"
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        Filters
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-blue-600 rounded-full">
            {activeFilterCount}
          </span>
        )}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible filter panel */}
      {isOpen && (
        <div
          ref={panelRef}
          id="campaign-filters-panel"
          role="region"
          aria-label="Campaign filter controls"
          className="mt-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Material Type */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                Material Type
              </label>
              <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                {(['all', 'PI', 'PCR'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleMaterialTypeChange(type === 'all' ? null : type)}
                    className={`
                      flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                      ${
                        (type === 'all' && !filters.materialType) ||
                        filters.materialType === type
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }
                    `}
                  >
                    {type === 'all' ? 'All' : type}
                  </button>
                ))}
              </div>
            </div>

            {/* ECHA Status */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                ECHA Approval
              </label>
              <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                {([
                  { value: null, label: 'All' },
                  { value: true, label: 'Approved' },
                  { value: false, label: 'Pending' },
                ] as const).map(({ value, label }) => (
                  <button
                    key={label}
                    onClick={() => handleEchaChange(value)}
                    className={`
                      flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                      ${
                        (value === null && filters.echaApproved === undefined) ||
                        filters.echaApproved === value
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                Status
              </label>
              <select
                value={filters.status === 'active' ? '' : (filters.status || '')}
                onChange={(e) => handleStatusChange(e.target.value as CampaignStatus | '')}
                className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range - From */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                Created From
              </label>
              <input
                type="date"
                value={filters.dateRange?.start?.split('T')[0] || ''}
                onChange={(e) => handleDateRangeChange('start', e.target.value ? `${e.target.value}T00:00:00Z` : '')}
                className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date Range - To */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                Created To
              </label>
              <input
                type="date"
                value={filters.dateRange?.end?.split('T')[0] || ''}
                onChange={(e) => handleDateRangeChange('end', e.target.value ? `${e.target.value}T23:59:59Z` : '')}
                className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Weight Range */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                Weight Range (kg)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  min="0"
                  value={filters.weightRange?.min ?? ''}
                  onChange={(e) => handleWeightRangeChange('min', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-zinc-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  min="0"
                  value={filters.weightRange?.max ?? ''}
                  onChange={(e) => handleWeightRangeChange('max', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Campaign Code Prefix */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                Campaign Code
              </label>
              <input
                type="text"
                placeholder="Search by code prefix..."
                value={filters.campaignCodePrefix || ''}
                onChange={(e) => handleCodePrefixChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Clear All Button */}
          {activeFilterCount > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={clearAllFilters}
                className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Calculate the number of active filters
 */
export function countActiveFilters(filters: CampaignFilters): number {
  let count = 0;
  if (filters.status && filters.status !== 'active') count++;
  if (filters.materialType) count++;
  if (filters.echaApproved !== undefined) count++;
  if (filters.dateRange?.start) count++;
  if (filters.dateRange?.end) count++;
  if (filters.weightRange?.min !== undefined) count++;
  if (filters.weightRange?.max !== undefined) count++;
  if (filters.campaignCodePrefix) count++;
  return count;
}
