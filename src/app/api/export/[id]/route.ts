import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCampaignById } from '@/lib/projections';
import { getEventsForStream } from '@/lib/events';
import { isValidCampaignId } from '@/lib/ids';
import {
  buildCampaignWorkbook,
  workbookToBuffer,
  generateExportFilename,
} from '@/lib/excel-exporter';

/**
 * GET /api/export/[id]
 *
 * Export a single campaign to Excel.
 * Returns an xlsx file with all 7 sheets populated with campaign data.
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
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get all events for this campaign
    const events = await getEventsForStream('campaign', id);

    // Build events map
    const eventsMap = new Map([[id, events]]);

    // Build workbook
    const workbook = buildCampaignWorkbook([campaign], eventsMap);
    const buffer = workbookToBuffer(workbook);

    // Generate filename
    const filename = generateExportFilename(campaign.legoCampaignCode);

    // Return Excel file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error exporting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to export campaign' },
      { status: 500 }
    );
  }
}
