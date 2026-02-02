import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCampaigns } from '@/lib/projections';
import type { CampaignStatus } from '@/types';

/**
 * GET /api/campaigns
 * 
 * List all campaigns from the projections table.
 * 
 * Query params:
 *   - status: Filter by status ('active' for non-completed, or specific status)
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    
    // Validate status parameter
    const validStatuses: (CampaignStatus | 'active')[] = [
      'active',
      'created',
      'inbound_shipment_recorded',
      'granulation_complete',
      'metal_removal_complete',
      'polymer_purification_complete',
      'extrusion_complete',
      'echa_approved',
      'transferred_to_rge',
      'manufacturing_started',
      'manufacturing_complete',
      'returned_to_lego',
      'completed',
    ];

    let statusFilter: CampaignStatus | 'active' | undefined;
    if (statusParam) {
      if (!validStatuses.includes(statusParam as CampaignStatus | 'active')) {
        return NextResponse.json(
          { error: `Invalid status filter. Valid values: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      statusFilter = statusParam as CampaignStatus | 'active';
    }

    const campaigns = await getCampaigns(statusFilter);

    return NextResponse.json({ campaigns });

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}
