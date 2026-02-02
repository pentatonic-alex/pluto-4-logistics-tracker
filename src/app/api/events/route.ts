import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { appendEvent } from '@/lib/events';
import { updateProjection, getCampaignById } from '@/lib/projections';
import { generateCampaignId, isValidCampaignId } from '@/lib/ids';
import type { EventType } from '@/types';

// Valid event types for validation
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
];

/**
 * POST /api/events
 * 
 * Append a new event to the event store and update projections.
 * 
 * For CampaignCreated events, a new campaign ID is generated.
 * For all other events, the campaignId must be provided.
 */
export async function POST(request: NextRequest) {
  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { eventType, campaignId, eventData } = body;

    // Validate event type
    if (!eventType || !VALID_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid event type. Valid types: ${VALID_EVENT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate event data
    if (!eventData || typeof eventData !== 'object') {
      return NextResponse.json(
        { error: 'eventData is required and must be an object' },
        { status: 400 }
      );
    }

    // Determine stream ID (campaign ID)
    let streamId: string;

    if (eventType === 'CampaignCreated') {
      // Generate new campaign ID for creation events
      streamId = generateCampaignId();
      
      // Validate required fields for CampaignCreated
      if (!eventData.legoCampaignCode) {
        return NextResponse.json(
          { error: 'legoCampaignCode is required for CampaignCreated events' },
          { status: 400 }
        );
      }
      if (!eventData.materialType || !['PI', 'PCR'].includes(eventData.materialType)) {
        return NextResponse.json(
          { error: 'materialType must be either "PI" or "PCR"' },
          { status: 400 }
        );
      }
    } else {
      // All other events require an existing campaign ID
      if (!campaignId) {
        return NextResponse.json(
          { error: 'campaignId is required for non-creation events' },
          { status: 400 }
        );
      }
      if (!isValidCampaignId(campaignId)) {
        return NextResponse.json(
          { error: 'Invalid campaign ID format' },
          { status: 400 }
        );
      }
      
      // Verify campaign exists
      const campaign = await getCampaignById(campaignId);
      if (!campaign) {
        return NextResponse.json(
          { error: 'Campaign not found' },
          { status: 404 }
        );
      }
      
      streamId = campaignId;
    }

    // Append event to the event store
    const event = await appendEvent({
      streamType: 'campaign',
      streamId,
      eventType,
      eventData,
      userId: session.user.email || 'unknown',
    });

    // Update the campaign projection
    await updateProjection(eventType, streamId, eventData, event.createdAt);

    // Return the created event and campaign ID
    return NextResponse.json({
      event,
      campaignId: streamId,
    }, { status: 201 });

  } catch (error) {
    console.error('Error appending event:', error);
    return NextResponse.json(
      { error: 'Failed to append event' },
      { status: 500 }
    );
  }
}
