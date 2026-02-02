import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCampaignById } from '@/lib/projections';
import { getEventsForStream } from '@/lib/events';
import { isValidCampaignId } from '@/lib/ids';

/**
 * GET /api/campaigns/[id]
 * 
 * Get a single campaign with its full event history.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Validate campaign ID format
    if (!isValidCampaignId(id)) {
      return NextResponse.json(
        { error: 'Invalid campaign ID format' },
        { status: 400 }
      );
    }

    // Get campaign projection
    const campaign = await getCampaignById(id);
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Get all events for this campaign
    const events = await getEventsForStream('campaign', id);

    return NextResponse.json({
      campaign,
      events,
    });

  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}
