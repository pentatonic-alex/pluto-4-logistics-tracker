'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { SkeletonStatsGrid, SkeletonArchivedCard } from '@/components/ui/Skeleton';
import type { Campaign } from '@/types';

export default function ArchivePage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchCompletedCampaigns() {
      try {
        const response = await fetch('/api/campaigns?status=completed');
        if (!response.ok) throw new Error('Failed to fetch campaigns');
        const data = await response.json();
        setCampaigns(data.campaigns);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchCompletedCampaigns();
  }, []);

  // Filter campaigns by search query
  const filteredCampaigns = useMemo(() => {
    if (!searchQuery.trim()) return campaigns;
    const query = searchQuery.toLowerCase();
    return campaigns.filter(
      (c) =>
        c.legoCampaignCode.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
    );
  }, [campaigns, searchQuery]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalWeight = campaigns.reduce(
      (sum, c) => sum + (c.currentWeightKg || 0),
      0
    );
    const totalCampaigns = campaigns.length;
    
    // Calculate average duration
    const durations = campaigns
      .filter((c) => c.completedAt && c.createdAt)
      .map((c) => {
        const start = new Date(c.createdAt).getTime();
        const end = new Date(c.completedAt!).getTime();
        return (end - start) / (1000 * 60 * 60 * 24); // days
      });
    
    const avgDuration =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

    return { totalWeight, totalCampaigns, avgDuration };
  }, [campaigns]);

  return (
    <div>
      {/* Header - responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Archive
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Completed campaigns and historical data
          </p>
        </div>
        
        {/* Export placeholder */}
        <button
          disabled
          className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 rounded-lg text-sm font-medium cursor-not-allowed inline-flex items-center justify-center gap-2 w-full sm:w-auto"
          title="Export coming soon"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export
        </button>
      </div>

      {/* Summary Stats - responsive grid */}
      {loading ? (
        <div className="mb-6">
          <SkeletonStatsGrid />
        </div>
      ) : !error && campaigns.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {stats.totalCampaigns}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              Completed Campaigns
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {stats.totalWeight.toLocaleString()} kg
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              Total Weight Processed
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {stats.avgDuration} days
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              Avg. Campaign Duration
            </div>
          </div>
        </div>
      ) : null}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by campaign code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          <SkeletonArchivedCard />
          <SkeletonArchivedCard />
          <SkeletonArchivedCard />
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
              Failed to load archive
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
          </div>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-6 py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
              <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              {searchQuery ? 'No matching campaigns' : 'No completed campaigns'}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {searchQuery
                ? 'Try a different search term.'
                : 'Completed campaigns will appear here.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCampaigns.map((campaign) => (
            <ArchivedCampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}

// Archived campaign card with completion info and timeline preview
function ArchivedCampaignCard({ campaign }: { campaign: Campaign }) {
  const completionDate = campaign.completedAt
    ? new Date(campaign.completedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Unknown';

  const duration = campaign.completedAt && campaign.createdAt
    ? Math.round(
        (new Date(campaign.completedAt).getTime() - new Date(campaign.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  // Timeline steps (simplified)
  const timelineSteps = [
    { label: 'Created', done: true },
    { label: 'Inbound', done: true },
    { label: 'MBA Processing', done: true },
    { label: 'RGE Manufacturing', done: true },
    { label: 'Completed', done: true },
  ];

  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="block bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
        <div className="min-w-0 flex-1">
          {/* Campaign code and material type */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {campaign.legoCampaignCode}
            </h3>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {campaign.materialType}
            </span>
          </div>

          {/* Description */}
          {campaign.description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1">
              {campaign.description}
            </p>
          )}
        </div>

        {/* Completed badge */}
        <div className="flex-shrink-0">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Completed
          </span>
        </div>
      </div>

      {/* Stats row - responsive wrapping */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400 mb-4">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Completed {completionDate}
        </span>
        {duration !== null && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {duration} days duration
          </span>
        )}
        {campaign.currentWeightKg && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            {campaign.currentWeightKg.toLocaleString()} kg
          </span>
        )}
        {campaign.echaApproved && (
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            ECHA
          </span>
        )}
      </div>

      {/* Collapsed timeline preview - hidden on very small screens */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 hidden sm:block">
        <div className="flex items-center justify-between">
          {timelineSteps.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 whitespace-nowrap">
                  {step.label}
                </span>
              </div>
              {i < timelineSteps.length - 1 && (
                <div className="w-6 sm:w-10 md:w-14 lg:w-16 h-px bg-green-300 dark:bg-green-700 mx-1" />
              )}
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}
