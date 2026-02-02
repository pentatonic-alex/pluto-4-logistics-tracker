import { sql } from './db';
import type {
  EventType,
  CampaignStatus,
  CampaignCreatedPayload,
  InboundShipmentPayload,
  ProcessingStepPayload,
  ECHAApprovalPayload,
  TransferToRGEPayload,
  ManufacturingStartedPayload,
  ManufacturingCompletedPayload,
  ReturnToLEGOPayload,
  CampaignCompletedPayload,
  EventCorrectionPayload,
  Campaign,
} from '@/types';
import { getEventsForStream } from './events';

/**
 * Projection Updater
 * 
 * Updates campaign projections based on events.
 * This keeps the materialized view in sync with the event store.
 */

// Status progression map - what comes after each status
const STATUS_PROGRESSION: Record<CampaignStatus, string | null> = {
  created: 'Inbound Shipment',
  inbound_shipment_recorded: 'Granulation',
  granulation_complete: 'Metal Removal',
  metal_removal_complete: 'Polymer Purification',
  polymer_purification_complete: 'Extrusion',
  extrusion_complete: 'ECHA Approval',
  echa_approved: 'Transfer to RGE',
  transferred_to_rge: 'Manufacturing Start',
  manufacturing_started: 'Manufacturing Complete',
  manufacturing_complete: 'Return to LEGO',
  returned_to_lego: 'Complete Campaign',
  completed: null,
};

// Human-readable step names
const STEP_NAMES: Record<CampaignStatus, string> = {
  created: 'Created',
  inbound_shipment_recorded: 'Inbound Shipment',
  granulation_complete: 'Granulation',
  metal_removal_complete: 'Metal Removal',
  polymer_purification_complete: 'Polymer Purification',
  extrusion_complete: 'Extrusion',
  echa_approved: 'ECHA Approved',
  transferred_to_rge: 'Transferred to RGE',
  manufacturing_started: 'Manufacturing',
  manufacturing_complete: 'Manufacturing Complete',
  returned_to_lego: 'Returned to LEGO',
  completed: 'Completed',
};

/**
 * Update campaign projection based on an event
 */
export async function updateProjection(
  eventType: EventType,
  streamId: string,
  eventData: Record<string, unknown>,
  timestamp: string
): Promise<void> {
  // Type assertion through unknown for runtime event data
  const data = eventData as unknown;
  
  switch (eventType) {
    case 'CampaignCreated':
      await handleCampaignCreated(streamId, data as CampaignCreatedPayload, timestamp);
      break;
    case 'InboundShipmentRecorded':
      await handleInboundShipment(streamId, data as InboundShipmentPayload, timestamp);
      break;
    case 'GranulationCompleted':
      await handleProcessingStep(streamId, data as ProcessingStepPayload, 'granulation_complete', timestamp);
      break;
    case 'MetalRemovalCompleted':
      await handleProcessingStep(streamId, data as ProcessingStepPayload, 'metal_removal_complete', timestamp);
      break;
    case 'PolymerPurificationCompleted':
      await handleProcessingStep(streamId, data as ProcessingStepPayload, 'polymer_purification_complete', timestamp);
      break;
    case 'ExtrusionCompleted':
      await handleProcessingStep(streamId, data as ProcessingStepPayload, 'extrusion_complete', timestamp);
      break;
    case 'ECHAApprovalRecorded':
      await handleECHAApproval(streamId, data as ECHAApprovalPayload, timestamp);
      break;
    case 'TransferToRGERecorded':
      await handleTransferToRGE(streamId, data as TransferToRGEPayload, timestamp);
      break;
    case 'ManufacturingStarted':
      await handleManufacturingStarted(streamId, data as ManufacturingStartedPayload, timestamp);
      break;
    case 'ManufacturingCompleted':
      await handleManufacturingCompleted(streamId, data as ManufacturingCompletedPayload, timestamp);
      break;
    case 'ReturnToLEGORecorded':
      await handleReturnToLEGO(streamId, data as ReturnToLEGOPayload, timestamp);
      break;
    case 'CampaignCompleted':
      await handleCampaignCompleted(streamId, data as CampaignCompletedPayload, timestamp);
      break;
    case 'EventCorrected':
      await handleEventCorrected(streamId, data as EventCorrectionPayload, timestamp);
      break;
  }
}

// Event handlers

async function handleCampaignCreated(
  campaignId: string,
  payload: CampaignCreatedPayload,
  timestamp: string
): Promise<void> {
  const status: CampaignStatus = 'created';
  
  await sql`
    INSERT INTO campaign_projections (
      id, lego_campaign_code, material_type, description, status,
      current_step, next_expected_step, last_event_type, last_event_at,
      created_at, updated_at
    ) VALUES (
      ${campaignId},
      ${payload.legoCampaignCode},
      ${payload.materialType},
      ${payload.description || null},
      ${status},
      ${STEP_NAMES[status]},
      ${STATUS_PROGRESSION[status]},
      'CampaignCreated',
      ${timestamp},
      ${timestamp},
      ${timestamp}
    )
  `;
}

