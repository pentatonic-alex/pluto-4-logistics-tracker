import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getRecentCampaigns } from '@/lib/projections';

/**
 * GET /api/search/suggestions
 * 
 * Get recent campaigns for auto-suggestions when search is focused.
 * Returns the most recently updated campaigns (both active and completed).
 * 
 * Returns:
 *   { suggestions: Suggestion[] }
 */
export async function GET() {
  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const suggestions = await getRecentCampaigns(8);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}
