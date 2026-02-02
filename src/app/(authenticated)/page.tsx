'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CampaignCard } from '@/components/CampaignCard';
import { SkeletonCampaignCard } from '@/components/ui/Skeleton';
import type { Campaign } from '@/types';

type FilterTab = 'active' | 'all';

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('active');

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const statusParam = activeTab === 'all' ? '' : `?status=${activeTab}`;
      const response = await fetch(`/api/campaigns${statusParam}`);

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();
      setCampaigns(data.campaigns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Fetch completed count for archive link
  useEffect(() => {
    async function fetchCompletedCount() {
      try {
        const response = await fetch('/api/campaigns?status=completed');
        if (response.ok) {
          const data = await response.json();
          setCompletedCount(data.campaigns.length);
        }
      } catch {
        // Silently fail - not critical
      }
    }
    fetchCompletedCount();
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'all', label: 'All' },
  ];

  return (
    <div>
      {/* Header - responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Campaigns
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track material through the supply chain
          </p>
        </div>
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

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-fit">
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

      {/* Content */}
      {loading ? (
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
              {error}
            </p>
            <button
              onClick={fetchCampaigns}
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
              {activeTab === 'active' ? 'No active campaigns' : 'No campaigns yet'}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Create your first campaign to start tracking material.
            </p>
            <Link
              href="/campaigns/new"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Create a campaign →
            </Link>
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
      {!loading && !error && completedCount > 0 && activeTab === 'active' && (
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
