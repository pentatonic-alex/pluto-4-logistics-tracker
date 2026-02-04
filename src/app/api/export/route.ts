import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCampaigns, getCampaignById } from '@/lib/projections';
import { getEventsForStream } from '@/lib/events';
import { isValidCampaignId } from '@/lib/ids';
import {
  buildCampaignWorkbook,
  workbookToBuffer,
  generateExportFilename,
} from '@/lib/excel-exporter';
import type { Campaign, BaseEvent, CampaignStatus } from '@/types';

/**
 * GET /api/export
 *
 * Export multiple campaigns to Excel.
 *
 * Query parameters:
 * - status: Filter by status ('active' for non-completed, or specific status)
 * - ids: Comma-separated list of campaign IDs to export
 *
 * Returns an xlsx file with all 7 sheets populated with data from all matching campaigns.
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') as CampaignStatus | 'active' | null;
    const idsParam = searchParams.get('ids');

    let campaigns: Campaign[];

    if (idsParam) {
      // Export specific campaigns by IDs
      const ids = idsParam.split(',').map((id) => id.trim());

      // Validate all IDs
      const invalidIds = ids.filter((id) => !isValidCampaignId(id));
      if (invalidIds.length > 0) {
        return NextResponse.json(
          { error: `Invalid campaign IDs: ${invalidIds.join(', ')}` },
          { status: 400 }
        );
      }

      // Fetch campaigns
      const campaignPromises = ids.map((id) => getCampaignById(id));
      const results = await Promise.all(campaignPromises);

      // Filter out nulls (campaigns not found)
      campaigns = results.filter((c): c is Campaign => c !== null);

      if (campaigns.length === 0) {
        return NextResponse.json(
          { error: 'No campaigns found for the provided IDs' },
          { status: 404 }
        );
      }
    } else {
      // Get campaigns by status filter
      const filters = statusFilter ? { status: statusFilter } : undefined;
      campaigns = await getCampaigns(filters);
    }

    if (campaigns.length === 0) {
      return NextResponse.json(
        { error: 'No campaigns to export' },
        { status: 404 }
      );
    }

    // Fetch events for all campaigns in parallel
    const eventsMap = new Map<string, BaseEvent[]>();
    const eventPromises = campaigns.map(async (campaign) => {
      const events = await getEventsForStream('campaign', campaign.id);
      eventsMap.set(campaign.id, events);
    });
    await Promise.all(eventPromises);

    // Build workbook
    const workbook = buildCampaignWorkbook(campaigns, eventsMap);
    const buffer = workbookToBuffer(workbook);

    // Generate filename
    const filename = generateExportFilename();

    // Return Excel file (convert Buffer to Uint8Array for TypeScript compatibility)
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error exporting campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to export campaigns' },
      { status: 500 }
    );
  }
}
