'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { CampaignCard } from '@/components/CampaignCard';
import { SkeletonCampaignCard } from '@/components/ui/Skeleton';
import { ExportButton } from '@/components/ExportButton';
import { CampaignFilters, countActiveFilters } from '@/components/CampaignFilters';
import { FilterChips } from '@/components/FilterChips';
import { useCampaigns, useCompletedCampaignCount } from '@/lib/hooks/useCampaigns';
import type { CampaignFilters as CampaignFiltersType } from '@/types';

type FilterTab = 'active' | 'all';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('active');
  const [filters, setFilters] = useState<CampaignFiltersType>({});
  
  // Debounced filters for API calls - use useDeferredValue for smoother UX
  // We use a custom debounce to control the exact timing
  const [debouncedFilters, setDebouncedFilters] = useState<CampaignFiltersType>({});
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  // Track previous tab to detect tab changes
  const prevTabRef = useRef<FilterTab>(activeTab);

  // Combined filters including tab selection - memoized to prevent unnecessary re-renders
  const effectiveFilters: CampaignFiltersType = useMemo(() => ({
    ...debouncedFilters,
    // Only set status from tab if not overridden by specific status filter
    ...(activeTab === 'active' && !debouncedFilters.status ? { status: 'active' as const } : {}),
  }), [debouncedFilters, activeTab]);

  // Use SWR for fetching campaigns - handles race conditions and caching automatically
  const { campaigns, isLoading, isValidating, error, mutate } = useCampaigns({
    filters: effectiveFilters,
  });
  
  // Fetch completed count for archive link
  const { count: completedCount } = useCompletedCampaignCount();

  // Debounce filter changes
  useEffect(() => {
    // Check if tab changed - apply filters with minimal delay
    const tabChanged = prevTabRef.current !== activeTab;
    prevTabRef.current = activeTab;
    
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Use minimal delay for tab changes, 300ms for filter changes
    // This avoids synchronous setState inside effect (React lint rule)
    const delay = tabChanged ? 0 : 300;
    
    debounceRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
    }, delay);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [filters, activeTab]);

  const handleFiltersChange = (newFilters: CampaignFiltersType) => {
    setFilters(newFilters);
  };

  const handleRemoveFilter = (key: keyof CampaignFiltersType, subKey?: string) => {
    const newFilters = { ...filters };

    if (subKey && (key === 'dateRange' || key === 'weightRange')) {
      const rangeValue = newFilters[key];
      if (rangeValue && typeof rangeValue === 'object') {
        const updated = { ...rangeValue };
        delete updated[subKey as keyof typeof updated];
        if (Object.keys(updated).length === 0) {
          delete newFilters[key];
        } else {
          // Type assertion needed here due to the conditional nature
          (newFilters as Record<string, unknown>)[key] = updated;
        }
      }
    } else {
      delete newFilters[key];
    }

    setFilters(newFilters);
  };

  const activeFilterCount = countActiveFilters(filters);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'all', label: 'All' },
  ];

  // Show loading state only on initial load, not during revalidation
  const showLoading = isLoading && campaigns.length === 0;
  
  // Show subtle loading indicator when revalidating
  const showRevalidating = isValidating && !isLoading;

  return (
    <div>
      {/* Header - responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Campaigns
            {showRevalidating && (
              <span className="ml-2 inline-flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              </span>
            )}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track material through the supply chain
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <ExportButton
            statusFilter={activeTab === 'active' ? 'active' : undefined}
            label="Export All"
            variant="secondary"
            className="w-full sm:w-auto"
          />
          <Link
            href="/campaigns/new"
            className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors inline-flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Campaign
          </Link>
        </div>
      </div>

      {/* Filter tabs and filters */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-4 py-1.5 text-sm font-medium rounded-md transition-colors
                ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <CampaignFilters
          filters={filters}
          onChange={handleFiltersChange}
          activeFilterCount={activeFilterCount}
        />
      </div>

      {/* Active filter chips */}
      <FilterChips filters={filters} onRemove={handleRemoveFilter} />

      {/* Content */}
      {showLoading ? (
        <div className="grid gap-4">
          {/* Show 3 skeleton cards while loading */}
          <SkeletonCampaignCard />
          <SkeletonCampaignCard />
          <SkeletonCampaignCard />
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
          <div className="px-6 py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              Failed to load campaigns
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              {error.message}
            </p>
            <button
              onClick={() => mutate()}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Try again →
            </button>
          </div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-6 py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
              <svg
                className="w-6 h-6 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              {activeFilterCount > 0 
                ? 'No campaigns match your filters' 
                : activeTab === 'active' 
                  ? 'No active campaigns' 
                  : 'No campaigns yet'}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              {activeFilterCount > 0
                ? 'Try adjusting your filters or clearing them to see more results.'
                : 'Create your first campaign to start tracking material.'}
            </p>
            {activeFilterCount > 0 ? (
              <button
                onClick={() => setFilters({})}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Clear all filters →
              </button>
            ) : (
              <Link
                href="/campaigns/new"
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Create a campaign →
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}

      {/* Archive link */}
      {!showLoading && !error && completedCount > 0 && activeTab === 'active' && (
        <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <Link
            href="/archive"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            View {completedCount} completed campaign{completedCount !== 1 ? 's' : ''} in archive →
          </Link>
        </div>
      )}
    </div>
  );
}
