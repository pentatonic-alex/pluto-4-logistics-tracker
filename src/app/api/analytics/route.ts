import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getOverviewMetrics,
  getYieldAverages,
  getThroughputByMonth,
  getLatestCampaignYields,
  type AnalyticsData,
  type YieldAverages,
} from '@/lib/analytics';

export interface AnalyticsResponse extends AnalyticsData {
  latestYields?: YieldAverages;
}

/**
 * GET /api/analytics
 *
 * Returns aggregated analytics data for the dashboard.
 *
 * Query params:
 *   - includeLatestYields: If 'true', includes yields from most recent campaign
 *
 * Response:
 * {
 *   overview: { totalProcessedKg, activeCampaigns, completedCampaigns, totalUnitsProduced, co2eSavedKg },
 *   yields: { granulation, metalRemoval, purification, extrusion, overall },
 *   throughput: [{ month, processedKg }],
 *   latestYields?: { ... } // Only if includeLatestYields=true
 * }
 */
export async function GET(request: Request) {
  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const includeLatestYields = searchParams.get('includeLatestYields') === 'true';

    // Fetch all analytics data in parallel
    const [overview, yields, throughput, latestYields] = await Promise.all([
      getOverviewMetrics(),
      getYieldAverages(),
      getThroughputByMonth(),
      includeLatestYields ? getLatestCampaignYields() : Promise.resolve(undefined),
    ]);

    const response: AnalyticsResponse = {
      overview,
      yields,
      throughput,
    };

    if (latestYields) {
      response.latestYields = latestYields;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
