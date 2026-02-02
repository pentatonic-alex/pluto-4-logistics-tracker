import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getEventsForStream } from '@/lib/events';
import type { Campaign, EventType, BaseEvent } from '@/types';
import type {
  ImportPreviewRequest,
  ImportPreviewResponse,
  CreatePreview,
  EventPreview,
  UpdatePreview,
  SkippedRow,
  FieldChange,
} from '@/types/import';

// Helper to generate temporary preview IDs
let previewIdCounter = 0;
function generatePreviewId(prefix: string): string {
  return `${prefix}_${++previewIdCounter}_${Date.now()}`;
}

// Reset counter for each request
function resetPreviewIds() {
  previewIdCounter = 0;
}

/**
 * Get campaigns by their LEGO campaign codes
 */
async function getCampaignsByLegoCodes(codes: string[]): Promise<Map<string, Campaign>> {
  if (codes.length === 0) return new Map();
  
  // Use parameterized query with array
  const rows = await sql`
    SELECT * FROM campaign_projections 
    WHERE lego_campaign_code = ANY(${codes})
  `;
  
  const map = new Map<string, Campaign>();
  rows.forEach(row => {
    const campaign = mapRowToCampaign(row);
    map.set(campaign.legoCampaignCode, campaign);
  });
  
  return map;
}

/**
 * Map database row to Campaign type
 */
function mapRowToCampaign(row: Record<string, unknown>): Campaign {
  return {
    id: row.id as string,
    legoCampaignCode: row.lego_campaign_code as string,
    status: row.status as Campaign['status'],
    currentStep: row.current_step as string | null,
    currentWeightKg: row.current_weight_kg ? Number(row.current_weight_kg) : null,
    materialType: row.material_type as 'PI' | 'PCR',
    description: row.description as string | null,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
    completedAt: row.completed_at ? (row.completed_at as Date).toISOString() : null,
    lastEventType: row.last_event_type as Campaign['lastEventType'],
    lastEventAt: row.last_event_at ? (row.last_event_at as Date).toISOString() : null,
    nextExpectedStep: row.next_expected_step as string | null,
    echaApproved: row.echa_approved as boolean,
  };
}

/**
 * Check if campaign already has an event of this type
 */
function hasEventOfType(events: BaseEvent[], eventType: EventType): BaseEvent | undefined {
  return events.find(e => e.eventType === eventType);
}

/**
 * Compare two values and generate field changes
 */
function compareFields(
  currentData: Record<string, unknown>,
  proposedData: Record<string, unknown>,
  fieldLabels: Record<string, string>
): FieldChange[] {
  const changes: FieldChange[] = [];
  
  for (const [field, label] of Object.entries(fieldLabels)) {
    const current = currentData[field];
    const proposed = proposedData[field];
    
    // Only include if proposed has a value and it's different
    if (proposed !== undefined && proposed !== null && proposed !== current) {
      changes.push({ field, label, current, proposed });
    }
  }
  
  return changes;
}

