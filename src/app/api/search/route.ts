import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { searchCampaigns } from '@/lib/projections';

/**
 * GET /api/search
 * 
 * Search campaigns by any identifier (campaign ID, LEGO code, 
 * tracking number, PO number, description).
 * 
 * Query params:
 *   - q: Search query (minimum 2 characters)
 * 
 * Returns:
 *   { results: SearchResult[] }
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // Validate query parameter
    if (!query || query.trim().length < 1) {
      return NextResponse.json(
        { error: 'Search query must be at least 1 character' },
        { status: 400 }
      );
    }

    const results = await searchCampaigns(query);

    return NextResponse.json({ results });

  } catch (error) {
    console.error('Error searching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to search campaigns' },
      { status: 500 }
    );
  }
}