async function handleInboundShipment(
  campaignId: string,
  payload: InboundShipmentPayload,
  timestamp: string
): Promise<void> {
  const status: CampaignStatus = 'inbound_shipment_recorded';
  
  await sql`
    UPDATE campaign_projections SET
      status = ${status},
      current_step = ${STEP_NAMES[status]},
      current_weight_kg = ${payload.netWeightKg},
      next_expected_step = ${STATUS_PROGRESSION[status]},
      last_event_type = 'InboundShipmentRecorded',
      last_event_at = ${timestamp},
      updated_at = ${timestamp}
    WHERE id = ${campaignId}
  `;
}

async function handleProcessingStep(
  campaignId: string,
  payload: ProcessingStepPayload,
  status: CampaignStatus,
  timestamp: string
): Promise<void> {
  const eventTypeMap: Record<string, string> = {
    granulation_complete: 'GranulationCompleted',
    metal_removal_complete: 'MetalRemovalCompleted',
    polymer_purification_complete: 'PolymerPurificationCompleted',
    extrusion_complete: 'ExtrusionCompleted',
  };

  await sql`
    UPDATE campaign_projections SET
      status = ${status},
      current_step = ${STEP_NAMES[status]},
      current_weight_kg = ${payload.outputWeightKg},
      next_expected_step = ${STATUS_PROGRESSION[status]},
      last_event_type = ${eventTypeMap[status]},
      last_event_at = ${timestamp},
      updated_at = ${timestamp}
    WHERE id = ${campaignId}
  `;
}

async function handleECHAApproval(
  campaignId: string,
  _payload: ECHAApprovalPayload,
  timestamp: string
): Promise<void> {
  const status: CampaignStatus = 'echa_approved';
  
  await sql`
    UPDATE campaign_projections SET
      status = ${status},
      current_step = ${STEP_NAMES[status]},
      next_expected_step = ${STATUS_PROGRESSION[status]},
      echa_approved = TRUE,
      last_event_type = 'ECHAApprovalRecorded',
      last_event_at = ${timestamp},
      updated_at = ${timestamp}
    WHERE id = ${campaignId}
  `;
}

async function handleTransferToRGE(
  campaignId: string,
  payload: TransferToRGEPayload,
  timestamp: string
): Promise<void> {
  const status: CampaignStatus = 'transferred_to_rge';
  
  await sql`
    UPDATE campaign_projections SET
      status = ${status},
      current_step = ${STEP_NAMES[status]},
      current_weight_kg = COALESCE(${payload.receivedWeightKg || null}, current_weight_kg),
      next_expected_step = ${STATUS_PROGRESSION[status]},
      last_event_type = 'TransferToRGERecorded',
      last_event_at = ${timestamp},
      updated_at = ${timestamp}
    WHERE id = ${campaignId}
  `;
}

async function handleManufacturingStarted(
  campaignId: string,
  _payload: ManufacturingStartedPayload,
  timestamp: string
): Promise<void> {
  const status: CampaignStatus = 'manufacturing_started';
  
  await sql`
    UPDATE campaign_projections SET
      status = ${status},
      current_step = ${STEP_NAMES[status]},
      next_expected_step = ${STATUS_PROGRESSION[status]},
      last_event_type = 'ManufacturingStarted',
      last_event_at = ${timestamp},
      updated_at = ${timestamp}
    WHERE id = ${campaignId}
  `;
}

async function handleManufacturingCompleted(
  campaignId: string,
  _payload: ManufacturingCompletedPayload,
  timestamp: string
): Promise<void> {
  const status: CampaignStatus = 'manufacturing_complete';
  
  await sql`
    UPDATE campaign_projections SET
      status = ${status},
      current_step = ${STEP_NAMES[status]},
      next_expected_step = ${STATUS_PROGRESSION[status]},
      last_event_type = 'ManufacturingCompleted',
      last_event_at = ${timestamp},
      updated_at = ${timestamp}
    WHERE id = ${campaignId}
  `;
}

async function handleReturnToLEGO(
  campaignId: string,
  _payload: ReturnToLEGOPayload,
  timestamp: string
): Promise<void> {
  const status: CampaignStatus = 'returned_to_lego';
  
  await sql`
    UPDATE campaign_projections SET
      status = ${status},
      current_step = ${STEP_NAMES[status]},
      next_expected_step = ${STATUS_PROGRESSION[status]},
      last_event_type = 'ReturnToLEGORecorded',
      last_event_at = ${timestamp},
      updated_at = ${timestamp}
    WHERE id = ${campaignId}
  `;
}