/**
 * POST /api/import/preview
 * 
 * Analyze parsed Excel data and return a preview of changes
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    resetPreviewIds();
    const data: ImportPreviewRequest = await request.json();
    
    // Collect all unique campaign codes
    const allCodes = new Set<string>();
    data.inboundShipments.forEach(r => allCodes.add(r.campaignCode));
    data.granulations.forEach(r => allCodes.add(r.campaignCode));
    data.metalRemovals.forEach(r => allCodes.add(r.campaignCode));
    data.polymerPurifications.forEach(r => allCodes.add(r.campaignCode));
    data.extrusions.forEach(r => allCodes.add(r.campaignCode));
    data.transfers.forEach(r => allCodes.add(r.campaignCode));
    data.manufacturing.forEach(r => allCodes.add(r.campaignCode));
    
    // Look up existing campaigns
    const existingCampaigns = await getCampaignsByLegoCodes(Array.from(allCodes));
    
    // Get events for existing campaigns
    const campaignEvents = new Map<string, BaseEvent[]>();
    for (const campaign of existingCampaigns.values()) {
      const events = await getEventsForStream('campaign', campaign.id);
      campaignEvents.set(campaign.id, events);
    }
    
    const creates: CreatePreview[] = [];
    const events: EventPreview[] = [];
    const updates: UpdatePreview[] = [];
    const skipped: SkippedRow[] = [];
    
    // Track which campaigns we're creating (to avoid duplicate creates)
    const campaignsToCreate = new Set<string>();
    
    // Process Inbound Shipments (can create campaigns + record shipment events)
    data.inboundShipments.forEach((row) => {
      const existing = existingCampaigns.get(row.campaignCode);
      
      if (!existing && !campaignsToCreate.has(row.campaignCode)) {
        // New campaign - need to create
        // Try to get material type from granulation data
        const granRow = data.granulations.find(g => g.campaignCode === row.campaignCode);
        const materialType = granRow?.materialType || 'PCR'; // Default to PCR if unknown
        
        creates.push({
          id: generatePreviewId('create'),
          campaignCode: row.campaignCode,
          materialType,
          source: 'inbound_shipment',
          payload: {
            legoCampaignCode: row.campaignCode,
            materialType,
          },
          inboundShipmentPayload: row.grossWeightKg !== undefined ? {
            grossWeightKg: row.grossWeightKg || 0,
            netWeightKg: row.netWeightKg || 0,
            estimatedAbsKg: row.estimatedAbsKg,
            carrier: row.carrier || 'Unknown',
            trackingRef: row.trackingRef || 'Unknown',
            shipDate: row.shipDate || new Date().toISOString().split('T')[0],
            arrivalDate: row.arrivalDate || new Date().toISOString().split('T')[0],
          } : undefined,
          selected: true,
        });
        campaignsToCreate.add(row.campaignCode);
      } else if (existing) {
        // Campaign exists - check if we should add inbound shipment event or update
        const existingEvents = campaignEvents.get(existing.id) || [];
        const inboundEvent = hasEventOfType(existingEvents, 'InboundShipmentRecorded');
        
        if (!inboundEvent && row.grossWeightKg !== undefined) {
          // Add new inbound shipment event
          events.push({
            id: generatePreviewId('event'),
            campaignId: existing.id,
            campaignCode: row.campaignCode,
            eventType: 'InboundShipmentRecorded',
            source: 'Inbound Shipment',
            payload: {
              grossWeightKg: row.grossWeightKg || 0,
              netWeightKg: row.netWeightKg || 0,
              estimatedAbsKg: row.estimatedAbsKg,
              carrier: row.carrier || 'Unknown',
              trackingRef: row.trackingRef || 'Unknown',
              shipDate: row.shipDate || new Date().toISOString().split('T')[0],
              arrivalDate: row.arrivalDate || new Date().toISOString().split('T')[0],
            },
            selected: true,
          });
        } else if (inboundEvent && row.netWeightKg !== undefined) {
          // Check for updates
          const changes = compareFields(
            inboundEvent.eventData,
            {
              grossWeightKg: row.grossWeightKg,
              netWeightKg: row.netWeightKg,
              carrier: row.carrier,
              trackingRef: row.trackingRef,
            },
            {
              grossWeightKg: 'Gross Weight (kg)',
              netWeightKg: 'Net Weight (kg)',
              carrier: 'Carrier',
              trackingRef: 'Tracking Reference',
            }
          );
          
          if (changes.length > 0) {
            updates.push({
              id: generatePreviewId('update'),
              campaignId: existing.id,
              campaignCode: row.campaignCode,
              eventType: 'EventCorrected',
              correctsEventId: inboundEvent.id,
              correctsEventType: 'InboundShipmentRecorded',
              source: 'Inbound Shipment',
              changes,
              selected: true,
            });
          }
        }
      }
    });
    
    // Process Granulation rows
    data.granulations.forEach((row, index) => {
      const existing = existingCampaigns.get(row.campaignCode);
      
      if (!existing && !campaignsToCreate.has(row.campaignCode)) {
        // Create campaign from granulation data
        creates.push({
          id: generatePreviewId('create'),
          campaignCode: row.campaignCode,
          materialType: row.materialType || 'PCR',
          source: 'granulation',
          payload: {
            legoCampaignCode: row.campaignCode,
            materialType: row.materialType || 'PCR',
          },
          selected: true,
        });
        campaignsToCreate.add(row.campaignCode);
      }
      
      // If campaign exists (or will be created), check for granulation event
      if (existing || campaignsToCreate.has(row.campaignCode)) {
        if (row.startingWeightKg === undefined && row.outputWeightKg === undefined) {
          skipped.push({
            id: generatePreviewId('skip'),
            source: 'Granulation',
            rowNumber: index + 2,
            campaignCode: row.campaignCode,
            reason: 'Missing weight data',
            rawData: row as unknown as Record<string, unknown>,
          });
          return;
        }
        
        if (existing) {
          const existingEvents = campaignEvents.get(existing.id) || [];
          const granEvent = hasEventOfType(existingEvents, 'GranulationCompleted');
          
          if (!granEvent) {
            events.push({
              id: generatePreviewId('event'),
              campaignId: existing.id,
              campaignCode: row.campaignCode,
              eventType: 'GranulationCompleted',
              source: 'Granulation',
              payload: {
                ticketNumber: row.ticketNumber || 'IMPORT',
                startingWeightKg: row.startingWeightKg || 0,
                outputWeightKg: row.outputWeightKg || 0,
                processHours: row.processHours,
                polymerComposition: row.polymerComposition,
                contaminationNotes: row.contaminationNotes,
                wasteCode: row.wasteCode,
                notes: row.notes,
              },
              selected: true,
            });
          } else {
            // Check for updates
            const changes = compareFields(
              granEvent.eventData,
              {
                startingWeightKg: row.startingWeightKg,
                outputWeightKg: row.outputWeightKg,
                processHours: row.processHours,
              },
              {
                startingWeightKg: 'Starting Weight (kg)',
                outputWeightKg: 'Output Weight (kg)',
                processHours: 'Process Hours',
              }
            );
            
            if (changes.length > 0) {
              updates.push({
                id: generatePreviewId('update'),
                campaignId: existing.id,
                campaignCode: row.campaignCode,
                eventType: 'EventCorrected',
                correctsEventId: granEvent.id,
                correctsEventType: 'GranulationCompleted',
                source: 'Granulation',
                changes,
                selected: true,
              });
            }
          }
        }
      }
    });
    
    // Process Metal Removal rows
    processProcessingStep(
      data.metalRemovals,
      existingCampaigns,
      campaignEvents,
      'MetalRemovalCompleted',
      'Metal Removal',
      events,
      updates,
      skipped
    );
    
    // Process Polymer Purification rows
    processProcessingStep(
      data.polymerPurifications,
      existingCampaigns,
      campaignEvents,
      'PolymerPurificationCompleted',
      'Polymer purification',
      events,
      updates,
      skipped
    );
    
    // Process Extrusion rows
    data.extrusions.forEach((row, index) => {
      const existing = existingCampaigns.get(row.campaignCode);
      if (!existing) {
        if (!campaignsToCreate.has(row.campaignCode)) {
          skipped.push({
            id: generatePreviewId('skip'),
            source: 'Extrusion',
            rowNumber: index + 2,
            campaignCode: row.campaignCode,
            reason: 'Campaign does not exist',
            rawData: row as unknown as Record<string, unknown>,
          });
        }
        return;
      }
      
      if (row.startingWeightKg === undefined && row.outputWeightKg === undefined) {
        skipped.push({
          id: generatePreviewId('skip'),
          source: 'Extrusion',
          rowNumber: index + 2,
          campaignCode: row.campaignCode,
          reason: 'Missing weight data',
          rawData: row as unknown as Record<string, unknown>,
        });
        return;
      }
      
      const existingEvents = campaignEvents.get(existing.id) || [];
      const extrusionEvent = hasEventOfType(existingEvents, 'ExtrusionCompleted');
      
      if (!extrusionEvent) {
        events.push({
          id: generatePreviewId('event'),
          campaignId: existing.id,
          campaignCode: row.campaignCode,
          eventType: 'ExtrusionCompleted',
          source: 'Extrusion',
          payload: {
            ticketNumber: row.ticketNumber || 'IMPORT',
            startingWeightKg: row.startingWeightKg || 0,
            outputWeightKg: row.outputWeightKg || 0,
            processHours: row.processHours,
            batchNumber: row.batchNumber || 'IMPORT',
            notes: row.notes,
          },
          selected: true,
        });
      } else {
        const changes = compareFields(
          extrusionEvent.eventData,
          {
            startingWeightKg: row.startingWeightKg,
            outputWeightKg: row.outputWeightKg,
            batchNumber: row.batchNumber,
          },
          {
            startingWeightKg: 'Starting Weight (kg)',
            outputWeightKg: 'Output Weight (kg)',
            batchNumber: 'Batch Number',
          }
        );
        
        if (changes.length > 0) {
          updates.push({
            id: generatePreviewId('update'),
            campaignId: existing.id,
            campaignCode: row.campaignCode,
            eventType: 'EventCorrected',
            correctsEventId: extrusionEvent.id,
            correctsEventType: 'ExtrusionCompleted',
            source: 'Extrusion',
            changes,
            selected: true,
          });
        }
      }
    });
    
    // Process Transfer rows
    data.transfers.forEach((row, index) => {
      const existing = existingCampaigns.get(row.campaignCode);
      if (!existing) {
        if (!campaignsToCreate.has(row.campaignCode)) {
          skipped.push({
            id: generatePreviewId('skip'),
            source: 'Transfer MBA-RGE',
            rowNumber: index + 2,
            campaignCode: row.campaignCode,
            reason: 'Campaign does not exist',
            rawData: row as unknown as Record<string, unknown>,
          });
        }
        return;
      }
      
      const existingEvents = campaignEvents.get(existing.id) || [];
      const transferEvent = hasEventOfType(existingEvents, 'TransferToRGERecorded');
      
      if (!transferEvent && (row.trackingRef || row.carrier)) {
        events.push({
          id: generatePreviewId('event'),
          campaignId: existing.id,
          campaignCode: row.campaignCode,
          eventType: 'TransferToRGERecorded',
          source: 'Transfer MBA-RGE',
          payload: {
            trackingRef: row.trackingRef || 'Unknown',
            carrier: row.carrier || 'Unknown',
            shipDate: new Date().toISOString().split('T')[0],
            receivedDate: row.receivedDate,
            receivedWeightKg: row.receivedWeightKg,
          },
          selected: true,
        });
      } else if (transferEvent) {
        const changes = compareFields(
          transferEvent.eventData,
          {
            trackingRef: row.trackingRef,
            carrier: row.carrier,
            receivedWeightKg: row.receivedWeightKg,
          },
          {
            trackingRef: 'Tracking Reference',
            carrier: 'Carrier',
            receivedWeightKg: 'Received Weight (kg)',
          }
        );
        
        if (changes.length > 0) {
          updates.push({
            id: generatePreviewId('update'),
            campaignId: existing.id,
            campaignCode: row.campaignCode,
            eventType: 'EventCorrected',
            correctsEventId: transferEvent.id,
            correctsEventType: 'TransferToRGERecorded',
            source: 'Transfer MBA-RGE',
            changes,
            selected: true,
          });
        }
      }
    });
    
    // Process Manufacturing rows
    data.manufacturing.forEach((row, index) => {
      const existing = existingCampaigns.get(row.campaignCode);
      if (!existing) {
        if (!campaignsToCreate.has(row.campaignCode)) {
          skipped.push({
            id: generatePreviewId('skip'),
            source: 'RGE Manufacturing',
            rowNumber: index + 2,
            campaignCode: row.campaignCode,
            reason: 'Campaign does not exist',
            rawData: row as unknown as Record<string, unknown>,
          });
        }
        return;
      }
      
      const existingEvents = campaignEvents.get(existing.id) || [];
      
      // ManufacturingStarted
      const startEvent = hasEventOfType(existingEvents, 'ManufacturingStarted');
      if (!startEvent && row.poNumber) {
        events.push({
          id: generatePreviewId('event'),
          campaignId: existing.id,
          campaignCode: row.campaignCode,
          eventType: 'ManufacturingStarted',
          source: 'RGE Manufacturing',
          payload: {
            poNumber: row.poNumber,
            poQuantity: row.poQuantity || 0,
            startDate: row.startDate || new Date().toISOString().split('T')[0],
          },
          selected: true,
        });
      } else if (startEvent) {
        const changes = compareFields(
          startEvent.eventData,
          {
            poNumber: row.poNumber,
            poQuantity: row.poQuantity,
            startDate: row.startDate,
          },
          {
            poNumber: 'PO Number',
            poQuantity: 'PO Quantity',
            startDate: 'Start Date',
          }
        );
        
        if (changes.length > 0) {
          updates.push({
            id: generatePreviewId('update'),
            campaignId: existing.id,
            campaignCode: row.campaignCode,
            eventType: 'EventCorrected',
            correctsEventId: startEvent.id,
            correctsEventType: 'ManufacturingStarted',
            source: 'RGE Manufacturing',
            changes,
            selected: true,
          });
        }
      }
      
      // ManufacturingCompleted (if end date is present)
      if (row.endDate) {
        const endEvent = hasEventOfType(existingEvents, 'ManufacturingCompleted');
        if (!endEvent) {
          events.push({
            id: generatePreviewId('event'),
            campaignId: existing.id,
            campaignCode: row.campaignCode,
            eventType: 'ManufacturingCompleted',
            source: 'RGE Manufacturing',
            payload: {
              endDate: row.endDate,
              actualQuantity: row.poQuantity || 0,
            },
            selected: true,
          });
        }
      }
    });
    
    // Calculate total rows processed
    const totalRows = 
      data.inboundShipments.length +
      data.granulations.length +
      data.metalRemovals.length +
      data.polymerPurifications.length +
      data.extrusions.length +
      data.transfers.length +
      data.manufacturing.length;
    
    const response: ImportPreviewResponse = {
      creates,
      events,
      updates,
      skipped,
      summary: {
        totalRows,
        newCampaigns: creates.length,
        newEvents: events.length,
        updates: updates.length,
        skipped: skipped.length,
      },
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error generating import preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate import preview' },
      { status: 500 }
    );
  }
}

/**
 * Helper to process processing step rows (Metal Removal, Polymer Purification)
 */
