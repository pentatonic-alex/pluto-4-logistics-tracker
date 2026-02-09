import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAuditEntries, getCampaignsForFilter, type AuditResponse } from '@/lib/audit';
import { isValidCampaignId } from '@/lib/ids';
import type { EventType } from '@/types';

// Valid event types for filtering
const VALID_EVENT_TYPES: EventType[] = [
  'CampaignCreated',
  'InboundShipmentRecorded',
  'GranulationCompleted',
  'MetalRemovalCompleted',
  'PolymerPurificationCompleted',
  'ExtrusionCompleted',
  'ECHAApprovalRecorded',
  'TransferToRGERecorded',
  'ManufacturingStarted',
  'ManufacturingCompleted',
  'ReturnToLEGORecorded',
  'CampaignCompleted',
  'EventCorrected',
];

/**
 * GET /api/audit
 *
 * Fetch paginated audit log entries (EventCorrected events).
 *
 * Query Parameters:
 * - campaignId (optional): Filter by campaign ID
 * - eventType (optional): Filter by the type of event that was corrected
 * - startDate (optional): ISO date string, filter corrections on or after
 * - endDate (optional): ISO date string, filter corrections on or before
 * - page (optional, default: 1): Page number
 * - limit (optional, default: 20): Items per page (max 100)
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const campaignId = searchParams.get('campaignId') || undefined;
    const eventTypeParam = searchParams.get('eventType') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    // Validate campaign ID if provided
    if (campaignId && !isValidCampaignId(campaignId)) {
      return NextResponse.json(
        { error: 'Invalid campaign ID format' },
        { status: 400 }
      );
    }

    // Validate event type if provided
    let eventType: EventType | undefined = undefined;
    if (eventTypeParam) {
      if (!VALID_EVENT_TYPES.includes(eventTypeParam as EventType)) {
        return NextResponse.json(
          { error: `Invalid eventType. Must be one of: ${VALID_EVENT_TYPES.join(', ')}` },
          { status: 400 }
        );
      }
      eventType = eventTypeParam as EventType;
    }

    // Validate dates if provided
    if (startDate && isNaN(Date.parse(startDate))) {
      return NextResponse.json(
        { error: 'Invalid startDate format. Use ISO 8601 format.' },
        { status: 400 }
      );
    }
    if (endDate && isNaN(Date.parse(endDate))) {
      return NextResponse.json(
        { error: 'Invalid endDate format. Use ISO 8601 format.' },
        { status: 400 }
      );
    }

    // Fetch audit entries and campaigns in parallel
    const [auditResult, campaigns] = await Promise.all([
      getAuditEntries(
        { campaignId, eventType, startDate, endDate },
        { page, limit }
      ),
      getCampaignsForFilter(),
    ]);

    const { entries, total } = auditResult;
    const totalPages = Math.ceil(total / limit);

    const response: AuditResponse = {
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      campaigns,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit log' },
      { status: 500 }
    );
  }
}