async function handleCampaignCompleted(
  campaignId: string,
  _payload: CampaignCompletedPayload,
  timestamp: string
): Promise<void> {
  const status: CampaignStatus = 'completed';
  
  await sql`
    UPDATE campaign_projections SET
      status = ${status},
      current_step = ${STEP_NAMES[status]},
      next_expected_step = NULL,
      completed_at = ${timestamp},
      last_event_type = 'CampaignCompleted',
      last_event_at = ${timestamp},
      updated_at = ${timestamp}
    WHERE id = ${campaignId}
  `;
}

/**
 * Handle EventCorrected
 * 
 * When a correction is made, we need to update the projection if the corrected
 * field affects the current state (e.g., weight changes).
 * 
 * For full TES compliance, this rebuilds the current weight from all events
 * with corrections applied.
 */
async function handleEventCorrected(
  campaignId: string,
  payload: EventCorrectionPayload,
  timestamp: string
): Promise<void> {
  // Check if any weight-related fields were corrected
  const weightFields = ['netWeightKg', 'outputWeightKg', 'receivedWeightKg'];
  const hasWeightCorrection = Object.keys(payload.changes).some(key => 
    weightFields.includes(key)
  );

  if (hasWeightCorrection) {
    // Rebuild current weight by replaying all events with corrections
    const newWeight = await rebuildCurrentWeight(campaignId);
    
    await sql`
      UPDATE campaign_projections SET
        current_weight_kg = ${newWeight},
        updated_at = ${timestamp}
      WHERE id = ${campaignId}
    `;
  } else {
    // Just update the timestamp
    await sql`
      UPDATE campaign_projections SET
        updated_at = ${timestamp}
      WHERE id = ${campaignId}
    `;
  }
}

/**
 * Rebuild the current weight by replaying all events with corrections applied.
 * 
 * This is the TES-compliant way to derive current state:
 * 1. Get all events for the campaign
 * 2. Build a map of corrections
 * 3. Apply events in order, using corrected values where applicable
 * 4. Return the final weight
 */
async function rebuildCurrentWeight(campaignId: string): Promise<number | null> {
  const events = await getEventsForStream('campaign', campaignId);
  
  // Build correction map: eventId -> { field -> corrected value }
  const corrections = new Map<string, Record<string, unknown>>();
  
  events.forEach(event => {
    if (event.eventType === 'EventCorrected') {
      const payload = event.eventData as unknown as EventCorrectionPayload;
      const correctedValues: Record<string, unknown> = {};
      
      for (const [field, change] of Object.entries(payload.changes)) {
        correctedValues[field] = change.now;
      }
      
      // Merge with any existing corrections for this event
      const existing = corrections.get(payload.correctsEventId) || {};
      corrections.set(payload.correctsEventId, { ...existing, ...correctedValues });
    }
  });

  // Replay events to calculate current weight
  let currentWeight: number | null = null;

  events.forEach(event => {
    if (event.eventType === 'EventCorrected') return; // Skip correction events
    
    const eventCorrections = corrections.get(event.id) || {};
    const data = { ...event.eventData, ...eventCorrections };
    
    // Extract weight from relevant event types
    if (event.eventType === 'InboundShipmentRecorded') {
      currentWeight = (data.netWeightKg as number) || currentWeight;
    } else if (['GranulationCompleted', 'MetalRemovalCompleted', 'PolymerPurificationCompleted', 'ExtrusionCompleted'].includes(event.eventType)) {
      currentWeight = (data.outputWeightKg as number) || currentWeight;
    } else if (event.eventType === 'TransferToRGERecorded' && data.receivedWeightKg) {
      currentWeight = data.receivedWeightKg as number;
    }
  });

  return currentWeight;
}

/**
 * Get a campaign by ID
 */
export async function getCampaignById(id: string): Promise<Campaign | null> {
  const rows = await sql`
    SELECT * FROM campaign_projections WHERE id = ${id}
  `;
  
  if (rows.length === 0) return null;
  return mapRowToCampaign(rows[0]);
}

/**
 * Get all campaigns, optionally filtered by status
 */
export async function getCampaigns(statusFilter?: CampaignStatus | 'active'): Promise<Campaign[]> {
  let rows;
  
  if (statusFilter === 'active') {
    rows = await sql`
      SELECT * FROM campaign_projections 
      WHERE status != 'completed'
      ORDER BY updated_at DESC
    `;
  } else if (statusFilter) {
    rows = await sql`
      SELECT * FROM campaign_projections 
      WHERE status = ${statusFilter}
      ORDER BY updated_at DESC
    `;
  } else {
    rows = await sql`
      SELECT * FROM campaign_projections 
      ORDER BY updated_at DESC
    `;
  }
  
  return rows.map(mapRowToCampaign);
}

/**
 * Map database row to Campaign type
 */
function mapRowToCampaign(row: Record<string, unknown>): Campaign {
  return {
    id: row.id as string,
    legoCampaignCode: row.lego_campaign_code as string,
    status: row.status as CampaignStatus,
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
