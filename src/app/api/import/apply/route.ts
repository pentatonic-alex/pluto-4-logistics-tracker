import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { appendEvent } from '@/lib/events';
import { updateProjection } from '@/lib/projections';
import { generateCampaignId } from '@/lib/ids';
import type { EventType } from '@/types';
import type {
  ImportApplyRequest,
  ImportApplyResponse,
  CreatePreview,
  EventPreview,
  UpdatePreview,
} from '@/types/import';

/**
 * POST /api/import/apply
 * 
 * Apply confirmed changes from the import preview.
 * Creates campaigns, records events, and applies corrections.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: ImportApplyRequest = await request.json();
    const { creates, events, updates, previewData } = body;
    
    const userId = session.user.email || 'import-user';
    
    const result: ImportApplyResponse = {
      success: true,
      created: [],
      events: [],
      corrections: [],
      errors: [],
    };
    
    // Map to track preview ID -> actual campaign ID for newly created campaigns
    const campaignIdMap = new Map<string, string>();
    
    // 1. Process creates (new campaigns)
    for (const previewId of creates) {
      const create = previewData.creates.find((c: CreatePreview) => c.id === previewId);
      if (!create) {
        result.errors.push({ id: previewId, error: 'Create preview not found' });
        continue;
      }
      
      try {
        // Generate new campaign ID
        const campaignId = generateCampaignId();
        campaignIdMap.set(create.campaignCode, campaignId);
        
        const eventIds: string[] = [];
        
        // Create CampaignCreated event
        const createPayload = create.payload as unknown as Record<string, unknown>;
        const createEvent = await appendEvent({
          streamType: 'campaign',
          streamId: campaignId,
          eventType: 'CampaignCreated',
          eventData: createPayload,
          userId,
        });
        eventIds.push(createEvent.id);
        await updateProjection('CampaignCreated', campaignId, createPayload, createEvent.createdAt);
        
        // If there's an inbound shipment payload, create that event too
        if (create.inboundShipmentPayload) {
          const shipmentPayload = create.inboundShipmentPayload as unknown as Record<string, unknown>;
          const shipmentEvent = await appendEvent({
            streamType: 'campaign',
            streamId: campaignId,
            eventType: 'InboundShipmentRecorded',
            eventData: shipmentPayload,
            userId,
          });
          eventIds.push(shipmentEvent.id);
          await updateProjection('InboundShipmentRecorded', campaignId, shipmentPayload, shipmentEvent.createdAt);
        }
        
        result.created.push({
          campaignId,
          campaignCode: create.campaignCode,
          eventIds,
        });
        
      } catch (error) {
        console.error(`Error creating campaign ${create.campaignCode}:`, error);
        result.errors.push({ 
          id: previewId, 
          error: error instanceof Error ? error.message : 'Failed to create campaign' 
        });
      }
    }
    
    // 2. Process events (add events to existing campaigns)
    for (const previewId of events) {
      const event = previewData.events.find((e: EventPreview) => e.id === previewId);
      if (!event) {
        result.errors.push({ id: previewId, error: 'Event preview not found' });
        continue;
      }
      
      try {
        // Use actual campaign ID (could be from a newly created campaign)
        const campaignId = campaignIdMap.get(event.campaignCode) || event.campaignId;
        const eventPayload = event.payload as unknown as Record<string, unknown>;
        
        const newEvent = await appendEvent({
          streamType: 'campaign',
          streamId: campaignId,
          eventType: event.eventType as EventType,
          eventData: eventPayload,
          userId,
        });
        
        await updateProjection(event.eventType as EventType, campaignId, eventPayload, newEvent.createdAt);
        
        result.events.push({
          campaignId,
          eventId: newEvent.id,
          eventType: event.eventType as EventType,
        });
        
      } catch (error) {
        console.error(`Error adding event for ${event.campaignCode}:`, error);
        result.errors.push({ 
          id: previewId, 
          error: error instanceof Error ? error.message : 'Failed to add event' 
        });
      }
    }
    
    // 3. Process updates (corrections)
    for (const previewId of updates) {
      const update = previewData.updates.find((u: UpdatePreview) => u.id === previewId);
      if (!update) {
        result.errors.push({ id: previewId, error: 'Update preview not found' });
        continue;
      }
      
      try {
        const campaignId = update.campaignId;
        
        // Build correction payload
        const changes: Record<string, { was: unknown; now: unknown }> = {};
        for (const change of update.changes) {
          changes[change.field] = {
            was: change.current,
            now: change.proposed,
          };
        }
        
        const correctionPayload = {
          correctsEventId: update.correctsEventId,
          correctsEventType: update.correctsEventType,
          reason: `Imported from Excel (${update.source})`,
          changes,
        };
        
        const correctionEvent = await appendEvent({
          streamType: 'campaign',
          streamId: campaignId,
          eventType: 'EventCorrected',
          eventData: correctionPayload,
          userId,
        });
        
        await updateProjection('EventCorrected', campaignId, correctionPayload, correctionEvent.createdAt);
        
        result.corrections.push({
          campaignId,
          eventId: correctionEvent.id,
          correctsEventId: update.correctsEventId,
        });
        
      } catch (error) {
        console.error(`Error applying correction for ${update.campaignCode}:`, error);
        result.errors.push({ 
          id: previewId, 
          error: error instanceof Error ? error.message : 'Failed to apply correction' 
        });
      }
    }
    
    // Set success to false if there were any errors
    if (result.errors.length > 0) {
      result.success = result.created.length > 0 || result.events.length > 0 || result.corrections.length > 0;
    }
    
    return NextResponse.json(result, { status: result.success ? 200 : 207 });
    
  } catch (error) {
    console.error('Error applying import:', error);
    return NextResponse.json(
      { error: 'Failed to apply import' },
      { status: 500 }
    );
  }
}
