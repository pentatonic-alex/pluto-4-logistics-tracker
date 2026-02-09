/**
 * Campaign data fetching hooks
 *
 * Provides hooks for fetching campaign data from the API with caching and revalidation.
 */

import { useState, useEffect } from 'react';
import type { Campaign, CampaignFilters } from '@/types';

interface UseCampaignsOptions {
  filters?: CampaignFilters;
}

interface UseCampaignsResult {
  campaigns: Campaign[];
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;
  mutate: () => void;
}

/**
 * Fetch campaigns from the API with the given filters
 */
export function useCampaigns({ filters = {} }: UseCampaignsOptions = {}): UseCampaignsResult {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchCampaigns() {
      if (!isLoading) {
        setIsValidating(true);
      }

      try {
        // Build query string from filters
        const params = new URLSearchParams();

        if (filters.status) {
          params.set('status', filters.status);
        }
        if (filters.materialType) {
          params.set('materialType', filters.materialType);
        }
        if (filters.echaApproved !== undefined) {
          params.set('echaApproved', String(filters.echaApproved));
        }
        if (filters.dateRange?.start) {
          params.set('dateFrom', filters.dateRange.start);
        }
        if (filters.dateRange?.end) {
          params.set('dateTo', filters.dateRange.end);
        }
        if (filters.weightRange?.min !== undefined) {
          params.set('weightMin', String(filters.weightRange.min));
        }
        if (filters.weightRange?.max !== undefined) {
          params.set('weightMax', String(filters.weightRange.max));
        }
        if (filters.campaignCodePrefix) {
          params.set('campaignCodePrefix', filters.campaignCodePrefix);
        }

        const url = `/api/campaigns${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch campaigns: ${response.statusText}`);
        }

        const data = await response.json();

        if (!cancelled) {
          setCampaigns(data.campaigns || []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch campaigns'));
          setCampaigns([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsValidating(false);
        }
      }
    }

    fetchCampaigns();

    return () => {
      cancelled = true;
    };
  }, [filters, refreshKey]);

  const mutate = () => {
    setRefreshKey(prev => prev + 1);
  };

  return {
    campaigns,
    isLoading,
    isValidating,
    error,
    mutate,
  };
}

/**
 * Fetch the count of completed campaigns
 */
export function useCompletedCampaignCount() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCount() {
      try {
        const response = await fetch('/api/campaigns?status=completed');

        if (!response.ok) {
          throw new Error(`Failed to fetch count: ${response.statusText}`);
        }

        const data = await response.json();

        if (!cancelled) {
          setCount(data.campaigns?.length || 0);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch count'));
          setCount(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchCount();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    count,
    isLoading,
    error,
  };
}