function processProcessingStep(
  rows: ImportPreviewRequest['metalRemovals'] | ImportPreviewRequest['polymerPurifications'],
  existingCampaigns: Map<string, Campaign>,
  campaignEvents: Map<string, BaseEvent[]>,
  eventType: 'MetalRemovalCompleted' | 'PolymerPurificationCompleted',
  sourceName: string,
  events: EventPreview[],
  updates: UpdatePreview[],
  skipped: SkippedRow[]
) {
  rows.forEach((row, index) => {
    const existing = existingCampaigns.get(row.campaignCode);
    if (!existing) {
      skipped.push({
        id: generatePreviewId('skip'),
        source: sourceName,
        rowNumber: index + 2,
        campaignCode: row.campaignCode,
        reason: 'Campaign does not exist',
        rawData: row as unknown as Record<string, unknown>,
      });
      return;
    }
    
    if (row.startingWeightKg === undefined && row.outputWeightKg === undefined) {
      skipped.push({
        id: generatePreviewId('skip'),
        source: sourceName,
        rowNumber: index + 2,
        campaignCode: row.campaignCode,
        reason: 'Missing weight data',
        rawData: row as unknown as Record<string, unknown>,
      });
      return;
    }
    
    const existingEvents = campaignEvents.get(existing.id) || [];
    const existingEvent = hasEventOfType(existingEvents, eventType);
    
    if (!existingEvent) {
      events.push({
        id: generatePreviewId('event'),
        campaignId: existing.id,
        campaignCode: row.campaignCode,
        eventType,
        source: sourceName,
        payload: {
          ticketNumber: row.ticketNumber || 'IMPORT',
          startingWeightKg: row.startingWeightKg || 0,
          outputWeightKg: row.outputWeightKg || 0,
          processHours: row.processHours,
          polymerComposition: row.polymerComposition,
          wasteCode: row.wasteCode,
          notes: row.notes,
        },
        selected: true,
      });
    } else {
      const changes = compareFields(
        existingEvent.eventData,
        {
          startingWeightKg: row.startingWeightKg,
          outputWeightKg: row.outputWeightKg,
          processHours: row.processHours,
        },
        {
          startingWeightKg: 'Starting Weight (kg)',
          outputWeightKg: 'Output Weight (kg)',
          processHours: 'Process Hours',
        }
      );
      
      if (changes.length > 0) {
        updates.push({
          id: generatePreviewId('update'),
          campaignId: existing.id,
          campaignCode: row.campaignCode,
          eventType: 'EventCorrected',
          correctsEventId: existingEvent.id,
          correctsEventType: eventType,
          source: sourceName,
          changes,
          selected: true,
        });
      }
    }
  });
}
